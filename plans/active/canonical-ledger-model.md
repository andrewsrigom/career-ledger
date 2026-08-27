# Implement the canonical career-ledger model

## Purpose

Make Career Ledger preserve a chronological, evidence-backed account of meaningful engineering activity before that work is consolidated into workstreams, promoted to milestones or achievements, and projected into public portfolio, resume, summary, or interview material.

## Context

- The current private model moves directly from Git scans to initiative-shaped drafts. It preserves evidence and outcomes, but activities, progression, milestones, achievements, narrative signals, provenance states, and enrichment questions are not first-class records.
- The current public entry model can represent meaningful initiatives and outcomes, but it does not distinguish ordinary activity, notable work, milestones, and achievements or attach semantic activity types.
- Existing ignored private records all use the version 1 initiative shape. They must remain valid and must not be rewritten through unsupported inference.
- The working tree already contains completed implementation work awaiting owner review for CV-derived portfolio content and PT-BR localization. This plan must preserve those changes and avoid modifying their private candidates or owner decisions.
- The repository is dependency-free, ESM-only, static, bilingual, deterministic, and currently passes all 22 tests plus the public build.

## Privacy impact

This work adds richer structures inside `.career/private/` and does not create a new route into public generation. Source evidence, internal project identity, provenance notes, attribution uncertainty, rejected outcomes, and enrichment questions remain private. Public generation continues to read only `content/public/`; new public projection fields are sanitized candidate metadata and still require the existing interactive owner approval gate. Existing approved public copy will not be rewritten as part of this plan.

## Plan

1. Add first-class private activity and workstream schemas, templates, paths, validation, relationship checks, and CLI review counts while retaining legacy initiative validation.
2. Model activity types, significance, temporal progression, evidence provenance, milestones, achievements, narrative signals, and enrichment questions with fail-closed validation rules.
   - Classify each activity with normalized technical domains and define an honest weighted activity-mix calculation for later portfolio analysis.
3. Extend public entry candidates with optional, validated significance and activity-type metadata; normalize missing legacy values conservatively in generated datasets and render them in the bilingual timeline and entry views.
4. Update repository skills, prompts, and documentation so analysis captures activities before consolidation, outcomes are promoted only with support, and career materials are projections of the ledger rather than independent inventions.
5. Add focused tests for private-record integrity, conservative public defaults, localization, candidate preview, and generated output; run the complete harness and inspect representative routes.
6. After the foundation is complete, use the owner-supplied private WSL project backlog to review and populate ledger records with the owner; do not publish project identities or candidates implicitly.

## Progress

