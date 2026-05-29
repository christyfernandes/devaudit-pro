<div align="center">

# DevAudit Pro

### Frontend Code Compliance & Best Practices Auditor

[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=flat-square&logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square)](https://web.dev/progressive-web-apps/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

*Audit Angular & React codebases against a comprehensive 9-domain Frontend CoE checklist — instantly.*

</div>

---

## What is DevAudit Pro?

DevAudit Pro is a **Progressive Web App** that gives engineering teams a single, authoritative reference for frontend code quality. It surfaces the full [Frontend CoE Review Checklist v2.0] across **9 domains**, runs a mock automated scan of any GitHub repository, and generates a scored compliance report with issue-level fix guidance.

---

## Features

| Feature | Description |
|---|---|
| 📋 **9-Domain Checklist** | Code Quality, TypeScript, Performance, Accessibility, Security, Testing, Angular, React, NFRs |
| 🔍 **Smart Search & Filter** | Filter by severity (Critical/High/Medium), group (Must-Have / Good-to-Have), and keyword |
| 🤖 **Repo Scanner** | Simulates scanning any GitHub URL with live progress and step-by-step feedback |
| 📊 **Results Matrix** | Topic-by-topic compliance scorecard with pass/fail/warning breakdowns |
| 🐛 **Issue Explorer** | Filterable issue list with file paths, line numbers, and code diffs |
| 🌙 **Dark / Light Mode** | Persisted theme preference, toggle in navbar |
| 📱 **PWA** | Installable, offline-capable via Angular Service Worker |
| 🔐 **Auth** | JWT-ready auth scaffold with role-based access (reviewer / admin) |

---

## Checklist Domains

1. **Code Quality & Standards** — linting, naming, complexity, modularity  
2. **TypeScript Guidelines** — strict mode, generics, type safety, no `any`  
3. **Performance Standards** — lazy loading, OnPush, bundle budgets, Web Vitals  
4. **Accessibility (a11y)** — WCAG 2.1 AA, ARIA, keyboard navigation, color contrast  
5. **Frontend Security** — XSS, CSP, secrets management, dependency hygiene  
6. **Testing Strategy** — unit, integration, e2e coverage, mocking patterns  
7. **Angular Best Practices** — standalone components, signals, reactive forms, DI  
8. **React Best Practices** — hooks, memo, error boundaries, context vs state  
9. **Non-Functional Requirements** — Lighthouse scores, i18n, error handling, logging  

---

## Tech Stack

- **Angular 17+** — standalone components, signals, lazy-loaded routes, view transitions  
- **Angular Signals** — reactive state without RxJS overhead  
- **Tailwind CSS 3** — custom dark-mode design system with brand tokens  
- **Angular PWA** — `@angular/service-worker`, offline caching  
- **TypeScript (strict mode)** — `noImplicitAny`, `strictNullChecks`, `strictTemplates`  
- **Fonts**: [Syne](https://fonts.google.com/specimen/Syne) · [DM Sans](https://fonts.google.com/specimen/DM+Sans) · [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
git clone https://github.com/christyfernandes/devaudit-pro.git
cd devaudit-pro
npm install
npm start          # → http://localhost:4200
```

### Build

```bash
npm run build      # production build → dist/devaudit-pro/browser/
```

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Reviewer | `reviewer@devaudit.pro` | `password` |
| Admin | `admin@devaudit.pro` | `password` |

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # TypeScript interfaces (checklist, audit)
│   │   ├── services/        # ChecklistService, AuditService, AuthService, ThemeService
│   │   └── guards/          # authGuard (functional)
│   ├── features/
│   │   ├── landing/         # Checklist explorer (search, filter, expand)
│   │   ├── auth/login/      # Login page
│   │   └── audit/
│   │       ├── new-audit/   # Repo URL entry + scan progress
│   │       └── results/     # Compliance matrix + issue explorer
│   └── shared/
│       └── components/
│           ├── navbar/           # Top navigation, auth-aware
│           └── severity-badge/   # Severity & group tag badges
├── styles.scss              # Tailwind + CSS variables + glass utilities
└── index.html               # Google Fonts, PWA meta
```

---

## Roadmap

- [ ] **Click-to-Fix Diff View** — GitHub PR-style side-by-side code diff
- [ ] **Export Reports** — PDF / Markdown executive summary
- [ ] **Shareable Deep-Links** — unique audit URLs with encoded state
- [ ] **Custom Checklist Builder** — admin can toggle rules on/off per org
- [ ] **CI/CD Gateway** — CLI wrapper / webhook for blocking non-compliant PRs
- [ ] **Real GitHub API Integration** — actual file scanning via GitHub REST API

---

## Contributing

PRs welcome! Please open an issue first for major changes.

```bash
git checkout -b feature/your-feature
# make changes
git commit -m "feat: your feature description"
git push origin feature/your-feature
# open a PR
```

---

## License

MIT © [Christy Fernandes](https://github.com/christyfernandes)
