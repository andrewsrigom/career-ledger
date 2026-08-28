# Recognizable project technologies

## Purpose

Make homepage project rows easy to scan for recruiters and engineers: show recorded technologies and a concise AI label, with readable contrast and comfortable spacing.

## Context

`ProjectIndex.astro` currently displays four taxonomy areas beneath each project link. The generic `.tag-list` rule overrides the row-specific margins, leaving tags against the bottom divider. Technologies already exist in validated project records. Existing staged and unstaged redesign work must be preserved.

## Privacy impact

Presentation only. Read the existing validated dataset; do not change project records, taxonomy, publication approval, images, or public/private build boundaries. Do not infer missing technologies.

## Plan

1. Replace homepage area tags with recorded technologies and an AI label derived from the existing area slug.
2. Position the stack below the summary, using solid high-contrast styling and responsive wrapping.
3. Verify bilingual rendering, missing-stack behavior, keyboard/no-JS/mobile fallbacks, base paths, and the complete checks.

## Progress

- [x] 2026-08-27: Inspected live preview and confirmed the margin override (tags end one pixel above the divider).
- [x] 2026-08-27: Implemented bilingual stack presentation, spacing, high-contrast styling, and build/browser/contrast regressions.
- [x] 2026-08-27: `npm run check` passed: 58 Node tests, 44 Astro files without diagnostics, privacy audit, links, and bundle budgets.
- [x] 2026-08-27: Public and private-preview browser suites passed (21 tests each); six targeted browser checks and a build passed under the alternate base path.
- [x] 2026-08-27: Inspected desktop and mobile screenshots, regenerated the root-path preview, and confirmed the updated tags in the live external browser.

## Decisions

- Show all recorded technology names, preserving their order rather than inventing an importance ranking or hiding a framework.
- Use the canonical `ai-engineering` slug to support equivalent AI / IA labeling in both languages.
- Omit an empty stack; do not guess technologies for projects that have not recorded them.
- Keep detailed taxonomy on project pages and preserve the existing project preview interaction.

## Surprises

- The perceived stack was actually a list of broad taxonomy areas.
- Equal-specificity CSS ordering discarded both the intended indentation and bottom margin.
- The running preview needed an explicit rebuild to pick up the source edits. Browser suites were run sequentially after an initial overlapping launch was rejected because their shared test port was occupied.

## Validation

Passed in WSL:

```bash
npm run check
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
BASE_PATH=/test-repository npm run build
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser -- --grep 'project stacks|project technology tags|project index|core reading|secondary pages|timeline filters'
SITE_URL=http://127.0.0.1:4322 BASE_PATH= npm run career:preview
npm run build
git diff --check
```

Visual checks covered the long professional-project stacks at 1440 and 390 px, EN/PT-BR, and the live root-path preview. Geometry tests covered 1440, 820, 390, and 320 px, at least 24 px clearance above the divider, at least 16 px below the summary, wrapping, and opaque labels. Static fallbacks retain the stack without JavaScript and with reduced motion. Existing keyboard previews, WebGL fallback, project/entry/area/timeline routes, and runtime-origin tests remain passing. Public output contains only the approved project, with no preview metadata or review assets. Bundle sizes are 47.7 KB main and 131.2 KB lazy architecture, gzip.

## Outcome

Completed. Homepage projects now show recognizable technology names beside their summary, with AI / IA highlighted only where the existing taxonomy records it. All recorded technologies remain visible; projects without a recorded stack receive no guessed tools. Detailed areas and canonical records are unchanged. Both local outputs were restored to their root base paths after testing. Existing worktree and staged changes were preserved. No commit, push, merge, or publication was performed.
