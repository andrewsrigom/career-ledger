# Privacy Model

## Objective

Career Ledger must be safe to host in a public repository even when it is used to analyze confidential work locally.

The design assumes that source repositories, commit messages, file paths, project context, and evidence may contain confidential information.

## Trust boundaries

### Private boundary

Private data includes:

- local repository paths;
- source code and architecture details from non-public projects;
- raw Git history and commit messages;
- internal project names, ticket identifiers, URLs, and people names;
- attribution notes;
- incomplete or uncertain outcome claims;
- drafts and unsanitized summaries.

Private data belongs only in:

```text
career.local.json
.career/private/
.career/state/
.career/reports/
.career/tmp/
```

These paths are ignored by Git.

### Public boundary

Public data includes only owner-reviewed records under:

```text
content/public/
```

The site generator reads no other content source.

Generated output under `dist/` is public by definition.

## Publication invariant

A private initiative may become public only through this sequence:

```text
private evidence
  → private initiative
  → sanitized public candidate
  → privacy and claim review
  → explicit owner approval
  → content/public/
  → build
```

No agent, script, scheduled task, or future integration may skip explicit owner approval.

## What sanitization means

Sanitization is not a simple find-and-replace operation. A safe public record should:

- describe the domain without naming the client;
- describe the system function without exposing internal product names;
- remove ticket IDs, branch names, commit hashes, URLs, local paths, and people names;
- reduce security-sensitive specificity;
- preserve the engineer's real scope without implying sole ownership;
- distinguish delivered work from measured outcomes;
- omit confidential metrics unless explicitly cleared for publication.

Example:

```text
Private:
Implemented direct authentication for Internal Product X using a named provider,
internal validation endpoint, and an internal ticket identifier.

Public:
Contributed to redesigning authentication for an embedded financial application,
including token validation, identity verification, and improved failure visibility.
```

## Automated safeguards

The audit command checks public content and staged files for:

- common credentials and tokens;
- private keys and connection strings;
- local filesystem paths;
- private network addresses;
- internal-domain patterns;
- ticket-like identifiers;
- blocked key names;
- owner-defined confidential terms from `career.local.json`.

Automated checks reduce risk but do not replace human review.

## Safe defaults

- Network access is absent from the default workflow.
- Scans store metadata privately and never copy source code.
- Git remotes are not collected.
- The public generator is deterministic and reads only committed public JSON.
- CI has no access to local configuration or private evidence.
- Staged-file checks reject ignored private paths if they are force-added.

## Future integrations

A future GitHub, GitLab, Jira, or Notion integration must write only to the private evidence layer.

Integration data must be treated as untrusted and potentially confidential. It cannot directly produce or modify approved public entries.
