# Optional GitHub Enrichment

Career Ledger starts from local repositories because local source, tests, documentation, and Git history provide the strongest evidence and also work for private company projects without API access.

Personal and open-source projects can later be enriched with public GitHub metadata without adding a backend.

## Intended boundary

A GitHub adapter may collect only allowlisted repositories and write only to:

```text
.career/private/integrations/github/
```

It must never write directly to `content/public/` or modify approval metadata.

## Useful public evidence

- repository description and topics;
- pull requests authored or reviewed by the owner;
- issues and discussions;
- releases and tags;
- public contribution dates;
- public URLs that may be attached to an approved project.

This data can improve attribution and provide public-source evidence, but it does not prove business impact or sole ownership.

## Authentication

Prefer the authenticated GitHub CLI or an environment-provided token when enrichment is implemented.

Never store a token in:

```text
career.local.json
content/public/
Git history
scan files
agent prompts
```

Local configuration should contain repository allowlists and adapter settings only.

## Offline-first sync design

A future command can remain local and explicit:

```text
career github sync --repository owner/repository
```

The command should:

1. confirm the repository is allowlisted;
2. fetch public metadata incrementally;
3. cache raw responses privately;
4. normalize records into private evidence;
5. connect them to existing local scans where possible;
6. leave consolidation, sanitization, review, and approval unchanged.

A scheduled backend is unnecessary unless multi-device or multi-user operation becomes a real requirement.

## Deduplication

The same change may appear in local Git history and GitHub pull-request data. The adapter should correlate by commit hash privately and keep one logical evidence reference per contribution.

Commit hashes remain private even when the repository is public unless the owner intentionally adds a public link to an approved record.

## Publication invariant

GitHub metadata can strengthen a candidate. It can never make a candidate public automatically.
