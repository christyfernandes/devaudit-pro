import { Injectable } from '@angular/core';
import {
  LighthouseReport, LighthouseCategory, LighthouseMetric, LighthouseAudit,
  ObservatoryReport, ObservatoryTest, ExternalTool,
} from '../models/tools.model';

const PSI_BASE  = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
// Mozilla HTTP Observatory v2 API (relaunched Nov 2024)
const OBS_BASE  = 'https://observatory.mozilla.org/api/v2';
const LS_KEY    = 'devaudit_psi_api_key';

export type LhErrorKind = 'quota' | 'network' | 'unknown';

export interface LhError {
  kind: LhErrorKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToolsService {

  // ── API key management (localStorage) ─────────────────────────────────────

  getSavedApiKey(): string {
    return localStorage.getItem(LS_KEY) ?? '';
  }

  saveApiKey(key: string): void {
    if (key.trim()) {
      localStorage.setItem(LS_KEY, key.trim());
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }

  // ── Google Lighthouse via PageSpeed Insights ───────────────────────────────

  async runLighthouse(
    url: string,
    strategy: 'mobile' | 'desktop',
    apiKey?: string,
  ): Promise<LighthouseReport> {
    const key = (apiKey ?? this.getSavedApiKey()).trim();
    const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';

    const endpoint =
      `${PSI_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}` +
      `&category=performance&category=accessibility&category=best-practices&category=seo` +
      keyParam;

    const res = await fetch(endpoint);

    if (!res.ok) {
      let rawMessage = `PageSpeed API returned HTTP ${res.status}`;
      let kind: LhErrorKind = 'unknown';

      try {
        const err = await res.json() as { error?: { message?: string; status?: string } };
        rawMessage = err?.error?.message ?? rawMessage;

        // Detect quota errors specifically
        if (
          rawMessage.includes('Quota exceeded') ||
          rawMessage.includes('quota') ||
          res.status === 429
        ) {
          kind = 'quota';
        } else if (res.status >= 500) {
          kind = 'network';
        }
      } catch { /* ignore */ }

      const lhErr: LhError = { kind, message: rawMessage };
      throw lhErr;
    }

    const data = await res.json();
    return this.parseLighthouse(data, url, strategy);
  }

  private parseLighthouse(
    data: Record<string, unknown>,
    url: string,
    strategy: 'mobile' | 'desktop',
  ): LighthouseReport {
    const lr        = data['lighthouseResult'] as Record<string, unknown>;
    const rawCats   = lr['categories'] as Record<string, { id: string; title: string; score: number }>;
    const rawAudits = lr['audits'] as Record<string, {
      id: string; title: string; description: string;
      score: number | null; displayValue?: string; scoreDisplayMode: string;
    }>;

    const categories: LighthouseCategory[] = Object.values(rawCats).map(c => ({
      id: c.id, title: c.title, score: c.score ?? 0,
    }));

    const cwvIds = [
      'first-contentful-paint', 'largest-contentful-paint',
      'total-blocking-time', 'cumulative-layout-shift',
      'speed-index', 'interactive',
    ];

    const coreWebVitals: LighthouseMetric[] = cwvIds
      .filter(id => rawAudits[id])
      .map(id => ({
        id, title: rawAudits[id].title,
        displayValue: rawAudits[id].displayValue ?? '—',
        score: rawAudits[id].score ?? 0,
      }));

    const failingAudits: LighthouseAudit[] = Object.values(rawAudits)
      .filter(a => a.scoreDisplayMode === 'numeric' && a.score !== null && a.score < 0.9 && !cwvIds.includes(a.id))
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 10)
      .map(a => ({ id: a.id, title: a.title, description: a.description, score: a.score, displayValue: a.displayValue }));

    return {
      url, finalUrl: (lr['finalUrl'] as string) ?? url,
      fetchTime: (lr['fetchTime'] as string) ?? '',
      strategy, categories, coreWebVitals, failingAudits,
    };
  }

  // ── Mozilla HTTP Observatory v2 ────────────────────────────────────────────
  //   New API: POST /api/v2/analyze?host={hostname}
  //   Returns grade, score, tests array in one shot (no polling needed in v2)

  async runObservatory(url: string): Promise<ObservatoryReport> {
    const hostname = new URL(url).hostname;

    const res = await fetch(`${OBS_BASE}/analyze?host=${encodeURIComponent(hostname)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host: hostname }),
    });

    if (!res.ok) {
      // Try GET as fallback (v2 supports both)
      const getRes = await fetch(`${OBS_BASE}/analyze?host=${encodeURIComponent(hostname)}`);
      if (!getRes.ok) {
        throw new Error(
          `Observatory API unavailable (HTTP ${res.status}). ` +
          `Mozilla's HTTP Observatory may be temporarily down.`
        );
      }
      const data = await getRes.json();
      return this.parseObservatoryV2(data, hostname);
    }

