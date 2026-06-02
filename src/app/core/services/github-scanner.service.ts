import { Injectable } from '@angular/core';
import { AuditIssue, Verifiability } from '../models/audit.model';
import { CHECKLIST_DATA } from './checklist.data';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedGithubUrl {
  owner: string;
  repo: string;
  /** Branch parsed from URL, or empty string (means "fetch default from API") */
  branch: string;
  valid: boolean;
  error?: string;
}

interface RepoContext {
  owner: string;
  repo: string;
  branch: string;
  /** Set of all file paths present in the repo */
  fileTree: Set<string>;
  /** path → raw content */
  files: Map<string, string>;
  isPrivate: boolean;
}

interface CheckResult {
  itemId: string;
  status: 'pass' | 'fail' | 'warning' | 'not-checked';
  verifiability: Verifiability;
  explanation: string;
  filePath?: string;
  lineNumber?: number;
  codeSnippet?: string;
  suggestedFix?: string;
  fixedCode?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Verifiability map — what can actually be checked from config files
// ─────────────────────────────────────────────────────────────────────────────

/** Items this scanner can fully or partially verify */
const VERIFIABLE: Record<string, Verifiability> = {
  // Code Quality
  'cq-1':  'auto',    // noImplicitAny / strict in tsconfig
  'cq-2':  'auto',    // eslint config file presence
  'cq-3':  'auto',    // husky hooks presence
  'cq-4':  'auto',    // prettier config presence
  'cq-5':  'partial', // commitlint in package.json
  'cq-7':  'partial', // path aliases in tsconfig
  'cq-8':  'partial', // no-console in eslint rules
  // TypeScript
  'ts-1':  'auto',    // strict: true in tsconfig
  'ts-3':  'partial', // types/models folder exists
  'ts-6':  'auto',    // strictNullChecks
  // Performance
  'perf-1': 'partial', // loadComponent/loadChildren in routes
  'perf-2': 'partial', // angular.json budgets
  'perf-3': 'partial', // no sync scripts in index.html
  'perf-8': 'partial', // Lighthouse CI in CI config
  // Accessibility
  'a11y-2': 'partial', // automated a11y testing lib
  // Security
  'sec-1':  'partial', // no secrets in environment files
  'sec-5':  'partial', // npm audit / snyk in CI or scripts
  // Testing
  'test-1': 'partial', // .spec.ts files exist
  'test-2': 'partial', // coverage thresholds in angular.json
  // Angular
  'ng-1':  'auto',    // no app.module.ts = standalone-first
  'ng-2':  'partial', // OnPush in components (sample)
  'ng-3':  'partial', // lazy routes (same as perf-1)
  'ng-4':  'partial', // signals usage
  'ng-5':  'partial', // new control flow syntax
  'ng-7':  'partial', // takeUntilDestroyed
  'ng-8':  'partial', // inject() function
};

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class GithubScannerService {

  // ── URL parsing ─────────────────────────────────────────────────────────────

  parseUrl(rawUrl: string): ParsedGithubUrl {
    const url = rawUrl.trim().replace(/\/$/, '');

    const ghMatch = url.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/][^?#]*?)(?:\/.*)?)?(?:\?.*)?(?:#.*)?$/
    );

    if (!ghMatch) {
      return { owner: '', repo: '', branch: '', valid: false, error: 'Not a valid GitHub URL' };
    }

    return {
      owner:  ghMatch[1],
      repo:   ghMatch[2].replace(/\.git$/, ''),
      branch: ghMatch[3] ?? '', // empty = resolve default branch via API
      valid:  true,
    };
  }

  // ── Default branch resolution ─────────────────────────────────────────────

