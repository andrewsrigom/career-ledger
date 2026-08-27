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
- source CV files, personal contact details, and unreviewed employer or outcome claims.
- chronological activities, workstreams, provenance, narrative signals, enrichment questions, and derived career-material drafts.

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

An optional approved `content/public/resume.json` may contain reviewed experience, skills, and education. Source CV files and private contact data never become build inputs.

Localized copy inherits the boundary of its source record. A translation stored in `content/public/` is public; a translation stored with a candidate under `.career/private/` remains private. The generator never loads candidate translations during a public build.

## Frontend build boundary

Astro receives an ephemeral dataset assembled by the Node adapter after schema and privacy validation. The public path uses only approved content. An injected dataset requires `preview: true` and is rejected if its destination is `dist/` or a descendant. Temporary build inputs are removed on completion or failure.

The adapter stages only the favicon and project images explicitly referenced in the validated dataset with owner image approval. It does not expose the whole assets directory to Astro, traverse local projects, or read the private media inventory during public generation. Project images must be WebP/AVIF, size-bounded, and free of symlink path components. Image approval is not publication approval.

Private preview mode may aggregate domain classifications into recorded activity percentages, but never includes raw activities, paths, evidence, or project scan data. That aggregate remains private until separately reviewed into an approved project or resume record.

Public output is checked for leaked identifiers, broken base-path references, remote runtime resources, and JavaScript budgets. Astro telemetry is disabled; browser assets are bundled locally. Dependency installation is the explicit networked setup step, not part of the offline analysis/build workflow.

## Publication invariant

A private initiative may become public only through this sequence:

```text
private evidence
  → private activity
  → private workstream
  → milestone / achievement review
  → sanitized public candidate
  → privacy and claim review
  → explicit owner approval
  → content/public/
  → build
```

No agent, script, scheduled task, or future integration may skip explicit owner approval.

Resume, portfolio, summary, and interview drafts are projections inside the private boundary. They cannot become an alternate publication source or bypass candidate review.

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
