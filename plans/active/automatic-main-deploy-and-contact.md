# Automatic main deployment and contact layout

## Purpose

Publish approved changes automatically after they reach `main` and pass the complete test harness. Keep the contact email readable without a dangling final character on wide displays.

## Context

The owner requested automatic deployment on `main` on 2026-08-28, replacing the previous per-release manual gate. The reviewed portfolio lives on `portfolio-interactive-redesign`; remote `main` still contains the earlier site. The Pages project uses Direct Upload, and GitHub does not yet have its deployment environment or secrets. The contact font currently scales against the viewport instead of the narrower grid column.

## Privacy impact

No public content promotion or additional runtime dependency. Only approved public records and assets enter `dist/`. Acceptance into `main` becomes the deployment approval boundary, not permission to publish private candidates. Keep a dedicated account-scoped Pages Edit credential in the GitHub production environment; never reuse the local Wrangler OAuth credential or commit secrets.

## Plan

1. Inspect deployment configuration, credentials and the contact layout.
2. Add main-only automatic deployment after validation and browser checks; retain an explicit manual main-only fallback.
3. Make email typography container-aware and allow a meaningful break before the domain at narrow widths.
4. Add regression coverage, run the full harness and inspect responsive bilingual output.
5. Configure CI credentials if the authenticated sessions permit it, push the reviewed changes, and integrate into main only with owner authorization.

## Progress

- [x] Inspected the branch, deployment workflow, GitHub secret metadata, and contact markup.
- [x] Implemented main-only push deployment plus confirmed main-only retries, all three browser suites before upload, container-relative email typography and a domain-safe wrap opportunity.
- [x] Updated approval rules, release instructions and ADR 0007 without changing candidate approval or privacy auditing.
- [x] Created the GitHub production environment restricted to `main`, and stored its account identifier and dedicated Pages Write credential. The token expires on 2027-08-28; no secret value was printed or written to repository files.
- [x] Verified the full validation/audit/type-check/build harness, 81 Node tests, both 38-test root and alternate-base browser suites, and the email in Windows Chrome. Desktop and mobile captures preserve the complete address.
- [ ] Finish deployment activation or document the remaining owner action.

## Decisions

- Preserve the existing Pages project, Analytics injection and rollback history.
- Do not publish feature branches or pull requests automatically.
- Keep email text and `mailto:` unchanged; do not truncate, ellipsize or rely on JavaScript text fitting.

## Surprises

- GitHub initially had no `cloudflare-pages` environment or deployment secrets; a local Wrangler login is not CI authentication. The dedicated environment and credentials are now configured.
- The original contact tests checked only link bounds, not text line breaks. Expanded coverage checks eleven viewport sizes in both locales with JavaScript on and off. Its timeout accommodates the larger matrix without relaxing the layout assertions.

## Validation

```bash
npm run check
npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Verify EN/PT-BR contact at narrow, intermediate and ultrawide sizes, including keyboard and JavaScript-disabled use. Test that main pushes can deploy, feature branches and pull requests cannot, failures stop deployment, and only the verified static artifact is uploaded.

## Outcome

The email-specific regression tests pass at 320–3440px with and without JavaScript. `npm run check` passed: 81 Node tests, zero diagnostics across 53 Astro files, and the verified 142-file static build. Both full root and alternate-base suites passed all 38 tests. Windows Chrome independently confirms the full email on one line in the desktop column. Main integration is awaiting owner direction; no feature-branch deployment has been enabled. The deployed portfolio remains unchanged until the reviewed workflow and email fix reach `main`.
