# Cloudflare public portfolio release

## Purpose

Publish the owner's reviewed portfolio at the preferred `andrewsrigom.pages.dev` address with Cloudflare Web Analytics and an explicit manual deployment workflow.

## Context

The Astro static frontend and portfolio refinements are on `portfolio-interactive-redesign`. Before this release, the local preview contained candidate projects, entries, resume/contact/recommendations and reviewed screenshots while the public dataset was smaller. The owner explicitly approved all current portfolio content and imagery, analytics, commit, push and publication on 2026-08-28. Existing unrelated Cloudflare projects must not change.

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
- [x] Commit and push of the approved source branch; production deployment to `andrewsrigom.pages.dev` without merging or modifying the prior live site.
- [x] Live verification: all 141 addressable generated files pass HTTP/content checks; the excluded file is the hosting marker `.nojekyll`. Unknown routes return 404. EN/PT-BR, complete project galleries and contact channels inspected in the browser.
- [x] Production analytics: exactly one Cloudflare beacon is injected into every HTML page and the beacon resource returns 200. The dashboard is enabled but has not yet displayed collected measurements; do not interpret its initial zero as a complete traffic count.
- [x] GitHub CI passed, including all three complete 38-test browser suites. Localhost now serves the approved public dataset without draft banners or tracking.

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

The complete owner-approved portfolio is public at <https://andrewsrigom.pages.dev/> and <https://andrewsrigom.pages.dev/pt-br/>. The deployed source branch is pushed, and its GitHub validation run passed. The previous GitHub Pages site and unrelated Cloudflare projects remain unchanged. Future publication remains an explicit manual action.

Validation: public and staged privacy audits, strict Node and 53 Astro file checks, 81 Node tests, and all three 38-test browser suites passed. The keyboard-edge regression was also repeated three times locally after correction. All 25 approved WebP files contain image chunks only, without EXIF/XMP metadata. Production output contains 142 pages/assets and 48.7 KB primary / 130.8 KB lazy architecture gzip JavaScript. The public JSON exposes 16 projects and 14 entries in both locales, without preview/review data; all deployed non-HTML bytes match the reviewed build.

Analytics activation, injection and resource delivery are verified. Aggregated measurements had not yet appeared during the release check; the owner's Web Analytics dashboard is the place to review incoming traffic. The optional Actions deployment route still requires environment secrets and the workflow on the default branch, as documented in `docs/cloudflare-release.md`; the successful initial release used the existing local Wrangler login.
