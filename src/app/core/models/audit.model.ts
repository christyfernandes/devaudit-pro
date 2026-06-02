import { Severity, Group } from './checklist.model';

export type AuditStatus = 'idle' | 'scanning' | 'completed' | 'error';
export type IssueStatus = 'pass' | 'fail' | 'warning' | 'not-checked';

/** How much of a checklist item can be verified without human review */
export type Verifiability = 'auto' | 'partial' | 'manual';

export interface AuditIssue {
  id: string;
  topicId: string;
  topicName: string;
  checklistItemId: string;
  practice: string;
  severity: Severity;
  group: Group;
  status: IssueStatus;
  verifiability: Verifiability;
  filePath?: string;
  lineNumber?: number;
  columnNumber?: number;
  explanation: string;
  suggestedFix?: string;
  codeSnippet?: string;
  fixedCode?: string;
}

export interface CoverageStats {
  total: number;
  autoChecked: number;    // 'auto' verifiability items
  partialChecked: number; // 'partial' verifiability items
  notVerifiable: number;  // 'manual' verifiability items
  passed: number;
  failed: number;
  warnings: number;
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
    notChecked: number;
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
  coverageStats: CoverageStats;
  /** Files actually fetched and analysed */
  fetchedFiles: string[];
  isPrivateRepo?: boolean;
}

export interface ScanProgress {
  phase: string;
  currentFile: string;
  progress: number;
  filesScanned: number;
  totalFiles: number;
}
