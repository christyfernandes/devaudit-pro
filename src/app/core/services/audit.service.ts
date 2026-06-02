import { Injectable, signal, computed, inject } from '@angular/core';
import {
  AuditReport, AuditIssue, AuditSummaryMatrix,
  ScanProgress, CoverageStats,
} from '../models/audit.model';
import { IndexedDbService } from './indexed-db.service';
import { GithubScannerService } from './github-scanner.service';
import { CHECKLIST_DATA } from './checklist.data';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private db      = inject(IndexedDbService);
  private scanner = inject(GithubScannerService);

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
    this.db.getAll()
      .then(reports => { this._auditHistory.set(reports); this._historyLoading.set(false); })
      .catch(() => this._historyLoading.set(false));
  }

  // ── History ────────────────────────────────────────────────────────────────

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

  async startAudit(rawUrl: string): Promise<void> {
    // 1. Parse URL — extract owner, repo, branch
    const parsed = this.scanner.parseUrl(rawUrl);
    if (!parsed.valid) {
      console.error('Invalid GitHub URL:', parsed.error);
      return;
    }

    const auditId = `audit-${Date.now()}`;
    let branch    = parsed.branch;

    // 2. Resolve default branch if not in URL
    if (!branch) {
      this._scanProgress.set({ phase: 'Resolving default branch', currentFile: `${parsed.owner}/${parsed.repo}`, progress: 2, filesScanned: 0, totalFiles: 1 });
      branch = await this.scanner.resolveDefaultBranch(parsed.owner, parsed.repo);
    }

    const repoName = `${parsed.owner}/${parsed.repo}`;

    this._currentAudit.set({
      id: auditId, repoUrl: rawUrl, repoName, branch,
      startedAt: new Date(), status: 'scanning', progress: 0,
      issues: [], summaryMatrix: {}, totalFiles: 0, scannedFiles: 0,
      overallScore: 0, coverageStats: this.emptyCoverage(), fetchedFiles: [],
    });

    // 3. Run the real scan
    try {
      const { issues, fetchedFiles, isPrivate } = await this.scanner.scan(
        parsed.owner, parsed.repo, branch,
        (phase, file, pct) => {
          this._scanProgress.set({ phase, currentFile: file, progress: pct, filesScanned: 0, totalFiles: 1 });
          this._currentAudit.update(a => a ? { ...a, progress: pct } : a);
        }
      );

      const summaryMatrix = this.buildMatrix(issues);
      const coverageStats = this.buildCoverage(issues);
      const overallScore  = this.calcScore(issues);

      const completed: AuditReport = {
        id: auditId, repoUrl: rawUrl, repoName, branch,
        startedAt: this._currentAudit()!.startedAt,
        completedAt: new Date(), status: 'completed', progress: 100,
        issues, summaryMatrix, coverageStats, fetchedFiles,
        totalFiles: fetchedFiles.length, scannedFiles: fetchedFiles.length,
        overallScore, isPrivateRepo: isPrivate,
      };

      this._currentAudit.set(completed);
      this._scanProgress.set(null);
      this._auditHistory.update(h => [completed, ...h.filter(a => a.id !== auditId)]);
      this.db.save(completed).catch(console.error);

    } catch (err) {
      this._currentAudit.update(a => a ? { ...a, status: 'error' } : a);
      this._scanProgress.set(null);
      console.error('Scan failed:', err);
    }
  }

  // ── Matrix + scoring ──────────────────────────────────────────────────────

  private buildMatrix(issues: AuditIssue[]): AuditSummaryMatrix {
    const matrix: AuditSummaryMatrix = {};
    CHECKLIST_DATA.forEach(topic => {
      const ti     = issues.filter(i => i.topicId === topic.id);
      const failed = ti.filter(i => i.status === 'fail');
      const nc     = ti.filter(i => i.status === 'not-checked');
      matrix[topic.id] = {
        topicName: topic.shortName,
        critical: failed.filter(i => i.severity === 'CRITICAL').length,
        high:     failed.filter(i => i.severity === 'HIGH').length,
        medium:   failed.filter(i => i.severity === 'MEDIUM').length,
        low:      failed.filter(i => i.severity === 'LOW').length,
        total:    ti.length,
        passed:   ti.filter(i => i.status === 'pass').length,
        failed:   failed.length,
        notChecked: nc.length,
      };
    });
    return matrix;
  }

  private buildCoverage(issues: AuditIssue[]): CoverageStats {
    return {
      total:           issues.length,
      autoChecked:     issues.filter(i => i.verifiability === 'auto').length,
      partialChecked:  issues.filter(i => i.verifiability === 'partial').length,
      notVerifiable:   issues.filter(i => i.verifiability === 'manual').length,
      passed:          issues.filter(i => i.status === 'pass').length,
      failed:          issues.filter(i => i.status === 'fail').length,
      warnings:        issues.filter(i => i.status === 'warning').length,
    };
  }

  private calcScore(issues: AuditIssue[]): number {
    // Only score items that were actually checked
    const checked = issues.filter(i => i.status !== 'not-checked');
    if (!checked.length) return 0;
    const weights: Record<string, number> = { CRITICAL: 15, HIGH: 8, MEDIUM: 3, LOW: 1 };
    const penalty = checked
      .filter(i => i.status === 'fail')
      .reduce((acc, i) => acc + (weights[i.severity] ?? 1), 0);
    return Math.max(0, Math.min(100, 100 - penalty));
  }

  private emptyCoverage(): CoverageStats {
    return { total: 0, autoChecked: 0, partialChecked: 0, notVerifiable: 0, passed: 0, failed: 0, warnings: 0 };
  }

  // ── Filters ───────────────────────────────────────────────────────────────

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
}
