# Prepare the public launch

## Purpose

Verify that locally analyzed project names, paths, Git evidence, and private drafts cannot enter the public site, exercise the real workflow locally, inspect the generated interface, and prepare a safe GitHub Pages launch.

## Context

- `career.local.json` and `.career/private/` remain local-only.
- `content/public/` is the approved public content source.
- `site/` and `scripts/lib/render.mjs` produce a dependency-free static site.
- Publication must not expose configured project labels, local paths, scans, commit metadata, or owner-defined blocked terms.

## Privacy impact

This work tested but did not relax the private/public boundary. Synthetic private markers remained in ignored local storage during testing and were absent from `dist/`, staged files, and the GitHub repository. No private project record was promoted into `content/public/`.

## Plan

1. Audit ignore rules, generator inputs, workflows, and generated output against private test markers.
2. Initialize the local workspace and Git repository, then exercise validation, audit, scan, and build behavior.
3. Inspect the required public routes on desktop and mobile, including keyboard focus and GitHub Pages base paths.
4. Correct blocking issues, run the full verification harness, and prepare the GitHub Pages repository and deployment.

## Progress

- [x] Removed duplicate `Zone.Identifier` artifacts and added an ignore rule.
- [x] Verified ignored configuration, private scans, state, reports, temporary files, and generated output.
- [x] Proved with synthetic markers that private scan data does not enter staged files or `dist/`.
- [x] Made staged-file auditing fail closed outside a Git work tree.
- [x] Corrected secondary-text contrast and added a WCAG AA token test.
- [x] Inspected home, timeline, entry, project, area, mobile, dark theme, keyboard focus, and project-page base paths.
- [x] Published the public repository and GitHub Pages site.

## Decisions

- Used synthetic private markers rather than real confidential names.
- Kept all analysis inputs private and created no public candidate during isolation testing.
- Preserved the editorial design while raising secondary text colors to WCAG AA contrast.
- Published through the existing GitHub Actions workflow rather than committing generated `dist/` files.

## Surprises

- The unpacked directory did not initially contain a `.git` repository, so staged-file auditing had no repository to inspect.
- Mobile accessibility testing exposed contrast failures that the first desktop audit left for manual review.
- The first GitHub Pages deployment took longer than the build but completed successfully.

## Validation

```bash
npm run career:doctor
npm run check
npm run career:audit
SITE_URL=https://example.github.io BASE_PATH=/test-repository npm run build
```

- 17 tests passed.
- Public build contained 32 files and no synthetic private markers.
- Staged content contained no private paths or synthetic markers.
- Required routes rendered without browser or console errors.
- Mobile and dark-theme accessibility audits reported zero automatic violations.
- GitHub CI and Pages deployment completed successfully.
- The live public JSON returned one approved entry and one approved project with no private marker.

## Outcome

Career Ledger is initialized on `main`, published as a public GitHub repository, and deployed through GitHub Pages. Private project configuration and evidence remain ignored locally, the generated site respects project-page base paths, and the live interface passed functional, privacy, and accessibility verification.