  async resolveDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      if (!res.ok) return 'main';
      const data = await res.json() as { default_branch?: string; private?: boolean };
      return data.default_branch ?? 'main';
    } catch {
      return 'main';
    }
  }

  // ── File tree ─────────────────────────────────────────────────────────────

  async fetchFileTree(owner: string, repo: string, branch: string): Promise<Set<string>> {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
        { headers: { Accept: 'application/vnd.github.v3+json' } }
      );
      if (!res.ok) return new Set();
      const data = await res.json() as { tree?: { path: string; type: string }[]; truncated?: boolean };
      return new Set((data.tree ?? []).filter(f => f.type === 'blob').map(f => f.path));
    } catch {
      return new Set();
    }
  }

  // ── Raw file fetch ────────────────────────────────────────────────────────

  async fetchFile(owner: string, repo: string, branch: string, path: string): Promise<string | null> {
    try {
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${path}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  // ── Main scan entry ───────────────────────────────────────────────────────

  async scan(
    owner: string,
    repo: string,
    branch: string,
    onProgress: (phase: string, file: string, pct: number) => void,
  ): Promise<{ issues: AuditIssue[]; fetchedFiles: string[]; isPrivate: boolean }> {

    // ── 1. File tree ──────────────────────────────────────────────────────────
    onProgress('Fetching repository file tree', `${owner}/${repo}@${branch}`, 5);
    const fileTree = await this.fetchFileTree(owner, repo, branch);
    const isPrivate = fileTree.size === 0; // assume private if tree empty

    // ── 2. Identify and fetch key config files ────────────────────────────────
    const filesToFetch = this.selectFilesToFetch(fileTree);
    const files = new Map<string, string>();
    const fetchedPaths: string[] = [];

    for (let i = 0; i < filesToFetch.length; i++) {
      const path = filesToFetch[i];
      const pct  = 10 + Math.round((i / filesToFetch.length) * 60);
      onProgress('Fetching config files', path, pct);
      const content = await this.fetchFile(owner, repo, branch, path);
      if (content !== null) {
        files.set(path, content);
        fetchedPaths.push(path);
      }
    }

    const ctx: RepoContext = { owner, repo, branch, fileTree, files, isPrivate };

    // ── 3. Run checks ─────────────────────────────────────────────────────────
    onProgress('Running checks', 'Analysing config files…', 75);
    const results = this.runAllChecks(ctx);

    onProgress('Building report', 'Computing scores…', 95);
    const issues = this.buildIssues(results);

    return { issues, fetchedFiles: fetchedPaths, isPrivate };
  }

  // ── File selection ────────────────────────────────────────────────────────

  private selectFilesToFetch(tree: Set<string>): string[] {
    const candidates = [
      'tsconfig.json',
      'tsconfig.base.json',
      'package.json',
      'angular.json',
      'project.json',
      'index.html',
      'src/index.html',
      'public/index.html',
      // ESLint configs
      '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.yaml',
      'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs',
      // Prettier
      '.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js',
      // commitlint
      '.commitlintrc.json', 'commitlint.config.js',
      // Routes / module
      'src/app/app.routes.ts',
      'src/app/app-routing.module.ts',
      'src/app/app.module.ts',
      'src/app/app.component.ts',
      'src/app/app.component.html',
      // Environment
      'src/environments/environment.ts',
      'src/environments/environment.prod.ts',
      'src/environments/environment.development.ts',
      // CI
      '.github/workflows/ci.yml',
      '.github/workflows/build.yml',
      '.github/workflows/main.yml',
      'Jenkinsfile',
      '.circleci/config.yml',
    ];

    // Only fetch files that actually exist in the tree, or always-try configs
    const alwaysTry = new Set(['tsconfig.json', 'package.json', 'angular.json', 'src/index.html', 'index.html']);
    return candidates.filter(p => tree.has(p) || alwaysTry.has(p));
  }

  // ── Master check runner ───────────────────────────────────────────────────

  private runAllChecks(ctx: RepoContext): CheckResult[] {
    const results: CheckResult[] = [];
    const push = (r: CheckResult) => results.push(r);

    const tsconfig  = this.parseJson(ctx.files.get('tsconfig.json') ?? ctx.files.get('tsconfig.base.json'));
    const pkgjson   = this.parseJson(ctx.files.get('package.json'));
    const angJson   = this.parseJson(ctx.files.get('angular.json'));
    const indexHtml = ctx.files.get('src/index.html') ?? ctx.files.get('index.html') ?? ctx.files.get('public/index.html') ?? '';
    const routesSrc = ctx.files.get('src/app/app.routes.ts') ?? ctx.files.get('src/app/app-routing.module.ts') ?? '';
    const appModSrc = ctx.files.get('src/app/app.module.ts') ?? '';
    const appCompSrc= ctx.files.get('src/app/app.component.ts') ?? '';
    const appTpl    = ctx.files.get('src/app/app.component.html') ?? '';
    const ciSrc     = ctx.files.get('.github/workflows/ci.yml')
                   ?? ctx.files.get('.github/workflows/build.yml')
                   ?? ctx.files.get('.github/workflows/main.yml')
                   ?? ctx.files.get('Jenkinsfile')
                   ?? ctx.files.get('.circleci/config.yml')
                   ?? '';

    const deps = { ...(pkgjson?.['dependencies'] ?? {}), ...(pkgjson?.['devDependencies'] ?? {}) } as Record<string, string>;
    const scripts = (pkgjson?.['scripts'] ?? {}) as Record<string, string>;
    const allScripts = Object.values(scripts).join(' ');

    // Detect Angular version
    const angVersion = this.extractMajorVersion(deps['@angular/core'] ?? deps['@angular/common'] ?? '');
    const isAngular  = angVersion > 0 || ctx.fileTree.has('angular.json') || ctx.files.has('angular.json');
    const isReact    = Boolean(deps['react'] || deps['react-dom']);
    const angCompilerOpts = (tsconfig?.['angularCompilerOptions'] ?? {}) as Record<string, unknown>;

    // ── Code Quality ─────────────────────────────────────────────────────────

    // cq-1: noImplicitAny / strict
    const compilerOpts = (tsconfig?.['compilerOptions'] ?? {}) as Record<string, unknown>;
    const hasStrict = compilerOpts['strict'] === true;
    const hasNoImplicitAny = compilerOpts['noImplicitAny'] === true;
    push({
      itemId: 'cq-1', verifiability: 'auto',
      status: (hasStrict || hasNoImplicitAny) ? 'pass' : 'fail',
      filePath: ctx.files.has('tsconfig.json') ? 'tsconfig.json' : undefined,
      explanation: (hasStrict || hasNoImplicitAny)
        ? '`strict: true` (or `noImplicitAny`) is enabled in tsconfig.json — TypeScript\'s full type safety is on.'
        : '`strict` mode is not enabled in tsconfig.json. `noImplicitAny` defaults to false, allowing type erasure.',
      codeSnippet: tsconfig ? JSON.stringify({ compilerOptions: { strict: compilerOpts['strict'], noImplicitAny: compilerOpts['noImplicitAny'] } }, null, 2) : undefined,
      suggestedFix: hasStrict ? undefined : 'Add `"strict": true` to compilerOptions in tsconfig.json.',
      fixedCode: hasStrict ? undefined : '{ "compilerOptions": { "strict": true } }',
    });

    // cq-2: ESLint config
    const eslintFiles = ['.eslintrc.json','.eslintrc.js','.eslintrc.cjs','.eslintrc.yaml','eslint.config.js','eslint.config.mjs','eslint.config.cjs'];
    const hasEslint = eslintFiles.some(f => ctx.fileTree.has(f) || ctx.files.has(f)) || Boolean(deps['eslint'] || pkgjson?.['eslintConfig']);
    push({
      itemId: 'cq-2', verifiability: 'auto',
      status: hasEslint ? 'pass' : 'fail',
      explanation: hasEslint
        ? 'An ESLint configuration file was detected in the repository.'
        : 'No ESLint configuration file found. Static analysis and code style enforcement are not configured.',
      suggestedFix: hasEslint ? undefined : 'Add an `.eslintrc.json` or `eslint.config.js` and integrate with your CI pipeline.',
    });

    // cq-3: Husky
    const huskyFiles = ['.husky/pre-commit','.husky/commit-msg','.husky/_/husky.sh'];
    const hasHusky = huskyFiles.some(f => ctx.fileTree.has(f)) || Boolean(deps['husky']) || allScripts.includes('husky');
    push({
      itemId: 'cq-3', verifiability: 'auto',
      status: hasHusky ? 'pass' : 'fail',
      explanation: hasHusky
        ? 'Husky pre-commit hooks are configured — linting and type checks run before every commit.'
        : 'No Husky configuration detected. Code quality checks are not enforced at commit time.',
      suggestedFix: hasHusky ? undefined : 'Install `husky` and `lint-staged`. Run `npx husky init` and configure staged file checks.',
    });

    // cq-4: Prettier
    const prettierFiles = ['.prettierrc','.prettierrc.json','.prettierrc.js','.prettierrc.yaml','prettier.config.js','prettier.config.mjs'];
    const hasPrettier = prettierFiles.some(f => ctx.fileTree.has(f) || ctx.files.has(f)) || Boolean(deps['prettier'] || pkgjson?.['prettier']);
    push({
      itemId: 'cq-4', verifiability: 'auto',
      status: hasPrettier ? 'pass' : 'fail',
      explanation: hasPrettier
        ? 'Prettier is configured — consistent code formatting is enforced automatically.'
        : 'No Prettier configuration found. Code formatting is inconsistent across contributors.',
      suggestedFix: hasPrettier ? undefined : 'Install `prettier` and add a `.prettierrc` file. Integrate with ESLint using `eslint-config-prettier`.',
    });

    // cq-5: commitlint (partial)
    const hasCommitlint = Boolean(deps['@commitlint/cli']) || ctx.fileTree.has('.commitlintrc.json') || ctx.fileTree.has('commitlint.config.js') || allScripts.includes('commitlint');
    push({
      itemId: 'cq-5', verifiability: 'partial',
      status: hasCommitlint ? 'pass' : 'fail',
      explanation: hasCommitlint
        ? '`@commitlint/cli` detected — conventional commit format is enforced.'
        : '`commitlint` not found in dependencies or scripts. Commit message format is not enforced.',
      suggestedFix: hasCommitlint ? undefined : 'Install `@commitlint/cli` and `@commitlint/config-conventional`. Add a `commit-msg` Husky hook.',
    });

    // cq-7: Path aliases in tsconfig
    const tsPaths = (compilerOpts['paths'] ?? {}) as Record<string, unknown>;
    const hasAliases = Object.keys(tsPaths).length > 0;
    push({
      itemId: 'cq-7', verifiability: 'partial',
      status: hasAliases ? 'pass' : 'warning',
      explanation: hasAliases
        ? `${Object.keys(tsPaths).length} path alias(es) configured in tsconfig (e.g. ${Object.keys(tsPaths)[0]}).`
        : 'No `paths` aliases found in tsconfig.json. Deeply nested relative imports may be in use.',
      codeSnippet: hasAliases ? JSON.stringify({ compilerOptions: { paths: tsPaths } }, null, 2).slice(0, 300) : undefined,
      suggestedFix: hasAliases ? undefined : 'Add `paths` to `compilerOptions` in tsconfig.json (e.g. `"@/*": ["src/*"]`).',
    });

    // cq-8: no-console in ESLint rules
    const eslintContent = ctx.files.get('.eslintrc.json') ?? ctx.files.get('eslint.config.js') ?? ctx.files.get('.eslintrc.js') ?? '';
    const hasNoConsoleRule = eslintContent.includes('no-console');
    push({
      itemId: 'cq-8', verifiability: 'partial',
      status: hasEslint ? (hasNoConsoleRule ? 'pass' : 'warning') : 'not-checked',
      explanation: !hasEslint
        ? 'Cannot verify: no ESLint config found to check `no-console` rule.'
        : hasNoConsoleRule
          ? '`no-console` rule is configured in ESLint — console statements are flagged at lint time.'
          : '`no-console` rule not found in ESLint config. Console statements may reach production builds.',
      filePath: eslintContent ? (ctx.files.has('.eslintrc.json') ? '.eslintrc.json' : 'eslint.config.js') : undefined,
      suggestedFix: (hasEslint && !hasNoConsoleRule) ? 'Add `"no-console": "error"` (or `["warn", { "allow": ["warn", "error"] }]`) to your ESLint rules.' : undefined,
    });

    // ── TypeScript ────────────────────────────────────────────────────────────

    // ts-1: strict: true
    push({
      itemId: 'ts-1', verifiability: 'auto',
      status: hasStrict ? 'pass' : 'fail',
      filePath: ctx.files.has('tsconfig.json') ? 'tsconfig.json' : undefined,
      explanation: hasStrict
        ? '`"strict": true` is set — all TypeScript strict checks active (noImplicitAny, strictNullChecks, strictFunctionTypes, etc.)'
        : '`"strict": true` is not set. Multiple strict checks are off by default.',
      codeSnippet: tsconfig ? `{ "compilerOptions": { "strict": ${compilerOpts['strict'] ?? 'NOT SET'} } }` : undefined,
      suggestedFix: hasStrict ? undefined : 'Set `"strict": true` in `compilerOptions`. Fix the resulting type errors — they reveal real bugs.',
      fixedCode: hasStrict ? undefined : '{\n  "compilerOptions": {\n    "strict": true\n  }\n}',
    });

    // ts-3: types / models folder
    const hasTypesFolder = Array.from(ctx.fileTree).some(p =>
      p.startsWith('src/types/') || p.startsWith('src/models/') ||
      p.startsWith('src/app/core/models/') || p.startsWith('src/app/models/')
    );
    push({
      itemId: 'ts-3', verifiability: 'partial',
      status: hasTypesFolder ? 'pass' : 'warning',
      explanation: hasTypesFolder
        ? 'A centralised types/models directory was found in the repository structure.'
        : 'No dedicated `types/` or `models/` folder detected at the expected paths.',
    });

    // ts-6: strictNullChecks
    const hasStrictNullChecks = hasStrict || compilerOpts['strictNullChecks'] === true;
    push({
      itemId: 'ts-6', verifiability: 'auto',
      status: hasStrictNullChecks ? 'pass' : 'fail',
      filePath: ctx.files.has('tsconfig.json') ? 'tsconfig.json' : undefined,
      explanation: hasStrictNullChecks
        ? '`strictNullChecks` is active (via `strict: true` or explicitly set).'
        : '`strictNullChecks` is disabled — `null` and `undefined` can be assigned to any type silently.',
      suggestedFix: hasStrictNullChecks ? undefined : 'Enable via `"strict": true` or `"strictNullChecks": true` in tsconfig.',
    });

    // ── Performance ───────────────────────────────────────────────────────────

    // perf-1 + ng-3: lazy loading
    const hasLoadComponent = routesSrc.includes('loadComponent') || routesSrc.includes('loadChildren');
    const hasEagerComponent = /component\s*:\s*\w+Component/.test(routesSrc);
    const lazyStatus = routesSrc
      ? (hasLoadComponent && !hasEagerComponent ? 'pass' : hasLoadComponent ? 'warning' : 'fail')
      : 'not-checked';
    const lazyExplain = !routesSrc
      ? 'Routes file not found or inaccessible at expected path.'
      : hasLoadComponent && !hasEagerComponent
        ? 'All routes appear to use `loadComponent`/`loadChildren` — lazy loading is in place.'
        : hasLoadComponent
          ? 'Mix of lazy (`loadComponent`) and eager (`component:`) routes detected. Consider making all routes lazy.'
          : 'No `loadComponent` or `loadChildren` found in routes. All modules appear to be eagerly loaded.';
    push({ itemId: 'perf-1', verifiability: 'partial', status: lazyStatus, filePath: routesSrc ? 'src/app/app.routes.ts' : undefined, explanation: lazyExplain, suggestedFix: lazyStatus === 'fail' ? 'Replace `component: MyComponent` with `loadComponent: () => import(\'./my/my.component\').then(m => m.MyComponent)`.' : undefined });
    push({ itemId: 'ng-3',  verifiability: 'partial', status: lazyStatus, filePath: routesSrc ? 'src/app/app.routes.ts' : undefined, explanation: lazyExplain });

    // perf-2: bundle budgets in angular.json
    const angBudgets = this.findAngularBudgets(angJson);
    push({
      itemId: 'perf-2', verifiability: 'partial',
      status: ctx.files.has('angular.json') ? (angBudgets ? 'pass' : 'fail') : 'not-checked',
      filePath: ctx.files.has('angular.json') ? 'angular.json' : undefined,
      explanation: !ctx.files.has('angular.json')
        ? 'angular.json not found — cannot verify bundle size budgets.'
        : angBudgets
          ? 'Bundle size budgets are configured in angular.json.'
          : 'No bundle size budgets found in angular.json. Oversized bundles will go undetected.',
      suggestedFix: (ctx.files.has('angular.json') && !angBudgets)
        ? 'Add a `budgets` array to the `build` configuration in angular.json (e.g. `maximumWarning: "500kb", maximumError: "1mb"`).'
        : undefined,
    });

    // perf-3: no sync scripts in <head>
    const syncScripts = this.findSyncScriptsInHead(indexHtml);
    push({
      itemId: 'perf-3', verifiability: 'partial',
      status: indexHtml ? (syncScripts.length === 0 ? 'pass' : 'fail') : 'not-checked',
      filePath: indexHtml ? 'index.html' : undefined,
      explanation: !indexHtml
        ? 'index.html not found at expected location.'
        : syncScripts.length === 0
          ? 'No synchronous blocking scripts detected in `<head>`.'
          : `${syncScripts.length} synchronous script tag(s) found in <head> without defer/async attribute — these block page render.`,
      codeSnippet: syncScripts.length ? syncScripts[0] : undefined,
      suggestedFix: syncScripts.length ? 'Add `defer` or `async` attribute to all `<script>` tags in `<head>`, or move to end of `<body>`.' : undefined,
    });

    // perf-8: Lighthouse CI in CI
    const hasLhci = ciSrc.includes('lighthouse') || ciSrc.includes('lhci') || ciSrc.includes('treosh/lighthouse');
    push({
      itemId: 'perf-8', verifiability: 'partial',
      status: ciSrc ? (hasLhci ? 'pass' : 'fail') : 'not-checked',
      filePath: ciSrc ? this.getCiFilePath(ctx) : undefined,
      explanation: !ciSrc
        ? 'No CI configuration file found. Cannot verify Lighthouse CI setup.'
        : hasLhci
          ? 'Lighthouse CI reference found in CI pipeline configuration.'
          : 'No Lighthouse CI step found in CI configuration. Performance regressions will not be caught in PRs.',
      suggestedFix: (ciSrc && !hasLhci)
        ? 'Add `treosh/lighthouse-ci-action` to your GitHub Actions workflow to track Lighthouse scores per PR.'
        : undefined,
    });

    // ── Accessibility ─────────────────────────────────────────────────────────

    // a11y-2: automated a11y testing
    const a11yLibs = ['jest-axe', '@axe-core/playwright', '@axe-core/puppeteer', 'cypress-axe', 'pa11y', '@deque/axe-core'];
    const hasA11yLib = a11yLibs.some(lib => Boolean(deps[lib]));
    push({
      itemId: 'a11y-2', verifiability: 'partial',
      status: hasA11yLib ? 'pass' : 'fail',
      explanation: hasA11yLib
        ? `An automated accessibility testing library was found (${a11yLibs.find(l => deps[l])}).`
        : 'No automated accessibility testing library (e.g. jest-axe, cypress-axe) found in dependencies.',
      suggestedFix: hasA11yLib ? undefined : 'Add `jest-axe` (unit tests) or `cypress-axe` (E2E) to detect accessibility regressions automatically.',
    });

    // ── Security ──────────────────────────────────────────────────────────────

    // sec-1: secrets in environment files — CONSERVATIVE patterns only
    const envFiles = [
      'src/environments/environment.ts',
      'src/environments/environment.prod.ts',
      'src/environments/environment.development.ts',
    ];
    const secretFinding = this.detectSecrets(ctx.files, envFiles);
    push({
      itemId: 'sec-1', verifiability: 'partial',
      status: secretFinding ? 'fail' : 'pass',
      filePath: secretFinding?.file,
      lineNumber: secretFinding?.line,
      explanation: secretFinding
        ? `A potential secret was detected on line ${secretFinding.line}: the value matches a known API key format (${secretFinding.pattern}).`
        : 'No high-confidence secret patterns detected in environment files. Note: this check only catches known key formats — use secret scanning tools like GitHub Advanced Security for comprehensive coverage.',
      codeSnippet: secretFinding?.snippet,
      suggestedFix: secretFinding ? 'Remove the secret from the environment file. Move it to a server-side proxy or environment variable injected at build time without committing the value.' : undefined,
    });

    // sec-5: dependency vulnerability scanning
    const hasDvScan = allScripts.includes('npm audit') || allScripts.includes('snyk') || Boolean(deps['snyk']) || ciSrc.includes('npm audit') || ciSrc.includes('snyk');
    push({
      itemId: 'sec-5', verifiability: 'partial',
      status: hasDvScan ? 'pass' : 'fail',
      explanation: hasDvScan
        ? 'Dependency vulnerability scanning (`npm audit` or Snyk) is configured in scripts or CI.'
        : 'No dependency vulnerability scanning found in package.json scripts or CI config.',
      suggestedFix: hasDvScan ? undefined : 'Add `"audit": "npm audit --audit-level=high"` to package.json scripts and run it in CI.',
    });

    // ── Testing ───────────────────────────────────────────────────────────────

    // test-1: spec files exist
    const specCount = Array.from(ctx.fileTree).filter(p => p.endsWith('.spec.ts') || p.endsWith('.test.ts') || p.endsWith('.spec.js') || p.endsWith('.test.js')).length;
    push({
      itemId: 'test-1', verifiability: 'partial',
      status: ctx.fileTree.size > 0 ? (specCount > 0 ? 'pass' : 'fail') : 'not-checked',
      explanation: ctx.fileTree.size === 0
        ? 'File tree not accessible — cannot count test files.'
        : specCount > 0
          ? `${specCount} test file(s) (*.spec.ts / *.test.ts) found in the repository.`
          : 'No `.spec.ts` or `.test.ts` files found. The project appears to have no unit tests.',
      suggestedFix: specCount === 0 ? 'Add unit tests for all business logic. Start with validators, services, and utility functions.' : undefined,
    });

    // test-2: coverage thresholds
    const hasThresholds = this.findCoverageThresholds(angJson, pkgjson);
    push({
      itemId: 'test-2', verifiability: 'partial',
      status: hasThresholds ? 'pass' : 'fail',
      filePath: ctx.files.has('angular.json') ? 'angular.json' : ctx.files.has('package.json') ? 'package.json' : undefined,
      explanation: hasThresholds
        ? 'Code coverage thresholds are configured — CI will fail if coverage drops below the minimum.'
        : 'No code coverage thresholds found in angular.json or package.json (jest config). Coverage can silently degrade.',
      suggestedFix: hasThresholds ? undefined : 'Add coverage thresholds to angular.json under `test > options > codeCoverageExclude` or configure `coverageThreshold` in jest config.',
    });

    // ── Angular-specific ──────────────────────────────────────────────────────

    if (isAngular || !isReact) {
      // ng-1: standalone components (no NgModule)
      const hasModuleFile = ctx.fileTree.has('src/app/app.module.ts') && ctx.files.get('src/app/app.module.ts') !== null;
      const moduleContent = ctx.files.get('src/app/app.module.ts') ?? '';
      const hasNgModuleDecorator = moduleContent.includes('@NgModule');
      push({
        itemId: 'ng-1', verifiability: 'auto',
        status: (hasModuleFile && hasNgModuleDecorator) ? 'fail' : 'pass',
        filePath: hasModuleFile ? 'src/app/app.module.ts' : undefined,
        explanation: (hasModuleFile && hasNgModuleDecorator)
          ? '`app.module.ts` with `@NgModule` decorator detected. The project is still using the module-based architecture.'
          : 'No `app.module.ts` / `@NgModule` found at the root level — project appears to use standalone components.',
        codeSnippet: hasNgModuleDecorator ? '@NgModule({ declarations: [...], imports: [...], bootstrap: [...] })' : undefined,
        suggestedFix: hasNgModuleDecorator ? 'Migrate to standalone components using `ng generate @angular/core:standalone`.' : undefined,
      });

      // ng-2: OnPush change detection
      const hasOnPush = appCompSrc.includes('ChangeDetectionStrategy.OnPush');
      push({
        itemId: 'ng-2', verifiability: 'partial',
        status: appCompSrc ? (hasOnPush ? 'pass' : 'warning') : 'not-checked',
        filePath: appCompSrc ? 'src/app/app.component.ts' : undefined,
        explanation: !appCompSrc
          ? 'AppComponent not found — cannot verify change detection strategy (checked sample only).'
          : hasOnPush
            ? '`ChangeDetectionStrategy.OnPush` found in AppComponent (sample check).'
            : '`ChangeDetectionStrategy.OnPush` not found in AppComponent. Default change detection may cause unnecessary re-renders. Note: this is a sample check of one file.',
        suggestedFix: (appCompSrc && !hasOnPush) ? 'Add `changeDetection: ChangeDetectionStrategy.OnPush` to the `@Component` decorator.' : undefined,
      });

      // ng-4: Signals
      const hasSignals = appCompSrc.includes('signal(') || appCompSrc.includes('computed(') || appCompSrc.includes("from '@angular/core'");
      push({
        itemId: 'ng-4', verifiability: 'partial',
        status: appCompSrc ? (hasSignals ? 'pass' : 'warning') : 'not-checked',
        filePath: appCompSrc ? 'src/app/app.component.ts' : undefined,
        explanation: !appCompSrc
          ? 'AppComponent not found — cannot verify Signal usage.'
          : hasSignals
            ? 'Angular Signals (`signal()`) usage detected in AppComponent.'
            : 'No Angular Signals detected in AppComponent (sample check). The project may still rely on RxJS BehaviorSubjects for state.',
        suggestedFix: (appCompSrc && !hasSignals && angVersion >= 17) ? 'Consider migrating local component state to `signal()` for better performance and simpler templates.' : undefined,
      });

      // ng-5: new control flow syntax
      const hasNewCf = appTpl.includes('@if ') || appTpl.includes('@for ') || appCompSrc.includes('@if ');
      const hasOldCf = appTpl.includes('*ngIf') || appTpl.includes('*ngFor') || appTpl.includes('ngSwitch');
      push({
        itemId: 'ng-5', verifiability: 'partial',
        status: appTpl || appCompSrc
          ? (hasNewCf && !hasOldCf ? 'pass' : hasOldCf ? 'fail' : 'not-checked')
          : 'not-checked',
        filePath: appTpl ? 'src/app/app.component.html' : appCompSrc ? 'src/app/app.component.ts' : undefined,
        explanation: hasNewCf && !hasOldCf
          ? 'New Angular control flow syntax (`@if`, `@for`) detected in templates (sample check).'
          : hasOldCf
            ? 'Legacy structural directives (`*ngIf`, `*ngFor`) found in AppComponent template. Migrate to `@if`/`@for` control flow.'
            : 'No template found to analyse (sample check only).',
        suggestedFix: hasOldCf ? 'Run `ng generate @angular/core:control-flow` to automatically migrate templates to the new `@if`/`@for` syntax.' : undefined,
      });

      // ng-7: takeUntilDestroyed
      const hasTud = appCompSrc.includes('takeUntilDestroyed') || appCompSrc.includes('DestroyRef');
      push({
        itemId: 'ng-7', verifiability: 'partial',
        status: appCompSrc ? (hasTud ? 'pass' : 'warning') : 'not-checked',
        filePath: appCompSrc ? 'src/app/app.component.ts' : undefined,
        explanation: !appCompSrc
          ? 'AppComponent not found — cannot verify RxJS cleanup patterns.'
          : hasTud
            ? '`takeUntilDestroyed()` or `DestroyRef` detected in AppComponent (sample check).'
            : 'No `takeUntilDestroyed()` found in AppComponent. RxJS subscriptions may not be cleaned up properly (sample check only).',
        suggestedFix: (appCompSrc && !hasTud) ? 'Use `takeUntilDestroyed(this.destroyRef)` from `@angular/core/rxjs-interop` for all RxJS subscriptions in components.' : undefined,
      });

      // ng-8: inject() function
      const hasInject = appCompSrc.includes('inject(');
      push({
        itemId: 'ng-8', verifiability: 'partial',
        status: appCompSrc ? (hasInject ? 'pass' : 'warning') : 'not-checked',
        filePath: appCompSrc ? 'src/app/app.component.ts' : undefined,
        explanation: !appCompSrc
          ? 'AppComponent not found — cannot verify DI pattern.'
          : hasInject
            ? '`inject()` function is used in AppComponent (sample check).'
            : 'No `inject()` calls found in AppComponent. Constructor injection may still be in use (sample check only).',
        suggestedFix: (appCompSrc && !hasInject) ? 'Prefer `private svc = inject(MyService)` over constructor parameter injection for standalone components.' : undefined,
      });
    }

    // React items: mark as not-applicable if not a React project
    if (!isReact) {
      const reactItems = ['react-1','react-2','react-3','react-4','react-5','react-6','react-7','react-8','react-9','react-10'];
      for (const itemId of reactItems) {
        push({
          itemId, verifiability: 'manual',
          status: 'not-checked',
          explanation: 'This is not a React project — React-specific checks are not applicable.',
        });
      }
    }

    return results;
  }

  // ── Build AuditIssue array from check results ─────────────────────────────

  private buildIssues(results: CheckResult[]): AuditIssue[] {
    const allItems = CHECKLIST_DATA.flatMap(t => t.items);
    const topicMap = new Map(CHECKLIST_DATA.map(t => [t.id, t]));
    const issues: AuditIssue[] = [];
    const resultMap = new Map(results.map(r => [r.itemId, r]));

    let issueIdx = 1;
    for (const item of allItems) {
      const result = resultMap.get(item.id);
      const topic  = topicMap.get(item.topicId);
      if (!topic) continue;

      // Determine verifiability and status
      const v     = VERIFIABLE[item.id] ?? 'manual';
      const status = result?.status ?? 'not-checked';
      const explanation = result?.explanation
        ?? `This item requires manual code review or runtime testing to verify — it cannot be determined from static file analysis alone.`;

      issues.push({
        id:              `issue-${issueIdx++}`,
        topicId:         topic.id,
        topicName:       topic.name,
        checklistItemId: item.id,
        practice:        item.practice,
        severity:        item.severity,
        group:           item.group,
        status,
        verifiability:   v,
        filePath:        result?.filePath,
        lineNumber:      result?.lineNumber,
        explanation,
        suggestedFix:    result?.suggestedFix,
        codeSnippet:     result?.codeSnippet,
        fixedCode:       result?.fixedCode,
      });
    }

    return issues;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private parseJson(content: string | undefined): Record<string, unknown> | null {
    if (!content) return null;
    try { return JSON.parse(content) as Record<string, unknown>; }
    catch { return null; }
  }

  private extractMajorVersion(versionStr: string): number {
    const match = versionStr.replace(/[\^~>=]/, '').match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private findAngularBudgets(angJson: Record<string, unknown> | null): boolean {
    if (!angJson) return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const any = angJson as any;
      const projects = any['projects'] ?? {};
      for (const proj of Object.values(projects) as any[]) {
        const build = proj?.architect?.build ?? proj?.targets?.build;
        const budgets = build?.configurations?.production?.budgets ?? build?.options?.budgets;
        if (budgets) return true;
      }
    } catch { /* ignore */ }
    return false;
  }

  private findCoverageThresholds(angJson: Record<string, unknown> | null, pkgjson: Record<string, unknown> | null): boolean {
    if (angJson) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const any = angJson as any;
        const projects = any['projects'] ?? {};
        for (const proj of Object.values(projects) as any[]) {
          const test = proj?.architect?.test ?? proj?.targets?.test;
          if (test?.options?.coverageThresholds || test?.options?.codeCoverageExclude) return true;
        }
      } catch { /* ignore */ }
    }
    if (pkgjson?.['jest']) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jest = pkgjson['jest'] as any;
      if (jest?.coverageThreshold) return true;
    }
    return false;
  }

  private findSyncScriptsInHead(html: string): string[] {
    if (!html) return [];
    const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
    if (!headMatch) return [];
    const head = headMatch[0];
    // Sync scripts: <script src="..."> without defer or async
    const syncRegex = /<script\s+(?!.*\bdefer\b)(?!.*\basync\b)[^>]*src=[^>]*>/gi;
    return [...head.matchAll(syncRegex)].map(m => m[0]).slice(0, 3);
  }

  /** Detect high-confidence secret patterns only — avoid false positives */
  private detectSecrets(
    files: Map<string, string>,
    paths: string[],
  ): { file: string; line: number; snippet: string; pattern: string } | null {
    // Patterns that are high-confidence actual secrets (not just variable names or URLs)
    const patterns: { name: string; re: RegExp }[] = [
      { name: 'Google API Key',    re: /:\s*['"`](AIza[0-9A-Za-z\\-_]{35})['"`]/ },
      { name: 'AWS Access Key',    re: /:\s*['"`](AKIA[0-9A-Z]{16})['"`]/ },
      { name: 'OpenAI API Key',    re: /:\s*['"`](sk-[a-zA-Z0-9]{20,})['"`]/ },
      { name: 'Stripe Secret Key', re: /:\s*['"`](sk_live_[a-zA-Z0-9]{24,})['"`]/ },
      { name: 'GitHub PAT',        re: /:\s*['"`](ghp_[a-zA-Z0-9]{36,})['"`]/ },
      { name: 'Private key literal', re: /:\s*['"`](-----BEGIN (?:RSA |EC )?PRIVATE KEY)/ },
    ];

    for (const path of paths) {
      const content = files.get(path);
      if (!content) continue;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip commented lines
        if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('#')) continue;
        for (const { name, re } of patterns) {
          if (re.test(line)) {
            return {
              file: path,
              line: i + 1,
              snippet: line.trim().slice(0, 120),
              pattern: name,
            };
          }
        }
      }
    }
    return null;
  }

  private getCiFilePath(ctx: RepoContext): string {
    const ciPaths = ['.github/workflows/ci.yml','.github/workflows/build.yml','.github/workflows/main.yml','Jenkinsfile','.circleci/config.yml'];
    return ciPaths.find(p => ctx.files.has(p)) ?? 'CI config';
  }
}
