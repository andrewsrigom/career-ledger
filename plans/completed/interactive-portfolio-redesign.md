# Interactive portfolio redesign

## Purpose

Turn the Career Ledger public site into a distinctive, interactive engineering portfolio that demonstrates frontend architecture while preserving the private-first publication workflow. The local candidate preview must show reviewable records and activity classifications without making them public.

## Context

The repository currently uses a dependency-free Node.js renderer, has English and PT-BR routes, and deploys a static `dist/` directory to GitHub Pages. The existing ledger, validation, localization, privacy audit, candidate-preview, and URL modules already cover the core data and publication boundaries. The worktree contains ongoing ledger-model and portfolio-content changes that must be preserved.

## Privacy impact

The public source remains `content/public/` only. Astro receives an ephemeral, already-validated build dataset and cannot read local repositories or candidate directories directly. Candidate builds continue to target `.career/reports/publication-preview/`, include `noindex`, and fail privacy audits. Project-media discovery produces a private review manifest only; no repository image becomes a public asset without explicit owner approval.

## Plan

1. Introduce Astro, TypeScript, GSAP, Three.js, and browser checks while retaining the Node ledger engine.
2. Rebuild all HTML routes with accessible Astro layouts and editorial components, preserving JSON, RSS, sitemap, manifest, robots, 404, base-path, and localization behavior.
3. Add progressive motion, a lazy Three.js architecture scene, project previews, the engineering landscape, and the experience timeline.
4. Extend candidates with optional reviewed presentation metadata and recorded activity mix, then update the private media-review workflow.
5. Change GitHub Pages to manual deployment, update architecture documentation and repository rules, and complete privacy, build, browser, mobile, reduced-motion, and no-JavaScript verification.

## Progress

- [x] Baseline audited; `npm run check` passes 34 tests.
- [x] Worktree preserved on `portfolio-interactive-redesign`.
- [x] Astro site and data bridge implemented, with a typed presentation contract and staged, audited output.
- [x] Interactive homepage implemented with mobile/SVG/no-JavaScript/reduced-motion fallbacks.
- [x] Schemas, private media inventory, ADR, repository rules, and manual deployment/rollback workflow updated.
- [x] 2026-08-27: Engineering validation and visual review finished; owner content/image approval remains a separate next step.

## Decisions

- Astro is the static MPA framework; React and a client router are intentionally excluded.
- GSAP is limited to progressive motion and Three.js to the hero signature visual.
- Native cross-document view transitions preserve normal navigation.
- Unapproved screenshots are replaced by deterministic abstract diagrams, never fake interfaces.
- The existing system-font editorial identity and offline runtime remain.

## Surprises

- The repository already contains substantial uncommitted work for localization, candidate preview, resume projections, domain classification, and a first homepage rework. This implementation builds on those changes rather than replacing them.
- Parallel Astro builds originally shared an intermediate directory when output was outside the workspace. Each build now has an isolated in-workspace staging directory and copies only a verified result to its requested destination.
- Three.js contains a long hexadecimal lookup table resembling private IPv4 sequences. A token-boundary correction removes that false positive while tests continue to detect real private IP addresses.
- Narrow-screen checks found a hero-label overflow at 320 px; the smallest layout now uses one label column. Accessible link names also now retain all visible label text.

## Validation

```bash
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
BASE_PATH=/test-repository npm run build
```

Inspect English and PT-BR home pages, timeline, project, entry, area, about, mobile, keyboard, reduced-motion, no-JavaScript, and WebGL fallback states. Inspect `dist/` for private data before any deployment.

Final results:

- `npm run check`: 42 Node tests passed, Astro reported zero errors/warnings/hints, public build and link verification passed.
- All 10 browser scenarios passed for the local candidate preview and for public builds under both `/career-ledger` and `/test-repository`.
- The public build contains only the approved entry/project; the private preview contains 27 candidates across 14 projects and the 91-activity aggregate. No candidate was promoted.
- Explicit generated-output audit with local privacy rules returned zero findings. Git tracks no generated or private output.
- JavaScript: 46.7 KB gzip combined non-architecture chunks; 130.4 KB gzip lazy architecture chunk, below 90/180 KB limits.
- Lighthouse 13.4.1, local Chromium: desktop performance 100, accessibility 100, LCP approximately 0.50 s, CLS 0; simulated mobile performance 99, accessibility 100, LCP approximately 1.96 s, CLS 0. Reports remain in ignored `.career/reports/`. These are lab measurements, not field guarantees.
- The remaining Lighthouse back/forward-cache note is caused by the intentional `Cache-Control: no-store` on the private local review server; it is not a deployed-site result.

## Outcome

Implementation is complete on `portfolio-interactive-redesign`. The live website was not changed: no commit, push, merge, candidate approval, or deploy was performed. The local review server is available on loopback port 4322.

Next, the owner reviews text, image choices, and recorded activity mix. The private follow-up checklist preserves the requested project list and ecosystem relationships without publishing those internal references. Missing approved imagery intentionally remains an abstract diagram. Publication still requires explicit owner approval, an authorized merge, and manual workflow confirmation.
