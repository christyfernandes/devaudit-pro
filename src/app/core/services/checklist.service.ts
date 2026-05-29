import { Injectable, signal, computed } from '@angular/core';
import { ChecklistTopic, ChecklistItem, TopicStats } from '../models/checklist.model';
import { CHECKLIST_DATA } from './checklist.data';

@Injectable({ providedIn: 'root' })
export class ChecklistService {
  private readonly _topics = signal<ChecklistTopic[]>(CHECKLIST_DATA);
  private readonly _searchQuery = signal<string>('');
  private readonly _selectedTopicId = signal<string | null>(null);
  private readonly _filterSeverity = signal<string[]>([]);
  private readonly _filterGroup = signal<string[]>([]);

  readonly topics = this._topics.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedTopicId = this._selectedTopicId.asReadonly();

  readonly filteredTopics = computed(() => {
    const query = this._searchQuery().toLowerCase();
    const severityFilter = this._filterSeverity();
    const groupFilter = this._filterGroup();

    return this._topics().map(topic => ({
      ...topic,
      items: topic.items.filter(item => {
        const matchesSearch = !query ||
          item.practice.toLowerCase().includes(query) ||
          item.whyItMatters.toLowerCase().includes(query) ||
          topic.name.toLowerCase().includes(query);
        const matchesSeverity = !severityFilter.length || severityFilter.includes(item.severity);
        const matchesGroup = !groupFilter.length || groupFilter.includes(item.group);
        return matchesSearch && matchesSeverity && matchesGroup;
      })
    })).filter(topic => topic.items.length > 0 || !query);
  });

  readonly selectedTopic = computed(() => {
    const id = this._selectedTopicId();
    if (!id) return this._topics()[0];
    return this._topics().find(t => t.id === id) ?? this._topics()[0];
  });

  readonly topicStats = computed((): TopicStats[] => {
    return this._topics().map(topic => ({
      topicId: topic.id,
      total: topic.items.length,
      mustHave: topic.items.filter(i => i.group === 'must-have').length,
      goodToHave: topic.items.filter(i => i.group === 'good-to-have').length,
      critical: topic.items.filter(i => i.severity === 'CRITICAL').length,
      high: topic.items.filter(i => i.severity === 'HIGH').length,
      medium: topic.items.filter(i => i.severity === 'MEDIUM').length,
      low: topic.items.filter(i => i.severity === 'LOW').length,
    }));
  });

  readonly overallStats = computed(() => {
    const all = this._topics().flatMap(t => t.items);
    return {
      total: all.length,
      critical: all.filter(i => i.severity === 'CRITICAL').length,
      high: all.filter(i => i.severity === 'HIGH').length,
      medium: all.filter(i => i.severity === 'MEDIUM').length,
      mustHave: all.filter(i => i.group === 'must-have').length,
      goodToHave: all.filter(i => i.group === 'good-to-have').length,
    };
  });

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  selectTopic(id: string): void {
    this._selectedTopicId.set(id);
  }

  setFilterSeverity(severities: string[]): void {
    this._filterSeverity.set(severities);
  }

  setFilterGroup(groups: string[]): void {
    this._filterGroup.set(groups);
  }

  getTopicById(id: string): ChecklistTopic | undefined {
    return this._topics().find(t => t.id === id);
  }

  getTopicStats(topicId: string): TopicStats | undefined {
    return this.topicStats().find(s => s.topicId === topicId);
  }
}
