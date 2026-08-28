# Local project image review

## Purpose

Add genuine project imagery to the local portfolio preview, using existing repository images and current local browser captures selected at the owner's request.

## Context

The local review gallery already accepts bounded WebP files and bilingual captions. Its provenance currently describes public web captures or owner-provided images, neither of which accurately describes an older repository asset or a fresh localhost capture.

## Privacy impact

Keep originals, repository locations, capture notes, and optimized derivatives in ignored private storage. Extend only preview-media provenance. Do not change public project schemas, approvals, public content, or deployment. Never read local repositories from the public build.

## Plan

1. Inspect candidate images and capture the requested running local interfaces.
2. Add validated local-capture and project-asset provenance with localized captions and tests.
3. Select bounded images for the local gallery, then verify rendering and public-build isolation.

## Progress

- [x] Located the requested repositories and running local sites.
- [x] Selected and inspected all four images.
- [x] Added provenance validation, localized rendering, and tests.
- [x] Added selected private images and verified the preview.

## Decisions

- Record the collection date for existing assets; do not invent their original capture date.
- Record the capture date for localhost screenshots without putting local URLs or paths in the preview dataset.
- Use real interface images only; do not turn test examples into claims of production use or invent a product screenshot.

## Surprises

- The running knowledge-site interface differs from its older repository screenshot.
- The site-authoring repository contains many visual test fixtures, which need individual selection rather than bulk copying.

## Validation

```bash
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser -- tests/browser/project-gallery.spec.ts
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/review-alt npm run check:browser -- tests/browser/project-gallery.spec.ts
```

Inspect image galleries in both languages and mobile, verify non-root paths, and confirm no review images or private metadata enter public output.

## Outcome

Added four selected, locally stored images with bilingual text and accurate source kinds. Existing images record collection dates; current local captures record capture dates. No original capture date was inferred and no local source location enters the preview dataset.

`npm run check` passed 56 Node tests, strict TypeScript, Astro checks, auditing, and static generation. Both full browser suites passed all 19 tests; gallery suites passed with the project-page base and an alternate base. External-browser inspection confirmed image loading, localized captions, and a 390-pixel mobile layout without horizontal overflow.

The public build remains 60 files, with no review-media references or review asset directory. Private preparation contains eleven gallery images in total, including the four additions. Each new image is below 76 KB. No public content, dependency, approval metadata, staged file, source repository, or deployed site was changed. The local preview was restored after tests. No push, merge, commit, or deployment occurred.
