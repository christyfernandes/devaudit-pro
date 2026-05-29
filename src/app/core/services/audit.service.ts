import { Injectable, signal, computed } from '@angular/core';
import { AuditReport, AuditIssue, AuditSummaryMatrix, ScanProgress } from '../models/audit.model';
import { IndexedDbService } from './indexed-db.service';
import { CHECKLIST_DATA } from './checklist.data';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private db = new IndexedDbService();

  private readonly _currentAudit   = signal<AuditReport | null>(null);
  private readonly _scanProgress   = signal<ScanProgress | null>(null);
  private readonly _auditHistory   = signal<AuditReport[]>([]);
  private readonly _historyLoading = signal<boolean>(true);

  readonly currentAudit   = this._currentAudit.asReadonly();
  readonly scanProgress   = this._scanProgress.asReadonly();
  readonly auditHistory   = this._auditHistory.asReadonly();
  readonly historyLoading = this._historyLoading.asReadonly();
  readonly isScanning     = computed(() => this._currentAudit()?.status === 'scanning');

  readonly selectedIssue  = signal<AuditIssue | null>(null);
  readonly filterTopicId  = signal<string | null>(null);
  readonly filterSeverity = signal<string[]>([]);
  readonly filterStatus   = signal<string[]>([]);
  readonly searchQuery    = signal<string>('');

  readonly filteredIssues = computed(() => {
    const audit = this._currentAudit();
    if (!audit) return [];
    return audit.issues.filter(issue => {
      const topicFilter  = this.filterTopicId();
      const sevFilter    = this.filterSeverity();
      const statusFilter = this.filterStatus();
      const query        = this.searchQuery().toLowerCase();
      if (topicFilter && issue.topicId !== topicFilter) return false;
      if (sevFilter.length && !sevFilter.includes(issue.severity)) return false;
      if (statusFilter.length && !statusFilter.includes(issue.status)) return false;
      if (query &&
          !issue.practice.toLowerCase().includes(query) &&
          !issue.filePath?.toLowerCase().includes(query) &&
          !issue.explanation.toLowerCase().includes(query)) return false;
      return true;
    });
  });

  constructor() {
    // Hydrate history from IndexedDB on startup (async — UI shows loading indicator)
    this.db.getAll()
      .then(reports => {
        this._auditHistory.set(reports);
        this._historyLoading.set(false);
      })
      .catch(() => this._historyLoading.set(false));
  }

  // ── History management ─────────────────────────────────────────────────────

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
    this.db.delete(auditId).catch(console.error);
  }

  clearAllHistory(): void {
    this._auditHistory.set([]);
    this.db.clearAll().catch(console.error);
  }

  // ── Scan ───────────────────────────────────────────────────────────────────

  async startAudit(repoUrl: string): Promise<void> {
    const repoName = this.extractRepoName(repoUrl);
    const auditId  = `audit-${Date.now()}`;

    this._currentAudit.set({
      id: auditId, repoUrl, repoName, branch: 'main',
      startedAt: new Date(), status: 'scanning', progress: 0,
      issues: [], summaryMatrix: {}, totalFiles: 0, scannedFiles: 0, overallScore: 0,
    });

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
      'Initialising scanner', 'Fetching repository tree',
      'Analysing TypeScript files', 'Running ESLint analysis',
      'Checking Angular patterns', 'Auditing security patterns',
      'Evaluating performance patterns', 'Compiling audit report',
    ];

    for (let i = 0; i < mockFiles.length; i++) {
      const phaseIndex = Math.floor((i / mockFiles.length) * phases.length);
      const progress   = Math.round(((i + 1) / mockFiles.length) * 85);
      this._scanProgress.set({ phase: phases[phaseIndex], currentFile: mockFiles[i], progress, filesScanned: i + 1, totalFiles: mockFiles.length });
      this._currentAudit.update(a => a ? { ...a, progress, scannedFiles: i + 1, totalFiles: mockFiles.length } : a);
      await this.delay(200 + Math.random() * 300);
    }

    const issues        = this.generateMockIssues();
    const summaryMatrix = this.buildSummaryMatrix(issues);
    const overallScore  = this.calculateScore(issues);

    this._scanProgress.set({ phase: 'Finalising report', currentFile: 'Generating AI explanations...', progress: 95, filesScanned: mockFiles.length, totalFiles: mockFiles.length });
    await this.delay(800);

    const completed: AuditReport = {
      id: auditId, repoUrl, repoName, branch: 'main',
      startedAt: this._currentAudit()!.startedAt,
      completedAt: new Date(),
      status: 'completed', progress: 100, issues, summaryMatrix,
      totalFiles: mockFiles.length, scannedFiles: mockFiles.length, overallScore,
    };

    this._currentAudit.set(completed);
    this._scanProgress.set(null);

    // Persist to IndexedDB and update in-memory history
    this._auditHistory.update(h => [completed, ...h.filter(a => a.id !== auditId)]);
    this.db.save(completed).catch(console.error);
  }

  private generateMockIssues(): AuditIssue[] {
    const findings = [
      { id: 'cq-1',   status: 'fail'    as const, filePath: 'src/app/core/services/user.service.ts',                 line: 23, col: 15,  explanation: 'Found usage of `any` type in function parameter. This disables TypeScript\'s type checking.',                                                             snippet: 'getUserData(id: any): Observable<any> {\n  return this.http.get(`/api/users/${id}`);\n}',                                                                                                                                            fix: 'Replace `any` with specific types.',                                             fixedCode: 'getUserData(id: UserId): Observable<User> {\n  return this.http.get<User>(`/api/users/${id}`);\n}' },
      { id: 'ng-1',   status: 'fail'    as const, filePath: 'src/app/app.module.ts',                                 line: 1,  col: 1,   explanation: 'NgModule detected. Angular v17+ recommends standalone components. NgModule is on the deprecation path.',                                                    snippet: '@NgModule({\n  declarations: [AppComponent],\n  imports: [BrowserModule],\n  bootstrap: [AppComponent]\n})',                                                                                                                             fix: 'Migrate using `ng generate @angular/core:standalone`.',                          fixedCode: '// Remove app.module.ts\n@Component({ standalone: true, ... })' },
      { id: 'ng-2',   status: 'fail'    as const, filePath: 'src/app/features/dashboard/dashboard.component.ts',     line: 8,  col: 1,   explanation: 'Component uses Default change detection. This causes unnecessary re-renders on every event in the component tree.',                                       snippet: '@Component({\n  selector: \'app-dashboard\',\n  // No changeDetection — defaults to Default\n})',                                                                                                                                      fix: 'Add ChangeDetectionStrategy.OnPush.',                                           fixedCode: '@Component({\n  changeDetection: ChangeDetectionStrategy.OnPush,\n})' },
      { id: 'sec-1',  status: 'fail'    as const, filePath: 'src/environments/environment.ts',                       line: 4,  col: 1,   explanation: 'Potential API key exposure in environment file. Keys bundled into browser JS are accessible to any user.',                                                snippet: 'export const environment = {\n  apiKey: \'sk-live-xxxx\',  // ⚠️ EXPOSED\n};',                                                                                                                                                         fix: 'Move secrets to server-side config.',                                           fixedCode: 'export const environment = {\n  // apiKey removed — use server-side proxy\n};' },
      { id: 'perf-1', status: 'fail'    as const, filePath: 'src/app/app.routes.ts',                                 line: 12, col: 1,   explanation: 'Feature module loaded eagerly. Bundle included in initial download regardless of navigation.',                                                            snippet: 'import { DashboardComponent } from \'...\';\nconst routes = [{ path: \'dashboard\', component: DashboardComponent }];',                                                                                                                   fix: 'Use loadComponent for lazy loading.',                                           fixedCode: 'const routes = [{\n  path: \'dashboard\',\n  loadComponent: () => import(...).then(m => m.DashboardComponent)\n}];' },
      { id: 'ts-1',   status: 'fail'    as const, filePath: 'tsconfig.json',                                         line: 15, col: 1,   explanation: 'TypeScript strict mode is not enabled. strictNullChecks disabled — null/undefined can be assigned to any type without error.',                            snippet: '{ "compilerOptions": { "strict": false } }',                                                                                                                                                                                            fix: 'Enable `"strict": true` in tsconfig.json.',                                     fixedCode: '{ "compilerOptions": { "strict": true } }' },
      { id: 'a11y-4', status: 'fail'    as const, filePath: 'src/app/shared/components/button/button.component.html',line: 3,  col: 1,   explanation: 'Colour contrast ratio ~2.8:1. WCAG 2.2 AA requires minimum 4.5:1 for normal text.',                                                                       snippet: '<button class="text-gray-300 bg-white">Submit</button>',                                                                                                                                                                                  fix: 'Increase text colour contrast.',                                                fixedCode: '<button class="text-gray-700 bg-white">Submit</button>' },
      { id: 'ng-7',   status: 'fail'    as const, filePath: 'src/app/features/products/product-list.component.ts',   line: 35, col: 1,   explanation: 'RxJS subscription not cleaned up on component destroy. Continues executing after component removed from DOM.',                                            snippet: 'ngOnInit() {\n  this.service.getProducts().subscribe(p => this.products = p);\n}',                                                                                                                                                       fix: 'Use takeUntilDestroyed() from @angular/core/rxjs-interop.',                     fixedCode: 'private destroyRef = inject(DestroyRef);\nngOnInit() {\n  this.service.getProducts()\n    .pipe(takeUntilDestroyed(this.destroyRef))\n    .subscribe(p => this.products = p);\n}' },
      { id: 'test-2', status: 'fail'    as const, filePath: 'angular.json',                                          line: 67, col: 1,   explanation: 'No code coverage thresholds configured. Coverage can silently decrease as new code is added.',                                                            snippet: '"test": { "options": { "codeCoverage": true } }',                                                                                                                                                                                       fix: 'Add coverageThresholds to angular.json.',                                       fixedCode: '"test": { "options": { "codeCoverage": true, "coverageThresholds": { "statements": 70 } } }' },
      { id: 'perf-8', status: 'fail'    as const, filePath: '.github/workflows/ci.yml',                              line: 1,  col: 1,   explanation: 'Lighthouse CI not configured. Performance regressions cannot be detected automatically before merging PRs.',                                               snippet: '# No Lighthouse CI step found',                                                                                                                                                                                                          fix: 'Add treosh/lighthouse-ci-action to your workflow.',                             fixedCode: '- uses: treosh/lighthouse-ci-action@v10\n  with:\n    urls: http://localhost:4200' },
      { id: 'cq-3',   status: 'pass'    as const, filePath: '.husky/pre-commit',                                     line: 1,  col: 1,   explanation: 'Pre-commit hooks configured with Husky and lint-staged.',                                                                                                   snippet: '#!/usr/bin/env sh\nnpx lint-staged',                                                                                                                                                                                                     fix: undefined,                                                                       fixedCode: undefined },
      { id: 'cq-4',   status: 'pass'    as const, filePath: '.prettierrc',                                           line: 1,  col: 1,   explanation: 'Prettier configured project-wide.',                                                                                                                        snippet: '{ "semi": true, "singleQuote": true, "printWidth": 100 }',                                                                                                                                                                              fix: undefined,                                                                       fixedCode: undefined },
      { id: 'nfr-5',  status: 'warning' as const, filePath: 'src/app/app.component.html',                            line: 45, col: 1,   explanation: 'Hardcoded user-facing string detected. Requires extraction if i18n is planned.',                                                                           snippet: '<h1>Welcome to our application</h1>',                                                                                                                                                                                                    fix: 'Use Angular i18n markers or ngx-translate.',                                    fixedCode: '<h1 i18n="@@welcome.title">Welcome to our application</h1>' },
    ];

    const issues: AuditIssue[] = [];
    findings.forEach((f, index) => {
      const allItems     = CHECKLIST_DATA.flatMap(t => t.items);
      const checklistItem = allItems.find(i => i.id === f.id);
      const topic        = CHECKLIST_DATA.find(t => t.items.some(i => i.id === f.id));
      if (checklistItem && topic) {
        issues.push({
          id: `issue-${index + 1}`, topicId: topic.id, topicName: topic.name,
          checklistItemId: f.id, practice: checklistItem.practice,
          severity: checklistItem.severity, group: checklistItem.group,
          status: f.status, filePath: f.filePath, lineNumber: f.line, columnNumber: f.col,
          explanation: f.explanation, suggestedFix: f.fix,
          codeSnippet: f.snippet, fixedCode: f.fixedCode,
        });
      }
    });
    return issues;
  }

  private buildSummaryMatrix(issues: AuditIssue[]): AuditSummaryMatrix {
    const matrix: AuditSummaryMatrix = {};
    CHECKLIST_DATA.forEach(topic => {
      const ti     = issues.filter(i => i.topicId === topic.id);
      const failed = ti.filter(i => i.status === 'fail');
      matrix[topic.id] = {
        topicName: topic.shortName,
        critical: failed.filter(i => i.severity === 'CRITICAL').length,
        high:     failed.filter(i => i.severity === 'HIGH').length,
        medium:   failed.filter(i => i.severity === 'MEDIUM').length,
        low:      failed.filter(i => i.severity === 'LOW').length,
        total:    ti.length,
        passed:   ti.filter(i => i.status === 'pass').length,
        failed:   failed.length,
      };
    });
    return matrix;
  }

  private calculateScore(issues: AuditIssue[]): number {
    const failures = issues.filter(i => i.status === 'fail');
    if (!failures.length) return 100;
    const penalty = failures.reduce((acc, i) => {
      const w: Record<string, number> = { CRITICAL: 15, HIGH: 8, MEDIUM: 3, LOW: 1 };
      return acc + (w[i.severity] ?? 1);
    }, 0);
    return Math.max(0, Math.min(100, 100 - penalty));
  }

  private extractRepoName(url: string): string {
    const match = url.match(/github\.com\/([^/]+\/[^/]+)/);
    return match ? match[1] : url;
  }

  selectIssue(issue: AuditIssue | null): void    { this.selectedIssue.set(issue); }
  setFilterTopic(id: string | null): void        { this.filterTopicId.set(id); }
  setFilterSeverity(s: string[]): void           { this.filterSeverity.set(s); }
  setFilterStatus(s: string[]): void             { this.filterStatus.set(s); }
  setSearchQuery(q: string): void                { this.searchQuery.set(q); }

  clearAudit(): void {
    this._currentAudit.set(null);
    this._scanProgress.set(null);
    this.selectedIssue.set(null);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
