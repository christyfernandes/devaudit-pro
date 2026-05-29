import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChecklistService } from '../../core/services/checklist.service';
import { SeverityBadgeComponent } from '../../shared/components/severity-badge/severity-badge.component';
import { ChecklistTopic, ChecklistItem } from '../../core/models/checklist.model';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SeverityBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
})
export class LandingComponent implements OnInit {
  protected checklistService = inject(ChecklistService);

  protected searchQuery = signal('');
  protected expandedItems = signal<Set<string>>(new Set());
  protected activeGroupFilter = signal<'all' | 'must-have' | 'good-to-have'>('all');
  protected activeSeverityFilters = signal<string[]>([]);
  protected readonly String = String;

  ngOnInit(): void {
    const topics = this.checklistService.topics();
    if (topics.length > 0) {
      this.checklistService.selectTopic(topics[0].id);
    }
  }

  protected scrollToGuidelines(): void {
    document.getElementById('guidelines')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected get currentTopic(): ChecklistTopic | undefined {
    return this.checklistService.selectedTopic();
  }

  protected filteredItems = computed(() => {
    const topic = this.checklistService.selectedTopic();
    if (!topic) return { mustHave: [], goodToHave: [] };

    const groupFilter = this.activeGroupFilter();
    const sevFilters = this.activeSeverityFilters();
    const query = this.searchQuery().toLowerCase();

    const filter = (item: ChecklistItem) => {
      if (query && !item.practice.toLowerCase().includes(query) && !item.whyItMatters.toLowerCase().includes(query)) return false;
      if (sevFilters.length && !sevFilters.includes(item.severity)) return false;
      return true;
    };

    return {
      mustHave: groupFilter !== 'good-to-have' ? topic.items.filter(i => i.group === 'must-have').filter(filter) : [],
      goodToHave: groupFilter !== 'must-have' ? topic.items.filter(i => i.group === 'good-to-have').filter(filter) : [],
    };
  });

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.checklistService.setSearchQuery(this.searchQuery());
  }

  protected toggleItem(id: string): void {
    this.expandedItems.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  protected isExpanded(id: string): boolean {
    return this.expandedItems().has(id);
  }

  protected selectTopic(id: string): void {
    this.checklistService.selectTopic(id);
    this.expandedItems.set(new Set());
  }

  protected toggleSeverityFilter(severity: string): void {
    this.activeSeverityFilters.update(filters => {
      if (filters.includes(severity)) return filters.filter(f => f !== severity);
      return [...filters, severity];
    });
  }

  protected setGroupFilter(group: string): void {
    this.activeGroupFilter.set(group as 'all' | 'must-have' | 'good-to-have');
  }

  protected get overallStats() {
    return this.checklistService.overallStats();
  }

  protected getTopicStats(topicId: string) {
    return this.checklistService.getTopicStats(topicId);
  }

  protected getTopicItemCount(topic: ChecklistTopic): number {
    return topic.items.length;
  }

  protected getTopicCriticalCount(topic: ChecklistTopic): number {
    return topic.items.filter(i => i.severity === 'CRITICAL').length;
  }

  protected trackById(_: number, item: ChecklistItem): string {
    return item.id;
  }

  protected hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '26, 92, 255';
  }
}
