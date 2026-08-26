# Prepare the public launch

## Purpose

Verify that locally analyzed project names, paths, Git evidence, and private drafts cannot enter the public site, exercise the real workflow locally, inspect the generated interface, and prepare a safe GitHub Pages launch.

## Context

- `career.local.json` and `.career/private/` are intended to remain local-only.
- `content/public/` is the approved public content source.
- `site/` and `scripts/lib/render.mjs` produce a dependency-free static site.
- The current directory was unpacked without Git metadata and has not completed local setup.
- Publication must not expose configured project labels, local paths, scans, commit metadata, or owner-defined blocked terms.

## Privacy impact

This work tests but does not relax the private/public boundary. Test-only private markers will remain in ignored local storage and must be absent from `dist/`, staged files, and the eventual GitHub repository. No private project record will be promoted into `content/public/`.

## Plan

1. Audit ignore rules, generator inputs, workflows, and generated output against private test markers.
2. Initialize the local workspace and Git repository, then exercise validation, audit, scan, and build behavior.
3. Inspect the required public routes on desktop and mobile, including keyboard focus and GitHub Pages base paths.
4. Correct blocking issues, run the full verification harness, and prepare the GitHub Pages repository and deployment.

## Progress

- [x] Removed duplicate `Zone.Identifier` artifacts.
- [x] Read the repository documentation and established the intended boundaries.
- [ ] Complete private-data isolation tests.
- [ ] Complete local workflow and browser verification.
- [ ] Complete GitHub Pages preparation and deployment.

## Decisions

- Use synthetic private markers for leakage testing rather than real confidential names.
- Keep all analysis inputs private; do not create public candidates during the isolation test.

## Surprises

- The unpacked directory did not contain a `.git` repository, so staged-file auditing initially had no repository to inspect.

## Validation

```bash
npm run career:doctor
npm run check
```

Also verify that synthetic private markers are absent from `dist/`, inspect the home, timeline, entry, project, and area routes, test a mobile viewport and keyboard focus, and build with `BASE_PATH=/test-repository`.

## Outcome

Pending.
