# Archived workspace cleanup and career evidence review

## Purpose

Reduce the size of an owner-selected archived development workspace by removing confirmed generated dependencies/build output, then recover meaningful career contributions from the preserved repositories.

## Context

The exact authorized Windows directory, repository inventory, deletion manifests, and evidence references belong in ignored private reports. Existing configured repositories and chronological ledger records must be reconciled before adding duplicate analysis. The owner prioritized backend/data work, commerce applications, and a component library whose visual demo may be reusable.

## Privacy impact

No evidence, source code, history, or unapproved media moves into public content. Source repositories are read in place. Cleanup is limited to confirmed generated artifacts beneath the explicitly authorized directory; it must preserve Git data, tracked files, uncommitted source, configuration, database data, uploads, backups, and uncertain directories. Do not follow symlinks or junctions. No push, commit, publication, or dependency installation is implied.

## Plan

1. Inventory repositories and removable artifact candidates, checking resolved paths, links, tracked contents, ignore rules, and build configuration.
2. Remove only confirmed candidates using native PowerShell and retain a private deletion/size report; compare source Git state before and after.
3. Configure and scan priority repositories, preserving existing identities and avoiding duplicate records for alternate checkouts.
4. Inspect owner-attributed history alongside implementation and tests; record dated activities, technical domains, conservative attribution, and unconfirmed outcomes privately.
5. Consolidate related work, validate records, and evaluate component-demo screenshot options without exposing secrets or rebuilding the whole archive.

## Progress

Completed on 2026-08-27.

- [x] Read relevant analysis/consolidation instructions and confirmed the owner-selected directory exists.
- [x] Finished inventory: 19 Git repositories and 37 artifact candidates; reviewed 35 removable targets totaling approximately 32 GiB and preserved two tracked generated directories.
- [x] Perform and verify bounded cleanup: all 35 targets removed, 398,826 inventoried generated files, approximately 32.67 GiB increase in available space, all 19 original repository states unchanged, and all protected tracked files present.
- [x] Analyze priority projects and reconcile existing records: eight all-ref scans, 29 activities, and 16 workstreams.
- [x] Validate and summarize the private evidence, gaps, and demo options; private validation and privacy audit pass.

## Decisions

- Keep path-bearing operational details and all evidence in ignored private storage.
- Do not use broad Git cleaning, reset, or repository-wide deletion commands.
- Treat folder names alone as insufficient evidence that ambiguous build directories are disposable.
- Do not reinstall removed dependencies merely to inspect source; evaluate a demo separately after cleanup.
- Retain the existing canonical identities for duplicate checkouts; history comparisons confirm identical commit sets for three previously analyzed repositories.
- Treat retained feature branches as historical implementation evidence, not proof of merge, release, or production success.
- Normalize Windows/WSL executable-bit noise only per scan process; do not change repository or global Git configuration.

## Surprises

- A generated commerce build accounts for approximately 26 GiB and more than 172,000 files; filesystem enumeration and deletion are the slowest operations.
- The archived design-system example has a blank compiled application and upstream history, so it is not a ready-made screenshot of the owner's component library. Uncommitted changes still need separate attribution review.
- Execute the self-authored PowerShell helper from a task-specific Windows temporary directory because the WSL UNC location is treated as remote by the shell's script policy. No execution-policy or Git trust settings are changed.
- Native PowerShell provider deletion proved slow for the largest directory. The owned helper was stopped and the same reviewed targets resumed with native .NET deletion from PowerShell, after rechecking all original repository states.
- The target volume is a healthy USB hard drive. The final deletion helper uses four bounded native workers; a nested/readonly temporary-file self-test passed, and all original Git states were rechecked before resuming. No disk or security settings were changed.
- One historical image-description change actually adds editor-facing sizing guidance, not stored alternative text. Record semantics were corrected after inspecting the actual diff.

## Validation

- Compare repository HEAD, tracked/untracked source status, and protected paths before and after cleanup.
- Verify each deletion target resolves strictly beneath the authorized directory and traverses no reparse point.
- Record deleted bytes and any failed or skipped deletion without claiming more space than confirmed.
- Run configured private scans and `npm run career:validate-private` after ledger updates.
- Run `npm run check` if scripts, schemas, public content, or site code change.
- Confirm no public content or approval metadata changed.
- The final `npm run check` passed: 60 Node tests, TypeScript/Astro checks, and the static build. The earlier check passed with 58 tests; concurrent unrelated frontend changes were preserved. Generated output was inspected for archive identifiers and private paths.
- The deletion report and an independent existence check confirm all reviewed targets are absent, all protected tracked artifacts remain, and HEAD/status snapshots match for every repository.

## Outcome

Cleanup and analysis complete. The private report records 29 new activities across eight projects and 16 consolidated workstreams, with source/history preservation verified after removal of the generated artifacts. This task changed no public content, candidates, or approval metadata and made no commit, push, or deployment. Existing canonical records and unrelated changes were preserved. Missing release/outcome information is retained as explicit questions rather than blocking capture. A real component-library screenshot remains a separate optional step requiring its dependencies; none were reinstalled and no screenshot was fabricated.
