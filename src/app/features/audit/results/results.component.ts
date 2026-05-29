import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { ReportExportService } from '../../../core/services/report-export.service';
import { SeverityBadgeComponent } from '../../../shared/components/severity-badge/severity-badge.component';
import { AuditIssue } from '../../../core/models/audit.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SeverityBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './results.component.html',
})
export class ResultsComponent implements OnInit {
  protected auditService    = inject(AuditService);
  protected exportService   = inject(ReportExportService);
  private router            = inject(Router);

  protected activeTab = signal<'matrix' | 'issues'>('matrix');
  protected selectedIssue = signal<AuditIssue | null>(null);
  protected showCode = signal(false);
  protected searchQuery = signal('');
  protected searchQueryValue = '';
  protected filterSeverity = signal<string[]>([]);
  protected filterStatus = signal<string[]>(['fail', 'warning']);

  ngOnInit(): void {
    const audit = this.auditService.currentAudit();
    if (!audit || audit.status !== 'completed') {
      this.router.navigate(['/audit']);
    }
    // Reset filters to show failures by default
    this.auditService.setFilterStatus(['fail', 'warning']);
  }

  protected get audit() {
    return this.auditService.currentAudit();
  }

  protected get filteredIssues() {
    return this.auditService.filteredIssues();
  }

  protected get summaryMatrix() {
    return this.audit?.summaryMatrix ?? {};
  }

  protected get matrixTopics() {
    return Object.entries(this.summaryMatrix);
  }

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

  protected get issueCountByStatus() {
    const issues = this.audit?.issues ?? [];
    return {
      fail: issues.filter(i => i.status === 'fail').length,
      warning: issues.filter(i => i.status === 'warning').length,
      pass: issues.filter(i => i.status === 'pass').length,
    };
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
    switch (status) {
      case 'fail': return '✗';
      case 'pass': return '✓';
      case 'warning': return '⚠';
      default: return '○';
    }
  }

  protected getStatusColor(status: string): string {
    switch (status) {
      case 'fail': return '#ef4444';
      case 'pass': return '#22c55e';
      case 'warning': return '#f59e0b';
      default: return '#64748b';
    }
  }

  protected getSeverityTextClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400';
      case 'HIGH': return 'text-orange-400';
      case 'MEDIUM': return 'text-yellow-400';
      default: return 'text-green-400';
    }
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
