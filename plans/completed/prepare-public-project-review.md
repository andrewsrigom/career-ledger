# Prepare public project review

## Purpose

Document VaultMind, Caderno UI, and Public Extensions as owner-created public projects and provide a complete local site preview for owner review before publication.

## Context

- All three source repositories are public and were created by the owner.
- The current public site contains only approved Career Ledger records.
- The Career Ledger supports private candidates and interactive approval, but it does not yet render candidate records for visual review.
- Existing uncommitted changes in source repositories are evidence only and must remain untouched.

## Privacy impact

Repository scans, attribution evidence, local paths, commit identifiers, and working-tree metadata remain under ignored private storage. Sanitized candidates also remain private. A review build must be generated outside `dist/` and must never become a publication source. Only the interactive approval command may move a candidate into `content/public/`.

## Plan

1. Configure and scan the three public-source repositories, then create evidence-backed private initiatives.
2. Produce sanitized project and achievement candidates with conservative, observable outcomes.
3. Add an isolated candidate-preview command and tests if the existing build cannot render private candidates safely.
4. Review every candidate for privacy, attribution, links, duplication, and writing quality.
5. Run the complete validation suite and inspect the local review site on representative desktop and mobile routes.

## Progress

- [x] 2026-08-26: Verified repository visibility, ownership evidence, licenses, documentation, and local working-tree state.
- [x] 2026-08-26: Added the three repositories to ignored local configuration and recorded owner-confirmed project contexts.
- [x] 2026-08-26: Generated private scans and consolidated one mature, owner-attributed initiative per project.
- [x] 2026-08-26: Created three project candidates and three related achievement candidates, then completed publication reviews for all six.
- [x] 2026-08-26: Added an isolated candidate-preview command with a visible unpublished banner, `noindex`, restrictive robots policy, local privacy audit, and automated coverage.
- [x] 2026-08-26: Inspected the home, timeline, projects, project details, entry details, area route, mobile layout, keyboard focus, links, and browser console.

## Decisions

- Describe VaultMind and Caderno UI as open-source projects under MIT.
- Describe Public Extensions as source-available under PolyForm Shield, not as open source.
- Use observable deliverables as outcomes and omit adoption or impact metrics that are not supported.
- Avoid exact extension counts so unreleased local work cannot be mistaken for the public release.
- Keep candidates private and require explicit owner approval after visual review.

## Surprises

- Caderno UI and Public Extensions contain substantial user-owned working-tree changes; these will not be modified or presented as released work.
- The existing CLI validates and approves candidates but has no isolated candidate-preview build.
- Mobile inspection exposed a visible scrollbar on the intentionally scrollable navigation; its chrome is now hidden while touch, wheel, and keyboard access remain available.

## Validation

```bash
npm run career:doctor
npm run career:validate-private
npm run career:audit -- --candidate <slug>
npm run check
npm run career:preview
```

All six candidate audits passed. The complete suite passed 18 tests and generated 32 production files from one approved entry and one approved project. The isolated preview generated 38 files from four entries and four projects, including six records with candidate status.

The final review confirmed generated links, all four external project links, candidate/public separation, representative project and entry pages, relevant area and timeline routes, desktop and mobile layouts, keyboard focus, zero browser console warnings or errors, and absence of the three candidate project names from both `content/public/` and `dist/`.

## Outcome

VaultMind, Caderno UI, and Public Extensions are documented as owner-created public projects, each with a detailed related achievement. Private evidence, initiatives, candidates, and review reports remain ignored locally. The review site is available from `.career/reports/publication-preview/` and clearly states that its records are not published. No candidate has moved into `content/public/`; explicit owner approval remains the only publication gate.
