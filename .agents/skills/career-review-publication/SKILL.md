---
name: career-review-publication
description: Perform the final privacy, evidence, attribution, duplication, and writing review of a sanitized public candidate. Use before owner approval. This skill reviews but never approves or publishes its own output.
---

# Review a Public Candidate

## Goal

Give the owner a clear publication recommendation without assuming authority to publish.

## Review dimensions

### Privacy

- No client, internal product, person, ticket, branch, path, hash, URL, credential, private metric, or identifiable security detail.
- Generalization is sufficient to prevent easy reconstruction of the private source.

### Attribution

- Verbs match the supported role.
- Team work is not presented as sole ownership.
- `led`, `owned`, and `designed` are backed by explicit private context.

### Outcomes

- Every public outcome has an accepted evidence level.
- Deliverables are not disguised as measured impact.
- Unknown results are omitted.

### Significance

- `activity` and `notable` entries do not imply a result that is not supported.
- `milestone` describes a completed delivery, transition, or stage with supporting evidence.
- `achievement` includes at least one supported outcome and remains comparatively rare.

### Quality

- The record is specific enough to be useful.
- It explains an initiative rather than listing tasks.
- It does not duplicate an existing entry or project.
- The title and summary are readable without internal context.
- Technologies support the story rather than replacing it.

## Output

Write a report to:

```text
.career/reports/publication/<slug>.md
```

Use one recommendation:

- `READY FOR OWNER APPROVAL`
- `REVISE BEFORE APPROVAL`
- `DO NOT PUBLISH`

List every blocking issue and concrete revision.

## Authority boundary

Do not run the approval command. Do not modify `content/public/`. Do not change candidate approval metadata.

The owner performs approval interactively:

```bash
npm run career:approve -- --candidate <slug>
```