- [x] 2026-08-26: Read the canonical operating prompt and all required repository policy and workflow documents.
- [x] 2026-08-26: Audited schemas, validation, generation, rendering, skills, prompts, active plans, and the shape of existing ignored private records.
- [x] 2026-08-26: Confirmed the pre-change baseline with `npm run check`; all 22 tests and the public build passed.
- [x] 2026-08-26: Added private activity and workstream schemas, templates, workspace paths, CLI review counts, evidence gates, and cross-record integrity while preserving all legacy records.
- [x] 2026-08-26: Extended public entry candidates with optional significance and activity types, conservative legacy normalization, bilingual display, combined timeline filters, and evidence gates for milestones and achievements.
- [x] 2026-08-26: Aligned agent skills, prompts, private workspace instructions, and documentation; added a private career-material projection skill and canonical operating-model document.
- [x] 2026-08-26: Validated all six modified/new skill packages and completed automated plus browser-based desktop/mobile verification.
- [x] Review and populate every evidence-bearing item in the owner-supplied private WSL project backlog; preserve three incomplete roots as explicit source-recovery cases instead of inventing records.
- [x] 2026-08-26: Inventoried the private WSL backlog without reading repository code; matched three configured projects and twelve additional exact Git roots, with two umbrella/grouping decisions still requiring owner confirmation.
- [x] 2026-08-26: Captured and validated the first canonical project review for Endpointer as two dated activities and one active workstream, without creating public content.
- [x] 2026-08-26: Converted the seven owner-reviewed Robs-web initiative groups into seven dated canonical activities and seven validated workstreams, preserving unconfirmed outcomes and private evidence.
- [x] 2026-08-26: Owner confirmed `aoa-componentes` maps to the `aoa-components` repository and that all Git repositories under the private Fengsoft umbrella are in scope, with SeuSaaS as the principal family and the starter/premium relationship still to be verified from repository evidence.
- [x] 2026-08-26: Captured public-extensions as a verified public release plus a separate uncommitted expansion, with two dated activities, one workstream, focused validation evidence, and no store-publication or adoption claim.
- [x] 2026-08-26: Configured and reviewed aoa-componentes, reducing 41 attributed commits to four chronological activities and one completed workstream with derived repository scope, two supported milestones, and no unsupported adoption or leadership claim.
- [x] 2026-08-26: Configured and reviewed aoa-next, reducing 304 attributed commits to eight chronological activities and three completed workstreams covering page composition, editor experience, and web quality, with all cited Git objects verified locally.
- [x] 2026-08-26: Reviewed the reusable-package monorepo, reducing 21 attributed commits to three chronological activities and one completed workstream with two supported milestones and no inferred publication, adoption, ownership, or impact claim.
- [x] 2026-08-26: Extended the private scanner to recover history from deterministic reachable references when a checkout has an unborn `HEAD`, with regression coverage for both fallback and genuinely empty repositories.
- [x] 2026-08-26: Audited another configured backlog path and moved it to source recovery after confirming that only an empty project subdirectory remains and no alternate local copy exists.
- [x] 2026-08-26: Audited a damaged checkout that retains only Git hooks and found a nine-file editor recovery snapshot; preserved it as partial evidence without inventing chronology, authorship, delivery, or outcomes.
- [x] 2026-08-26: Added normalized technical domains to private activities and defined the future percentage view as a weighted recorded-activity mix rather than time, effort, or line-count estimation.
- [x] 2026-08-26: Resolved the private Rebolt umbrella into two linked repositories and consolidated their all-reference history into 16 dated activities and 9 workstreams, separating default-branch delivery from retained branch and uncommitted work.
- [x] 2026-08-26: Reviewed the private infrastructure-as-code repository and consolidated five attributed default-branch commits into three DevOps/infrastructure activities and one preview-deployment reliability workstream without copying sensitive configuration values.
- [x] 2026-08-26: Reviewed a large private extension workspace, separating two product families and repository governance into six evidence-dated activities and three workstreams; the complete local quality gate passed, while adoption, deployment, cost, and roadmap outcome claims remain pending owner confirmation.
- [x] 2026-08-26: Reviewed a knowledge-platform shell and its separately governed editorial repository, consolidating 189 scanned commits into nine activities and three workstreams across product evolution, reusable static-site architecture, publishing automation, editorial quality, and localized technical education while preserving local-only delivery state and open validation warnings.
- [x] 2026-08-26: Reviewed the large private multi-tenant site platform, consolidating 2,568 owner-attributed all-reference commits into 11 activities and 5 workstreams while separating staging-only delivery, an explicit deploy/cron freeze, and current uncommitted section work from production and impact claims.
- [x] 2026-08-26: Reviewed the public streaming-platform repository, consolidating 44 owner-attributed all-reference commits into 6 activities and 3 workstreams covering production-oriented architecture, public governance, and bounded runtime foundations without claiming a playable or hosted product.
- [x] 2026-08-26: Resolved the full 21-root Fengsoft umbrella, consolidating it into 14 activities and 5 workstreams covering reusable core services, tooling, earlier product lineages, licensed-source custody, the central SaaS platform, generated editions, and the uncommitted studio site.
- [x] 2026-08-26: Confirmed Launch and Scale as generated downstream editions of the central platform; retained Starter and Premium as earlier or sibling lineages because repository evidence does not confirm the recalled export relationship.
- [x] 2026-08-26: Excluded two unborn `.local-*` generated snapshots and current uncommitted edition changes from independent activity counts, avoiding generated-code duplication.
- [x] 2026-08-26: Verified all 58 commit objects cited by the Fengsoft consolidation in their 18 source repositories.
- [x] 2026-08-26: Completed the inventory with 91 canonical activities and 43 workstreams, produced a prioritized private owner-review packet, and kept 149 unverified result statements out of achievements.
- [ ] Owner completes the prioritized review packet for attribution, deployment, adoption, outcomes, public boundaries, and three source-recovery cases.

## Decisions

- Preserve the existing version 1 private initiatives as valid legacy records; do not mechanically convert contributions into dated activities or achievements.
- Add activities and workstreams as first-class private records instead of overloading commits or public entries.
- Keep evidence provenance distinct from outcome evidence levels: provenance describes where a claim came from, while evidence level describes the support for a public result.
- Treat missing significance on already-approved entries as `activity`, the least promotional classification.
- Keep new public metadata optional at the source-schema level for backward compatibility, but normalize it in generated datasets so renderers and exports have a stable shape.
- Do not edit approved public content or the seven existing private publication candidates under this plan.
- Represent full-stack activity with both `frontend` and `backend`; do not add a separate full-stack bucket. Split each activity's unit weight equally across its domains when deriving a recorded-activity mix.
- Keep the exact owner-supplied project backlog in ignored private storage; the versioned plan records only the existence of the follow-up stage.

