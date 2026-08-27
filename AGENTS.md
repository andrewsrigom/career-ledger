# AGENTS.md

## Mission

Maintain a private-first engineering career ledger that turns evidence from local work into accurate, sanitized, owner-approved public records.

The public website is not a commit feed. It communicates meaningful initiatives, contributions, projects, and verified outcomes.

## Read before acting

Use the relevant repository skill under `.agents/skills/` for career analysis, consolidation, sanitization, publication review, or site maintenance.

Read these documents when the task touches their scope:

- `docs/privacy-model.md`
- `docs/operating-model.md`
- `docs/data-model.md`
- `docs/codex-workflow.md`
- `docs/definition-of-done.md`
- `PLANS.md` for complex work

## Source-of-truth boundaries

- `content/public/` is the only publishable content source.
- `.career/private/` contains private scans, evidence, drafts, candidates, and review reports. It is ignored by Git.
- `career.local.json` contains local paths, identities, and sensitive terms. It is ignored by Git.
- `dist/` is generated and must never be edited by hand.
- Never copy source files from an analyzed repository into this repository.
- Never make the public build read from local repositories, `.career/private/`, Git history, environment secrets, or network APIs.

## Non-negotiable privacy rules

- Never write client names, internal product names, ticket IDs, employee names, internal URLs, local paths, repository remotes, commit hashes, incident details, credentials, customer data, or raw evidence into `content/public/`.
- Generalize confidential systems by domain and function, not by replacing one internal name with another recognizable identifier.
- Treat file paths and commit messages as private evidence.
- Do not publish security-sensitive implementation details that could make a private system easier to attack.
- Run `npm run career:audit` before any public-content change is considered complete.
- Never weaken, bypass, or silently allowlist a privacy finding to make a task pass.

## Attribution rules

- Code proves that an implementation exists. It does not prove who designed the entire system.
- Git authorship proves that an identity committed a change. It does not prove sole ownership, business impact, production success, or leadership.
- Distinguish `implemented`, `contributed to`, `investigated`, `designed`, `led`, and `owned` carefully.
- Use conservative language when ownership is uncertain.
- Record attribution uncertainty in private drafts rather than smoothing it over in public prose.

## Outcome rules

- Never infer measurable improvement from code alone.
- Do not claim reduced incidents, higher conversion, lower latency, cost savings, adoption, revenue, reliability, or user satisfaction without explicit evidence.
- Separate deliverables from outcomes.
- Mark unconfirmed outcomes as `needs-confirmation` in private drafts.
- Public outcomes must be observed, measured, or explicitly self-reported and reviewed by the owner.

## Agent workflow

1. Inspect existing context and prior initiatives before creating a new record.
2. Scan incrementally when possible.
3. Convert activity into workstreams, then initiatives. Do not create one record per commit.
4. Keep evidence and analysis private.
5. Create a sanitized candidate only after attribution and scope are credible.
6. Review the candidate for confidentiality, unsupported claims, duplication, and clarity.
7. Never move a candidate to `content/public/` without explicit owner approval.
8. Run the required validation, audit, tests, and build.

## Engineering expectations

- Keep the private ledger engine on Node.js standard-library APIs and ESM.
- Write maintained tooling, tests, and frontend logic in strict TypeScript. Use the existing native Node type-stripping entrypoints; keep runtime validation for unknown JSON and shared contracts in `scripts/lib/model.ts`.
- The owner-approved static frontend uses Astro, TypeScript, GSAP, and Three.js; bundle dependencies locally and justify any additional runtime dependency.
- Keep Three.js isolated to the hero, respect reduced motion, and preserve complete reading/navigation without JavaScript.
- Keep output deterministic. Do not insert build timestamps that create meaningless diffs.
- Support Windows, WSL, macOS, and Linux paths where practical.
- Prefer full, readable functions over clever abstractions.
- Preserve accessibility, responsive behavior, and GitHub Pages base-path support.
- Do not redesign the site into a SaaS dashboard. The visual language is editorial, calm, and evidence-focused.

## Required commands

For changes to scripts, schemas, public content, or site code, run:

```bash
npm run check
```

For public-content work, also inspect the generated site and confirm no private data appears in `dist/`.

## Definition of done

A task is done only when:

- the requested behavior works;
- privacy boundaries remain intact;
- public claims are supported and correctly scoped;
- tests cover meaningful logic changes;
- `npm run check` passes;
- documentation is updated when behavior or workflow changed;
- generated files are not committed unless explicitly documented.

## Code review rules

Flag as blocking:

- any path from private storage to public generation;
- any automatic publication without owner approval;
- unsupported impact or leadership claims;
- accidental network access in the default offline workflow;
- secret-like values or internal identifiers in public content;
- root-relative links that break GitHub project pages;
- generated `dist/` edits;
- tests removed or audit rules weakened without a stronger replacement.
