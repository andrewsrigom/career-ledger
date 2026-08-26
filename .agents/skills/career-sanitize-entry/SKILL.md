---
name: career-sanitize-entry
description: Transform a mature private career initiative into a safe public entry or project candidate. Use only after attribution and outcomes have been reviewed. Never write directly to approved public content.
---

# Sanitize a Career Record

## Goal

Create a credible public candidate that preserves the engineering substance while removing confidential and unsupported detail.

## Preconditions

- The private initiative exists and is mature enough to describe.
- Attribution uncertainty has been reviewed.
- Outcomes are confirmed, rejected, or intentionally omitted.
- The owner has not prohibited publication of the workstream.

## Workflow

1. Read the initiative, supporting private context, and prior public records.
2. Decide whether the best public shape is an `entry` or `project`.
3. Generalize organizations and systems by domain and function.
4. Remove all internal names, ticket IDs, people names, paths, branches, hashes, URLs, private metrics, and raw evidence.
5. Reduce security-sensitive specificity.
6. Preserve exact scope with careful verbs.
7. Prefer a strong contribution statement with no outcome over an invented outcome.
8. Avoid generic portfolio language such as “leveraged cutting-edge technology.”
9. Check for duplication with existing public entries.
10. Write a private candidate and run the candidate audit.

## Public writing standard

A candidate should answer:

- What system, problem, or product area was involved?
- What did the owner actually contribute?
- What changed or was delivered?
- What outcome is genuinely known?
- Which engineering areas does the work demonstrate?

It should not read like a ticket, resume keyword list, confidential case study, or inflated marketing claim.

## Output

Write to:

```text
.career/private/public-candidates/<slug>.json
```

Use `recordType` to distinguish `entry` and `project`.

Set publication metadata to:

```json
{
  "status": "candidate",
  "sanitized": true,
  "reviewedAt": null,
  "approvedBy": null
}
```

Never move the file into `content/public/`.

## Completion checks

```bash
node scripts/career.mjs audit --candidate <slug>
```

Also confirm:

- no blocked term remains;
- no unsupported ownership or impact claim remains;
- the candidate adds a distinct signal to the public record;
- no public file changed.
