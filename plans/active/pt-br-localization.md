# Add a complete PT-BR site locale

## Purpose

Add a first-class Brazilian Portuguese version of the portfolio so the owner can review and direct the public narrative in Portuguese while preserving the existing English site.

## Context

- The static generator currently renders only English and hard-codes both interface copy and `lang="en"`.
- Public records use English as their canonical content and the private candidate preview overlays sanitized entry, project, and resume records.
- Internal links already flow through a base-path URL helper and must continue working on GitHub project pages.
- The site must remain static, dependency-free, readable without JavaScript, and deterministic.

## Privacy impact

Localization does not change the evidence boundary. Translations live beside the same approved public record or private candidate they translate, inherit its publication status, and never create a path from `.career/private/` into the public build. Public output still reads only `content/public/`; candidate translations appear only in the ignored review preview.

## Plan

1. Define supported locales and locale-aware URLs for English at the existing routes and Brazilian Portuguese under `/pt-br/`.
2. Add validated, optional `pt-BR` localizations to profile, taxonomy, entry, project, and resume records.
3. Localize the dataset and all interface copy, metadata, structured data, dates, feeds, manifests, language navigation, and alternate-language links.
4. Add Portuguese translations to the approved records and current private candidates without changing their publication state.
5. Extend URL, validation, build, and preview tests; generate both public and private sites and inspect representative localized routes.

## Progress

- [x] 2026-08-26: Reviewed site, content, URL, validation, build, preview, and test architecture.
- [x] 2026-08-26: Added locale-aware URL contexts, shared asset URLs, English root routes, and PT-BR routes under `/pt-br/`.
- [x] 2026-08-26: Localized every interface label, status, project kind, date, page title, description, structured-data language, Open Graph locale, JSON feed, RSS feed, and manifest.
- [x] 2026-08-26: Added reciprocal `hreflang` links and an accessible EN/PT language switch that preserves the current route and GitHub Pages base path.
- [x] 2026-08-26: Added validated PT-BR localizations to the approved profile, taxonomy, entry, and project, and to all seven private candidates including the resume.
- [x] 2026-08-26: Confirmed localized generated JSON contains no authoring `localizations` objects and candidate translations remain outside the public build.
- [x] 2026-08-26: Ran `npm run check`, preview generation, link verification, untranslated-interface checks, and `git diff --check`; all 22 tests passed.
- [ ] Owner reviews the PT-BR page at `http://127.0.0.1:4174/pt-br/` on desktop and mobile and directs any wording refinements.

## Decisions

- Keep English at the current root URLs to preserve existing links.
- Publish Brazilian Portuguese at `/pt-br/` with reciprocal `hreflang` links and an explicit language switcher.
- Store translations with their source record instead of maintaining a parallel content tree.
- Fall back to canonical English only when an optional translation is absent, while tests keep the currently visible portfolio fully translated.

## Surprises

- The current renderer hard-codes nearly all interface language, so correct PT-BR support requires localization beyond content fields alone.

## Validation

```bash
npm run check
npm run career:preview
git diff --check
```

Inspect `/`, `/pt-br/`, one project, one entry, one area, About, localized JSON and RSS feeds, language switching, `lang`/canonical/`hreflang` metadata, keyboard focus, mobile layout, and a build using `BASE_PATH=/test-repository`.

## Outcome

The static site now has first-class English and Brazilian Portuguese variants. English keeps the existing URLs, while equivalent PT-BR pages, JSON, RSS, and manifest files are generated below `/pt-br/`. The language switch is semantic, keyboard accessible, base-path safe, and does not require JavaScript. Approved translations remain with approved records; candidate translations remain ignored and preview-only. Automated validation, privacy auditing, deterministic generation, link verification, and all 22 tests pass. Owner visual and wording review remains before final publication decisions.
