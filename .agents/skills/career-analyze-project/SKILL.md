---
name: career-analyze-project
description: Analyze a configured local software project and its latest private Git scan to capture meaningful chronological activities and update evidence-backed workstreams. Use for repository analysis or career evidence extraction. Never use it to publish public content.
---

# Analyze a Local Project

## Goal

Convert local implementation evidence into dated private activities and evolving workstreams without copying source code or creating public portfolio copy.

## Preconditions

- The project exists in `career.local.json`.
- The latest scan exists under `.career/private/scans/<project-id>/`.
- Codex has read access to the project path, preferably through `--add-dir`.
- Read the configured project context file when present.

If a scan is missing, run:

```bash
npm run career:scan -- --project <project-id>
```

## Workflow

1. Read `AGENTS.md`, `docs/privacy-model.md`, and `docs/data-model.md`.
2. Read the latest scan and prior scans needed to understand continuity.
3. Read existing activities, workstreams, legacy drafts, and initiatives for this project before creating anything new.
4. Inspect the local project directly, beginning with changed files, tests, documentation, and nearby architecture.
5. Capture a new activity only when the evidence shows meaningful professional work or meaningful progression in an existing workstream.
6. Group related changes by problem, system boundary, technical objective, and timeline; never use the commit as the unit of career meaning.
7. Classify activities with semantic types, normalized technical domains, progression, and the least promotional supported significance.
8. Record evidence provenance as `observed`, `provided`, `derived`, `inferred`, or `unverified`; do not blur inference into fact.
9. Determine what the evidence supports about the owner's contribution and keep attribution uncertainty explicit.
10. Create or update private activities and workstreams only, then run private validation.

## Evidence hierarchy

Prefer evidence in this order:

1. implementation plus tests and documentation;
2. multiple related commits and changed areas;
3. architecture or decision records;
4. project context supplied by the owner;
5. commit messages alone.

Commit volume and changed-line count are weak evidence of importance.

## Attribution

Use these scopes precisely:

- `implemented`: evidence supports direct implementation work;
- `contributed`: evidence supports participation but not broad ownership;
- `designed`: evidence supports authorship of a technical design or approach;
- `led`: explicit context supports technical direction or coordination;
- `owned`: explicit context supports sustained responsibility for the area;
- `investigated`: evidence supports diagnosis, evaluation, or research.

Never infer `led` or `owned` from repository breadth alone.

## Significance and outcomes

Use `activity` for normal meaningful work and `notable` when scope, complexity, ownership, or expertise is unusually informative. Use `milestone` only for completed, supported progress. Use `achievement` only when at least one outcome is confirmed and evidence-backed.

Implementation evidence can support a delivered capability. It cannot by itself support claims about adoption, incident reduction, revenue, conversion, latency, cost, reliability, or user satisfaction.

Write unverified results under `potentialOutcomes` with:

```json
{
  "status": "needs-confirmation",
  "evidenceLevel": "unknown"
}
```

## Output

Write dated activities to:

```text
.career/private/activities/<project-id>/<activity-id>.json
```

Use `schemas/private-activity.schema.json`. Evidence IDs must be unique within the project. Set `workstreamId` when the activity clearly belongs to an existing or newly created workstream.

Classify `domains` by the technical surfaces materially changed, using only the schema enum. Represent full-stack work with both `frontend` and `backend`; never invent a `full-stack` domain. Do not tag a supporting test or deployment surface unless it was itself a meaningful part of the activity.

Create or update the corresponding workstream at:

```text
.career/private/workstreams/<project-id>/<workstream-id>.json
```

Use `schemas/private-workstream.schema.json`. Preserve activities as separate chronological records and reference them through `activityIds`.

Private records may include detailed references but must not copy full source files, secrets, customer data, or large code fragments.

## Completion checks

- Each activity represents professional meaning or progression, not a commit.
- Each activity has evidence-supported normalized domains suitable for a recorded-activity mix.
- Related work updates an existing workstream instead of creating a duplicate.
- Milestones and achievements pass their stronger evidence gates.
- Attribution language is conservative.
- Unsupported outcomes remain unconfirmed.
- No public file changed.
- `npm run career:validate-private` passes.
