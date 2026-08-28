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

On 2026-08-28 the owner explicitly approved the full existing portfolio preview, including its drafts, project/company names, recommendation identities, reviewed screenshots, contact details and reviewed metrics. That approval permits promotion of those presentation records, not publication of raw private storage. Future content still needs its own approval. Approved public galleries keep captions, source categories, translations and image-specific approval; they do not read private media at build time.

Cloudflare Web Analytics is an explicitly approved production runtime exception, configured on the Pages project and injected after deployment. Local builds and previews remain tracker-free. It does not add network calls to the public content generator or relax the external-resource audit. Deployment OAuth/API credentials are not public beacon metadata and must never enter content, assets or Git. See `docs/cloudflare-release.md`.

An optional approved `content/public/resume.json` may contain reviewed experience, skills, and education. Source CV files and private contact data never become build inputs.

Localized copy inherits the boundary of its source record. A translation stored in `content/public/` is public; a translation stored with a candidate under `.career/private/` remains private. The generator never loads candidate translations during a public build.

## Frontend build boundary

Astro receives an ephemeral dataset assembled by the Node adapter after schema and privacy validation. The public path uses only approved content. An injected dataset requires `preview: true` and is rejected if its destination is `dist/` or a descendant. Temporary build inputs are removed on completion or failure.

The adapter stages only the favicon and project images explicitly referenced in the validated dataset with owner image approval. It does not expose the whole assets directory to Astro, traverse local projects, or read the private media inventory during public generation. Project images must be WebP/AVIF, size-bounded, and free of symlink path components. Image approval is not publication approval.

The optional resume recommendations follow that same approval boundary. Supplied quotes and author identities stay in the resume candidate until reviewed. Genuine profile photos may be prepared locally when the owner requests them, but the site never embeds LinkedIn or hotlinks its images. Private portrait references use `reviewPortraits` and are rejected by public builds. Approved public portraits must be explicitly referenced under `assets/portraits/`, square WebP (64–512px), at most 50 KB, with image-specific owner approval. Download URLs and original recommendation dates remain in private provenance notes; relationship labels must not imply endorsement by an author's current employer. Public availability alone does not replace owner review or any necessary permission to reuse a photo.

Private preview mode may aggregate domain classifications into recorded activity percentages, but never includes raw activities, paths, evidence, or project scan data. That aggregate remains private until separately reviewed into an approved project or resume record.

Owner-requested screenshot review is a separate, local-only presentation path. `.career/private/media-review/preview.json` references bounded WebP derivatives in its `images/` directory, with EN/PT-BR text and source-specific dates: public web capture, owner provision, local capture, or existing project-asset collection. Local captures and existing assets cannot include source URLs or paths in the manifest; their locations stay in separate private review notes. The preview adapter validates metadata, audits text, rejects symlinks, checks encoded dimensions, and passes only selected image bytes to the isolated build. Original paths never enter the dataset. The public build does not read this manifest or image directory.

These review images are not approved public assets. They are rendered only with `preview: true`, cannot be staged by a public build, and cannot be written into `dist/`. They do not receive fabricated owner approval. Public use still requires image review, an approved asset under `public/assets/projects/`, and a separately approved content record. An owner-cleared product name is not automatically a release of the data visible in a screenshot.

A web capture may explicitly set its review source `url` to `null` when the source location must stay private. Record the real address in separate private review notes. The preview retains the web-capture kind and date but renders no source link. This does not exempt any supplied URL, caption, or image metadata from auditing; privacy rules and public-image approval remain unchanged.

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

Publicly identifiable or explicitly owner-cleared project names may remain in private candidates. Record that authorization and its scope in private context; do not conflate a private repository with a confidential product identity. Revising an owner-defined identity restriction does not disable secret, internal-URL, ticket, or customer-data checks and does not approve publication.

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
