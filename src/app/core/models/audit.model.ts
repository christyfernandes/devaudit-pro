import { Severity, Group } from './checklist.model';

export type AuditStatus = 'idle' | 'scanning' | 'completed' | 'error';
export type IssueStatus = 'pass' | 'fail' | 'warning' | 'skipped';

export interface AuditIssue {
  id: string;
  topicId: string;
  topicName: string;
  checklistItemId: string;
  practice: string;
  severity: Severity;
  group: Group;
  status: IssueStatus;
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  explanation: string;
  suggestedFix?: string;
  codeSnippet?: string;
  fixedCode?: string;
}

export interface AuditSummaryMatrix {
  [topicId: string]: {
    topicName: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
    passed: number;
    failed: number;
  };
}

export interface AuditReport {
  id: string;
  repoUrl: string;
  repoName: string;
  branch: string;
  startedAt: Date;
  completedAt?: Date;
  status: AuditStatus;
  progress: number;
  issues: AuditIssue[];
  summaryMatrix: AuditSummaryMatrix;
  totalFiles: number;
  scannedFiles: number;
  overallScore: number;
}

export interface ScanProgress {
  phase: string;
  currentFile: string;
  progress: number;
  filesScanned: number;
  totalFiles: number;
}
