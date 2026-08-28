# Cloudflare public portfolio release

## Purpose

Publish the owner's reviewed portfolio at the preferred `andrewsrigom.pages.dev` address with Cloudflare Web Analytics and an explicit manual deployment workflow.

## Context

The Astro static frontend and portfolio refinements are on `portfolio-interactive-redesign`. The local preview contains candidate projects, entries, resume/contact/recommendations and reviewed screenshots; the public dataset is still smaller. The owner explicitly approved all current portfolio content and imagery, analytics, commit, push and publication on 2026-08-28. Existing unrelated Cloudflare projects must not change.

## Privacy impact

Only the reviewed presentation records and bounded images will be promoted. Raw evidence, repository histories, local paths, source files, account credentials and review notes remain ignored and private. The default build continues to read only public content, without network access. Analytics is a deliberate production-only exception to the local-resource rule, not permission for arbitrary remote assets.

## Plan

1. Inspect the release dataset, Git state and authenticated Pages account.
2. Preserve all approved images in a validated public gallery; promote reviewed records using the existing publication workflow and record owner authorization privately.
3. Configure Pages, production analytics and manual-only deployment; retain the existing live site and rollback artifacts.
4. Audit code/content/assets, run the complete check and browser harness, and inspect bilingual desktop/mobile output.
5. Commit and push the reviewed source branch, deploy that exact build, and verify live content and analytics.

## Progress

- [x] 2026-08-28: Received explicit owner approval for the current content, screenshots, contact details, analytics, commit, push and deployment.
- [x] Public dataset and image promotion: 16 projects, 14 entries, resume/contact, 19 screenshots and 6 portraits. All current portfolio candidates passed the interactive gate; private evidence and original snapshots remain excluded.
- [x] Pages project `andrewsrigom` created and Web Analytics enabled through the authenticated dashboard. Pinned deployment CLI, manual workflow, ADR and operating documentation added.
- [x] Validation and visual review: public content, bilingual desktop/mobile layouts, 25 image files, and the browser suites reviewed. The final production-context `npm run check` passed before committing.
- [ ] Commit, push, deployment and live verification.

## Decisions

- Cloudflare Pages Direct Upload preserves the requested `pages.dev` address and manual release control.
- Do not merge branches or change the existing hosting deployment implicitly; publish the exact owner-approved source commit.
- Never transfer the local preview directory or the entire workspace to the host.
- Keep authentication outside source control; scope future CI credentials to Pages.

## Surprises

- Public presentation previously supported only a single preview. Added validated bilingual galleries to preserve the exact approved review images and captions.
- Wrangler OAuth could deploy Pages but could not administer Web Analytics. The authenticated dashboard provided the supported setup path; no new credential was created.
- The staged-file audit caught a synthetic unsafe path in a regression fixture. Construct that fake input at runtime, preserving the rejection test without adding an audit exception.
- A short mobile viewport exposed fractional clipping during keyboard layer navigation. Explicit nearest scrolling with a focus margin fixes it; repeated keyboard/mobile checks pass without relaxing the full-visibility assertion.
- Do not run separate public builds concurrently with browser tests: the test server uses `dist/`. Keep base-path suites serial.

## Validation

```bash
npm run check
npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Verify all portfolio projects, real images, recommendations and contact channels in EN/PT-BR; inspect the deploy artifact for private data, validate live redirects/404/metadata, and confirm production-only analytics delivery.

## Outcome

Implementation in progress. No release has been made yet.

Checks so far: full validation/audit, strict Node and 53 Astro file checks, 81 Node tests, and the root 38-test browser suite passed. The `/career-ledger` suite passed 37 checks and identified the keyboard-edge issue above; both affected tests then passed three repeats after correction. The alternate-base suite passed all 38 tests. All 25 approved WebP files contain image chunks only, without EXIF/XMP metadata. Final production-context validation passed: 142 pages/assets and 48.7 KB primary / 130.8 KB lazy architecture gzip JavaScript. Live deployment verification is pending.
