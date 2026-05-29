import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Severity, Group } from '../../../core/models/checklist.model';

@Component({
  selector: 'app-severity-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border"
          [ngClass]="badgeClass">
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      {{ label }}
    </span>
  `
})
export class SeverityBadgeComponent {
  @Input() severity?: Severity;
  @Input() group?: Group;
  @Input() size: 'sm' | 'md' = 'sm';

  get label(): string {
    if (this.severity) return this.severity;
    if (this.group === 'must-have') return '🔴 MUST HAVE';
    if (this.group === 'good-to-have') return '🟢 GOOD TO HAVE';
    return '';
  }

  get badgeClass(): string {
    if (this.group === 'must-have') return 'badge-must-have';
    if (this.group === 'good-to-have') return 'badge-good-to-have';
    switch (this.severity) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-medium';
    }
  }

  get dotClass(): string {
    if (this.group === 'must-have') return 'bg-red-400';
    if (this.group === 'good-to-have') return 'bg-green-400';
    switch (this.severity) {
      case 'CRITICAL': return 'bg-red-400 animate-pulse';
      case 'HIGH': return 'bg-orange-400';
      case 'MEDIUM': return 'bg-yellow-400';
      case 'LOW': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  }
}
