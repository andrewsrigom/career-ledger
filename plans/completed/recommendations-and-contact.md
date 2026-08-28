# Recommendations and contact

## Purpose

Add a personal section with genuine recommendations, author photos, professional context, and links to the originals. Show no recommendation dates. Close the page with direct contact channels and a prominent way to reach them.

## Context

The owner supplied six LinkedIn recommendations and requested photos. Reuse the resume candidate, localization model, static Astro homepage, and existing private media-review adapter. Preserve ongoing work and the current project hierarchy.

## Privacy impact

Quotes, author identities, and downloaded portraits remain in the ignored candidate/media folders for local review. Public builds still read only approved public content and explicitly approved assets. No LinkedIn embeds, remote images, browser credentials, or runtime network access. Public portrait support requires explicit asset approval. No push or deployment.

## Plan

1. Prepare faithful excerpts, translations, and genuine local portrait derivatives.
2. Extend validated resume content and the existing media boundary; add an accessible editorial section.
3. Cover validation, localization, asset isolation, and browser behavior. Run all checks and inspect both locales.

## Progress

- [x] Read supplied text and verify the six recommendations and visible photos on LinkedIn.
- [x] Implement recommendations and presentation.
- [x] Verify recommendations: 77 Node tests, 36 public and 36 private browser tests; both locales visually reviewed.
- [x] Add the contact section and hero/footer shortcuts, with validated support for email, international phone, optional WhatsApp and social links. The owner subsequently supplied email and phone and explicitly confirmed WhatsApp.
- [x] Verify the combined result and document. Contact fields are populated from the owner's confirmation; unprovided social profiles remain absent.

## Decisions

- Put recommendations after experience, with all six readable without JavaScript, autoplay, or a carousel.
- English uses exact excerpts; Portuguese translations are identified as translations.
- Describe the actual work relationship, not a current employer's endorsement.
- Keep portraits separate from project screenshots so their smaller dimensions do not weaken screenshot constraints.
- Contact details remain in the resume candidate; do not guess missing values or display inactive placeholders. No form or network service is needed.

## Surprises

- Native Chromium cross-document transitions can report `AbortError: Transition was skipped` during rapid navigation even with JavaScript disabled. The contact test uses the existing suite's narrowly scoped cancellation handling; other errors remain failures.

## Validation

- `npm run check`: 78 Node tests, 53 Astro/TypeScript files with zero diagnostics, privacy audit, build and link checks passed.
- Public Playwright: 38 passed under `/career-ledger`.
- Private Playwright under `/test-repository`: all 38 passed after adding the owner-confirmed contact values, including email, phone and exact direct WhatsApp destination checks in both languages.
- Both recommendation locales and contact reviewed visually on desktop and mobile; English excerpts match the owner's supplied text. Six real portraits total 23,388 bytes.
- Public `dist` contains none of the recommendation names, review portraits, sample contact fixtures, or private contact/profile references. No private files are tracked. Both preview languages remain noindex.
- JavaScript budget unchanged: 48.6 KB main / 130.8 KB lazy architecture (gzip).

## Outcome

Six recommendations with real locally stored photos, faithful excerpts and identified PT-BR translations are available after experience. The contact section, hero shortcut and localized footer links include the supplied LinkedIn profile, email, international phone and a separately confirmed direct WhatsApp link. Confirmation and actual contact values stay in the private candidate/context; other networks are not inferred. The root preview runs on port 4322. No commit, push, merge, public-content promotion or deployment performed.
