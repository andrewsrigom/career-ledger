# Public homepage captures for local review

## Purpose

Add the two owner-requested client homepages as real screenshots in the existing local project galleries and homepage previews.

## Context

The private media-review manifest supports web sources, capture dates, localized captions, and bounded WebP images. A blocked source location requires a small review-only extension: explicitly nullable web source links, with the real address retained in private notes. Public schemas, project copy, dependencies, and audit rules remain unchanged.

## Privacy impact

Capture only the supplied public homepages without account access or form submission. Keep originals and derivatives in ignored private storage; retain source attribution and separate public-image approval. Do not infer authorship of the marketing pages or turn their advertised metrics into career outcomes.

## Plan

1. Capture and inspect both public homepages.
2. Optimize images and add localized review metadata to the existing project IDs.
3. Validate preview galleries, mobile and base paths, public isolation, and the complete harness.

## Progress

- [x] 2026-08-27: Read the media workflow and inspected both public homepages.
- [x] Prepare images and review metadata.
- [x] Verify the preview and public isolation.

## Decisions

- Use current homepage screenshots as organization/product context, not proof of every visible implementation.
- Keep existing project records, approval metadata, source history, and prior review images unchanged.

## Surprises

- The browser returned JPEG captures despite the initial filename extension. Originals now use their true encoding extension. The wider image included blank capture padding; only that outside-viewport padding was removed from the selected derivative.
- A pre-existing domain restriction rejected one source URL. Preserve the block and omit that location from the preview projection instead of exempting a finding. Web capture kind and date remain required, and any supplied URL is still audited and validated. Tests cover explicit null, invalid omission/empty URLs, private URLs, source-link rendering, and public-build rejection.
- The single gallery test now visits eleven project galleries in two languages. Its fixed 30-second batch budget expired on the tenth project; scale the batch budget with collection size while bounding individual page visits to 15 seconds and asset requests to 5 seconds. No content, image, keyboard, translation, or link assertion was removed.

## Validation

```bash
npm run check
npm run check:browser -- --workers=1
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser -- --workers=1
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser -- tests/browser/project-gallery.spec.ts --workers=1
```

Inspect the new images and captions in both languages, confirm mobile bounds and full-size links, and verify public output contains no review image references or bytes.

## Outcome

Added both selected public-homepage captures to the existing local galleries and homepage previews, with English and Portuguese captions and alternative text. Their WebP derivatives are 121872 and 64998 bytes; originals remain private and unchanged. The preview now contains thirteen images across eleven projects.

Web-capture source metadata can explicitly withhold a URL while retaining its capture kind and date. The actual location stays in private review notes; supplied links remain fully audited and validated. Existing privacy rules, blocked terms, public schemas, candidate copy, dependencies, and approval metadata were not changed.

`npm run check` passed 57 Node tests, strict TypeScript, Astro checks with no diagnostics, auditing, and static generation. Both full browser suites passed 19 tests; the preview used the project-page base. The alternate-base gallery suite passed both tests. The original fixed batch timeout was replaced by a collection-scaled budget with bounded per-page and per-request operations, preserving every assertion; the final full-preview gallery pass completed in 16.8 seconds.

External Chrome inspection verified both images, the withheld and retained source-link cases, translated captions, and a 390-pixel mobile viewport without overflow. The root preview was restored and both homepage project rows reference their new images. Public output remains 60 files with no review-media field or review image directory. Existing staged changes are intact. No commit, push, merge, approval, or deployment occurred.
