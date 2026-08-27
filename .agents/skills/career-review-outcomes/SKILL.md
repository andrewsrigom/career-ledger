---
name: career-review-outcomes
description: Review private initiatives for outcomes that became known after implementation, identify claims needing owner confirmation, and create structured follow-up notes. Use for weekly, monthly, quarterly, or performance-review preparation.
---

# Review Outcomes

## Goal

Prevent real results from being forgotten while refusing to manufacture impact that is not supported.

## Workflow

1. Read private activities and workstreams with outcomes marked `needs-confirmation`.
2. Prioritize completed or mature workstreams whose results may now be observable.
3. Check project context, owner notes, public sources, tests, telemetry summaries, or other explicitly available evidence.
4. Do not inspect confidential systems beyond the access granted for the task.
5. Produce questions the owner can answer quickly.
6. Mark an outcome `confirmed` only when the owner or evidence supports it, retaining its evidence level and provenance.
7. Mark false or overstated outcomes `rejected` and preserve the reason privately.
8. Keep metrics private unless publication is explicitly cleared.

## Useful confirmation questions

- Was the work deployed or adopted?
- Did it remove a known limitation or unblock a launch?
- Is there a measured performance, reliability, support, or cost result?
- Did it change team workflow or reduce repeated manual work?
- Is the result safe to describe publicly without the metric?
- Is the owner's role accurately represented?

## Output

Write a review under:

```text
.career/private/outcome-reviews/<year>/<date>-review.md
```

Update private activities or workstreams only when evidence or owner confirmation changes their status. Promote a workstream achievement only when a referenced activity contains a confirmed outcome and the supporting evidence is explicit.

## Completion checks

- Questions are specific and answerable.
- No metric or outcome was inferred from implementation alone.
- Rejected claims are not silently removed from history.
- Activities are not promoted to achievements merely because implementation is complete.
- No public file changed.
