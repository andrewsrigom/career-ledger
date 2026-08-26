# ADR 0003: Zero-dependency public generator

- Status: Accepted
- Date: 2026-08-26

## Context

The public site is content-focused and does not require server rendering, a CMS, or application state. A framework would add installation, upgrade, and supply-chain overhead to an otherwise small static pipeline.

## Decision

Generate HTML, CSS, JavaScript, JSON, XML, and static assets with Node.js standard-library modules only.

## Consequences

- The repository runs immediately after unzip when Node.js is present.
- Builds are easy to audit and reproduce.
- GitHub Pages deployment does not install third-party packages.
- Template code must be maintained directly.
- A framework migration remains possible if site complexity later justifies it.
