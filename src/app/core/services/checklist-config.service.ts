import { Injectable, signal, computed } from '@angular/core';
import { CHECKLIST_DATA } from './checklist.data';

const STORAGE_KEY = 'devaudit_disabled_rules';

@Injectable({ providedIn: 'root' })
export class ChecklistConfigService {
  private readonly _disabled = signal<Set<string>>(this.load());

  readonly disabledItems  = this._disabled.asReadonly();
  readonly disabledCount  = computed(() => this._disabled().size);
  readonly hasCustomRules = computed(() => this._disabled().size > 0);

  // ── Public API ──────────────────────────────────────────────────────────────

  isEnabled(itemId: string): boolean {
    return !this._disabled().has(itemId);
  }

  setItemEnabled(itemId: string, enabled: boolean): void {
    this._disabled.update(s => {
      const n = new Set(s);
      enabled ? n.delete(itemId) : n.add(itemId);
      return n;
    });
    this.save();
  }

  setTopicEnabled(topicId: string, enabled: boolean): void {
    const items = CHECKLIST_DATA.find(t => t.id === topicId)?.items ?? [];
    this._disabled.update(s => {
      const n = new Set(s);
      for (const item of items) {
        enabled ? n.delete(item.id) : n.add(item.id);
      }
      return n;
    });
    this.save();
  }

  isTopicFullyEnabled(topicId: string): boolean {
    const items = CHECKLIST_DATA.find(t => t.id === topicId)?.items ?? [];
    return items.every(item => !this._disabled().has(item.id));
  }

  isTopicPartiallyEnabled(topicId: string): boolean {
    const items = CHECKLIST_DATA.find(t => t.id === topicId)?.items ?? [];
    const disabledCount = items.filter(item => this._disabled().has(item.id)).length;
    return disabledCount > 0 && disabledCount < items.length;
  }

  getTopicDisabledCount(topicId: string): number {
    const items = CHECKLIST_DATA.find(t => t.id === topicId)?.items ?? [];
    return items.filter(item => this._disabled().has(item.id)).length;
  }

  resetAll(): void {
    this._disabled.set(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Storage ─────────────────────────────────────────────────────────────────

  private load(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...this._disabled()]));
    } catch { /* quota exceeded */ }
  }
}