    const data = await res.json();
    return this.parseObservatoryV2(data, hostname);
  }

  private parseObservatoryV2(
    data: Record<string, unknown>,
    hostname: string,
  ): ObservatoryReport {
    // v2 response shape: { grade, score, tests: { [key]: { pass, result, score_modifier, ... } } }
    const rawTests = (data['tests'] ?? {}) as Record<string, Record<string, unknown>>;

    const tests: ObservatoryTest[] = Object.entries(rawTests).map(([key, t]) => ({
      key,
      title: (t['test_name'] as string) ?? (t['name'] as string) ?? key,
      pass: Boolean(t['pass']),
      scoreModifier: (t['score_modifier'] as number) ?? 0,
      result: (t['result'] as string) ?? '',
      link: (t['link'] as string) ?? '',
    }));

    tests.sort((a, b) => (a.pass ? 1 : 0) - (b.pass ? 1 : 0));

    const passed = tests.filter(t => t.pass).length;
    const failed = tests.filter(t => !t.pass).length;

    return {
      grade: (data['grade'] as string) ?? (data['letterGrade'] as string) ?? '?',
      score: (data['score'] as number) ?? 0,
      testsPassed: (data['tests_passed'] as number) ?? passed,
      testsFailed: (data['tests_failed'] as number) ?? failed,
      scanUrl: `https://observatory.mozilla.org/analyze/${hostname}`,
      tests,
    };
  }

  // ── External tool quick-launch links ──────────────────────────────────────

  readonly externalTools: ExternalTool[] = [
    {
      name: 'PageSpeed Insights',
      icon: '⚡',
      description: 'Full Lighthouse report on Google\'s servers — always free',
      category: 'Performance',
      buildUrl: url => `https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'WAVE',
      icon: '♿',
      description: 'WebAIM accessibility evaluation tool',
      category: 'Accessibility',
      buildUrl: url => `https://wave.webaim.org/report#/${url}`,
    },
    {
      name: 'axe DevTools',
      icon: '🔍',
      description: 'Deque axe browser extension for Chrome/Firefox',
      category: 'Accessibility',
      buildUrl: () => 'https://www.deque.com/axe/devtools/',
    },
    {
      name: 'SSL Labs',
      icon: '🔒',
      description: 'Deep SSL/TLS configuration analysis',
      category: 'Security',
      buildUrl: url => {
        try { return `https://www.ssllabs.com/ssltest/analyze.html?d=${new URL(url).hostname}`; }
        catch { return 'https://www.ssllabs.com/ssltest/'; }
      },
    },
    {
      name: 'Security Headers',
      icon: '🛡️',
      description: 'HTTP response header analysis',
      category: 'Security',
      buildUrl: url => `https://securityheaders.com/?q=${encodeURIComponent(url)}&hide=on`,
    },
    {
      name: 'WebPageTest',
      icon: '📊',
      description: 'Waterfall, filmstrip & deep perf diagnostics',
      category: 'Performance',
      buildUrl: url => `https://www.webpagetest.org/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'W3C Validator',
      icon: '✅',
      description: 'HTML markup validity check',
      category: 'Code Quality',
      buildUrl: url => `https://validator.w3.org/nu/?doc=${encodeURIComponent(url)}`,
    },
    {
      name: 'HTTP Observatory',
      icon: '🦊',
      description: 'Mozilla security headers & best practices',
      category: 'Security',
      buildUrl: url => {
        try { return `https://observatory.mozilla.org/analyze/${new URL(url).hostname}`; }
        catch { return 'https://observatory.mozilla.org/'; }
      },
    },
  ];

  guessLiveUrl(repoUrl: string): string {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (match) return `https://${match[1]}.github.io/${match[2]}/`;
    return '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
