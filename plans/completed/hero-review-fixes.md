# Hero and project-preview regression fixes

## Purpose

Restore the visible desktop headline, correctly positioned project previews, readable architecture labels, and an event-driven hero scene. Hide the architecture layer ribbon on mobile, where the owner considers it redundant beside the static illustration.

## Context

The visual-polish work is already staged on `portfolio-interactive-redesign`. Preserve that index and its design changes. The review reproduced clipped headline words, a transformed ancestor changing fixed-preview coordinates, low-opacity layer text, and continuous WebGL/GSAP animation. Existing tests checked DOM text and opacity but missed these visual failures.

Relevant files: `src/scripts/motion.ts`, `src/scripts/architecture-scene.ts`, `src/styles/global.css`, `tests/browser/portfolio.spec.ts`, and `tests/site.test.ts`.

## Privacy impact

Presentation and tests only. No public-content promotion, private-record changes, new dependencies, commit, push, or deployment. Preview remains loopback-only and separate from public output.

## Plan

1. Add regression checks for actual headline geometry, viewport-contained previews, readable labels, mobile ribbon removal, and idle WebGL draw calls.
2. Correct the four review findings while preserving the visual composition; replace the automatic layer cycle with desktop scroll progression and finite interaction updates.
3. Run the complete checks, both Pages base paths, candidate preview tests, and a visual check in the owner's external Chrome browser.

## Progress

- 2026-08-27: Confirmed the nine staged files and unchanged branch; no unrelated edits will be staged or discarded.
- 2026-08-27: Owner additionally requested removing the redundant cycling layer ribbon on mobile.
- [x] Regression tests reproduce the failures: headline clipping, preview bounds, mobile ribbon, static-label opacity, and idle WebGL drawing all failed before corrections; the existing motion-load fallback remained green.
- [x] Corrections implemented; strict type-check and both contrast tests passed.
- [x] Automated and external-browser verification complete.

## Decisions

- Keep the current dark hero composition; animate headline transforms explicitly.
- Never transform the parent of viewport-positioned project previews.
- Use opaque, contrast-checked ribbon text instead of dimming whole layers.
- No idle rotation or timed layer cycling. Render finite changes only while visible.
- Hide the mobile ribbon rather than animate a decorative static fallback.

## Surprises

- The previous headline and preview tests passed although the title was completely clipped and the preview coordinates were wrong.
- The external Chrome mobile check exposed a small horizontal overflow: the viewport-based shell ignored the scrollbar gutter and let the landscape SVG extend past the page. The narrow shell now uses its containing block, with a stable-gutter regression check.
- Per-frame interpolation took too long under software WebGL; layer transitions now use a 360ms time bound rather than a frame-count-dependent decay.

## Validation

```bash
npm run check
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
```

- `npm run check`: public validation and privacy audit passed; 49 Node tests passed; TypeScript and Astro checks reported no errors, warnings, or hints.
- Browser suites: all 16 tests passed without skips in each of the two Pages base paths and the local candidate preview (48 executions).
- External Chrome: visually verified the desktop headline and viewport-contained project preview; verified EN/PT-BR mobile titles, the static illustration, hidden layer ribbon, and no horizontal overflow. Restored the external viewport afterward.
- Public build: 60 files; 47.7 KB gzip main JavaScript and 131.2 KB lazy architecture chunk. Restored the default root build after the alternate-base tests.
- Both staged and unstaged diffs passed whitespace checks. The nine pre-existing staged changes, branch, and HEAD remain unchanged; generated output and private files remain untracked/ignored.

## Outcome

All four review findings and the requested mobile simplification are fixed, with regression coverage for real visibility, preview geometry, contrast, fallbacks, and idle rendering. The local preview remains available for owner review. No public content, dependencies, commit, push, merge, or deployment changed.
