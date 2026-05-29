import { Injectable } from '@angular/core';
import {
  LighthouseReport, LighthouseCategory, LighthouseMetric, LighthouseAudit,
  ObservatoryReport, ObservatoryTest, ExternalTool,
} from '../models/tools.model';

const PSI_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const OBS_BASE = 'https://http-observatory.security.mozilla.org/api/v1';

@Injectable({ providedIn: 'root' })
export class ToolsService {

  // ── Google Lighthouse via PageSpeed Insights ───────────────────────────────

  async runLighthouse(url: string, strategy: 'mobile' | 'desktop'): Promise<LighthouseReport> {
    const endpoint =
      `${PSI_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}` +
      `&category=performance&category=accessibility&category=best-practices&category=seo`;

    const res = await fetch(endpoint);

    if (!res.ok) {
      let message = `PageSpeed API returned HTTP ${res.status}`;
      try {
        const err = await res.json();
        message = err?.error?.message ?? message;
      } catch { /* ignore */ }
      throw new Error(message);
    }

    const data = await res.json();
    return this.parseLighthouse(data, url, strategy);
  }

  private parseLighthouse(
    data: Record<string, unknown>,
    url: string,
    strategy: 'mobile' | 'desktop',
  ): LighthouseReport {
    const lr = data['lighthouseResult'] as Record<string, unknown>;
    const rawCats = lr['categories'] as Record<string, { id: string; title: string; score: number }>;
    const rawAudits = lr['audits'] as Record<string, {
      id: string; title: string; description: string;
      score: number | null; displayValue?: string; scoreDisplayMode: string;
    }>;

    const categories: LighthouseCategory[] = Object.values(rawCats).map(c => ({
      id: c.id, title: c.title, score: c.score ?? 0,
    }));

    // Core Web Vitals + key metrics (order matters for display)
    const cwvIds = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
      'interactive',
    ];
    const coreWebVitals: LighthouseMetric[] = cwvIds
      .filter(id => rawAudits[id])
      .map(id => ({
        id,
        title: rawAudits[id].title,
        displayValue: rawAudits[id].displayValue ?? '—',
        score: rawAudits[id].score ?? 0,
      }));

    // Top failing audits (exclude CWV rows to avoid duplication)
    const failingAudits: LighthouseAudit[] = Object.values(rawAudits)
      .filter(a =>
        a.scoreDisplayMode === 'numeric' &&
        a.score !== null &&
        a.score < 0.9 &&
        !cwvIds.includes(a.id),
      )
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 10)
      .map(a => ({
        id: a.id, title: a.title, description: a.description,
        score: a.score, displayValue: a.displayValue,
      }));

    return {
      url,
      finalUrl: (lr['finalUrl'] as string) ?? url,
      fetchTime: (lr['fetchTime'] as string) ?? '',
      strategy,
      categories,
      coreWebVitals,
      failingAudits,
    };
  }

  // ── Mozilla HTTP Observatory ───────────────────────────────────────────────

  async runObservatory(url: string): Promise<ObservatoryReport> {
    const hostname = new URL(url).hostname;

    // Kick off (or retrieve cached) scan
    const postRes = await fetch(`${OBS_BASE}/analyze?host=${hostname}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'rescan=false',
    });

    if (!postRes.ok) {
      throw new Error(`Observatory API unavailable (HTTP ${postRes.status})`);
    }

    let scanData = await postRes.json() as Record<string, unknown>;

    // Poll until finished (max ~40 s)
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      const state = scanData['state'] as string;
      if (state === 'FINISHED') break;
      if (state === 'FAILED' || state === 'ABORTED') {
        throw new Error(`Observatory scan ${state.toLowerCase()}`);
      }
      await this.delay(2000);
      const pollRes = await fetch(`${OBS_BASE}/analyze?host=${hostname}`);
      scanData = await pollRes.json();
    }

    if ((scanData['state'] as string) !== 'FINISHED') {
      throw new Error('Observatory scan timed out. Try again in a moment.');
    }

    // Fetch individual test results
    const scanId = scanData['scan_id'] as number;
    const testsRes = await fetch(`${OBS_BASE}/tests?scan=${scanId}`);
    if (!testsRes.ok) throw new Error('Could not fetch Observatory test details');

    const testsRaw = await testsRes.json() as Record<string, Record<string, unknown>>;
    return this.parseObservatory(scanData, testsRaw, hostname);
  }

  private parseObservatory(
    scan: Record<string, unknown>,
    tests: Record<string, Record<string, unknown>>,
    hostname: string,
  ): ObservatoryReport {
    const parsed: ObservatoryTest[] = Object.entries(tests).map(([key, t]) => ({
      key,
      title: (t['test_name'] as string) ?? key,
      pass: t['pass'] as boolean,
      scoreModifier: (t['score_modifier'] as number) ?? 0,
      result: (t['result'] as string) ?? '',
      link: (t['link'] as string) ?? '',
    }));

    // Failures first, then passes
    parsed.sort((a, b) => (a.pass ? 1 : 0) - (b.pass ? 1 : 0));

    return {
      grade: (scan['grade'] as string) ?? '?',
      score: (scan['score'] as number) ?? 0,
      testsPassed: (scan['tests_passed'] as number) ?? 0,
      testsFailed: (scan['tests_failed'] as number) ?? 0,
      scanUrl: `https://observatory.mozilla.org/analyze/${hostname}`,
      tests: parsed,
    };
  }

  // ── External tool quick-launch links ──────────────────────────────────────

  readonly externalTools: ExternalTool[] = [
    {
      name: 'PageSpeed Insights',
      icon: '⚡',
      description: 'Full Lighthouse report on Google\'s servers',
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
      description: 'Deque axe browser extension (install in Chrome/Firefox)',
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
      description: 'Waterfall, filmstrip, and deep perf diagnostics',
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
      name: 'Mozilla Observatory',
      icon: '🦊',
      description: 'Security headers and best practices audit',
      category: 'Security',
      buildUrl: url => {
        try { return `https://observatory.mozilla.org/analyze/${new URL(url).hostname}`; }
        catch { return 'https://observatory.mozilla.org/'; }
      },
    },
  ];

  /** Guess the live deployment URL from a GitHub repo URL */
  guessLiveUrl(repoUrl: string): string {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (match) return `https://${match[1]}.github.io/${match[2]}/`;
    return '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
