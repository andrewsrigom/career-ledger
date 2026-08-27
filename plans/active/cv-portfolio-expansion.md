# Expand the portfolio with CV experience

## Purpose

Turn the project-first site into a complete software engineering portfolio that adds professional experience, selected outcomes, capabilities, and education without exposing unapproved CV data.

## Context

- The current homepage presents selected projects through compact inline-expanding records.
- The owner supplied a two-page PDF CV dated through August 2026.
- The CV describes five professional roles beginning in February 2016, one independent SaaS project, education, skills, leadership, and measurable results.
- The CV also contains a phone number, personal email, employer and client names, product names, and strong quantitative claims.
- Approved public generation currently supports profile, entry, and project records. Candidate preview and approval support only entry and project candidates.

## Privacy impact

This work extends the publication boundary with a new resume candidate type. Extracted CV content, review notes, and the candidate remain under `.career/private/` until explicit owner approval. The public build continues to read only `content/public/`; it renders no resume section until an approved resume source exists. Phone number, personal email, named clients, and named client products are excluded from the candidate. Employer names and self-reported metrics remain review items and must not be approved implicitly.

## Plan

1. Record a private, sanitized extraction of the CV and identify publication decisions.
2. Add a validated resume schema, optional approved source, candidate preview overlay, privacy audit, and interactive approval support.
3. Render experience, selected outcomes, capabilities, and education as compact inline sections on the portfolio homepage.
4. Add tests for resume validation, preview isolation, deterministic experience calculations, base-path links, and the public build with no approved resume.
5. Generate the private preview, inspect representative routes and responsive markup, run the complete validation harness, and request owner approval decisions.

## Progress

- [x] 2026-08-26: Read and visually inspected both CV pages; extracted five roles, one independent project, education, skills, and quantitative highlights.
- [x] 2026-08-26: Kept the original PDF unchanged and moved rendered inspection images into ignored private storage.
- [x] 2026-08-26: Created a sanitized private extraction and one coherent `resume` publication candidate; excluded contact details, named clients, and named client products.
- [x] 2026-08-26: Added resume schema, validation, audit, preview overlay, approval support, deterministic experience totals, and compact homepage sections.
- [x] 2026-08-26: Added coverage for resume ordering, experience totals, preview isolation, base-path links, and the public build without an approved resume.
- [x] 2026-08-26: Generated and inspected the private preview markup; confirmed the current role appears first, only the first role is expanded, and all preview pages are marked `noindex,nofollow`.
- [x] 2026-08-26: Ran `npm run check`, candidate audit, preview generation, and `git diff --check`; all 19 tests passed.
- [x] 2026-08-26: Confirmed `content/public/` is unchanged and the public `dist/` contains none of the CV employer/client/product names, metrics, email addresses, or phone patterns.
- [ ] Owner reviews the private preview and explicitly decides which employer names, quantitative claims, education institutions, and contact/profile links may become public.

## Decisions

- Treat the PDF as private source evidence, not as automatically approved web content.
- Model the CV as one coherent `resume` publication candidate so the owner can review and approve the complete public career narrative.
- Keep employer names as explicit review items, but remove named clients and client products from the sanitized candidate.
- Mark quantitative outcomes derived only from the owner's CV as `self-reported` until stronger evidence or public sources are attached.
- Calculate completed experience years from `experienceStart` and the dataset's deterministic `updatedAt`, never from the build clock.

## Surprises

- The CV contains several strong metrics (50+ components, 8+ applications, 74% test coverage, 600+ companies, a team of 8, and $300K in avoided fines) that are useful but require explicit owner confirmation before publication.
- The current candidate pipeline cannot represent profile or experience data, so the publication workflow must be extended rather than bypassed.

## Validation

```bash
npm run check
npm run career:preview
git diff --check
```

Inspect the private preview homepage, experience expansion, projects, one entry, one project, one area, mobile layout, keyboard behavior, candidate audit results, and a build using a GitHub Pages base path. Confirm that `content/public/` and `dist/` contain none of the unapproved CV names or metrics.

## Outcome

The private portfolio preview is ready for owner review. It adds a concise professional summary, five selected outcomes, five roles covering 10+ completed years, core skills, and education while retaining the inline project portfolio. The public source and generated public site remain unchanged; publication is intentionally pending explicit owner decisions about employer names, self-reported metrics, education institutions, and contact/profile links.
