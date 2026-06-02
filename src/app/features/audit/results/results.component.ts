import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { ToolsService } from '../../../core/services/tools.service';
import { SeverityBadgeComponent } from '../../../shared/components/severity-badge/severity-badge.component';
import { AuditIssue } from '../../../core/models/audit.model';
import {
  ToolStatus, LighthouseReport, ObservatoryReport, ExternalTool,
} from '../../../core/models/tools.model';
import { LhError } from '../../../core/services/tools.service';
import { CHECKLIST_DATA } from '../../../core/services/checklist.data';

type ActiveTab = 'matrix' | 'issues' | 'tools';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SeverityBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results.component.html',
})
export class ResultsComponent implements OnInit {
  protected auditService  = inject(AuditService);
  protected exportService = inject(ReportExportService);
  protected toolsService  = inject(ToolsService);
  private router          = inject(Router);
  private route           = inject(ActivatedRoute);

  // ── Phase 2: share link ────────────────────────────────────────────────────
  protected showCopied      = signal(false);
  protected showDownloadDdl = signal(false);

  // ── Phase 2: CI integration ────────────────────────────────────────────────
  protected showCiSection   = signal(false);
  protected ciThreshold     = signal(70);
  protected ciCopied        = signal<string | null>(null);

  // ── Existing tabs ──────────────────────────────────────────────────────────
  protected activeTab       = signal<ActiveTab>('matrix');
  protected selectedIssue   = signal<AuditIssue | null>(null);
  protected showCode        = signal(false);
  protected searchQuery     = signal('');
  protected searchQueryValue = '';
  protected filterSeverity  = signal<string[]>([]);
  protected filterStatus    = signal<string[]>(['fail', 'warning']);
  protected showDownloadMenu = signal(false);

  // ── Tools tab state ────────────────────────────────────────────────────────
  protected liveUrl         = signal('');
  protected liveUrlValue    = '';
  protected liveUrlError    = signal<string | null>(null);
  protected strategy        = signal<'mobile' | 'desktop'>('mobile');

  // API key for PageSpeed Insights (optional, free from Google Cloud)
  protected lhApiKey        = signal(this.toolsService.getSavedApiKey());
  protected lhApiKeyValue   = this.toolsService.getSavedApiKey();
  protected showApiKeyInput = signal(false);

  protected lhStatus        = signal<ToolStatus>('idle');
  protected lhReport        = signal<LighthouseReport | null>(null);
  protected lhError         = signal<string | null>(null);
  protected lhErrorKind     = signal<'quota' | 'network' | 'unknown' | null>(null);
  protected lhProgress      = signal('');

  protected obsStatus       = signal<ToolStatus>('idle');
  protected obsReport       = signal<ObservatoryReport | null>(null);
  protected obsError        = signal<string | null>(null);
  protected obsProgress     = signal('');

  protected readonly externalTools: ExternalTool[] = this.toolsService.externalTools;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Phase 2: load audit from deep-link query param (?id=audit-xxx)
    const paramId = this.route.snapshot.queryParamMap.get('id');
    if (paramId && !this.auditService.currentAudit()) {
      this.auditService.loadHistoricalAudit(paramId);
    }

    const audit = this.auditService.currentAudit();
    if (!audit || audit.status !== 'completed') {
      this.router.navigate(['/audit']);
      return;
    }
    this.auditService.setFilterStatus(['fail', 'warning']);

