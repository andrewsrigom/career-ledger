# Project stack charts and direct captions

## Purpose

Remove defensive authorship/review prose from the visible portfolio, replace the small four-node project signature with a readable Backend / Frontend / DevOps chart, and prioritize Node.js, Python, TypeScript, Next.js, React in technology lists.

## Context

The existing Astro page, hero, GSAP, and Three.js composition stay intact. ProjectIndex currently shows four small layer nodes, source-order technology chips, and captions from the private media manifest. ProjectGallery repeats those captions. Toolbox currently starts with Languages and Interface. None of the current project candidates has an activityMix; portfolio-wide activity percentages cannot stand in for project percentages.

## Privacy impact

Presentation, a pure private projection helper, and owner-requested private candidate/media wording change. No publication status, approval, provenance, source URL, privacy rule, schema, or public source is changed. Project charts read the existing optional activityMix. A private preparation script uses reviewed project scopes to calculate aggregate work percentages and writes only those percentages and the sample to private candidates. Canonical activities, source IDs, and derivation reports remain private; the public build never reads or calculates from them.

## Plan

1. Remove the visible authorship/review caveats, retaining useful descriptive captions in both languages.
2. Add a static recorded-work distribution chart and a shared stable technology ordering; preserve hero layers and abstract fallback plates.
3. Update existing unit/browser checks, inspect both locales and mobile, run the full checks and non-root build, and document the result.

## Progress

- [x] 2026-08-27: Inspected source, caption occurrences, and absence of project-level activity mixes.
- [x] 2026-08-27: Replaced the small signature with labeled technology-count bars, ordered stacks and the toolbox, and removed visible defensive caption/description prose in EN/PT-BR. Preserved the activity-mix basis using a concise positive weighting explanation.
- [x] 2026-08-27: Owner clarified the chart must describe their work, not the number of tools. Removed the technology-count chart. Prepared focused work mixes for four selected projects using 49 qualifying activities across reviewed scopes. Two projects without activity evidence have no chart.
- [x] 2026-08-27: Verified final combined code, both languages, desktop, mobile at 390/320 px, keyboard, static/reduced-motion behavior, root preview and non-root public navigation.

## Decisions

- Bars represent the recorded-work distribution with a fixed 0–100% scale, sample count, and Backend / Frontend / DevOps order. Missing project data is omitted, not substituted with a portfolio average or tool count.
- The private projection selects frontend/backend/delivery surfaces from existing activity tags, collapses devops/infrastructure, and splits one unit per qualifying activity. Cross-cutting tags remain canonical; unclassified surfaces are outside the focused sample. No work hours or skill score is inferred.
- Shared/unknown languages and tools remain visible in the full stack. The five explicitly requested technologies lead when present; do not add an absent technology.
- Preserve the independent recorded-activity visualization and private/public boundaries.

## Surprises

- The same defensive wording also appears in a project description and a second image caption.
- A concurrent owner task added header-scroll regression tests and changed the header while verification was running. The first preview run passed all 27 portfolio scenarios plus one new header scenario, with three new header cases failing at the 33 px compaction threshold. The next base-path attempt encountered its occupied port 4399. Coordinated with that task and preserved its edits/processes; repeat full verification after it releases the shared outputs and port.
- The header task then corrected its regression and released the port. Independently read its complete-run logs: the combined source passed 31 preview scenarios and 31 public scenarios under `/test-repository`. No unrelated header edits were made by this task.

## Validation

```bash
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
npm run build
```

Inspect chart values/labels, short and complete stack order, image captions and project description, both locales, keyboard, no JavaScript, reduced motion, mobile at 390/320 px, and the unchanged hero.

Initial work-distribution implementation passed `npm run check` (63 tests, TypeScript/Astro, audit, static build) and the 27-scenario public browser suite. The preview passed its project stacks, gallery, no-JavaScript, reduced-motion, keyboard, motion, and visual checks; the new concurrent header failures above are tracked separately until the final repeat. Visual review confirmed Backend-first work percentages and the exact Node.js / Python / TypeScript / Next.js / React core-stack order. Narrow 320 px charts now place each bar below its label and percentage to use the full content width.

Final combined browser runs passed 31 preview and 31 public `/test-repository` scenarios. A separate focused run passed all 11 domain/presentation tests; private validation passed for 120 activities and 59 workstreams. After the other task released the outputs, this task re-ran `npm run check`: all 63 tests, TypeScript/Astro, privacy audit, and root public build passed. A final root preview generation validated 29 candidates and 134 pages/assets. `git diff --check` and the staged equivalent passed. Inspected the resulting public JSON: one approved project, no preview flag, review media, or project work mixes. The four prepared mixes exist only in private candidates, with approval fields still null.

## Outcome

Complete. Visible captions and the owner-confirmed storefront description are direct and descriptive in both languages. The tiny project layer strip is replaced by readable recorded-work percentages from four project-specific samples (49 qualifying activities total), with a fixed 0–100% scale and visible sample counts. Two selected projects without activity evidence omit the chart until a supported distribution is provided. Technology counts are not used as a proxy for work. Core skills and technology lists begin with the owner's requested Node.js / Python / TypeScript / Next.js / React sequence when present. The hero and abstract preview plates are preserved; GSAP only enhances the new bars. No records or images were published, no approvals were inferred, and no commit or staging operation was performed.
