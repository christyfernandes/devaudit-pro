export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Group = 'must-have' | 'good-to-have';

export interface ChecklistItem {
  id: string;
  number: number;
  severity: Severity;
  practice: string;
  whyItMatters: string;
  longRunImpact: string;
  group: Group;
  topicId: string;
}

export interface ChecklistTopic {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  items: ChecklistItem[];
  tags?: string[];
}

export interface TopicStats {
  topicId: string;
  total: number;
  mustHave: number;
  goodToHave: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}
