---
name: career-consolidate-work
description: Consolidate related private career drafts into stable initiatives, deduplicate repeated analysis, and maintain initiative lifecycle over time. Use after several scans or drafts describe the same engineering effort.
---

# Consolidate Private Work

## Goal

Turn fragmented drafts into a small, durable set of private initiatives that reflect coherent engineering efforts over time.

## Inputs

- `.career/private/drafts/<project-id>/`
- `.career/private/initiatives/<project-id>/`
- relevant scans and project context

## Workflow

1. Read all current drafts for the selected project and period.
2. Read existing initiatives before proposing new ones.
3. Group records by problem, system boundary, technical objective, and timeline.
4. Merge entries when they are phases of the same initiative.
5. Keep separate entries when they have distinct goals, owners, or outcomes.
6. Preserve every source scan reference and meaningful evidence reference.
7. Reconcile conflicting attribution conservatively.
8. Extend the period of ongoing initiatives rather than creating monthly duplicates.
9. Mark lifecycle status accurately: `detected`, `active`, `completed`, `ready-for-sanitization`, or `archived`.
10. Keep unconfirmed outcomes as unconfirmed.

## Merge test

Two drafts probably belong together when they answer the same three questions:

- What problem or objective was being addressed?
- What system or product boundary was involved?
- What result would make the effort complete?

Technology overlap alone is not enough to merge.

## Output

Write consolidated initiatives to:

```text
.career/private/initiatives/<project-id>/<initiative-id>.json
```

Do not delete source drafts. They provide provenance.

## Completion checks

- No duplicate initiative remains for the same workstream.
- Initiative periods and status reflect the latest evidence.
- Contributions are readable without becoming public marketing copy.
- Attribution and outcomes remain honest.
- No public file changed.
- `node scripts/career.mjs validate-private` passes.
