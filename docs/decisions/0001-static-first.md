# ADR 0001: Static-first architecture

- Status: Accepted
- Date: 2026-08-26

## Context

The system needs to maintain a public career record while most evidence lives in local or confidential repositories. The initial owner is a single engineer using Codex locally.

## Decision

Use local JSON and files as the private workspace, approved JSON as the public source, Node.js as a dependency-free generator, and GitHub Pages as the host.

No backend, database, authentication layer, or permanent server runtime is included.

## Consequences

Positive:

- low maintenance and zero hosting cost;
- auditable Git history;
- strong public/private separation;
- no online service receives confidential source data by default;
- the generated site is portable.

Tradeoffs:

- local files are the private source of truth;
- multi-device sync is manual;
- scheduled ingestion is limited;
- owner approval happens locally.

A backend may be introduced only when these limitations become concrete product requirements.
