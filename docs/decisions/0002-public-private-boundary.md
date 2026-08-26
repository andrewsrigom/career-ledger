# ADR 0002: Separate private evidence from public content

- Status: Accepted
- Date: 2026-08-26

## Context

A single repository that mixes raw evidence and public pages creates a high risk of accidental disclosure, especially when an agent performs most maintenance work.

## Decision

Store local evidence, drafts, candidates, state, and sensitive configuration only in ignored paths. Make `content/public/` the exclusive source for public generation.

Require an interactive owner approval command before moving a candidate into the public source.

## Consequences

- Agents can analyze and draft without gaining publication authority.
- CI can safely build a public repository because private inputs are absent.
- Public claims have a visible approval state.
- The owner must perform an explicit promotion step.
- Privacy checks remain defense in depth rather than the only barrier.
