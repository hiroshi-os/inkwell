# Web accessibility and responsive quality pass

Measured locally on 2026-11-04. This is developer-led accessibility engineering and browser verification, **not user research or a WCAG certification**.

## Changes grounded in baseline findings

- Linked visible labels to login, registration, story, chapter and profile controls. Added registration requirements/autocomplete and explicit search semantics.
- Darkened muted text after axe measured 3.78:1 contrast in the demo panel. Added visible focus styling, a keyboard skip link, named navigation and current-page/filter states.
- Added announced errors, loading and save feedback, and guarded editor/profile actions against silent promise failures.
- Kept the existing reading-room design and basic breakpoints. Fixed long unbroken titles, names and chapter text that expanded a 320px viewport to 2,957px (story) and 10,371px (reader). Both cases now fit at 320px. Added narrow-screen navigation wrapping and reduced-motion behavior.
- Search preserves the latest result when requests complete out of order, and distinguishes a valid empty search from a load failure.

## Actual local checks

Playwright + axe tested browse, login, registration, story, reader, author desk, editor and profile at **320, 390, 768 and 1280 CSS pixels**. Authenticated pages use the real seeded Go API, not mocked responses. The test database is isolated under `web/.test-artifacts/`; normal API data and the normal Next build directory are not reused.

| Check | Before | After |
| --- | ---: | ---: |
| Targeted axe rule/viewport violations across 32 combinations | 32 | 0 |
| Affected element/viewport instances | 76 | 0 |
| Ordinary page/viewport combinations with horizontal overflow | 0 | 0 |
| Long-content story width at 320px | 2,957px | 320px |
| Long-content reader width at 320px | 10,371px | 320px |

The 32 violation instances are repeated rule/viewport observations, not 32 unique accessibility defects. There are still **36 incomplete rule/viewport observations** requiring manual review, including gradient-background contrast cases. Automated zero violations does not settle those checks.

The final **38 tests passed with zero skips**: 32 screen/viewport cases plus keyboard bypass/focus, long-content reflow, search/filter/no-results, login-error recovery and keyboard submission, chapter creation/save/reload, and registration/profile persistence. A further axe scan runs with the chapter editor open. These verify browser → Go API → SQLite → API → rendered state. Source maps and synthetic credentials in local traces are test-only; raw traces/databases are ignored.

TypeScript checking passed. See [machine-readable measurements](ui-quality-results.json); raw local scans and screenshots are under `web/.test-artifacts/before` and `after`. Selected actual screenshots: [mobile before](ui-quality/browse-before-320.png), [mobile after](ui-quality/browse-after-320.png), [desktop editor](ui-quality/editor-after-1280.png).

## Reproduce

```sh
cd web
npm ci
npx playwright install chromium
npm run typecheck
npm run test:ui
```

Go must be installed. Tests reserve ports 13000 and 18080 and refuse to reuse an existing server. They launch the Go API and Next test server and stop them after the suite. The checked-in GitHub Actions workflow installs Chromium/Linux dependencies and uploads the resulting scans and test report. A diagnostic baseline uses `AUDIT_BASELINE=1`; its collection assertions are intentionally disabled and must not be cited as passing accessibility checks. `node scripts/summarize-audit.mjs` requires both saved baseline files and a complete final 38-test result.

## Human work still pending

Use [the moderated study protocol](usability-study.md) and [blank observation sheet](usability-observations.csv). No participant results have been invented. Real screen-reader testing, manual review of incomplete axe findings, actual browser zoom, inclusive usability testing and browser/device coverage remain future work. The tests do not certify Section 508/WCAG compliance.
