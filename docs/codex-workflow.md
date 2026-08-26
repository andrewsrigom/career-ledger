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

Codex can select them implicitly, but explicit invocation is preferable for sensitive workflow stages.

## Analysis sequence

### 1. Scan

```bash
npm run career:scan -- --project <id>
```

The scan is incremental after the first run and records private Git metadata. It fails instead of silently truncating a history window that exceeds `maxCommits`; increase the limit and rerun when that happens.

### 2. Analyze

Ask Codex:

```text
Use $career-analyze-project for <id>. Inspect the latest scan and the configured
project directly. Create or update private drafts only. Do not create public copy.
```

The agent should identify workstreams rather than restating commits.

### 3. Consolidate

When multiple drafts describe one initiative:

```text
Use $career-consolidate-work for <id> and the current review period.
```

The agent should update an existing initiative when the work is a continuation.

### 4. Confirm attribution and outcomes

Review private fields marked uncertain or `needs-confirmation`.

Code can support contribution claims. Business and production outcomes require separate confirmation.

### 5. Sanitize

```text
Use $career-sanitize-entry on <private initiative id>.
```

The result remains private under `.career/private/public-candidates/`.

### 6. Review

```text
Use $career-review-publication on <candidate slug>.
```

The agent produces a review report and should block publication when privacy, attribution, evidence, duplication, or clarity is unresolved.

### 7. Approve

```bash
npm run career:approve -- --candidate <slug>
```

Approval is intentionally interactive.

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
review newly detected workstreams
merge drafts into ongoing initiatives
record outcomes that became known
sanitize only mature initiatives
publish only records worth keeping publicly
```

The ledger should remain selective. A smaller set of credible entries is stronger than an exhaustive activity feed.
