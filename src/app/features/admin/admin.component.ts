import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChecklistConfigService } from '../../core/services/checklist-config.service';
import { AuthService } from '../../core/services/auth.service';
import { CHECKLIST_DATA } from '../../core/services/checklist.data';
import { ChecklistItem } from '../../core/models/checklist.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="min-h-screen pt-20 px-4 pb-16" style="background: var(--color-bg);">
  <div class="max-w-4xl mx-auto">

    <!-- Header -->
    <div class="pt-8 mb-8">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center"
                 style="background: linear-gradient(135deg,#7c3aed,#1a5cff);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style="background:rgba(124,58,237,0.2);color:#a78bfa;">Admin</span>
          </div>
          <h1 class="font-display font-bold text-3xl text-white mb-1">Custom Checklist</h1>
          <p class="text-sm" style="color:var(--color-text-muted);">
            Enable or disable specific rules for your organisation's audit scans.
            Disabled rules are excluded from scoring and marked accordingly in reports.
          </p>
        </div>
        <div class="flex items-center gap-3">
          @if (config.hasCustomRules()) {
            <div class="text-xs px-3 py-1.5 rounded-lg"
                 style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);color:#f59e0b;">
              {{ config.disabledCount() }} rule{{ config.disabledCount() === 1 ? '' : 's' }} disabled
            </div>
          }
          <button (click)="confirmReset()"
                  [disabled]="!config.hasCustomRules()"
                  class="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                  style="border:1px solid var(--color-border);color:var(--color-text-muted);">
            Restore defaults
          </button>
          @if (showResetConfirm()) {
            <div class="fixed inset-0 z-50 flex items-center justify-center"
                 style="background:rgba(0,0,0,0.6);">
              <div class="rounded-2xl p-6 w-80"
                   style="background:var(--color-surface-2);border:1px solid var(--color-border);">
                <h3 class="font-semibold text-white mb-2">Restore all defaults?</h3>
                <p class="text-sm mb-4" style="color:var(--color-text-muted);">
                  This will re-enable all {{ totalItems }} rules.
                </p>
                <div class="flex gap-3 justify-end">
                  <button (click)="showResetConfirm.set(false)"
                          class="px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/10"
                          style="color:var(--color-text-muted);">Cancel</button>
                  <button (click)="doReset()"
                          class="px-4 py-2 rounded-lg text-sm font-medium text-white"
                          style="background:linear-gradient(135deg,#1a5cff,#7c3aed);">Reset</button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Topics -->
    @for (topic of topics; track topic.id) {
      <div class="rounded-2xl mb-4 overflow-hidden"
           style="background:var(--color-surface-2);border:1px solid var(--color-border);">

        <!-- Topic header -->
        <div class="flex items-center justify-between px-5 py-4"
             style="border-bottom:1px solid var(--color-border);">
          <div class="flex items-center gap-3">
            <button (click)="toggleTopic(topic.id)"
                    class="w-10 h-6 rounded-full relative transition-all flex-shrink-0"
                    [style.background]="config.isTopicFullyEnabled(topic.id) ? 'linear-gradient(135deg,#1a5cff,#7c3aed)' : config.isTopicPartiallyEnabled(topic.id) ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'">
              <span class="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                    style="background:white;"
                    [style.left]="config.isTopicFullyEnabled(topic.id) ? '20px' : '2px'">
              </span>
            </button>
            <div>
              <div class="text-sm font-semibold text-white">{{ topic.name }}</div>
              <div class="text-xs" style="color:var(--color-text-muted);">
                {{ topic.items.length }} rules ·
                @if (config.getTopicDisabledCount(topic.id) === 0) {
                  <span class="text-green-400">all enabled</span>
                } @else if (config.getTopicDisabledCount(topic.id) === topic.items.length) {
                  <span class="text-red-400">all disabled</span>
                } @else {
                  <span class="text-yellow-400">{{ topic.items.length - config.getTopicDisabledCount(topic.id) }} / {{ topic.items.length }} enabled</span>
                }
              </div>
            </div>
          </div>
          <button (click)="toggleTopicExpand(topic.id)"
                  class="text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
                  style="color:var(--color-text-muted);">
            {{ expandedTopics().has(topic.id) ? 'Hide rules' : 'Show rules' }}
          </button>
        </div>

        <!-- Rules list -->
        @if (expandedTopics().has(topic.id)) {
          <div class="divide-y" style="--tw-divide-color:rgba(255,255,255,0.04);">
            @for (item of topic.items; track item.id) {
              <div class="flex items-start gap-3 px-5 py-3 transition-all"
                   [style.opacity]="config.isEnabled(item.id) ? '1' : '0.4'">
                <!-- Toggle -->
                <button (click)="config.setItemEnabled(item.id, !config.isEnabled(item.id))"
                        class="mt-0.5 w-9 h-5 rounded-full relative transition-all flex-shrink-0"
                        [style.background]="config.isEnabled(item.id) ? '#1a5cff' : 'rgba(255,255,255,0.1)'">
                  <span class="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style="background:white;"
                        [style.left]="config.isEnabled(item.id) ? '18px' : '2px'">
                  </span>
                </button>
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-medium"
                          [style.color]="config.isEnabled(item.id) ? 'var(--color-text)' : 'var(--color-text-muted)'">
                      {{ item.practice }}
                    </span>
                    <span class="text-xs px-1.5 py-0.5 rounded font-semibold"
                          [ngClass]="item.severity === 'CRITICAL' ? 'text-red-400' : item.severity === 'HIGH' ? 'text-orange-400' : item.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'"
                          [style.background]="item.severity === 'CRITICAL' ? 'rgba(239,68,68,0.12)' : item.severity === 'HIGH' ? 'rgba(249,115,22,0.12)' : item.severity === 'MEDIUM' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)'">
                      {{ item.severity }}
                    </span>
                    <span class="text-xs px-1.5 py-0.5 rounded"
                          style="background:rgba(255,255,255,0.05);color:var(--color-text-muted);">
                      {{ item.group === 'must-have' ? '🔴 Must-Have' : '🟢 Good-to-Have' }}
                    </span>
                  </div>
                  @if (!config.isEnabled(item.id)) {
                    <p class="text-xs mt-0.5 text-yellow-500">Excluded from scans</p>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    }

  </div>
</div>
  `,
})
export class AdminComponent {
  protected config         = inject(ChecklistConfigService);
  protected auth           = inject(AuthService);
  protected topics         = CHECKLIST_DATA;
  protected totalItems     = CHECKLIST_DATA.reduce((a, t) => a + t.items.length, 0);
  protected expandedTopics = signal<Set<string>>(new Set());
  protected showResetConfirm = signal(false);

  protected toggleTopic(topicId: string): void {
    const fullyEnabled = this.config.isTopicFullyEnabled(topicId);
    this.config.setTopicEnabled(topicId, !fullyEnabled);
  }

  protected toggleTopicExpand(topicId: string): void {
    this.expandedTopics.update(s => {
      const n = new Set(s);
      n.has(topicId) ? n.delete(topicId) : n.add(topicId);
      return n;
    });
  }

  protected confirmReset(): void { this.showResetConfirm.set(true); }
  protected doReset(): void {
    this.config.resetAll();
    this.showResetConfirm.set(false);
  }
}
