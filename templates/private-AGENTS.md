# Private Career Workspace

Everything under this directory is private working material and must remain outside Git.

## Rules

- Never move a file from this directory into `content/public/` directly.
- Never copy source code, credentials, customer data, complete diffs, or large code fragments from an analyzed repository.
- Keep repository paths, commit hashes, commit messages, ticket identifiers, people names, internal URLs, private metrics, and attribution uncertainty here only.
- Treat scans as evidence, not accomplishments.
- Capture meaningful dated activities, not one record per commit.
- Classify each activity with normalized technical domains based on the surfaces materially changed; use both `frontend` and `backend` for full-stack work.
- Group related activities into workstreams while preserving their chronological progression.
- Use `milestone` only for supported completion or transition events and `achievement` only for confirmed outcomes.
- Preserve whether evidence is observed, provided, derived, inferred, or unverified.
- Keep unsupported outcomes as `needs-confirmation`.
- Use conservative attribution and record uncertainty rather than inventing a polished claim.
- A sanitized candidate remains private until the owner runs the interactive approval command.
- Do not modify `content/public/` while analyzing, consolidating, reviewing outcomes, sanitizing, or reviewing publication.

Run private validation after changing activities, workstreams, drafts, or initiatives:

```bash
node scripts/career.mjs validate-private
```