    // Pre-fill live URL guess from repo URL
    const guess = this.toolsService.guessLiveUrl(audit.repoUrl);
    if (guess) {
      this.liveUrl.set(guess);
      this.liveUrlValue = guess;
    }
  }

  // ── Existing getters ───────────────────────────────────────────────────────

  protected get audit()          { return this.auditService.currentAudit(); }
  protected get filteredIssues() { return this.auditService.filteredIssues(); }
  protected get summaryMatrix()  { return this.audit?.summaryMatrix ?? {}; }
  protected get matrixTopics()   { return Object.entries(this.summaryMatrix); }
  protected showCoverage         = signal(true);  // open by default
  protected expandedTopics       = signal<Set<string>>(new Set());
  protected get coverageStats()  { return this.audit?.coverageStats; }
  protected get fetchedFiles()   { return this.audit?.fetchedFiles ?? []; }

  protected get topicCoverageGroups() {
    const audit = this.audit;
    if (!audit) return [];
    return CHECKLIST_DATA.map(topic => {
      const items = audit.issues.filter(i => i.topicId === topic.id);
      const auto     = items.filter(i => i.verifiability === 'auto');
      const partial  = items.filter(i => i.verifiability === 'partial');
      const manual   = items.filter(i => i.verifiability === 'manual');
      const checked  = items.filter(i => i.status !== 'not-checked');
      const failed   = items.filter(i => i.status === 'fail');
      return { topic, auto, partial, manual, checked, failed, items };
    });
  }

  protected toggleTopicExpand(topicId: string): void {
    this.expandedTopics.update(s => {
      const n = new Set(s);
      n.has(topicId) ? n.delete(topicId) : n.add(topicId);
      return n;
    });
  }

  protected isTopicExpanded(topicId: string): boolean {
    return this.expandedTopics().has(topicId);
  }

  protected statusIcon(status: string): string {
    if (status === 'pass')        return '✓';
    if (status === 'fail')        return '✗';
    if (status === 'warning')     return '⚠';
    if (status === 'not-checked') return '—';
    return '?';
  }

  protected statusCoverageColor(status: string, verif: string): string {
    if (verif === 'manual') return 'rgba(255,255,255,0.08)';
    if (status === 'pass')    return 'rgba(34,197,94,0.15)';
    if (status === 'fail')    return 'rgba(239,68,68,0.15)';
    if (status === 'warning') return 'rgba(245,158,11,0.15)';
    return 'rgba(255,255,255,0.06)';
  }

  protected statusCoverageTextColor(status: string, verif: string): string {
    if (verif === 'manual') return '#4b5563';
    if (status === 'pass')    return '#22c55e';
    if (status === 'fail')    return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#6b7280';
  }

  protected get issueCountByStatus() {
    const issues = this.audit?.issues ?? [];
    return {
      fail:    issues.filter(i => i.status === 'fail').length,
      warning: issues.filter(i => i.status === 'warning').length,
      pass:    issues.filter(i => i.status === 'pass').length,
    };
  }

  // ── Tools tab actions ──────────────────────────────────────────────────────

  protected setLiveUrl(url: string): void {
    this.liveUrlValue = url;
    this.liveUrl.set(url);
    this.liveUrlError.set(null);
  }

  protected async runLighthouse(): Promise<void> {
    const url = this.validateUrl();
    if (!url) return;

    this.lhStatus.set('running');
    this.lhError.set(null);
    this.lhErrorKind.set(null);
    this.lhReport.set(null);
    this.lhProgress.set('Connecting to PageSpeed Insights…');

    try {
      const phases = [
        'Fetching page…', 'Running performance audits…',
        'Analysing accessibility…', 'Checking best practices…', 'Computing scores…',
      ];
      let pi = 0;
      const ticker = setInterval(() => {
        if (pi < phases.length) this.lhProgress.set(phases[pi++]);
      }, 5000);

      const report = await this.toolsService.runLighthouse(url, this.strategy(), this.lhApiKey());
      clearInterval(ticker);
      this.lhReport.set(report);
      this.lhStatus.set('done');
    } catch (e: unknown) {
      const lhErr = e as LhError;
      this.lhError.set(lhErr.message ?? 'Lighthouse failed. Check the URL and try again.');
      this.lhErrorKind.set(lhErr.kind ?? 'unknown');
      this.lhStatus.set('error');
      // Auto-show API key input when quota error and no key set
      if (lhErr.kind === 'quota' && !this.lhApiKey()) {
        this.showApiKeyInput.set(true);
      }
    }
  }

  protected setApiKey(key: string): void {
    this.lhApiKeyValue = key;
    this.lhApiKey.set(key);
    this.toolsService.saveApiKey(key);
  }

  protected retryWithKey(): void {
    this.lhStatus.set('idle');
    this.lhError.set(null);
    this.lhErrorKind.set(null);
    this.runLighthouse();
  }

  protected async runObservatory(): Promise<void> {
    const url = this.validateUrl();
    if (!url) return;

    this.obsStatus.set('running');
    this.obsError.set(null);
    this.obsReport.set(null);
    this.obsProgress.set('Initiating scan…');

    try {
      const phases = [
        'Scanning HTTP headers…',
        'Checking Content-Security-Policy…',
        'Evaluating cookie security…',
        'Auditing CORS policy…',
        'Compiling results…',
      ];
      let pi = 0;
      const ticker = setInterval(() => {
        if (pi < phases.length) this.obsProgress.set(phases[pi++]);
      }, 6000);

      const report = await this.toolsService.runObservatory(url);
      clearInterval(ticker);
      this.obsReport.set(report);
      this.obsStatus.set('done');
    } catch (e: unknown) {
      this.obsError.set((e as Error).message ?? 'Observatory scan failed.');
      this.obsStatus.set('error');
    }
  }

  protected runAll(): void {
    this.runLighthouse();
    this.runObservatory();
  }

  private validateUrl(): string | null {
    const url = this.liveUrl().trim();
    if (!url) {
      this.liveUrlError.set('Enter the live deployment URL (not the GitHub repo URL)');
      return null;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      this.liveUrlError.set('Enter a valid URL starting with https://');
      return null;
    }
    this.liveUrlError.set(null);
    return url;
  }

  // ── Lighthouse helpers ─────────────────────────────────────────────────────

  protected lhScoreColor(score: number): string {
    if (score >= 0.9) return '#22c55e';
    if (score >= 0.5) return '#f59e0b';
    return '#ef4444';
  }

  protected lhScorePct(score: number): number {
    return Math.round(score * 100);
  }

  protected cwvShortTitle(id: string): string {
    const map: Record<string, string> = {
      'first-contentful-paint': 'FCP',
      'largest-contentful-paint': 'LCP',
      'total-blocking-time': 'TBT',
      'cumulative-layout-shift': 'CLS',
      'speed-index': 'SI',
      'interactive': 'TTI',
    };
    return map[id] ?? id;
  }

  protected lhPageSpeedUrl(): string {
    const url = this.liveUrl();
    return `https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}&form_factor=${this.strategy()}`;
  }

  // ── Observatory helpers ────────────────────────────────────────────────────

  protected obsGradeColor(grade: string): string {
    if (grade.startsWith('A')) return '#22c55e';
    if (grade.startsWith('B')) return '#84cc16';
    if (grade.startsWith('C')) return '#f59e0b';
    return '#ef4444';
  }

  protected obsDirectUrl(): string {
    const url = this.liveUrl().trim();
    try { return `https://observatory.mozilla.org/analyze/${new URL(url).hostname}`; }
    catch { return 'https://observatory.mozilla.org/'; }
  }

  // ── Existing methods ───────────────────────────────────────────────────────

  protected selectIssue(issue: AuditIssue): void {
    this.selectedIssue.set(issue);
    this.activeTab.set('issues');
  }

  protected onSearchChange(q: string): void {
    this.searchQueryValue = q;
    this.searchQuery.set(q);
    this.auditService.setSearchQuery(q);
  }

  protected toggleSeverityFilter(sev: string): void {
    const current = this.filterSeverity();
    const updated = current.includes(sev) ? current.filter(s => s !== sev) : [...current, sev];
    this.filterSeverity.set(updated);
    this.auditService.setFilterSeverity(updated);
  }

  protected toggleStatusFilter(status: string): void {
    const current = this.filterStatus();
    const updated = current.includes(status) ? current.filter(s => s !== status) : [...current, status];
    this.filterStatus.set(updated);
    this.auditService.setFilterStatus(updated);
  }

  protected getScoreColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  protected getScoreLabel(score: number): string {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Work';
    return 'Critical Issues';
  }

  protected getStatusIcon(status: string): string {
    return status === 'fail' ? '✗' : status === 'pass' ? '✓' : '⚠';
  }

  protected getStatusColor(status: string): string {
    return status === 'fail' ? '#ef4444' : status === 'pass' ? '#22c55e' : '#f59e0b';
  }

  protected getSeverityTextClass(severity: string): string {
    const map: Record<string, string> = {
      CRITICAL: 'text-red-400', HIGH: 'text-orange-400',
      MEDIUM: 'text-yellow-400', LOW: 'text-green-400',
    };
    return map[severity] ?? 'text-surface-400';
  }

  protected newAudit(): void {
    this.auditService.clearAudit();
    this.router.navigate(['/audit']);
  }

  protected downloadReport(format: 'html' | 'pdf' | 'markdown' = 'html'): void {
    const audit = this.auditService.currentAudit();
    if (!audit) return;
    this.showDownloadMenu.set(false);
    this.showDownloadDdl.set(false);
    if (format === 'html')     this.exportService.downloadSingle(audit);
    else if (format === 'pdf') this.exportService.printAsPdf(audit);
    else                       this.exportService.downloadMarkdown(audit);
  }

  // ── Phase 2: Share Link ─────────────────────────────────────────────────────

  protected copyShareLink(): void {
    const audit = this.auditService.currentAudit();
    if (!audit) return;
    const url = `${window.location.origin}${window.location.pathname}?id=${audit.id}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showCopied.set(true);
      setTimeout(() => this.showCopied.set(false), 2500);
    });
  }

  // ── Phase 2: Email Export ──────────────────────────────────────────────────

  protected emailReport(): void {
    const audit = this.auditService.currentAudit();
    if (audit) this.exportService.emailReport(audit);
  }

  // ── Phase 2: CI Integration ────────────────────────────────────────────────

  protected ciYaml(): string {
    const audit = this.auditService.currentAudit();
    if (!audit) return '';
    const threshold = this.ciThreshold();
    const score     = audit.overallScore;
    const grade     = score >= threshold ? 'PASS' : 'FAIL';
    return `# .github/workflows/devaudit.yml
name: DevAudit Pro Check

on:
  pull_request:
    branches: [main, master]

jobs:
  devaudit:
    name: Frontend Compliance Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run DevAudit Pro
        id: audit
        run: |
          echo "🔍 DevAudit Pro — scanning \${{ github.repository }}"
          echo "Branch: \${{ github.head_ref }}"
          echo ""
          echo "📊 Last audit score: ${score}/100 (threshold: ${threshold})"
          echo "Status: ${grade}"
          echo ""
          echo "Open the full report:"
          echo "https://christyfernandes.github.io/devaudit-pro/"
          echo ""
          # Fail the check if score is below threshold
          if [ ${score} -lt ${threshold} ]; then
            echo "❌ Score ${score} is below threshold ${threshold}"
            exit 1
          fi
          echo "✅ Score ${score} meets threshold ${threshold}"

      - name: Comment PR with DevAudit link
        uses: actions/github-script@v7
        if: always()
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: \`## DevAudit Pro Report
              
📊 **Score:** ${score}/100 | **Branch:** \${audit.branch}  
🔗 [View full report](https://christyfernandes.github.io/devaudit-pro/)

> Threshold: ${threshold}/100 — Status: **${grade}**\`
            })`;
  }

  protected ciBadge(): string {
    const audit = this.auditService.currentAudit();
    if (!audit) return '';
    const score = audit.overallScore;
    const color = score >= 80 ? 'brightgreen' : score >= 60 ? 'yellow' : 'red';
    const encodedRepo = encodeURIComponent(audit.repoName).replace(/-/g, '--');
    return `[![DevAudit](https://img.shields.io/badge/DevAudit-${score}%25%20%7C%20${encodedRepo}-${color}?style=flat-square)](https://christyfernandes.github.io/devaudit-pro/)`;
  }

  protected copyCi(type: 'yaml' | 'badge'): void {
    const text = type === 'yaml' ? this.ciYaml() : this.ciBadge();
    navigator.clipboard.writeText(text).then(() => {
      this.ciCopied.set(type);
      setTimeout(() => this.ciCopied.set(null), 2000);
    });
  }

  @HostListener('document:click')
  closeDownloadDdl(): void { this.showDownloadDdl.set(false); }
}
