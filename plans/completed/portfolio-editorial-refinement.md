# Portfolio editorial refinement

## Purpose

Refine the existing portfolio after the approved hero: curate selected work, keep visual evidence visible at rest, and clarify the progression from projects to systems, experience, principles, and tools.

## Context

The static Astro homepage composes the existing home components. GSAP supplies once-only reveals and SVG path drawing; inspection of the live preview and `motion.ts` found no pins or scrubbed sections. Section headings currently have overlapping parent/child reveals. Fourteen featured projects receive equal full rows in the private preview, and fixed pointer-following images can cover results. The validated public dataset currently has one project and no resume.

Relevant files: `src/components/home/`, `src/lib/portfolio-copy.ts`, `src/scripts/motion.ts`, `src/scripts/site.ts`, `src/styles/global.css`, and existing browser tests. The working tree includes substantial owner work; preserve the index and unrelated changes. No branch, commit, or publication is requested.

## Privacy impact

Presentation only. Keep canonical dataset ordering, featured flags, approved public inputs, the isolated private preview and existing image approvals. Do not change schemas, candidates, approval metadata, audit rules, or public claims. Existing image captions must distinguish reference captures from contributed implementation. Missing data is omitted, never inferred as achievement or ownership.

## Plan

1. Inspect the live scroll experience and existing contracts.
2. Present up to six featured records in canonical order, with all remaining projects in a compact archive. Add visible evidence, bounded stack summaries, and recorded-area layer signatures.
3. Coordinate section, project, landscape, and career GSAP timelines; preserve static/mobile/reduced-motion reading and the approved hero.
4. Verify actual scrolling, anchors, history, refresh, resize, touch, and fallback states; run check and browser suites in public, preview, and base-path modes.
5. Document behavior and complete this plan.

## Progress

- [x] 2026-08-27: Read owner feedback, repository skill/contracts/components, and inspected live desktop project/landscape transitions.
- [x] 2026-08-27: Six selected records plus a ten-record archive in the preview; public output adapts to its single approved project. Inline images/captions, actual roles/contributions/results, six-technology summaries, and recorded-area signatures implemented.
- [x] 2026-08-27: Coordinated composition timelines, safe refresh, immediate focus visibility, and final-state restoration implemented. Inspected all selected projects, archive, landscape, experience, principles, and tools in the live browser.
- [x] 2026-08-27: `npm run check` passed (60 Node tests, strict TypeScript/Astro checks, privacy audit, verified build). All 27 browser scenarios passed in public, private preview, `/career-ledger`, and `/test-repository` modes after the fixes. Keyboard focus also passed 20 consecutive runs.

## Decisions

- Use the first six existing featured records (or the canonical collection if none are featured). Preserve order and show every remaining record in the archive. This is a presentation limit, not a new content priority.
- No flagship: the data has no distinct flagship signal.
- Keep actual supplied/reviewed images and their captions. Abstract fallbacks describe recorded layers, not invented product architecture.
- Preserve the approved hero, Three.js behavior, typography, palette, source principles, and toolbox grouping.
- Do not remove spacing based on full-page captures. Evaluate live pacing and eliminate overlapping reveal ownership.

## Surprises

- No ScrollTrigger pin spacers exist. The screenshot concern is primarily untriggered reveals, not pinned layout.
- The previous fixed preview can overlap the result text; inline evidence removes both occlusion and continuous pointer-position work.
- A forced ScrollTrigger refresh interrupted native smooth anchor navigation. The direct-anchor regression reproduced it; safe refresh waits for scrolling to settle.
- Keyboard focus could precede the lazy motion import. Focused compositions are now never hidden at initialization, and focus finishes active reveals immediately.
- Chromium can report its native `AbortError: Transition was skipped` during rapid MPA navigation. The regression test recognizes only that exact optional browser-transition abort; all application errors and GSAP warnings still fail, and content/navigation states are asserted.

## Validation

Passed on the final implementation:

```bash
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser -- --grep "project index works" --repeat-each=20
```

Manual review covered the real preview at 1440, 1280, 768, and 390 px: every selected project, the archive, landscape, experience, principles, tools, and footer. Automated geometry checks also cover 1920 and 320 px, EN/PT-BR, no JavaScript, reduced motion, WebGL failure, and touch. Slow/fast/reverse scroll, direct anchors, reload at a later project, history return, focus, image dimensions/loading, expanded details, and responsive remounts were verified. No pin spacers exist.

Final build budgets: 48.5 KB gzip for main JavaScript; 130.8 KB for the unchanged lazy architecture chunk. Instrumented WebGL idle/offscreen rendering tests pass. No Lighthouse score or physical-device performance measurement is claimed.

Resting desktop/mobile review captures are saved under `.career/reports/portfolio-editorial-refinement/`. They contain private-preview records and are not public assets. Public output was checked to contain one approved project/entry, no resume, no preview flag, no review media, and only the favicon outside generated bundles.

## Outcome

The existing editorial portfolio is refined without reworking the approved hero. The current preview has six selected projects and ten compact archive rows, preserving canonical order. Evidence/captions are visible at rest; roles, contributions, results, layer signatures, and bounded stacks use existing records. GSAP has a single owner per composition, safe refresh, and resilient focus/restoration behavior. Experience keeps its editorial rail and exposes recorded outcomes without expanding every contribution list.

The hero/Three.js implementation, public/private boundary, approval workflow, complete project detail data, actual principles, and toolbox grouping remain intact. No flagship, unsupported metrics, screenshots, architecture, dependency, or publication was invented. Existing staged and unrelated working-tree changes were preserved.

No remaining functional failures were found in the tested scenarios. Reference images remain labeled as references, missing evidence remains explicitly abstract, and candidate/image publication still requires the owner's separate approval. Physical-device performance profiling remains outside this verification.
