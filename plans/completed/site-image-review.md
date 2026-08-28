# Public-site image review

## Purpose

Use the owner's specified public website to illustrate an existing portfolio project in the local review gallery.

## Context

The project already has a bilingual candidate and a preview-only media pipeline. Reuse that pipeline without changing public records, frontend logic, schemas, dependencies, or image approval metadata. Preserve existing staged and unstaged work.

## Privacy impact

Real page captures and optimized derivatives remain in ignored private media-review storage. Only the local preview receives them. Do not authenticate, submit forms, copy repository assets, or publish anything. Public builds remain unchanged and offline.

## Plan

1. Inspect the requested public site and select relevant original page views.
2. Capture and optimize bounded WebP files, with bilingual descriptions and source/date provenance.
3. Validate the preview, inspect the gallery, and verify public build isolation.

## Progress

- [x] 2026-08-27: Inspected the site in the external browser and identified relevant views.
- [x] 2026-08-27: Saved two original PNG browser captures and bounded WebP derivatives; added bilingual captions and source/date provenance to the private preview manifest.
- [x] 2026-08-27: Completed automated checks and external-browser gallery inspection; confirmed no private images in public output.

## Decisions

- Use actual browser captures, with no fabricated interface or altered page content.
- Leave the dashboard illustration out pending origin/license confirmation: its visible brand differs from the project and prior context excludes licensed vendor material from original-work attribution.
- Capture the landing introduction and feature presentation instead. Do not turn marketing statements or demonstration values into portfolio outcome claims.

## Surprises

- The site's dashboard illustration retains a different product/template brand.

## Validation

```bash
npm run check
CAREER_BROWSER_PREVIEW=1 npm run check:browser
```

Inspect local gallery and homepage preview, EN/PT-BR text, full-size links, dimensions, and no private assets in public output.

Results: `npm run check` passed 55 Node tests and TypeScript/Astro validation with zero errors, warnings, or hints. The preview browser suite passed all 19 tests, including all gallery images, keyboard links, mobile/no-JavaScript reading, both languages, and homepage visuals. The public build contains 60 files, with unchanged JavaScript budgets and no review-media references. Existing staged diffs are unchanged.

Image derivatives are 1440 × 566 (24,168 bytes) and 1440 × 1112 (58,890 bytes). Only resize and WebP encoding were applied; page content and original captures were not altered. Both images and the preparation helper remain ignored by Git.

## Outcome

Two actual public-site captures now illustrate the existing project in the localhost gallery and its homepage preview. No frontend or schema change was needed. Dashboard illustration origin/license confirmation remains an optional follow-up; it was not copied into the gallery. Nothing was approved, committed, pushed, or deployed.
