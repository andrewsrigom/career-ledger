# Refine the existing interface-to-infrastructure hero

## Purpose

Preserve the dark editorial hero while improving headline hierarchy, network readability, meaningful layer selection, and mobile composition.

## Context

The current branch is `portfolio-interactive-redesign`, with pre-existing staged and unstaged work. Preserve it without staging, committing, or changing branches. `Hero.astro` owns the content; `ArchitectureScene.astro` supplies the static SVG; `architecture-scene.ts` lazily enhances eligible desktops with Three.js. `motion.ts` currently owns hover/scroll selection, making it unavailable with reduced motion. `global.css` contains the existing serif/monospace design tokens. GSAP and Three.js are already installed.

## Privacy impact

No candidate promotion, private-data access from public generation, approval changes, or deployment. The owner explicitly supplied the replacement profile sentence, including “10+ years”; update that approved profile copy and its Portuguese translation only. The editorial public status uses the validated dataset date, never the build clock. Draft mode retains its warning and noindex protections.

## Plan

1. Inspect current markup, animation, tokens, responsive rules, and desktop preview.
2. Refine the existing hero, grouped static/WebGL layers, native selection/scroll controller, header, and dual-mode status bar.
3. Extend existing tests, inspect desktop/mobile/Portuguese/fallback states, run the full validation and base-path browser harness, and document results.

## Progress

- 2026-08-27: Inspected the current desktop preview, source, previous review fixes, and privacy boundaries.
- 2026-08-27: Confirmed a duplicated SVG/WebGL stack, oversized network nodes, and non-focusable layer labels. Existing mobile rules hide the layer model; the new owner request supersedes that earlier behavior.
- 2026-08-27: Implemented the requested copy, three-line headline, measured soft masks, grouped SVG/WebGL selection, native layer controls, mobile legend, header numbering, and deterministic public/draft status modes.
- 2026-08-27: First full check passed: 58 Node tests, strict checks, privacy audit, and build. Browser review caught a sticky-header overlap and a Portuguese line wrap; corrected both while preserving headline wording.
- 2026-08-27: Full public, private-preview, and both Pages-base browser suites passed (26 tests per configuration, no skips). Final public rerun also covers 1920px headlines and fully visible keyboard focus in a short mobile viewport.
- 2026-08-27: Final `npm run career:audit` and `npm run check` passed: 58 Node tests, zero TypeScript/Astro errors/warnings/hints, and successful public build.
- [x] Implementation, verification, documentation, and visual review complete.

## Decisions

- Keep Astro, system fonts, the current abstract stack/network, and existing dependencies.
- Use soft CSS opacity masks, not a shader or opaque text panel. Do not add decorative gradients.
- Move semantic layer interactions out of the optional GSAP bundle so mobile and reduced-motion visitors retain controls.
- Keep all descriptions in HTML and render changes only in response to input; no timed cycles or continuous animation.
- Portuguese desktop typography uses a slightly smaller scale to preserve its longer first line. Mobile uses intentional wrapping, full descriptions, and 44px minimum targets.

## Surprises

- Pre-existing work includes staged changes to the same hero files. Only add the requested refinements on top.
- Existing motion listener cleanup needed completing so reduced-motion and viewport changes do not leave magnetic navigation or cursor handlers active.

## Validation

```bash
npm run career:audit
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

- All commands passed. The final standard browser run passed all 26 tests, including the 1920/1440/1280/1024/768/390/320px bilingual geometry matrix and mobile keyboard focus visibility. Preview and both base-path runs also passed all 26 tests without skips.
- Personally inspected draft EN/PT mobile, laptop and desktop views, the wide desktop and tablet compositions, scroll progression, and manual layer selection in the in-app browser. Inspected public-mode home, timeline, entry, project, and area pages.
- Verified reduced motion, touch, keyboard, no JavaScript, motion-chunk failure, WebGL failure, live preference/viewport changes, and finite/idle/offscreen WebGL rendering through the browser harness.
- Public output remains 60 files, with one approved project and entry, no preview flag, review media, or private activity mix. The only copied non-bundle asset is the favicon. Public content and generated-output audits remain intact.
- JavaScript gzip: 48.3 KB main / 130.8 KB lazy architecture, within the existing 90/180 KB budgets. No continuous rendering or timed layer cycling. No Lighthouse or field-performance scores are claimed.
- Both staged and unstaged whitespace checks passed. No dependencies, candidate approvals, commits, branches, or deployment changed. Pre-existing staged and concurrent work remains intact.

## Outcome

The existing hero now has a dominant, deliberately wrapped headline, softer text/network overlap, smaller nodes, and coherent Interface → Product → Systems → Infrastructure interaction. The full layer model remains readable on mobile and without enhancement. Requested copy, editorial CTA wording, compact numbered navigation, and deterministic draft/public status modes are in place. No candidate was promoted or published; the existing local draft preview remains available for owner review.
