export type ToolStatus = 'idle' | 'running' | 'done' | 'error';

// ── Lighthouse / PageSpeed Insights ──────────────────────────────────────────

export interface LighthouseCategory {
  id: string;
  title: string;
  score: number; // 0–1
}

export interface LighthouseMetric {
  id: string;
  title: string;
  displayValue: string;
  score: number; // 0–1, null-safe
}

export interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}

export interface LighthouseReport {
  url: string;
  finalUrl: string;
  fetchTime: string;
  strategy: 'mobile' | 'desktop';
  categories: LighthouseCategory[];
  coreWebVitals: LighthouseMetric[];
  failingAudits: LighthouseAudit[];
}

// ── Mozilla HTTP Observatory ──────────────────────────────────────────────────

export interface ObservatoryTest {
  key: string;
  title: string;
  pass: boolean;
  scoreModifier: number;
  result: string;
  link: string;
}

export interface ObservatoryReport {
  grade: string;
  score: number;
  testsPassed: number;
  testsFailed: number;
  scanUrl: string;
  tests: ObservatoryTest[];
}

// ── External tool links (open in new tab) ─────────────────────────────────────

export interface ExternalTool {
  name: string;
  icon: string;       // emoji or inline SVG char
  description: string;
  category: string;
  buildUrl: (url: string) => string;
}
