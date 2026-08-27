---
name: career-consolidate-work
description: Consolidate related private activities into stable workstreams, preserve chronological progression, deduplicate repeated analysis, and maintain workstream lifecycle. Use after several activities describe the same engineering effort.
---

# Consolidate Private Work

## Goal

Turn chronological activities into a small, durable set of private workstreams without erasing meaningful progression.

## Inputs

- `.career/private/activities/<project-id>/`
- `.career/private/workstreams/<project-id>/`
- legacy drafts and initiatives when they contain relevant prior analysis
- relevant scans and project context

## Workflow

1. Read all current activities for the selected project and period.
2. Read existing workstreams and relevant legacy initiatives before proposing new ones.
3. Group records by problem, system boundary, technical objective, and timeline.
4. Merge entries when they are phases of the same initiative.
5. Keep separate entries when they have distinct goals, owners, or outcomes.
6. Preserve every activity, normalized technical domain, source scan reference, meaningful evidence reference, and provenance state.
7. Reconcile conflicting attribution conservatively.
8. Extend the period of ongoing workstreams instead of creating monthly duplicates, but keep separate activity records when meaningful progression occurred.
9. Record reached milestones only for supported completion or transition events.
10. Record achievements only for confirmed results; keep other possibilities under `potentialOutcomes`.
11. Mark lifecycle status accurately: `detected`, `active`, `completed`, `ready-for-sanitization`, or `archived`.
12. Mark a narrative signal `supported` only when at least two meaningful activities support it.

## Merge test

Two drafts probably belong together when they answer the same three questions:

- What problem or objective was being addressed?
- What system or product boundary was involved?
- What result would make the effort complete?

Technology overlap alone is not enough to merge.

## Output

Write consolidated workstreams to:

```text
.career/private/workstreams/<project-id>/<workstream-id>.json
```

Do not delete source activities, drafts, or legacy initiatives. They preserve chronology and provenance.

When summarizing a domain distribution, derive it from referenced activities: each activity has weight one, split equally across its unique domains. Label it **recorded activity mix** and never present it as hours, effort, lines of code, or ownership.

## Completion checks

- No duplicate workstream remains for the same objective.
- Workstream periods and status reflect the referenced activities.
- Activity and workstream references are bidirectional and valid.
- Contributions are readable without becoming public marketing copy.
- Attribution and outcomes remain honest.
- No public file changed.
- `npm run career:validate-private` passes.
