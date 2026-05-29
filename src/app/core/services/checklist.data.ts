import { ChecklistTopic } from '../models/checklist.model';

export const CHECKLIST_DATA: ChecklistTopic[] = [
  {
    id: 'code-quality',
    name: 'Code Quality & Standards',
    shortName: 'Code Quality',
    description: 'Code quality standards are the bedrock of a maintainable codebase. Without them, every review becomes subjective, every new joiner writes in a different dialect, and technical debt accumulates silently.',
    icon: 'code-2',
    color: '#6366f1',
    tags: ['TypeScript', 'ESLint', 'Husky', 'Prettier'],
    items: [
      {
        id: 'cq-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'code-quality',
        practice: 'Strict TypeScript — no \'any\', noImplicitAny enabled',
        whyItMatters: 'Allowing \'any\' silently disables the entire type system. It is the single biggest hole in TypeScript adoption and the root cause of most TS projects that still have runtime type errors.',
        longRunImpact: 'Refactors become safe — renaming a property or changing a function signature propagates compiler errors everywhere, not surprise runtime failures in production.'
      },
      {
        id: 'cq-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'code-quality',
        practice: 'ESLint with org-wide shared config (npm package)',
        whyItMatters: 'Without enforced linting, each team accumulates its own dialect of anti-patterns. A shared @org/eslint-config package means one place to update rules.',
        longRunImpact: 'Code review discussions move from style debates to logic. Technical debt is flagged at commit time, not months later in production incidents.'
      },
      {
        id: 'cq-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'code-quality',
        practice: 'Pre-commit hooks — Husky + lint-staged',
        whyItMatters: 'CI catches problems after a push, but by then the developer\'s context has switched. Pre-commit hooks run linting and type-checking on staged files only, failing in under 5 seconds.',
        longRunImpact: 'CI pipelines run cleaner and faster. Developers build the habit of shipping clean code rather than reverting and re-pushing.'
      },
      {
        id: 'cq-4', number: 4, severity: 'HIGH', group: 'must-have', topicId: 'code-quality',
        practice: 'Prettier for automatic code formatting',
        whyItMatters: 'Manual formatting causes endless PR noise — tabs vs spaces, trailing commas, semicolons, line widths. Prettier enforces a non-negotiable format.',
        longRunImpact: 'Merges become faster, diffs become smaller, and new team members contribute without formatting anxiety on day one.'
      },
      {
        id: 'cq-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'code-quality',
        practice: 'Conventional Commits enforced via commitlint',
        whyItMatters: 'Unstructured commit messages make release notes, changelogs, and bisecting bugs difficult.',
        longRunImpact: 'Automated changelogs, semantic versioning with standard-version or release-please, and faster root-cause analysis via structured git log.'
      },
      {
        id: 'cq-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'code-quality',
        practice: 'Documented and enforced folder structure per framework',
        whyItMatters: 'When every project organises files differently, every engineer re-learns the project structure on each context switch.',
        longRunImpact: 'Onboarding new developers drops from days to hours. Cross-team contributions happen without needing a full guided tour.'
      },
      {
        id: 'cq-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'code-quality',
        practice: 'Absolute import aliases — no deep relative paths',
        whyItMatters: 'Deep relative imports (../../../../services/auth) are brittle when files move. Path aliases (@/services/auth) are stable regardless of file location.',
        longRunImpact: 'Refactors that move files do not cascade into dozens of import path fixes.'
      },
      {
        id: 'cq-8', number: 8, severity: 'HIGH', group: 'must-have', topicId: 'code-quality',
        practice: 'No console.log in production builds',
        whyItMatters: 'Console statements left in production expose internal state, data structures, and sometimes PII to any user who opens DevTools.',
        longRunImpact: 'Data exposure risk is eliminated. Logging in production uses a proper log service (Datadog, Sentry) with level control and redaction.'
      },
      {
        id: 'cq-9', number: 9, severity: 'MEDIUM', group: 'must-have', topicId: 'code-quality',
        practice: 'Dead code elimination — no unused exports, vars, imports',
        whyItMatters: 'Dead code confuses readers, inflates bundles, and misleads new developers who try to understand the codebase by reading everything.',
        longRunImpact: 'Codebase stays lean and readable. Bundle sizes reduce. New team members can trust that the code they see is the code that runs.'
      },
      {
        id: 'cq-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'code-quality',
        practice: 'Maximum function complexity threshold (cyclomatic ≤ 10)',
        whyItMatters: 'Functions with deeply nested conditions or too many branches are hard to test, easy to break, and impossible to reason about at a glance.',
        longRunImpact: 'Code stays testable and decomposed. Long-term the codebase avoids god-functions that nobody dares touch or test.'
      },
      {
        id: 'cq-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'code-quality',
        practice: 'Import order enforcement (eslint-plugin-import)',
        whyItMatters: 'Consistent import grouping (external > internal > relative) reduces merge conflicts and makes dependency audits easier.',
        longRunImpact: 'Projects with consistent imports are easier to analyse for dead code and circular dependencies.'
      },
      {
        id: 'cq-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'code-quality',
        practice: 'Barrel files (index.ts) with caution — document policy',
        whyItMatters: 'Barrel files simplify imports but create circular dependency risks and can defeat tree-shaking.',
        longRunImpact: 'Prevents a common Angular/React pattern that causes circular import errors and unexpectedly large bundles.'
      },
      {
        id: 'cq-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'code-quality',
        practice: 'Git branch naming convention enforced via branch policies',
        whyItMatters: 'Without branch naming standards, PRs are hard to trace back to tickets, automated tools cannot link branches to issues.',
        longRunImpact: 'CI/CD pipelines can parse branch names for auto-deployment rules. Ticket traceability is maintained from branch to PR to deploy.'
      },
      {
        id: 'cq-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'code-quality',
        practice: 'EditorConfig in repo root',
        whyItMatters: 'Not everyone uses the same editor. EditorConfig ensures consistent indentation, charset, and line endings.',
        longRunImpact: 'Eliminates Windows/Unix line-ending conflicts polluting git history.'
      },
      {
        id: 'cq-g5', number: 5, severity: 'MEDIUM', group: 'good-to-have', topicId: 'code-quality',
        practice: 'Automated dependency update PRs (Dependabot / Renovate)',
        whyItMatters: 'Manually keeping dependencies current is deferred indefinitely. Automated PRs make staying on supported versions practical.',
        longRunImpact: 'Vulnerability exposure window is minimised. Teams stay on minor/patch versions with small, reviewable incremental updates.'
      }
    ]
  },
  {
    id: 'typescript',
    name: 'TypeScript Guidelines',
    shortName: 'TypeScript',
    description: 'TypeScript\'s value is directly proportional to how strictly it is used. Loose TypeScript is JavaScript with extra syntax and false confidence.',
    icon: 'braces',
    color: '#3178c6',
    tags: ['TypeScript', 'Strict Mode', 'Type Safety'],
    items: [
      {
        id: 'ts-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'typescript',
        practice: 'strict: true in tsconfig — all strict checks enabled',
        whyItMatters: 'Strict mode enables strictNullChecks, noImplicitAny, strictFunctionTypes. Disabling any of these creates silent holes where runtime errors hide.',
        longRunImpact: 'The majority of "Cannot read properties of undefined" production errors are caught at compile time.'
      },
      {
        id: 'ts-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'typescript',
        practice: 'No type assertions (as Type) without documented justification',
        whyItMatters: 'Type assertions tell the compiler "trust me" — they bypass all checks. Widespread use is a signal that types were wrong at the source.',
        longRunImpact: 'Forces correct typing at the source. Assertion abuse is a common root cause of TypeScript projects that still have runtime type errors.'
      },
      {
        id: 'ts-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'typescript',
        practice: 'Centralised domain types and interfaces folder (/types or /models)',
        whyItMatters: 'Types scattered across files get duplicated, diverge, and cause silent inconsistencies between layers.',
        longRunImpact: 'Changes to a domain model are made in one place and propagate. API response type mismatches are caught at compile time.'
      },
      {
        id: 'ts-4', number: 4, severity: 'HIGH', group: 'must-have', topicId: 'typescript',
        practice: 'Use interfaces for public API contracts, type aliases for unions/intersections',
        whyItMatters: 'Interfaces are extendable and produce clearer error messages. Type aliases are better for union types and conditional types.',
        longRunImpact: 'Contracts between layers (API → store → component) are explicit and enforced.'
      },
      {
        id: 'ts-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'typescript',
        practice: 'Prefer unknown over any for external / unvalidated data',
        whyItMatters: 'When consuming API responses, unknown forces explicit narrowing and validation before use, unlike any which skips all checks silently.',
        longRunImpact: 'External data handling is safe by construction. Runtime parse errors are forced to the surface at the boundary.'
      },
      {
        id: 'ts-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'typescript',
        practice: 'Strict null checks — no non-null assertions (!.) without justification',
        whyItMatters: 'The non-null assertion operator is a runtime risk every time it is used.',
        longRunImpact: 'Null reference errors — still the most common JavaScript runtime error — are caught at compile time.'
      },
      {
        id: 'ts-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'typescript',
        practice: 'Readonly for immutable data structures',
        whyItMatters: 'Mutating data that should be immutable is a common source of subtle bugs where one part of the system inadvertently modifies shared state.',
        longRunImpact: 'Immutability violations are compile-time errors. Particularly important for Redux/NgRx state shapes.'
      },
      {
        id: 'ts-8', number: 8, severity: 'MEDIUM', group: 'must-have', topicId: 'typescript',
        practice: 'Use utility types (Partial, Pick, Omit, Readonly, Record)',
        whyItMatters: 'Writing manual partial interfaces leads to divergence from their source types over time.',
        longRunImpact: 'Less code to maintain. Type correctness is compositional rather than duplicative.'
      },
      {
        id: 'ts-9', number: 9, severity: 'MEDIUM', group: 'must-have', topicId: 'typescript',
        practice: 'Branded / nominal types for domain primitives (UserId, OrderId)',
        whyItMatters: 'Without branding, UserId and OrderId are both strings — the compiler cannot prevent passing one where the other is expected.',
        longRunImpact: 'Prevents entire classes of domain logic errors. Critical in codebases with many ID types or domain primitives.'
      },
      {
        id: 'ts-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'typescript',
        practice: 'Exhaustive checks in switch/if for discriminated unions',
        whyItMatters: 'When a discriminated union gains a new variant, switch statements that do not handle it silently fall through.',
        longRunImpact: 'Adding a new union variant produces a compile error everywhere it is not handled.'
      },
      {
        id: 'ts-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'typescript',
        practice: 'Generic constraints instead of overloads for reusable utilities',
        whyItMatters: 'Function overloads for similar signatures create maintenance overhead. Generics with constraints are more composable.',
        longRunImpact: 'Utility functions are reusable without duplication.'
      },
      {
        id: 'ts-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'typescript',
        practice: 'Zod / io-ts for runtime validation at API boundaries',
        whyItMatters: 'TypeScript types are erased at runtime. API responses can diverge from their declared types.',
        longRunImpact: 'Type safety is end-to-end including runtime. API contract changes become immediate, structured validation failures.'
      },
      {
        id: 'ts-g3', number: 3, severity: 'MEDIUM', group: 'good-to-have', topicId: 'typescript',
        practice: 'Template literal types for string-based contracts',
        whyItMatters: 'CSS class names, event names, API path segments are stringly typed by default. Template literal types constrain them.',
        longRunImpact: 'Typos in string-based APIs become compile errors. Auto-complete works in IDEs.'
      },
      {
        id: 'ts-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'typescript',
        practice: 'Avoid large untyped object spreads (...config)',
        whyItMatters: 'Spreading large objects with unknown shapes discards type information and frequently causes unexpected property leakage.',
        longRunImpact: 'Type narrowing works correctly downstream. Accidental property exposure in API payloads is caught at compile time.'
      }
    ]
  },
  {
    id: 'performance',
    name: 'Performance Standards',
    shortName: 'Performance',
    description: 'Performance is a product feature. Poor Core Web Vitals directly affect user retention, SEO ranking, and conversion rates.',
    icon: 'zap',
    color: '#f59e0b',
    tags: ['Core Web Vitals', 'Bundle Size', 'Lazy Loading'],
    items: [
      {
        id: 'perf-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'performance',
        practice: 'Route-level code splitting — all routes lazy loaded',
        whyItMatters: 'Without lazy loading, 100% of application code is downloaded on the first route regardless of what the user needs.',
        longRunImpact: 'Initial bundle size typically reduces by 50–80% for large apps. Time-to-interactive improves directly.'
      },
      {
        id: 'perf-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'performance',
        practice: 'Bundle size budgets enforced in CI (Webpack / Vite / Angular CLI)',
        whyItMatters: 'Without a budget, bundles grow unbounded. Every npm install, every new feature adds to load time silently.',
        longRunImpact: 'Performance regressions are caught before they reach production. Teams make deliberate trade-offs.'
      },
      {
        id: 'perf-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'performance',
        practice: 'No synchronous blocking scripts in <head>',
        whyItMatters: 'Render-blocking scripts prevent the browser from parsing the HTML until the script is fully downloaded and executed.',
        longRunImpact: 'FCP (First Contentful Paint) and LCP (Largest Contentful Paint) improve directly.'
      },
      {
        id: 'perf-4', number: 4, severity: 'HIGH', group: 'must-have', topicId: 'performance',
        practice: 'Image optimisation — WebP/AVIF format, explicit dimensions, lazy loading',
        whyItMatters: 'Images are typically the single largest contributor to page weight, often accounting for 60–80% of total transfer size.',
        longRunImpact: 'LCP — the most user-visible Core Web Vital — improves directly.'
      },
      {
        id: 'perf-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'performance',
        practice: 'Third-party script governance — review before adding any',
        whyItMatters: 'Analytics, chat widgets, A/B testing scripts — each adds to main-thread blocking time.',
        longRunImpact: 'TBT (Total Blocking Time) and TTI (Time to Interactive) stay within budget.'
      },
      {
        id: 'perf-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'performance',
        practice: 'Virtualise long lists (virtual scrolling for 100+ item lists)',
        whyItMatters: 'Rendering 1000 DOM nodes when only 20 are visible is one of the most common causes of jank in data-heavy UIs.',
        longRunImpact: 'Scroll performance (INP) stays smooth regardless of data size.'
      },
      {
        id: 'perf-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'performance',
        practice: 'Avoid memory leaks — clean up subscriptions, timers, event listeners',
        whyItMatters: 'Uncleared setInterval, uncleaned RxJS subscriptions, and event listeners accumulate over SPA navigation.',
        longRunImpact: 'App performance stays consistent during long sessions. Memory-related slowdowns are eliminated.'
      },
      {
        id: 'perf-8', number: 8, severity: 'MEDIUM', group: 'must-have', topicId: 'performance',
        practice: 'Lighthouse CI in CI/CD pipeline — track scores per PR',
        whyItMatters: 'Manual performance audits happen rarely and inconsistently. Automated Lighthouse runs on every PR create a measurable trend.',
        longRunImpact: 'Performance becomes a team habit rather than a quarterly crisis.'
      },
      {
        id: 'perf-9', number: 9, severity: 'MEDIUM', group: 'must-have', topicId: 'performance',
        practice: 'Tree-shaking verification for all added libraries',
        whyItMatters: 'Some libraries are not tree-shakeable — importing one function pulls in the entire package.',
        longRunImpact: 'Bundle size stays lean. A single non-tree-shakeable library can add 100–300 KB silently.'
      },
      {
        id: 'perf-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'performance',
        practice: 'Font loading strategy — font-display: swap and preload',
        whyItMatters: 'Custom fonts that block rendering cause blank text periods (FOIT) and layout shifts (FOUT).',
        longRunImpact: 'CLS (Cumulative Layout Shift) and FCP improve. Users see text content immediately.'
      },
      {
        id: 'perf-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'performance',
        practice: 'HTTP cache headers — immutable for hashed assets',
        whyItMatters: 'Assets without proper cache headers are re-downloaded on every visit.',
        longRunImpact: 'Returning users experience near-instant loads. Server bandwidth costs fall.'
      },
      {
        id: 'perf-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'performance',
        practice: 'Preload / prefetch critical resources strategically',
        whyItMatters: '<link rel=preload> for critical fonts, hero images, and key scripts hints the browser to fetch them early.',
        longRunImpact: 'LCP and FCP improve for resources the critical render path depends on.'
      },
      {
        id: 'perf-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'performance',
        practice: 'Service Worker for offline support and asset caching',
        whyItMatters: 'Service Workers enable background asset caching, offline fallbacks, and background sync.',
        longRunImpact: 'Users on unreliable connections get a functional experience. Repeat visit performance is dramatically faster.'
      },
      {
        id: 'perf-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'performance',
        practice: 'Avoid layout thrashing — batch DOM reads/writes',
        whyItMatters: 'Interleaving DOM reads with DOM writes forces the browser to recalculate layout repeatedly in the same frame.',
        longRunImpact: 'Animation and scroll performance stays smooth. Particularly relevant for dashboard UIs.'
      },
      {
        id: 'perf-g5', number: 5, severity: 'MEDIUM', group: 'good-to-have', topicId: 'performance',
        practice: 'Web Workers for CPU-intensive operations',
        whyItMatters: 'Heavy computation on the main thread blocks rendering and user interactions.',
        longRunImpact: 'INP stays responsive even during heavy data processing. The UI never freezes.'
      }
    ]
  },
  {
    id: 'accessibility',
    name: 'Accessibility (a11y)',
    shortName: 'Accessibility',
    description: 'Accessibility is both a legal obligation and a quality signal. WCAG 2.2 compliance is required by law in the EU, UK, and US.',
    icon: 'accessibility',
    color: '#10b981',
    tags: ['WCAG 2.2', 'Screen Readers', 'Keyboard Nav'],
    items: [
      {
        id: 'a11y-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'accessibility',
        practice: 'WCAG 2.2 AA as the explicit, documented baseline',
        whyItMatters: 'Without an explicit standard, accessibility is aspirational rather than measurable. AA is referenced in all major legal frameworks.',
        longRunImpact: 'Sets a clear, testable bar for designers, developers, and QA. Legal risk is quantified and manageable.'
      },
      {
        id: 'a11y-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'accessibility',
        practice: 'Automated a11y testing in CI — axe-core / jest-axe on all components',
        whyItMatters: 'Manual accessibility reviews are expensive, inconsistent, and happen after the fact. Automated checks catch 30–40% of all WCAG violations at PR time.',
        longRunImpact: 'Accessibility regressions are impossible to ship unnoticed.'
      },
      {
        id: 'a11y-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'accessibility',
        practice: 'Keyboard navigation — all interactive elements fully operable',
        whyItMatters: 'Any element that requires a mouse to operate is inaccessible to keyboard users, screen reader users, and users with motor disabilities.',
        longRunImpact: 'Keyboard support is the prerequisite for screen reader compatibility.'
      },
      {
        id: 'a11y-4', number: 4, severity: 'CRITICAL', group: 'must-have', topicId: 'accessibility',
        practice: 'Colour contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text',
        whyItMatters: 'Low contrast text is unreadable for users with low vision or colour blindness. Failing contrast ratios are the single most common WCAG violation.',
        longRunImpact: 'Affects approximately 8% of male users (colour vision deficiency).'
      },
      {
        id: 'a11y-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'accessibility',
        practice: 'Semantic HTML — correct heading hierarchy, landmarks, lists, buttons',
        whyItMatters: 'Screen readers navigate by document structure. Div soup with no landmarks makes a page unusable for assistive technology users.',
        longRunImpact: 'Most accessibility wins come for free from semantic HTML. A correct heading hierarchy also improves SEO.'
      },
      {
        id: 'a11y-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'accessibility',
        practice: 'All images have meaningful alt text — decorative images use alt=""',
        whyItMatters: 'Screen readers announce every image. Images without alt text are read as the filename.',
        longRunImpact: 'Screen reader users get equivalent information to sighted users for all content images.'
      },
      {
        id: 'a11y-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'accessibility',
        practice: 'ARIA used only when native HTML semantics are insufficient',
        whyItMatters: 'Misused ARIA — applying roles to elements that already have native semantics — creates worse accessibility than no ARIA.',
        longRunImpact: 'Correct, minimal ARIA use produces predictable screen reader behaviour.'
      },
      {
        id: 'a11y-8', number: 8, severity: 'HIGH', group: 'must-have', topicId: 'accessibility',
        practice: 'Focus management for SPAs — announce route changes to screen readers',
        whyItMatters: 'In SPAs, route changes don\'t trigger a browser page load. Screen reader users have no indication the page content has changed.',
        longRunImpact: 'Screen reader users can navigate the app independently and equivalently to sighted users.'
      },
      {
        id: 'a11y-9', number: 9, severity: 'MEDIUM', group: 'must-have', topicId: 'accessibility',
        practice: 'aria-live regions for dynamic content (notifications, search results, status)',
        whyItMatters: 'Content updated dynamically via JavaScript is invisible to screen readers unless explicitly announced via aria-live.',
        longRunImpact: 'Users relying on screen readers get equivalent information when content changes asynchronously.'
      },
      {
        id: 'a11y-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'accessibility',
        practice: 'Form labels, error messages, and fieldsets — explicit associations',
        whyItMatters: 'Form inputs without explicit label associations are announced by their placeholder only.',
        longRunImpact: 'Forms are the most common accessibility failure point. Correct label association makes forms usable.'
      },
      {
        id: 'a11y-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'accessibility',
        practice: 'Reduced motion support — @prefers-reduced-motion for all animations',
        whyItMatters: 'Animations can trigger vestibular disorders causing dizziness and nausea.',
        longRunImpact: 'Reduces harm for users with vestibular conditions. Required for strict WCAG 2.3 AAA compliance.'
      },
      {
        id: 'a11y-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'accessibility',
        practice: 'Skip navigation link — first focusable element skips to main content',
        whyItMatters: 'Keyboard users navigating a page with a large header/nav must tab through every link before reaching content.',
        longRunImpact: 'Keyboard navigation efficiency improves dramatically.'
      },
      {
        id: 'a11y-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'accessibility',
        practice: 'Touch targets — minimum 44x44 CSS pixels for all interactive elements',
        whyItMatters: 'Small touch targets cause accidental taps, particularly for users with motor difficulties.',
        longRunImpact: 'Mobile usability improves for all users. Critical for users with motor impairments.'
      },
      {
        id: 'a11y-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'accessibility',
        practice: 'No content that flashes more than 3 times per second',
        whyItMatters: 'Content flashing above 3Hz can trigger photosensitive epilepsy seizures.',
        longRunImpact: 'Prevents potential medical harm to users with photosensitive epilepsy.'
      },
      {
        id: 'a11y-g5', number: 5, severity: 'MEDIUM', group: 'good-to-have', topicId: 'accessibility',
        practice: 'Accessible data tables — caption, scope, headers attributes',
        whyItMatters: 'Tables without explicit header associations are read as a stream of values with no context by screen readers.',
        longRunImpact: 'Data-heavy applications become usable for screen reader users.'
      }
    ]
  },
  {
    id: 'security',
    name: 'Frontend Security',
    shortName: 'Security',
    description: 'Frontend code runs in an adversarial environment. Security failures result in data breaches, credential theft, regulatory penalties, and reputational damage.',
    icon: 'shield',
    color: '#ef4444',
    tags: ['XSS', 'CSP', 'Auth Tokens', 'HTTPS'],
    items: [
      {
        id: 'sec-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'security',
        practice: 'No secrets, API keys, or credentials in frontend code or .env exposed to browser',
        whyItMatters: 'Frontend code and environment variables prefixed VITE_, NEXT_PUBLIC_, or NG_APP_ are shipped to the browser.',
        longRunImpact: 'Prevents credential exposure that leads to data breaches, cloud billing abuse, and regulatory penalties.'
      },
      {
        id: 'sec-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'security',
        practice: 'Content Security Policy (CSP) header — strict policy with nonces',
        whyItMatters: 'CSP is the primary browser-enforced defence against XSS. Without it, any injected script executes with full access.',
        longRunImpact: 'Even if an XSS vulnerability exists, a properly configured CSP prevents exploitation in the vast majority of cases.'
      },
      {
        id: 'sec-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'security',
        practice: 'Sanitise all dynamic HTML — DOMPurify before any innerHTML usage',
        whyItMatters: 'Directly inserting unsanitised user-controlled content into the DOM is an explicit XSS vulnerability.',
        longRunImpact: 'Eliminates the most common and highest-impact frontend vulnerability class.'
      },
      {
        id: 'sec-4', number: 4, severity: 'CRITICAL', group: 'must-have', topicId: 'security',
        practice: 'Auth tokens in HttpOnly cookies — never in localStorage',
        whyItMatters: 'Storing JWTs in localStorage exposes them to any XSS. HttpOnly cookies are completely inaccessible to JavaScript.',
        longRunImpact: 'Authentication tokens cannot be exfiltrated even if XSS occurs.'
      },
      {
        id: 'sec-5', number: 5, severity: 'CRITICAL', group: 'must-have', topicId: 'security',
        practice: 'Dependency vulnerability scanning in CI — npm audit / Snyk',
        whyItMatters: 'Most frontend apps import hundreds of packages. The average enterprise frontend has 5–10 high-severity vulnerabilities in its dependency tree.',
        longRunImpact: 'Known vulnerabilities are caught before they reach production.'
      },
      {
        id: 'sec-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'security',
        practice: 'Avoid eval(), Function(), and dynamic code execution',
        whyItMatters: 'eval() and Function() execute arbitrary strings as code. They are a direct XSS vector.',
        longRunImpact: 'Eliminates a severe vulnerability class. Effective CSP becomes implementable once eval is removed.'
      },
      {
        id: 'sec-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'security',
        practice: 'Validate and sanitise all URL parameters before use',
        whyItMatters: 'URL parameters used in redirects or innerHTML without validation enable open redirect and XSS attacks.',
        longRunImpact: 'Open redirect and URL-based injection attacks are prevented.'
      },
      {
        id: 'sec-8', number: 8, severity: 'HIGH', group: 'must-have', topicId: 'security',
        practice: 'HTTPS enforced — no mixed content, HSTS header set',
        whyItMatters: 'Mixed content and missing HSTS headers leave connections vulnerable to downgrade attacks and MITM interception.',
        longRunImpact: 'All traffic is encrypted end-to-end. Required baseline for any application handling user data.'
      },
      {
        id: 'sec-9', number: 9, severity: 'HIGH', group: 'must-have', topicId: 'security',
        practice: 'Sensitive data not logged or tracked — PII redaction in error monitoring',
        whyItMatters: 'Error monitoring tools capture exceptions and often include request/response payloads with PII.',
        longRunImpact: 'GDPR, CCPA, and HIPAA compliance depends on PII not being sent to unauthorised processors.'
      },
      {
        id: 'sec-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'security',
        practice: 'Third-party scripts loaded via SRI (Subresource Integrity)',
        whyItMatters: 'CDN-loaded scripts can be tampered with at the CDN provider level. SRI hashes verify the resource hash before execution.',
        longRunImpact: 'Supply-chain attacks via CDN tampering are blocked.'
      },
      {
        id: 'sec-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'security',
        practice: 'Regular dependency update cadence — all packages within 2 major versions',
        whyItMatters: 'Stale dependencies accumulate vulnerabilities and become increasingly expensive to upgrade.',
        longRunImpact: 'Vulnerability exposure window is minimised.'
      },
      {
        id: 'sec-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'security',
        practice: 'iframe sandboxing for all embedded third-party content',
        whyItMatters: 'Embedded iframes can access parent window context via window.parent unless explicitly sandboxed.',
        longRunImpact: 'Third-party embedded content cannot escalate permissions into the parent application context.'
      },
      {
        id: 'sec-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'security',
        practice: 'Permissions policy header — disable unused browser features',
        whyItMatters: 'The Permissions-Policy header disables browser APIs (camera, microphone, geolocation) that the application does not need.',
        longRunImpact: 'Defence in depth — if XSS occurs, the attacker cannot activate camera/microphone APIs.'
      },
      {
        id: 'sec-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'security',
        practice: 'Rate limiting awareness for client-side API calls',
        whyItMatters: 'Frontend applications that hammer APIs without debouncing can unintentionally DDoS backend services.',
        longRunImpact: 'Backend services remain stable under UI interaction load.'
      }
    ]
  },
  {
    id: 'testing',
    name: 'Testing Strategy',
    shortName: 'Testing',
    description: 'Tests are an investment in the ability to change safely. Without a clear strategy, teams either over-test trivial details or under-test critical business paths.',
    icon: 'test-tube',
    color: '#8b5cf6',
    tags: ['Unit Tests', 'E2E', 'Coverage', 'TDD'],
    items: [
      {
        id: 'test-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'testing',
        practice: 'Unit tests for all business logic — validators, formatters, calculators, reducers',
        whyItMatters: 'Business logic is the highest-risk, highest-value code to test. Bugs here cause wrong bills, incorrect data, silent failures.',
        longRunImpact: 'The most critical code is the most protected. Refactors can be made with confidence.'
      },
      {
        id: 'test-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'testing',
        practice: 'Coverage thresholds enforced in CI — minimum 70% on critical paths',
        whyItMatters: 'Coverage without a threshold is a vanity metric. A minimum floor forces maintenance of coverage as features are added.',
        longRunImpact: 'Coverage debt does not silently accumulate. Regressions in critical business logic are caught before production.'
      },
      {
        id: 'test-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'testing',
        practice: 'Test-driven API mocking — no real HTTP calls in unit/integration tests',
        whyItMatters: 'Tests that make real HTTP calls are slow, flaky, and couple test suites to backend availability.',
        longRunImpact: 'Test suites run in seconds, not minutes. Tests are fully deterministic.'
      },
      {
        id: 'test-4', number: 4, severity: 'HIGH', group: 'must-have', topicId: 'testing',
        practice: 'Component tests for UI contracts — test behaviour, not implementation',
        whyItMatters: 'Tests that assert on component internals break on every refactor even when behaviour is unchanged.',
        longRunImpact: 'UI can be refactored freely without test churn. Tests only break when behaviour actually changes.'
      },
      {
        id: 'test-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'testing',
        practice: 'E2E tests for critical user journeys only — login, checkout, primary workflow',
        whyItMatters: 'E2E tests are expensive to write, slow to run, and brittle to maintain. They should cover only the highest-value user flows.',
        longRunImpact: 'E2E suite stays fast and maintainable. Critical path regressions are caught.'
      },
      {
        id: 'test-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'testing',
        practice: 'No snapshot tests for logic — only for stable component output',
        whyItMatters: 'Snapshot tests that capture entire component trees break on every minor change and become auto-accepted noise.',
        longRunImpact: 'Test suite maintenance burden is reduced. When tests do break, they signal a real behaviour change.'
      },
      {
        id: 'test-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'testing',
        practice: 'Testing pyramid respected — more unit tests than integration, more integration than e2e',
        whyItMatters: 'Inverted pyramids result in CI pipelines that take 20+ minutes, are frequently flaky, and give slow feedback loops.',
        longRunImpact: 'CI feedback is fast — developers see test results in minutes, not after lunch.'
      },
      {
        id: 'test-8', number: 8, severity: 'MEDIUM', group: 'must-have', topicId: 'testing',
        practice: 'Accessibility automated in component tests (jest-axe / Testing Library)',
        whyItMatters: 'Running axe-core assertions in component tests catches WCAG violations at the unit test level.',
        longRunImpact: 'a11y regressions are caught per-component during development.'
      },
      {
        id: 'test-9', number: 9, severity: 'MEDIUM', group: 'must-have', topicId: 'testing',
        practice: 'Test data builders / factories — no hardcoded test fixtures',
        whyItMatters: 'Hardcoded test data scattered across test files creates maintenance overhead when data shapes change.',
        longRunImpact: 'When API response shapes change, only the factory is updated. Tests remain readable and realistic.'
      },
      {
        id: 'test-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'testing',
        practice: 'Contract testing for API integrations — MSW for frontend, Pact for cross-service',
        whyItMatters: 'Frontend teams that mock APIs incorrectly build against the wrong contract.',
        longRunImpact: 'API contract changes are caught during development. Frontend and backend can be developed independently.'
      },
      {
        id: 'test-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'testing',
        practice: 'Visual regression testing — Chromatic or Percy on component library',
        whyItMatters: 'CSS regressions are invisible to unit tests. Only visual comparison catches unintended visual changes.',
        longRunImpact: 'Design system changes are validated visually on every PR. Unintended visual regressions do not reach production.'
      },
      {
        id: 'test-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'testing',
        practice: 'Performance regression tests in CI — bundle size + Lighthouse score history',
        whyItMatters: 'Without tracking performance over time, teams discover regressions months after they were introduced.',
        longRunImpact: 'Performance trends are visible. Regressions are attributed to the specific PR that introduced them.'
      },
      {
        id: 'test-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'testing',
        practice: 'Mutation testing for test quality validation (Stryker)',
        whyItMatters: 'High coverage does not guarantee good tests. Mutation testing verifies tests actually catch bugs.',
        longRunImpact: 'Teams discover that many passing tests make zero assertions about behaviour.'
      },
      {
        id: 'test-g5', number: 5, severity: 'MEDIUM', group: 'good-to-have', topicId: 'testing',
        practice: 'Property-based testing for edge case discovery (fast-check)',
        whyItMatters: 'Example-based tests only catch cases the developer thought of. Property-based testing generates hundreds of random inputs.',
        longRunImpact: 'Edge cases in business logic, parsers, and validators are found automatically.'
      }
    ]
  },
  {
    id: 'angular',
    name: 'Angular-Specific Best Practices',
    shortName: 'Angular',
    description: 'Angular is an opinionated, fast-evolving framework. These practices align with the Angular team\'s current direction since v17 — Signals, standalone components, and new control flow syntax.',
    icon: 'layers',
    color: '#dd0031',
    tags: ['Standalone', 'Signals', 'OnPush', 'Angular 17+'],
    items: [
      {
        id: 'ng-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'angular',
        practice: 'Standalone components as the default — no new NgModules',
        whyItMatters: 'NgModule is on the Angular deprecation path. Writing NgModule-based code today creates migration debt that grows with every new component.',
        longRunImpact: 'Simpler mental model, faster compilation (no module analysis), better tree-shaking.'
      },
      {
        id: 'ng-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'angular',
        practice: 'OnPush change detection on all components',
        whyItMatters: 'Default change detection runs a full component tree check on every DOM event, every async callback, every setInterval tick.',
        longRunImpact: 'Application performance improves measurably in data-heavy views. Combined with Signals, overhead approaches zero.'
      },
      {
        id: 'ng-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'angular',
        practice: 'Lazy loading all feature routes — no eagerly loaded feature modules',
        whyItMatters: 'Without lazy loading, Angular bundles the entire application into the initial chunk.',
        longRunImpact: 'Initial bundle size reduces 50–80% for large apps. Time to interactive improves directly.'
      },
      {
        id: 'ng-4', number: 4, severity: 'HIGH', group: 'must-have', topicId: 'angular',
        practice: 'Angular Signals for component and feature state',
        whyItMatters: 'Angular Signals (v16+, stable v17+) are the new reactive primitive. They integrate natively with change detection.',
        longRunImpact: 'Change detection overhead drops with Signals — the framework knows precisely which components depend on which signals.'
      },
      {
        id: 'ng-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'angular',
        practice: 'New control flow syntax — @if, @for, @switch (not *ngIf, *ngFor)',
        whyItMatters: 'The structural directives *ngIf, *ngFor, *ngSwitch are being deprecated. The new syntax is faster and has better type narrowing.',
        longRunImpact: 'Teams on deprecated directive syntax face a larger migration surface with every Angular version.'
      },
      {
        id: 'ng-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'angular',
        practice: 'Reactive Forms for all non-trivial forms',
        whyItMatters: 'Template-driven forms hide logic in templates, making them untestable without rendering the DOM.',
        longRunImpact: 'Form logic is fully unit-testable. Complex validation scenarios are manageable and debuggable.'
      },
      {
        id: 'ng-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'angular',
        practice: 'takeUntilDestroyed() for all RxJS subscriptions in components',
        whyItMatters: 'Manual unsubscription via ngOnDestroy + Subject/takeUntil is error-prone and frequently forgotten.',
        longRunImpact: 'Memory leaks from uncleaned subscriptions are systematically eliminated with one line.'
      },
      {
        id: 'ng-8', number: 8, severity: 'HIGH', group: 'must-have', topicId: 'angular',
        practice: 'inject() function over constructor injection in components and services',
        whyItMatters: 'inject() in the component body is the modern Angular DI pattern. It enables DI in utility functions.',
        longRunImpact: 'Simpler, shorter constructor signatures. Enables composition of DI-dependent logic.'
      },
      {
        id: 'ng-9', number: 9, severity: 'MEDIUM', group: 'must-have', topicId: 'angular',
        practice: 'NgOptimizedImage for all non-dynamic images',
        whyItMatters: 'Angular\'s built-in NgOptimizedImage automatically handles lazy loading, explicit size requirements, and format hints.',
        longRunImpact: 'LCP score improves with minimal effort. Missing width/height attributes are enforced by the directive.'
      },
      {
        id: 'ng-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'angular',
        practice: 'HTTP interceptors for auth, error handling, and logging — not in services',
        whyItMatters: 'Auth token attachment, global error handling, and request logging scattered across individual services creates duplication.',
        longRunImpact: 'Token refresh logic, error handling, and retry strategies are implemented once and apply everywhere.'
      },
      {
        id: 'ng-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'angular',
        practice: 'Signal-based inputs and outputs (@Input as signal) — Angular 17.1+',
        whyItMatters: 'Signal inputs allow derived computed state to automatically update when input values change, without ngOnChanges lifecycle hooks.',
        longRunImpact: 'Eliminates a common class of bug where ngOnChanges is forgotten or fires in the wrong order.'
      },
      {
        id: 'ng-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'angular',
        practice: '@defer for below-fold and interaction-triggered content',
        whyItMatters: '@defer is Angular\'s built-in mechanism for deferring template loading until a trigger condition.',
        longRunImpact: 'Initial load performance improves without manual lazy loading setup.'
      },
      {
        id: 'ng-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'angular',
        practice: 'Angular DevTools and profiler in development — measure before optimising',
        whyItMatters: 'Angular DevTools shows the change detection cycle, component tree, and signal dependency graph.',
        longRunImpact: 'Performance work is evidence-based. The highest-impact components are identified before writing any optimisation code.'
      },
      {
        id: 'ng-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'angular',
        practice: 'Functional guards and resolvers — not class-based',
        whyItMatters: 'Class-based guards and resolvers are verbose and require DI boilerplate. Functional guards are simpler.',
        longRunImpact: 'Router configuration is more readable. Functional guards are easier to compose and test in isolation.'
      },
      {
        id: 'ng-g5', number: 5, severity: 'MEDIUM', group: 'good-to-have', topicId: 'angular',
        practice: 'Typed forms — FormControl<T>, FormGroup<T> throughout',
        whyItMatters: 'Angular 14+ introduced strictly typed reactive forms. Untyped forms return any for .value and .valueChanges.',
        longRunImpact: 'Form values are type-safe end-to-end from form definition to submission handler.'
      }
    ]
  },
  {
    id: 'react',
    name: 'React-Specific Best Practices',
    shortName: 'React',
    description: 'React\'s flexibility is both its strength and its risk. Without clear patterns, teams diverge on state management, rendering strategy, and data fetching.',
    icon: 'atom',
    color: '#61dafb',
    tags: ['React 18+', 'Hooks', 'Server Components', 'React Query'],
    items: [
      {
        id: 'react-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'react',
        practice: 'Function components only — no class components in new code',
        whyItMatters: 'Class components are legacy. They cannot use hooks, concurrent features, or React Server Components.',
        longRunImpact: 'Codebase consistency. All modern React features are available only in function components.'
      },
      {
        id: 'react-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'react',
        practice: 'Server state with React Query or SWR — not Redux for API data',
        whyItMatters: 'Server state has fundamentally different requirements: caching, invalidation, background refresh, optimistic updates.',
        longRunImpact: 'Eliminates 40–60% of state management code in typical CRUD applications.'
      },
      {
        id: 'react-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'react',
        practice: 'Error boundaries at route and critical feature level',
        whyItMatters: 'Without error boundaries, a single uncaught render error unmounts the entire React tree and shows a blank screen.',
        longRunImpact: 'Partial failures degrade gracefully. Users see a meaningful error state rather than a blank page.'
      },
      {
        id: 'react-4', number: 4, severity: 'CRITICAL', group: 'must-have', topicId: 'react',
        practice: 'Explicit and correct dependency arrays in useEffect, useMemo, useCallback',
        whyItMatters: 'Missing dependencies cause stale closures. Incorrect dependencies cause infinite re-render loops.',
        longRunImpact: 'The react-hooks/exhaustive-deps lint rule catches these at write time.'
      },
      {
        id: 'react-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'react',
        practice: 'Custom hooks for all reusable stateful logic',
        whyItMatters: 'Logic mixing state, effects, and business rules spread inline across components is not reusable and not testable.',
        longRunImpact: 'Shared logic is updated in one place. Custom hooks can be tested with renderHook.'
      },
      {
        id: 'react-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'react',
        practice: 'State management choice explicitly documented and scoped',
        whyItMatters: 'Using Redux, Zustand, Jotai, Context, and React Query simultaneously without an explicit scoping policy creates chaos.',
        longRunImpact: 'New team members understand exactly where state lives and why. Debugging is predictable.'
      },
      {
        id: 'react-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'react',
        practice: 'Colocation of state — state lives as close as possible to its consumers',
        whyItMatters: 'State lifted too high causes unnecessary re-renders across large subtrees and prop drilling.',
        longRunImpact: 'Renders are scoped to the components that actually depend on state. Component interfaces are cleaner.'
      },
      {
        id: 'react-8', number: 8, severity: 'HIGH', group: 'must-have', topicId: 'react',
        practice: 'React.Suspense + React.lazy() for all route-level code splitting',
        whyItMatters: 'React.lazy() with Suspense is the idiomatic pattern for async component loading.',
        longRunImpact: 'Initial bundle size reduction with clean, declarative fallback UI.'
      },
      {
        id: 'react-9', number: 9, severity: 'MEDIUM', group: 'must-have', topicId: 'react',
        practice: 'Memoisation (React.memo, useMemo, useCallback) only with profiler evidence',
        whyItMatters: 'Premature memoisation adds code complexity, memory overhead, and reference equality bugs for zero benefit.',
        longRunImpact: 'Codebase stays readable. Memoisation is applied where it has demonstrated impact.'
      },
      {
        id: 'react-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'react',
        practice: 'Strict Mode enabled in development (not removed to suppress warnings)',
        whyItMatters: 'React Strict Mode deliberately double-invokes renders and effects to expose impure renders and incorrect effect cleanup.',
        longRunImpact: 'Required preparation for React 18+ concurrent features and Server Components.'
      },
      {
        id: 'react-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'react',
        practice: 'React Server Components (RSC) for data-fetching components where applicable',
        whyItMatters: 'RSC components render on the server, have zero client-side JS weight, and can access data sources directly.',
        longRunImpact: 'Data-fetching components contribute zero bytes to client bundles. Initial page load performance improves significantly.'
      },
      {
        id: 'react-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'react',
        practice: 'Avoid prop drilling > 2 levels — use context or state management',
        whyItMatters: 'Prop drilling through 3+ levels creates tight coupling, makes refactoring expensive.',
        longRunImpact: 'Component interfaces reflect actual data dependencies.'
      },
      {
        id: 'react-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'react',
        practice: 'useReducer for complex multi-value local state (not multiple useState)',
        whyItMatters: 'Multiple useState hooks for related state lead to inconsistent updates — impossible intermediate states.',
        longRunImpact: 'Impossible UI states are structurally prevented. State transitions are debuggable as explicit actions.'
      },
      {
        id: 'react-g4', number: 4, severity: 'MEDIUM', group: 'good-to-have', topicId: 'react',
        practice: 'Key prop stability — use entity IDs, never array index in dynamic lists',
        whyItMatters: 'Array index as key causes React to reuse DOM nodes incorrectly when list order changes.',
        longRunImpact: 'List reordering, filtering, and deletion behave correctly.'
      },
      {
        id: 'react-g5', number: 5, severity: 'MEDIUM', group: 'good-to-have', topicId: 'react',
        practice: 'Avoid anonymous functions and objects as props in hot render paths',
        whyItMatters: 'New function and object references created inline on every render defeat React.memo.',
        longRunImpact: 'React.memo becomes effective when it is used. Render profiling shows accurate results.'
      }
    ]
  },
  {
    id: 'nfr',
    name: 'Non-Functional Requirements',
    shortName: 'NFRs',
    description: 'NFRs are the qualities a system must have — reliability, observability, scalability, and internationalisation. Their absence causes 3am production incidents and failed audits.',
    icon: 'settings',
    color: '#06b6d4',
    tags: ['Observability', 'i18n', 'Feature Flags', 'Error Handling'],
    items: [
      {
        id: 'nfr-1', number: 1, severity: 'CRITICAL', group: 'must-have', topicId: 'nfr',
        practice: 'Structured error boundary strategy with user-facing fallback UI',
        whyItMatters: 'Unhandled render errors silently unmount components. Without error boundaries, one bad API response can render the entire app blank.',
        longRunImpact: 'Failures are contained to the smallest affected surface. Users see a meaningful recovery message.'
      },
      {
        id: 'nfr-2', number: 2, severity: 'CRITICAL', group: 'must-have', topicId: 'nfr',
        practice: 'Centralised error monitoring integrated and alerting (Sentry / Datadog RUM)',
        whyItMatters: 'Console errors visible only in a developer\'s browser are invisible in production.',
        longRunImpact: 'Regressions are caught within minutes of deployment via alert thresholds.'
      },
      {
        id: 'nfr-3', number: 3, severity: 'CRITICAL', group: 'must-have', topicId: 'nfr',
        practice: 'Source maps generated and uploaded to error monitoring tool (not served publicly)',
        whyItMatters: 'Minified production JavaScript produces stack traces with no useful information.',
        longRunImpact: 'Stack traces in Sentry/Datadog point to the exact source line. Mean time to diagnose drops from hours to minutes.'
      },
      {
        id: 'nfr-4', number: 4, severity: 'CRITICAL', group: 'must-have', topicId: 'nfr',
        practice: 'Environment configuration managed via environment variables — no hardcoded URLs',
        whyItMatters: 'Hardcoded API base URLs or feature flags require code changes to promote between environments.',
        longRunImpact: 'Promotions from dev to staging to production require only config changes.'
      },
      {
        id: 'nfr-5', number: 5, severity: 'HIGH', group: 'must-have', topicId: 'nfr',
        practice: 'Internationalisation (i18n) framework in place from the start — no hardcoded strings',
        whyItMatters: 'Retrofitting i18n into a codebase with thousands of hardcoded English strings is a multi-sprint effort.',
        longRunImpact: 'Adding a new locale is a translation task, not a code change.'
      },
      {
        id: 'nfr-6', number: 6, severity: 'HIGH', group: 'must-have', topicId: 'nfr',
        practice: 'Feature flag system in place — no deploy required to toggle features',
        whyItMatters: 'Shipping features that are always on couples deployment to feature release.',
        longRunImpact: 'Canary releases, A/B testing, instant kill switches for problematic features are all possible.'
      },
      {
        id: 'nfr-7', number: 7, severity: 'HIGH', group: 'must-have', topicId: 'nfr',
        practice: 'Real User Monitoring (RUM) — Core Web Vitals tracked in production per route',
        whyItMatters: 'Lighthouse scores measure synthetic lab performance. Real users often experience significantly different performance.',
        longRunImpact: 'Performance regressions are caught by alert thresholds on p75/p95 CWV metrics.'
      },
      {
        id: 'nfr-8', number: 8, severity: 'HIGH', group: 'must-have', topicId: 'nfr',
        practice: 'Graceful degradation — app remains functional when optional services are unavailable',
        whyItMatters: 'Third-party services fail independently of the core application. Without graceful degradation, a third-party script can break core user flows.',
        longRunImpact: 'Core application functionality is resilient to third-party outages.'
      },
      {
        id: 'nfr-9', number: 9, severity: 'HIGH', group: 'must-have', topicId: 'nfr',
        practice: 'Loading and empty states explicitly designed for every async operation',
        whyItMatters: 'Components that render nothing while data is loading produce confusing and broken UIs.',
        longRunImpact: 'User experience during slow or failed network conditions is intentional rather than accidental.'
      },
      {
        id: 'nfr-10', number: 10, severity: 'MEDIUM', group: 'must-have', topicId: 'nfr',
        practice: 'Logging strategy — structured logs with correlation IDs, not ad-hoc console statements',
        whyItMatters: 'Ad-hoc console.log statements provide no structure, no searchability, and no correlation between frontend events and backend traces.',
        longRunImpact: 'Frontend events can be correlated with backend traces in distributed tracing tools.'
      },
      {
        id: 'nfr-11', number: 11, severity: 'MEDIUM', group: 'must-have', topicId: 'nfr',
        practice: 'API rate limiting and retry strategy — exponential backoff with jitter',
        whyItMatters: 'Frontend apps that retry failed requests immediately amplify backend pressure at exactly the worst moment.',
        longRunImpact: 'Cascading failures where frontend hammering prevents backend recovery are avoided.'
      },
      {
        id: 'nfr-12', number: 12, severity: 'MEDIUM', group: 'must-have', topicId: 'nfr',
        practice: 'Offline / degraded network handling — meaningful feedback and graceful recovery',
        whyItMatters: 'SPAs that make no provision for offline or poor connectivity show blank screens or infinite spinners.',
        longRunImpact: 'Users receive clear feedback when connectivity is lost and automatic recovery when it returns.'
      },
      {
        id: 'nfr-g1', number: 1, severity: 'HIGH', group: 'good-to-have', topicId: 'nfr',
        practice: 'Automated smoke tests against production after every deployment',
        whyItMatters: 'CI tests run against local or staging. A post-deployment smoke test catches environment-specific misconfigurations.',
        longRunImpact: 'Production regressions from deployment configuration errors are caught within minutes.'
      },
      {
        id: 'nfr-g2', number: 2, severity: 'HIGH', group: 'good-to-have', topicId: 'nfr',
        practice: 'Content Security Policy violation reporting endpoint',
        whyItMatters: 'A CSP prevents XSS exploitation but does not alert on attempted attacks or misconfigured policies.',
        longRunImpact: 'Security incidents are visible before they succeed. CSP policy refinement is data-driven.'
      },
      {
        id: 'nfr-g3', number: 3, severity: 'HIGH', group: 'good-to-have', topicId: 'nfr',
        practice: 'Dependency licence audit — no GPL or unknown licences in production bundles',
        whyItMatters: 'GPL-licensed packages in a proprietary product require open-sourcing the entire product under GPL.',
        longRunImpact: 'Legal and IP risk from inadvertent open-source licence violations is eliminated.'
      },
      {
        id: 'nfr-g4', number: 4, severity: 'HIGH', group: 'good-to-have', topicId: 'nfr',
        practice: 'Accessibility statement published and compliance process documented',
        whyItMatters: 'WCAG compliance is not a one-time fix — it requires a process with regular audits and a feedback mechanism.',
        longRunImpact: 'Regulatory compliance is demonstrable, not just claimed.'
      },
      {
        id: 'nfr-g5', number: 5, severity: 'HIGH', group: 'good-to-have', topicId: 'nfr',
        practice: 'GDPR / privacy compliance — cookie consent, data subject rights, retention limits',
        whyItMatters: 'Client-side tracking without informed consent is a regulatory violation with significant financial penalties.',
        longRunImpact: 'Regulatory penalties are avoided. User trust is maintained through transparent data handling.'
      }
    ]
  }
];
