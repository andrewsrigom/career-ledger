# Codex Workflow

## Why Codex works from local repositories

The primary source is the checked-out project, not an API integration. Local access gives Codex the implementation, tests, documentation, and Git history needed to understand a workstream more accurately than commit titles alone.

Career Ledger still avoids copying source code into its own repository. Codex reads the configured project in place.

## Granting project access

Start Codex from the Career Ledger repository and grant the target project directory with `--add-dir`:

```bash
codex --add-dir "/absolute/path/to/project"
```

The scan command prints a complete suggested invocation for the selected project.

Grant only the directories required for the current task. Do not use an unrestricted sandbox merely to avoid configuring access.

## Skills

Repository skills live under `.agents/skills/`:

- `$career-analyze-project`
- `$career-consolidate-work`
- `$career-review-outcomes`
- `$career-sanitize-entry`
- `$career-review-publication`
- `$career-maintain-site`
- `$career-compose-material`

Codex can select them implicitly, but explicit invocation is preferable for sensitive workflow stages.

## Analysis sequence

### 1. Scan

```bash
npm run career:scan -- --project <id>
```

The scan is incremental after the first run and records private Git metadata. It fails instead of silently truncating a history window that exceeds `maxCommits`; increase the limit and rerun when that happens. Local configuration accepts up to 10,000 commits per scan so large repositories can still be captured without silent truncation. For a recovered checkout whose `HEAD` is unborn, the scanner may use a reachable branch, remote, or tag reference and records the selected fallback as a warning; a repository with no reachable commit still fails closed.

When meaningful work is distributed across retained feature branches rather than reachable from the current branch, run `npm run career:scan -- --project <id> --all-refs`. This mode scans commits reachable from local branches, remote branches, and tags, deliberately excludes stashes, always uses the configured date window, and does not advance single-head incremental state.

### 2. Analyze

Ask Codex:

```text
Use $career-analyze-project for <id>. Inspect the latest scan and the configured
project directly. Create or update private drafts only. Do not create public copy.
```

The agent should capture meaningful dated activities, then connect them to evolving workstreams. It should not restate commits or create an activity when nothing professionally meaningful changed.

### 3. Consolidate

When multiple activities describe one larger effort:

```text
Use $career-consolidate-work for <id> and the current review period.
```

The agent should update an existing workstream when the work is a continuation while preserving each meaningful activity as chronology.

Run `npm run career:review` to summarize the private queues and the current **recorded activity mix**. The mix gives every activity one unit divided equally across its normalized technical domains, so it describes the ledger records rather than hours or effort.

### 4. Confirm attribution and outcomes

Review private fields marked uncertain or `needs-confirmation`. Record milestones only for supported completion or transition events and achievements only for confirmed results.

Code can support contribution claims. Business and production outcomes require separate confirmation.

### 5. Sanitize

```text
Use $career-sanitize-entry on <private activity or workstream id>.
```

The result remains private under `.career/private/public-candidates/`.

### 6. Review

```text
Use $career-review-publication on <candidate slug>.
```

The agent produces a review report and should block publication when privacy, attribution, evidence, duplication, or clarity is unresolved.

### 7. Preview

```bash
npm run career:preview
```

This builds all sanitized entry, project, and resume candidates with the approved public records into `.career/reports/publication-preview/`. English is available at the preview root and Brazilian Portuguese under `/pt-br/`. The output is ignored by Git, marked `noindex`, blocked by `robots.txt`, visually labeled as unpublished, and never used as the production `dist/` source.

When a record has `localizations.pt-BR`, review the English and Portuguese versions together. The translation must preserve attribution, quantitative claims, evidence levels, relationships, and the publication status of the canonical record.

Inspect the homepage, experience section when present, timeline, project and entry detail pages, relevant areas, links, desktop layout, and mobile layout before approval.

When the owner requests screenshots, prepare real captures or use explicitly supplied images. Keep originals and review derivatives private; the optional `.career/private/media-review/preview.json` manifest makes selected images visible in the local preview without granting image or publication approval. Review visible identifiers and values as well as the caption. A current website capture is not evidence that the owner implemented every visible element. The preview server watches the media-review directory; restart it after changing Node tooling.

### 8. Approve

```bash
npm run career:approve -- --candidate <slug>
```

Approval is intentionally interactive.

Explicit owner approval in the current conversation may authorize execution of that gate for the exact reviewed records. Preserve the approval scope in private review notes; this is not agent self-approval and does not authorize future drafts. The complete 2026-08-28 portfolio release includes its existing drafts, reviewed image galleries, recommendations and contact channels. With no pending candidates, the isolated local preview can still render the approved collection.

Publication to Cloudflare follows the owner-approved main-branch policy: accepting a reviewed revision into `main` authorizes deployment after its validation and browser checks pass. A passing feature-branch CI run is not deployment approval. Private candidates still require the interactive content approval above. Follow `docs/cloudflare-release.md`; upload only verified public `dist/` and keep credentials/private material outside Git. Do not infer permission to merge unrelated changes.

## Agent limitations to preserve

Codex must not:

- equate many changed files with high impact;
- infer leadership from broad repository changes;
- infer production success from merged code;
- infer ownership of pre-existing architecture;
- publish raw evidence;
- alter public content during project analysis;
- approve its own candidate.

## Weekly routine

A useful weekly routine is:

```text
scan active projects
capture meaningful activities and progression
consolidate related activities into ongoing workstreams
record outcomes that became known
recognize supported milestones and achievements
sanitize only mature activities or workstreams
publish only records worth keeping publicly
```

The ledger should remain selective. A smaller set of credible entries is stronger than an exhaustive activity feed.

## Career-material projections

Use `$career-compose-material` for private resume drafts, portfolio narratives, professional summaries, interview stories, and evidence-gap reports. These outputs must select from activities and workstreams instead of inventing experience independently.

For targeted resumes, rank evidence by relevance, impact, evidence strength, ownership, scale, recency, and distinctiveness. For interview stories, expand the same evidence into context, problem, constraints, decision, action, result, tradeoffs, and learning.
