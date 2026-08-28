# Automatic main deployment and contact layout

## Purpose

Publish approved changes automatically after they reach `main` and pass the complete test harness. Keep the contact email readable without a dangling final character on wide displays.

## Context

The owner requested automatic deployment on `main` on 2026-08-28, replacing the previous per-release manual gate. At the start, the reviewed portfolio lived on `portfolio-interactive-redesign`, remote `main` still contained the earlier site, and GitHub had no deployment environment or secrets. The Pages project uses Direct Upload. The contact font scaled against the viewport instead of the narrower grid column.

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
- [x] 2026-08-28: Received explicit owner approval to finish the release; fast-forwarded `main` to the reviewed branch and pushed without rewriting history. The feature-branch CI passed, and the main push started the automatic Cloudflare release.
- [x] 2026-08-28: Confirmed that Cloudflare Web Analytics is receiving visits and page views. Dashboard readings include verification traffic and are not a claim about external audience size.
- [x] 2026-08-28: Automatic deployment run 33141547999 passed all checks and published the reviewed main revision. Independently verified all 141 addressable files against its retained artifact, both locales, contact links, the 404 response and one analytics beacon per HTML page.
- [x] 2026-08-28: Inspected the actual production revision in Windows Chrome in EN/PT-BR at a 1718px viewport. The complete email occupies one line, stays within its column, and has no horizontal overflow. Archived this completed plan.

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
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Verify EN/PT-BR contact at narrow, intermediate and ultrawide sizes, including keyboard and JavaScript-disabled use. Test that main pushes can deploy, feature branches and pull requests cannot, failures stop deployment, and only the verified static artifact is uploaded.

## Outcome

The owner-approved main integration and automatic deployment are complete. [The first automatic release](https://github.com/andrewsrigom/career-ledger/actions/runs/33141547999) passed `npm run check` (81 Node tests, zero Astro diagnostics and the 142-file static build) and all 38 browser tests in each of the three base-path configurations. Main CI also passed independently.

The published revision is available at <https://133e680a.andrewsrigom.pages.dev/> and the production alias <https://andrewsrigom.pages.dev/>. HTTP verification passed for all 141 addressable files; the other artifact file is `.nojekyll`. Both public data feeds retain 16 projects and 14 entries without private preview fields. All served HTML contains exactly one analytics beacon, and the dashboard is receiving measurements. The previous successful deployment remains available for rollback.

Email regression coverage passes at 320–3440px with and without JavaScript; production Windows Chrome confirms the final container-relative typography in both languages. Feature branches and pull requests cannot publish. Future approved main pushes run the same checks and deploy automatically, without promoting private drafts or requiring another manual Cloudflare action.
