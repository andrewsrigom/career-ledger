# Execution Plans

Use an execution plan for work that is multi-step, touches privacy boundaries, changes the data model, changes publication behavior, or is likely to require more than one focused coding session.

Create the plan in `plans/active/<short-name>.md` from `plans/TEMPLATE.md`.

An execution plan is a living document. Keep these sections current while working:

- **Purpose**: the user-visible result and why it matters.
- **Context**: relevant files, constraints, and current behavior.
- **Privacy impact**: whether data can move between private and public layers.
- **Plan**: concrete milestones in implementation order.
- **Progress**: timestamped completed and remaining work.
- **Decisions**: important choices and alternatives rejected.
- **Surprises**: unexpected behavior, failures, or discoveries.
- **Validation**: exact commands and manual checks.
- **Outcome**: what changed, remaining limitations, and follow-up work.

Plans must be self-contained enough that another agent can continue without relying on hidden conversation context.

Do not create a plan for a trivial text correction or isolated style adjustment.

When complete, move the plan to `plans/completed/` and preserve the final validation and outcome sections.
