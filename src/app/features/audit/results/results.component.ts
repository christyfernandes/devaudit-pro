import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { ToolsService } from '../../../core/services/tools.service';
import { SeverityBadgeComponent } from '../../../shared/components/severity-badge/severity-badge.component';
import { AuditIssue } from '../../../core/models/audit.model';
import {
  ToolStatus, LighthouseReport, ObservatoryReport, ExternalTool,
} from '../../../core/models/tools.model';

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

  // ── Existing tabs ──────────────────────────────────────────────────────────
  protected activeTab       = signal<ActiveTab>('matrix');
  protected selectedIssue   = signal<AuditIssue | null>(null);
  protected showCode        = signal(false);
  protected searchQuery     = signal('');
  protected searchQueryValue = '';
  protected filterSeverity  = signal<string[]>([]);
  protected filterStatus    = signal<string[]>(['fail', 'warning']);

  // ── Tools tab state ────────────────────────────────────────────────────────
  protected liveUrl         = signal('');
  protected liveUrlValue    = '';
  protected liveUrlError    = signal<string | null>(null);
  protected strategy        = signal<'mobile' | 'desktop'>('mobile');

  protected lhStatus        = signal<ToolStatus>('idle');
  protected lhReport        = signal<LighthouseReport | null>(null);
  protected lhError         = signal<string | null>(null);
  protected lhProgress      = signal('');

  protected obsStatus       = signal<ToolStatus>('idle');
  protected obsReport       = signal<ObservatoryReport | null>(null);
  protected obsError        = signal<string | null>(null);
  protected obsProgress     = signal('');

  protected readonly externalTools: ExternalTool[] = this.toolsService.externalTools;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
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
    this.lhReport.set(null);
    this.lhProgress.set('Connecting to PageSpeed Insights…');

    try {
      // Progress hint updates while API runs (typically 15-30 s)
      const phases = [
        'Fetching page…',
        'Running performance audits…',
        'Analysing accessibility…',
        'Checking best practices…',
        'Computing scores…',
      ];
      let pi = 0;
      const ticker = setInterval(() => {
        if (pi < phases.length) this.lhProgress.set(phases[pi++]);
      }, 5000);

      const report = await this.toolsService.runLighthouse(url, this.strategy());
      clearInterval(ticker);
      this.lhReport.set(report);
      this.lhStatus.set('done');
    } catch (e: unknown) {
      this.lhError.set((e as Error).message ?? 'Lighthouse failed. Check the URL and try again.');
      this.lhStatus.set('error');
    }
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

  protected downloadReport(): void {
    const audit = this.auditService.currentAudit();
    if (audit) this.exportService.downloadSingle(audit);
  }
}
