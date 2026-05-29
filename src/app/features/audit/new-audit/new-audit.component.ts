import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditReport } from '../../../core/models/audit.model';

@Component({
  selector: 'app-new-audit',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-audit.component.html',
})
export class NewAuditComponent {
  protected auditService = inject(AuditService);
  protected authService = inject(AuthService);
  private router = inject(Router);

  protected repoUrl = signal('');
  protected repoUrlValue = '';
  protected urlError = signal<string | null>(null);
  protected confirmDeleteId = signal<string | null>(null);

  protected popularRepos = [
    { name: 'angular/angular', url: 'https://github.com/angular/angular', stars: '90.3k', type: 'Angular' },
    { name: 'facebook/react', url: 'https://github.com/facebook/react', stars: '218k', type: 'React' },
    { name: 'microsoft/TypeScript', url: 'https://github.com/microsoft/TypeScript', stars: '99k', type: 'TypeScript' },
  ];

  protected get scanProgress() { return this.auditService.scanProgress(); }
  protected get currentAudit() { return this.auditService.currentAudit(); }
  protected get isScanning() { return this.auditService.isScanning(); }
  protected get auditHistory() { return this.auditService.auditHistory(); }

  protected setRepo(url: string): void {
    this.repoUrlValue = url;
    this.repoUrl.set(url);
  }

  protected validateAndScan(): void {
    const url = this.repoUrl().trim();
    if (!url) { this.urlError.set('Please enter a GitHub repository URL'); return; }
    if (!url.match(/^https?:\/\/github\.com\/[^/]+\/[^/]+/)) {
      this.urlError.set('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
      return;
    }
    this.urlError.set(null);
    this.startScan(url);
  }

  protected startScan(url: string): void {
    this.auditService.startAudit(url).then(() => {
      if (this.auditService.currentAudit()?.status === 'completed') {
        this.router.navigate(['/audit/results']);
      }
    });
    const interval = setInterval(() => {
      if (this.auditService.currentAudit()?.status === 'completed') {
        clearInterval(interval);
        this.router.navigate(['/audit/results']);
      }
    }, 500);
  }

  protected cancelScan(): void { this.auditService.clearAudit(); }

  protected viewHistoricalAudit(auditId: string): void {
    if (this.auditService.loadHistoricalAudit(auditId)) {
      this.router.navigate(['/audit/results']);
    }
  }

  protected requestDelete(auditId: string): void { this.confirmDeleteId.set(auditId); }
  protected cancelDelete(): void { this.confirmDeleteId.set(null); }

  protected confirmDelete(auditId: string): void {
    this.auditService.deleteHistoricalAudit(auditId);
    this.confirmDeleteId.set(null);
  }

  protected scoreColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  protected scoreLabel(score: number): string {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  }

  protected failCount(audit: AuditReport): number {
    return audit.issues.filter(i => i.status === 'fail').length;
  }

  protected criticalCount(audit: AuditReport): number {
    return audit.issues.filter(i => i.status === 'fail' && i.severity === 'CRITICAL').length;
  }
}