## Surprises

- The current implementation already includes a strong approval boundary, deterministic preview pipeline, optional resume projection, and full PT-BR generation in the uncommitted working tree.
- Eleven consolidated initiatives and twelve drafts already exist privately, so a breaking schema replacement would invalidate meaningful owner data.
- Browser verification exposed stale initiative-only timeline copy even though the data model and renderer were correct; the English and PT-BR methodology copy now describes activities, workstreams, milestones, and outcomes.
- The owner added a larger WSL project review backlog after implementation began. Its exact identifiers remain in ignored private storage and do not appear in `dist/`.
- The Fengsoft directory is an umbrella containing 21 Git roots. Two `.local-*` roots are unborn generated snapshots without independent chronology, while the Launch and Scale histories and manifests explicitly identify the central platform as their source.
- The expected bjj-next path currently contains only empty directories and no Git metadata or source files; no alternative copy was found under `/home`, so this item needs source recovery rather than speculative activity creation.
- One recovered package-workspace checkout has an unborn branch and an entirely untracked current snapshot while its complete 21-commit history remains reachable from a remote-tracking reference and annotated tags. The scanner now records the selected fallback reference explicitly instead of rejecting that evidence.
- A second expected project path contains only an empty directory and no Git metadata or source files, so it cannot support canonical records until source evidence is recovered.
- Another expected checkout lost its working tree and nearly all Git metadata, but an editor cache preserves a small code snapshot. That cache can guide recovery questions but is too weak to support dated canonical activity by itself.
- Two large shared repositories retained most of the owner's reviewed history outside the current branch. Explicit local-branch, remote-branch, and tag scanning recovered that history while excluding stashes and avoiding unsupported delivery claims.
- Object-level verification exposed several initially transcribed commit hashes whose prefixes matched but complete values did not resolve. The private evidence references were corrected from the local scans before the records were accepted.
- One private workspace arrived as a very large initial snapshot with only two owner commits. Its canonical records therefore share the supported import date and are separated by system boundary, without fabricating pre-import chronology from file contents or roadmap prose.
- One backlog item is intentionally split across a public reusable shell and a private editorial repository. The local content branch is ten commits ahead of its remote, and the current build passes while still emitting two static-route conflicts and a client-chunk warning; those delivery and quality boundaries remain explicit in the private ledger.
- The owner-recalled Starter and Premium relationship is not supported as a direct export relationship by the observed chronology. The current platform explicitly generates only Launch and Scale, while Starter and Premium preserve independent earlier histories and different source boundaries.
- The current studio portfolio implementation is substantial but almost entirely uncommitted, so its observation date, contribution scope, and active status are recorded without inventing an implementation start date or public launch.

## Validation

```bash
npm run career:validate-private
npm run career:review
npm run career:preview
npm run check
git diff --check
```

Inspect English and PT-BR timelines, one entry, one project, generated JSON, the private preview banner and robots policy, keyboard focus, mobile layout, and a build with `BASE_PATH=/test-repository`. Confirm that public generation still reads only `content/public/` and that no private identity, evidence, path, or unapproved claim appears in `dist/`.

Latest complete validation on 2026-08-26:

- `npm run check`: passed validation, privacy audit, all 34 tests, and the bilingual static build with 58 generated pages and assets;
- `npm run career:validate-private`: validated 91 activities and 43 workstreams while preserving 12 legacy drafts and 11 legacy initiatives;
- `npm run career:preview`: generated 70 ignored preview files from seven existing candidates;
- skill package validation: all six modified or new skills passed;
- browser verification: combined filtering, search empty state, language switching, entry/project projections, desktop layout, and 390 px mobile layout passed with no console warnings or errors;
- `git diff --check` and JSON parsing for all changed canonical schemas passed;
- all 58 commit objects cited by the Fengsoft umbrella records resolve in their source repositories;
- generated `dist/` contains none of the selected private Fengsoft/SeuSaaS identities, local paths, or commit hashes, and the complete public audit passes.

## Outcome

The canonical ledger foundation and the evidence-bearing WSL project inventory are complete and validated. Career Ledger now preserves dated activities, evolving workstreams, supported milestones, confirmed achievements, evidence provenance, narrative signals, enrichment questions, technical-domain classification, and private career-material projections while keeping existing legacy initiatives valid. Public records retain conservative projections and the approval boundary. Remaining work is the owner's prioritized review of attribution, delivery, adoption, outcomes, public boundaries, and the three source-recovery cases; no unconfirmed result will be promoted merely to close the plan.
