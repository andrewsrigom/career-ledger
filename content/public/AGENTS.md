# Public Content Rules

These rules override broader repository guidance for every file under `content/public/`.

- Treat every byte in this directory as immediately publishable.
- Add only owner-approved, sanitized records.
- Never use this directory for drafts, examples copied from private work, temporary notes, or raw evidence.
- Every entry and project must have `publication.status` set to `approved`, `publication.sanitized` set to `true`, and complete review metadata.
- Use only canonical area labels from `taxonomy.json`.
- Keep IDs and slugs stable after publication.
- Do not invent outcomes to make a record sound stronger.
- Do not include local paths, ticket IDs, commit hashes, branches, employee names, client names, internal URLs, unpublished metrics, or sensitive security details.
- Prefer `contributed to` over `led` or `owned` when attribution is uncertain.
- Run `npm run career:validate`, `npm run career:audit`, and inspect the generated page before completion.
- Do not modify `content/public/` during initial project analysis or sanitization. Promotion requires explicit owner approval through the approval command.
