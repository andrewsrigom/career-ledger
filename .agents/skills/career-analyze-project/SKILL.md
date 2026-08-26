---
name: career-analyze-project
description: Analyze a configured local software project and its latest private Git scan to identify meaningful engineering workstreams. Use for repository analysis, career evidence extraction, or updating private drafts. Never use it to publish public content.
---

# Analyze a Local Project

## Goal

Convert local implementation evidence into conservative private drafts that explain meaningful engineering work without copying source code or creating public portfolio copy.

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
3. Read existing drafts and initiatives for this project before creating anything new.
4. Inspect the local project directly, beginning with changed files, tests, documentation, and nearby architecture.
5. Identify workstreams that are meaningful beyond a single commit.
6. Separate routine implementation noise from architecture, investigation, product delivery, reliability, developer experience, or other durable work.
7. Determine what the evidence supports about the owner's contribution.
8. Capture uncertain attribution or impact explicitly.
9. Create or update private drafts only.
10. Run private validation before finishing.

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

## Outcomes

Implementation evidence can support a delivered capability. It cannot by itself support claims about adoption, incident reduction, revenue, conversion, latency, cost, reliability, or user satisfaction.

Write unverified results under `potentialOutcomes` with:

```json
{
  "status": "needs-confirmation",
  "evidenceLevel": "unknown"
}
```

## Output

Write drafts to:

```text
.career/private/drafts/<project-id>/<initiative-id>.json
```

Use `schemas/private-initiative.schema.json`.

A draft should include evidence references but must not copy full source files, secrets, customer data, or large code fragments.

## Completion checks

- The draft represents an initiative, not a commit list.
- Existing initiatives were updated instead of duplicated when appropriate.
- Attribution language is conservative.
- Unsupported outcomes remain unconfirmed.
- No public file changed.
- `node scripts/career.mjs validate-private` passes.
