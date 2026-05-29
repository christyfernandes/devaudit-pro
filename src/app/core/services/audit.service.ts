import { Injectable, signal, computed } from '@angular/core';
import { AuditReport, AuditIssue, AuditSummaryMatrix, ScanProgress } from '../models/audit.model';
import { CHECKLIST_DATA } from './checklist.data';

const HISTORY_KEY = 'devaudit_history';
const MAX_HISTORY = 20;

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly _currentAudit = signal<AuditReport | null>(null);
  private readonly _scanProgress = signal<ScanProgress | null>(null);
  private readonly _auditHistory = signal<AuditReport[]>(this.loadHistoryFromStorage());

  readonly currentAudit = this._currentAudit.asReadonly();
  readonly scanProgress = this._scanProgress.asReadonly();
  readonly auditHistory = this._auditHistory.asReadonly();
  readonly isScanning = computed(() => this._currentAudit()?.status === 'scanning');

  readonly selectedIssue = signal<AuditIssue | null>(null);
  readonly filterTopicId = signal<string | null>(null);
  readonly filterSeverity = signal<string[]>([]);
  readonly filterStatus = signal<string[]>([]);
  readonly searchQuery = signal<string>('');

  readonly filteredIssues = computed(() => {
    const audit = this._currentAudit();
    if (!audit) return [];
    return audit.issues.filter(issue => {
      const topicFilter = this.filterTopicId();
      const sevFilter = this.filterSeverity();
      const statusFilter = this.filterStatus();
      const query = this.searchQuery().toLowerCase();
      if (topicFilter && issue.topicId !== topicFilter) return false;
      if (sevFilter.length && !sevFilter.includes(issue.severity)) return false;
      if (statusFilter.length && !statusFilter.includes(issue.status)) return false;
      if (query && !issue.practice.toLowerCase().includes(query) &&
          !issue.filePath?.toLowerCase().includes(query) &&
          !issue.explanation.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  // ─── Persistence helpers ───────────────────────────────────────────────────

  private loadHistoryFromStorage(): AuditReport[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AuditReport[];
      // Revive Date objects which JSON.parse leaves as strings
      return parsed.map(a => ({
        ...a,
        startedAt: new Date(a.startedAt),
        completedAt: a.completedAt ? new Date(a.completedAt) : undefined,
      }));
    } catch {
      return [];
    }
  }

  private saveHistoryToStorage(history: AuditReport[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
    } catch {
      // localStorage quota exceeded — silently skip
    }
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Load a historical audit as the active report and navigate to results */
  loadHistoricalAudit(auditId: string): boolean {
    const found = this._auditHistory().find(a => a.id === auditId);
    if (!found) return false;
    this._currentAudit.set(found);
    this.filterStatus.set(['fail', 'warning']);
    this.filterSeverity.set([]);
    this.filterTopicId.set(null);
    this.searchQuery.set('');
    return true;
  }

  deleteHistoricalAudit(auditId: string): void {
    this._auditHistory.update(h => h.filter(a => a.id !== auditId));
    this.saveHistoryToStorage(this._auditHistory());
  }

  clearAllHistory(): void {
    this._auditHistory.set([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  // ─── Scan ──────────────────────────────────────────────────────────────────

  async startAudit(repoUrl: string): Promise<void> {
    const repoName = this.extractRepoName(repoUrl);
    const auditId = `audit-${Date.now()}`;

    const initialAudit: AuditReport = {
      id: auditId, repoUrl, repoName, branch: 'main',
      startedAt: new Date(), status: 'scanning', progress: 0,
      issues: [], summaryMatrix: {}, totalFiles: 0, scannedFiles: 0, overallScore: 0,
    };

    this._currentAudit.set(initialAudit);
    await this.simulateScan(auditId, repoUrl, repoName);
  }

  private async simulateScan(auditId: string, repoUrl: string, repoName: string): Promise<void> {
    const mockFiles = [
      'src/app/app.component.ts', 'src/app/app.module.ts',
      'src/app/core/services/auth.service.ts', 'src/app/features/dashboard/dashboard.component.ts',
      'src/app/shared/components/button/button.component.ts', 'src/app/features/users/users.component.ts',
      'tsconfig.json', '.eslintrc.json', 'package.json', 'src/styles.scss',
      'src/app/features/products/product-list.component.ts', 'src/app/core/interceptors/auth.interceptor.ts',
      'src/app/shared/pipes/truncate.pipe.ts', 'src/environments/environment.ts',
      'src/app/features/checkout/checkout.component.ts', 'src/app/core/guards/auth.guard.ts',
    ];

    const phases = [
      { phase: 'Initialising scanner' }, { phase: 'Fetching repository tree' },
      { phase: 'Analysing TypeScript files' }, { phase: 'Running ESLint analysis' },
      { phase: 'Checking Angular patterns' }, { phase: 'Auditing security patterns' },
      { phase: 'Evaluating performance patterns' }, { phase: 'Compiling audit report' },
    ];

    for (let i = 0; i < mockFiles.length; i++) {
      const phaseIndex = Math.floor((i / mockFiles.length) * phases.length);
      const progress = Math.round(((i + 1) / mockFiles.length) * 85);
      this._scanProgress.set({ phase: phases[phaseIndex].phase, currentFile: mockFiles[i], progress, filesScanned: i + 1, totalFiles: mockFiles.length });
      this._currentAudit.update(audit => audit ? { ...audit, progress, scannedFiles: i + 1, totalFiles: mockFiles.length } : audit);
      await this.delay(200 + Math.random() * 300);
    }

    const issues = this.generateMockIssues(repoName);
    const summaryMatrix = this.buildSummaryMatrix(issues);
    const overallScore = this.calculateScore(issues);

    this._scanProgress.set({ phase: 'Finalising report', currentFile: 'Generating AI explanations...', progress: 95, filesScanned: mockFiles.length, totalFiles: mockFiles.length });
    await this.delay(800);

    const completedAudit: AuditReport = {
      id: auditId, repoUrl, repoName, branch: 'main',
      startedAt: this._currentAudit()!.startedAt, completedAt: new Date(),
      status: 'completed', progress: 100, issues, summaryMatrix,
      totalFiles: mockFiles.length, scannedFiles: mockFiles.length, overallScore,
    };

    this._currentAudit.set(completedAudit);
    this._scanProgress.set(null);

    // Persist to history
    this._auditHistory.update(h => {
      const deduplicated = h.filter(a => a.id !== auditId);
      return [completedAudit, ...deduplicated];
    });
    this.saveHistoryToStorage(this._auditHistory());
  }

  private generateMockIssues(repoName: string): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const mockFindings = [
      { checklistItemId: 'cq-1', status: 'fail' as const, filePath: 'src/app/core/services/user.service.ts', lineNumber: 23, columnNumber: 15, explanation: 'Found usage of `any` type in function parameter. This disables TypeScript\'s type checking for this value and all operations on it.', codeSnippet: 'getUserData(id: any): Observable<any> {\n  return this.http.get(`/api/users/${id}`);\n}', suggestedFix: 'Replace `any` with specific types. Define a `UserId` branded type and a `User` interface.', fixedCode: 'getUserData(id: UserId): Observable<User> {\n  return this.http.get<User>(`/api/users/${id}`);\n}' },
      { checklistItemId: 'ng-1', status: 'fail' as const, filePath: 'src/app/app.module.ts', lineNumber: 1, columnNumber: 1, explanation: 'NgModule detected. Angular v17+ recommends standalone components. NgModule is on the deprecation path and creates unnecessary compilation overhead.', codeSnippet: '@NgModule({\n  declarations: [AppComponent, DashboardComponent],\n  imports: [BrowserModule, RouterModule],\n  bootstrap: [AppComponent]\n})', suggestedFix: 'Migrate to standalone components using `ng generate @angular/core:standalone`', fixedCode: '// Remove app.module.ts entirely\n// In app.component.ts:\n@Component({\n  standalone: true,\n  imports: [RouterModule],\n  ...\n})' },
      { checklistItemId: 'ng-2', status: 'fail' as const, filePath: 'src/app/features/dashboard/dashboard.component.ts', lineNumber: 8, explanation: 'Component uses Default change detection strategy. This causes unnecessary re-renders on every event in the component tree.', codeSnippet: '@Component({\n  selector: \'app-dashboard\',\n  templateUrl: \'./dashboard.component.html\',\n  // No changeDetection specified — defaults to Default\n})', suggestedFix: 'Add `changeDetection: ChangeDetectionStrategy.OnPush` to the @Component decorator.', fixedCode: '@Component({\n  selector: \'app-dashboard\',\n  templateUrl: \'./dashboard.component.html\',\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})' },
      { checklistItemId: 'sec-1', status: 'fail' as const, filePath: 'src/environments/environment.ts', lineNumber: 4, explanation: 'Potential API key exposure detected in environment file. Keys will be bundled into browser JavaScript and are accessible to any user.', codeSnippet: 'export const environment = {\n  production: false,\n  apiKey: \'sk-live-xxxxxxxxxxxx\',  // ⚠️ EXPOSED\n  apiUrl: \'https://api.example.com\'\n};', suggestedFix: 'Move secrets to server-side configuration. Never include private API keys in frontend bundles.', fixedCode: 'export const environment = {\n  production: false,\n  // apiKey removed — use server-side proxy\n  apiUrl: \'https://api.example.com\'\n};' },
      { checklistItemId: 'perf-1', status: 'fail' as const, filePath: 'src/app/app.routes.ts', lineNumber: 12, explanation: 'Feature module loaded eagerly. This causes the entire feature bundle to be included in the initial download.', codeSnippet: 'import { DashboardComponent } from \'./features/dashboard/dashboard.component\';\n\nconst routes: Routes = [\n  { path: \'dashboard\', component: DashboardComponent }  // Eager\n];', suggestedFix: 'Use `loadComponent` for lazy loading standalone components.', fixedCode: 'const routes: Routes = [\n  {\n    path: \'dashboard\',\n    loadComponent: () => import(\'./features/dashboard/dashboard.component\')\n      .then(m => m.DashboardComponent)\n  }\n];' },
      { checklistItemId: 'ts-1', status: 'fail' as const, filePath: 'tsconfig.json', lineNumber: 15, explanation: 'TypeScript strict mode is not fully enabled. `strictNullChecks` is disabled.', codeSnippet: '{\n  "compilerOptions": {\n    "strict": false,\n    "strictNullChecks": false\n  }\n}', suggestedFix: 'Enable `"strict": true` in tsconfig.json.', fixedCode: '{\n  "compilerOptions": {\n    "strict": true\n  }\n}' },
      { checklistItemId: 'a11y-4', status: 'fail' as const, filePath: 'src/app/shared/components/button/button.component.html', lineNumber: 3, explanation: 'Colour contrast ratio is approximately 2.8:1 for the light grey text on white background. WCAG 2.2 AA requires 4.5:1.', codeSnippet: '<button class="text-gray-300 bg-white px-4 py-2">Submit</button>', suggestedFix: 'Increase text colour contrast to meet WCAG 2.2 AA.', fixedCode: '<button class="text-gray-700 bg-white px-4 py-2">Submit</button>' },
      { checklistItemId: 'ng-7', status: 'fail' as const, filePath: 'src/app/features/products/product-list.component.ts', lineNumber: 35, explanation: 'RxJS subscription is not cleaned up when the component is destroyed.', codeSnippet: 'ngOnInit() {\n  this.productService.getProducts().subscribe(products => {\n    this.products = products;  // Subscription never unsubscribed!\n  });\n}', suggestedFix: 'Use `takeUntilDestroyed()` from @angular/core/rxjs-interop.', fixedCode: 'private destroyRef = inject(DestroyRef);\n\nngOnInit() {\n  this.productService.getProducts()\n    .pipe(takeUntilDestroyed(this.destroyRef))\n    .subscribe(products => {\n      this.products = products;\n    });\n}' },
      { checklistItemId: 'test-2', status: 'fail' as const, filePath: 'angular.json', lineNumber: 67, explanation: 'No code coverage thresholds are configured.', codeSnippet: '"test": {\n  "options": {\n    "codeCoverage": true\n    // No coverageThresholds configured\n  }\n}', suggestedFix: 'Add coverage thresholds to angular.json.', fixedCode: '"test": {\n  "options": {\n    "codeCoverage": true,\n    "coverageThresholds": {\n      "statements": 70,\n      "branches": 60,\n      "functions": 70,\n      "lines": 70\n    }\n  }\n}' },
      { checklistItemId: 'cq-3', status: 'pass' as const, filePath: '.husky/pre-commit', lineNumber: 1, explanation: 'Pre-commit hooks are properly configured with Husky and lint-staged.' , codeSnippet: '#!/usr/bin/env sh\n. "$(dirname "$0")/_/husky.sh"\nnpx lint-staged' },
      { checklistItemId: 'cq-4', status: 'pass' as const, filePath: '.prettierrc', lineNumber: 1, explanation: 'Prettier is configured with a project-wide configuration file.', codeSnippet: '{\n  "semi": true,\n  "trailingComma": "all",\n  "singleQuote": true,\n  "printWidth": 100,\n  "tabWidth": 2\n}' },
      { checklistItemId: 'nfr-5', status: 'warning' as const, filePath: 'src/app/app.component.html', lineNumber: 45, explanation: 'Hardcoded user-facing string detected. If internationalisation is required, this string will need to be extracted.', codeSnippet: '<h1>Welcome to our application</h1>\n<p>Please log in to continue</p>', suggestedFix: 'Use Angular i18n markers or ngx-translate if internationalisation is planned.', fixedCode: '<h1 i18n="@@welcome.title">Welcome to our application</h1>\n<p i18n="@@welcome.loginPrompt">Please log in to continue</p>' },
      { checklistItemId: 'perf-8', status: 'fail' as const, filePath: '.github/workflows/ci.yml', lineNumber: 1, explanation: 'Lighthouse CI is not configured in the CI pipeline.', codeSnippet: '# No Lighthouse CI step found in workflow\njobs:\n  build:\n    steps:\n      - run: npm run build\n      - run: npm test', suggestedFix: 'Add LHCI (Lighthouse CI) to your GitHub Actions workflow.', fixedCode: '- name: Run Lighthouse CI\n  uses: treosh/lighthouse-ci-action@v10\n  with:\n    urls: |\n      http://localhost:4200\n    uploadArtifacts: true' },
    ];

    mockFindings.forEach((finding, index) => {
      const allItems = CHECKLIST_DATA.flatMap(t => t.items);
      const checklistItem = allItems.find(i => i.id === finding.checklistItemId);
      const topic = CHECKLIST_DATA.find(t => t.items.some(i => i.id === finding.checklistItemId));
      if (checklistItem && topic) {
        issues.push({
          id: `issue-${index + 1}`, topicId: topic.id, topicName: topic.name,
          checklistItemId: finding.checklistItemId, practice: checklistItem.practice,
          severity: checklistItem.severity, group: checklistItem.group,
          status: finding.status, filePath: finding.filePath, lineNumber: finding.lineNumber,
          columnNumber: finding.columnNumber, explanation: finding.explanation,
          suggestedFix: finding.suggestedFix, codeSnippet: finding.codeSnippet, fixedCode: finding.fixedCode,
        });
      }
    });

    return issues;
  }

  private buildSummaryMatrix(issues: AuditIssue[]): AuditSummaryMatrix {
    const matrix: AuditSummaryMatrix = {};
    CHECKLIST_DATA.forEach(topic => {
      const topicIssues = issues.filter(i => i.topicId === topic.id);
      const failed = topicIssues.filter(i => i.status === 'fail');
      matrix[topic.id] = {
        topicName: topic.shortName,
        critical: failed.filter(i => i.severity === 'CRITICAL').length,
        high: failed.filter(i => i.severity === 'HIGH').length,
        medium: failed.filter(i => i.severity === 'MEDIUM').length,
        low: failed.filter(i => i.severity === 'LOW').length,
        total: topicIssues.length,
        passed: topicIssues.filter(i => i.status === 'pass').length,
        failed: failed.length,
      };
    });
    return matrix;
  }

  private calculateScore(issues: AuditIssue[]): number {
    const failures = issues.filter(i => i.status === 'fail');
    if (!failures.length) return 100;
    const penalty = failures.reduce((acc, issue) => {
      const weights: Record<string, number> = { CRITICAL: 15, HIGH: 8, MEDIUM: 3, LOW: 1 };
      return acc + (weights[issue.severity] ?? 1);
    }, 0);
    return Math.max(0, Math.min(100, 100 - penalty));
  }

  private extractRepoName(url: string): string {
    try {
      const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
      return match ? match[1] : url;
    } catch { return url; }
  }

  selectIssue(issue: AuditIssue | null): void { this.selectedIssue.set(issue); }
  setFilterTopic(topicId: string | null): void { this.filterTopicId.set(topicId); }
  setFilterSeverity(severities: string[]): void { this.filterSeverity.set(severities); }
  setFilterStatus(statuses: string[]): void { this.filterStatus.set(statuses); }
  setSearchQuery(q: string): void { this.searchQuery.set(q); }

  clearAudit(): void {
    this._currentAudit.set(null);
    this._scanProgress.set(null);
    this.selectedIssue.set(null);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
