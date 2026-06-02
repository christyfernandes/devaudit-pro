import { Injectable } from '@angular/core';
import { AuditReport, AuditIssue } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class ReportExportService {

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Open report in a print-ready window so user can Save as PDF */
  printAsPdf(audit: AuditReport): void {
    const html = this.buildHtml([audit], `${audit.repoName.replace(/\//g, '-')} — Audit Report`);
    const win = window.open('', '_blank');
    if (!win) {
      this.downloadSingle(audit);
      return;
    }
    win.document.write(html + '<script>window.onload=()=>window.print();<\/script>');
    win.document.close();
  }

  /** Download a Markdown summary of the audit */
  downloadMarkdown(audit: AuditReport): void {
    const slug = audit.repoName.replace(/\//g, '-');
    const date = this.fmtDate(audit.completedAt ?? audit.startedAt);
    const md   = this.buildMarkdown(audit);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `devaudit-${slug}-${date}.md`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  /** Download multiple audits as a combined Markdown file */
  downloadMultipleMarkdown(audits: AuditReport[]): void {
    const md   = audits.map(a => this.buildMarkdown(a)).join('\n\n---\n\n');
    const date = this.fmtDate(new Date());
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `devaudit-combined-${date}.md`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  /** Open mailto: with a formatted audit summary pre-filled */
  emailReport(audit: AuditReport): void {
    const fails    = audit.issues.filter(i => i.status === 'fail');
    const critical = fails.filter(i => i.severity === 'CRITICAL').length;
    const high     = fails.filter(i => i.severity === 'HIGH').length;

    const subject = encodeURIComponent(
      `DevAudit Report: ${audit.repoName} (Score ${audit.overallScore}/100)`
    );

    const topFailures = fails.slice(0, 5)
      .map((f, i) => `${i + 1}. [${f.severity}] ${f.practice}`)
      .join('\n');

    const body = encodeURIComponent([
      `DevAudit Pro — Audit Report`,
      ``,
      `Repository : ${audit.repoUrl}`,
      `Branch     : ${audit.branch}`,
      `Score      : ${audit.overallScore}/100  (${this.scoreLabel(audit.overallScore)})`,
      `Completed  : ${this.fmtFull(audit.completedAt ?? audit.startedAt)}`,
      ``,
      `Summary`,
      `-------`,
      `Failures : ${fails.length}  (Critical: ${critical}, High: ${high})`,
      `Warnings : ${audit.issues.filter(i => i.status === 'warning').length}`,
      `Passed   : ${audit.issues.filter(i => i.status === 'pass').length}`,
      ``,
      `Top Failures`,
      `------------`,
      topFailures || 'No failures detected.',
      ``,
      `View full interactive report at:`,
      `https://christyfernandes.github.io/devaudit-pro/`,
      ``,
      `— Sent from DevAudit Pro`,
    ].join('\n'));

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  private buildMarkdown(audit: AuditReport): string {
    const fails    = audit.issues.filter(i => i.status === 'fail');
    const warnings = audit.issues.filter(i => i.status === 'warning');
    const passes   = audit.issues.filter(i => i.status === 'pass');
    const score    = audit.overallScore;
    const grade    = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

    const lines: string[] = [
      `# DevAudit Pro — Audit Report`,
      ``,
      `| Field | Value |`,
      `|---|---|`,
      `| Repository | \`${audit.repoName}\` |`,
      `| Branch | \`${audit.branch}\` |`,
      `| Repo URL | ${audit.repoUrl} |`,
      `| Score | **${score}/100** (Grade ${grade}) |`,
      `| Completed | ${this.fmtFull(audit.completedAt ?? audit.startedAt)} |`,
      `| Files Analysed | ${audit.scannedFiles} |`,
      ``,
      `## Summary`,
      ``,
      `| Status | Count |`,
      `|---|---|`,
      `| ❌ Failures | ${fails.length} |`,
      `| ⚠️ Warnings | ${warnings.length} |`,
      `| ✅ Passed | ${passes.length} |`,
      `| ⬜ Not Checked | ${audit.issues.filter(i => i.status === 'not-checked').length} |`,
      ``,
      `## Compliance Matrix`,
      ``,
      `| Domain | Critical | High | Medium | Passed | Not Checked |`,
      `|---|---|---|---|---|---|`,
    ];

    for (const [, row] of Object.entries(audit.summaryMatrix)) {
      lines.push(`| ${row.topicName} | ${row.critical || '—'} | ${row.high || '—'} | ${row.medium || '—'} | ${row.passed} | ${row.notChecked ?? 0} |`);
    }

    if (fails.length > 0) {
      lines.push('', '## Failures', '');
      for (const issue of fails) {
        lines.push(
          `### ${issue.severity} — ${issue.practice}`,
          ``,
          `**Topic:** ${issue.topicName}  `,
          `**File:** ${issue.filePath ? `\`${issue.filePath}\`` + (issue.lineNumber ? `:${issue.lineNumber}` : '') : '_Not file-specific_'}  `,
          ``,
          issue.explanation,
          ``
        );
        if (issue.suggestedFix) lines.push(`> 💡 **Fix:** ${issue.suggestedFix}`, ``);
        if (issue.codeSnippet)  lines.push('```typescript', issue.codeSnippet, '```', ``);
        if (issue.fixedCode)    lines.push('**Recommended:**', '```typescript', issue.fixedCode, '```', ``);
      }
    }

    if (warnings.length > 0) {
      lines.push('', '## Warnings', '');
      for (const issue of warnings) {
        lines.push(`- **${issue.severity}** ${issue.practice} — ${issue.explanation}`);
      }
    }

    lines.push(
      ``,
      `---`,
      `*Generated by [DevAudit Pro](https://christyfernandes.github.io/devaudit-pro/) · Frontend CoE Review Checklist v2.0*`
    );

    return lines.join('\n');
  }
  downloadSingle(audit: AuditReport): void {
    const slug = audit.repoName.replace(/\//g, '-');
    const date = this.fmtDate(audit.completedAt ?? audit.startedAt);
    const html = this.buildHtml([audit], `${slug} — Audit Report`);
    this.triggerDownload(`devaudit-${slug}-${date}.html`, html);
  }

  /** Download multiple audit reports as one combined HTML file */
  downloadMultiple(audits: AuditReport[]): void {
    const date  = this.fmtDate(new Date());
    const title = audits.length === 1
      ? `${audits[0].repoName.replace(/\//g, '-')} — Audit Report`
      : `DevAudit Pro — ${audits.length} Reports`;
    const html = this.buildHtml(audits, title);
    this.triggerDownload(`devaudit-combined-${date}.html`, html);
  }

  // ── HTML builder ────────────────────────────────────────────────────────────

  private buildHtml(audits: AuditReport[], docTitle: string): string {
    const toc = audits.length > 1
      ? `<nav class="toc">
           <h2>Contents</h2>
           <ol>${audits.map((a, i) =>
             `<li><a href="#audit-${i}">${this.esc(a.repoName)}</a>
               <span class="toc-score" style="color:${this.scoreColor(a.overallScore)}">${a.overallScore}/100</span></li>`
           ).join('')}</ol>
         </nav>` : '';

    const sections = audits.map((a, i) => this.buildAuditSection(a, i)).join(
      '<div class="page-break"></div>'
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${this.esc(docTitle)}</title>
<style>${this.css()}</style>
</head>
<body>
<div class="doc">
  <header class="doc-header">
    <div class="brand">
      <div class="brand-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div>
        <div class="brand-name">DevAudit <span>Pro</span></div>
        <div class="brand-sub">Frontend Code Compliance Report</div>
      </div>
    </div>
    <div class="doc-meta">Generated ${this.fmtFull(new Date())}</div>
  </header>

  ${toc}
  ${sections}

  <footer class="doc-footer">
    <p>Generated by <strong>DevAudit Pro</strong> · Based on Frontend CoE Review Checklist v2.0 ·
       <a href="https://christyfernandes.github.io/devaudit-pro/">christyfernandes.github.io/devaudit-pro</a></p>
  </footer>
</div>
</body>
</html>`;
  }

  private buildAuditSection(audit: AuditReport, index: number): string {
    const fails    = audit.issues.filter(i => i.status === 'fail');
    const warnings = audit.issues.filter(i => i.status === 'warning');
    const passes   = audit.issues.filter(i => i.status === 'pass');
    const critical = fails.filter(i => i.severity === 'CRITICAL').length;
    const high     = fails.filter(i => i.severity === 'HIGH').length;

    return `
<section id="audit-${index}" class="audit-section">

  <!-- ── Cover ── -->
  <div class="cover">
    <div class="cover-left">
      <div class="repo-label">Repository</div>
      <div class="repo-name">${this.esc(audit.repoName)}</div>
      <div class="repo-url">${this.esc(audit.repoUrl)}</div>
      <div class="cover-meta">
        <span>Branch: <strong>${this.esc(audit.branch)}</strong></span>
        <span>${audit.scannedFiles} files scanned</span>
        <span>Completed ${this.fmtFull(audit.completedAt ?? audit.startedAt)}</span>
      </div>
    </div>
    <div class="cover-right">
      <div class="score-ring" style="--score-color:${this.scoreColor(audit.overallScore)}">
        <div class="score-value">${audit.overallScore}</div>
        <div class="score-label">${this.scoreLabel(audit.overallScore)}</div>
      </div>
    </div>
  </div>

  <!-- ── Stat bar ── -->
  <div class="stat-bar">
    <div class="stat"><div class="stat-n red">${fails.length}</div><div class="stat-l">Failures</div></div>
    <div class="stat"><div class="stat-n orange">${warnings.length}</div><div class="stat-l">Warnings</div></div>
    <div class="stat"><div class="stat-n green">${passes.length}</div><div class="stat-l">Passed</div></div>
    <div class="stat"><div class="stat-n red">${critical}</div><div class="stat-l">Critical</div></div>
    <div class="stat"><div class="stat-n orange">${high}</div><div class="stat-l">High</div></div>
  </div>

  <!-- ── Compliance matrix ── -->
  <div class="section-title">Compliance Matrix</div>
  <table class="matrix">
    <thead>
      <tr>
        <th>Domain</th>
        <th class="center red">Critical</th>
        <th class="center orange">High</th>
        <th class="center amber">Medium</th>
        <th class="center blue">Low</th>
        <th class="center green">Passed</th>
        <th class="center">Total</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(audit.summaryMatrix).map(([, row]) => `
      <tr>
        <td class="topic">${this.esc(row.topicName)}</td>
        <td class="center">${row.critical > 0 ? `<span class="badge red">${row.critical}</span>` : '<span class="zero">—</span>'}</td>
        <td class="center">${row.high > 0     ? `<span class="badge orange">${row.high}</span>` : '<span class="zero">—</span>'}</td>
        <td class="center">${row.medium > 0   ? `<span class="badge amber">${row.medium}</span>` : '<span class="zero">—</span>'}</td>
        <td class="center">${row.low > 0      ? `<span class="badge blue">${row.low}</span>` : '<span class="zero">—</span>'}</td>
        <td class="center">${row.passed > 0   ? `<span class="badge green">${row.passed}</span>` : '<span class="zero">—</span>'}</td>
        <td class="center dim">${row.total}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <!-- ── Issues ── -->
  ${fails.length > 0 ? `
  <div class="section-title">Failures <span class="count">${fails.length}</span></div>
  ${fails.map(i => this.buildIssue(i)).join('')}` : ''}

  ${warnings.length > 0 ? `
  <div class="section-title">Warnings <span class="count warn">${warnings.length}</span></div>
  ${warnings.map(i => this.buildIssue(i)).join('')}` : ''}

  ${passes.length > 0 ? `
  <div class="section-title">Passed <span class="count pass">${passes.length}</span></div>
  ${passes.map(i => this.buildIssue(i)).join('')}` : ''}

</section>`;
  }

  private buildIssue(issue: AuditIssue): string {
    const sevClass = issue.severity.toLowerCase();
    return `
<div class="issue issue-${issue.status}">
  <div class="issue-head">
    <div class="issue-badges">
      <span class="sev sev-${sevClass}">${issue.severity}</span>
      <span class="topic-tag">${this.esc(issue.topicName)}</span>
      <span class="group-tag">${issue.group === 'must-have' ? '🔴 Must-Have' : '🟢 Good-to-Have'}</span>
    </div>
    <div class="issue-status issue-status-${issue.status}">${issue.status.toUpperCase()}</div>
  </div>
  <div class="issue-title">${this.esc(issue.practice)}</div>
  ${issue.filePath ? `<div class="file-path">📄 ${this.esc(issue.filePath)}${issue.lineNumber ? `:${issue.lineNumber}` : ''}</div>` : ''}
  <div class="issue-body">
    <p class="explanation">${this.esc(issue.explanation)}</p>
    ${issue.codeSnippet ? `
    <div class="code-block">
      <div class="code-label">Current Code</div>
      <pre>${this.esc(issue.codeSnippet)}</pre>
    </div>` : ''}
    ${issue.suggestedFix ? `<p class="fix-hint">💡 <strong>Suggested fix:</strong> ${this.esc(issue.suggestedFix)}</p>` : ''}
    ${issue.fixedCode ? `
    <div class="code-block fixed">
      <div class="code-label">Recommended Fix</div>
      <pre>${this.esc(issue.fixedCode)}</pre>
    </div>` : ''}
  </div>
</div>`;
  }

  // ── CSS ─────────────────────────────────────────────────────────────────────

  private css(): string {
    return `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#f8fafc;color:#1e293b;font-size:14px;line-height:1.6}
a{color:#1a5cff}
.doc{max-width:960px;margin:0 auto;padding:24px 16px}

/* Header */
.doc-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-radius:16px;background:linear-gradient(135deg,#0a0e1a,#1a1f35);margin-bottom:24px}
.brand{display:flex;align-items:center;gap:14px}
.brand-icon{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#1a5cff,#7c3aed);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.brand-name{font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.5px}
.brand-name span{color:#818cf8}
.brand-sub{font-size:12px;color:#94a3b8;margin-top:2px}
.doc-meta{font-size:12px;color:#64748b;text-align:right}

/* TOC */
.toc{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px}
.toc h2{font-size:14px;font-weight:600;color:#475569;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em}
.toc ol{padding-left:20px}
.toc li{padding:4px 0;color:#334155}
.toc a{color:#1a5cff;text-decoration:none;font-weight:500}
.toc-score{float:right;font-weight:700;font-size:13px}

/* Audit section */
.audit-section{margin-bottom:48px}
.page-break{page-break-after:always;height:1px;background:#e2e8f0;margin:32px 0}

/* Cover */
.cover{display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px 32px;margin-bottom:16px}
.repo-label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:6px}
.repo-name{font-size:22px;font-weight:700;color:#0f172a;font-family:monospace;margin-bottom:4px}
.repo-url{font-size:12px;color:#64748b;font-family:monospace;margin-bottom:16px}
.cover-meta{display:flex;gap:16px;flex-wrap:wrap}
.cover-meta span{font-size:12px;color:#64748b;background:#f1f5f9;padding:4px 10px;border-radius:20px}
.score-ring{width:110px;height:110px;border-radius:50%;background:conic-gradient(var(--score-color) 0%,#e2e8f0 0%);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;position:relative;box-shadow:0 0 0 8px #fff,0 0 0 9px #e2e8f0}
.score-value{font-size:32px;font-weight:800;color:#0f172a;line-height:1}
.score-label{font-size:11px;font-weight:600;color:var(--score-color);text-transform:uppercase;letter-spacing:.06em}

/* Stat bar */
.stat-bar{display:flex;gap:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px}
.stat{flex:1;padding:14px 16px;text-align:center;border-right:1px solid #e2e8f0}
.stat:last-child{border-right:none}
.stat-n{font-size:22px;font-weight:700;line-height:1}
.stat-l{font-size:11px;color:#94a3b8;margin-top:2px}
.red{color:#ef4444}.orange{color:#f97316}.amber{color:#f59e0b}.blue{color:#3b82f6}.green{color:#22c55e}

/* Section title */
.section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#475569;padding:16px 0 10px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #e2e8f0;margin-bottom:12px}
.count{background:#ef4444;color:#fff;border-radius:20px;padding:1px 8px;font-size:11px}
.count.warn{background:#f59e0b}.count.pass{background:#22c55e}

/* Matrix table */
.matrix{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;margin-bottom:28px;font-size:13px}
.matrix thead tr{background:#f8fafc}
.matrix th{padding:10px 14px;font-weight:600;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #e2e8f0}
.matrix td{padding:10px 14px;border-bottom:1px solid #f1f5f9}
.matrix tbody tr:last-child td{border-bottom:none}
.matrix tbody tr:hover{background:#fafbfc}
.topic{font-weight:500;color:#334155}
.center{text-align:center}
.zero{color:#cbd5e1}
.dim{color:#94a3b8}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;font-weight:700;font-size:11px;font-family:monospace}
.badge.red{background:#fee2e2;color:#dc2626}
.badge.orange{background:#ffedd5;color:#ea580c}
.badge.amber{background:#fef3c7;color:#d97706}
.badge.blue{background:#dbeafe;color:#2563eb}
.badge.green{background:#dcfce7;color:#16a34a}

/* Issue card */
.issue{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:12px}
.issue-fail{border-left:4px solid #ef4444}
.issue-warning{border-left:4px solid #f59e0b}
.issue-pass{border-left:4px solid #22c55e}
.issue-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
.issue-badges{display:flex;gap:6px;flex-wrap:wrap}
.sev{padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;font-family:monospace;letter-spacing:.04em}
.sev-critical{background:#fee2e2;color:#dc2626}
.sev-high{background:#ffedd5;color:#ea580c}
.sev-medium{background:#fef3c7;color:#d97706}
.sev-low{background:#dbeafe;color:#2563eb}
.topic-tag{padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;background:#f1f5f9;color:#475569}
.group-tag{padding:2px 8px;border-radius:4px;font-size:10px;background:#f8f4ff;color:#6d28d9}
.issue-status{font-size:10px;font-weight:700;letter-spacing:.06em;padding:2px 8px;border-radius:4px;flex-shrink:0}
.issue-status-fail{background:#fee2e2;color:#dc2626}
.issue-status-warning{background:#fef3c7;color:#d97706}
.issue-status-pass{background:#dcfce7;color:#16a34a}
.issue-title{font-size:14px;font-weight:600;color:#0f172a;margin-bottom:6px}
.file-path{font-family:monospace;font-size:12px;color:#64748b;margin-bottom:10px}
.issue-body{padding-left:0}
.explanation{color:#475569;margin-bottom:12px;font-size:13px}
.code-block{margin:12px 0;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0}
.code-block.fixed{border-color:#bbf7d0}
.code-label{padding:6px 14px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;background:#f8fafc;color:#94a3b8;border-bottom:1px solid #e2e8f0}
.code-block.fixed .code-label{background:#f0fdf4;color:#16a34a;border-bottom-color:#bbf7d0}
pre{padding:14px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:12px;background:#f8fafc;white-space:pre-wrap;word-break:break-all;color:#334155;overflow-x:auto}
.code-block.fixed pre{background:#f0fdf4}
.fix-hint{font-size:13px;color:#475569;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin:8px 0}

/* Footer */
.doc-footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px}

/* Print */
@media print{
  body{background:#fff}
  .doc{padding:0}
  .doc-header{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page-break{page-break-after:always}
  .issue,.matrix,.cover,.stat-bar{break-inside:avoid}
}`;
  }

  // ── Utilities ────────────────────────────────────────────────────────────────

  private scoreColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  private scoreLabel(score: number): string {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  }

  private esc(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private fmtDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private fmtFull(date: Date): string {
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  private triggerDownload(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
