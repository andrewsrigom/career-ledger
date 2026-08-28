# 0007 — Automatic deployment of approved main revisions

Status: accepted by the owner on 2026-08-28; supersedes the manual-only deployment policy in ADR 0006.

## Context

The owner wants approved changes to publish automatically when they enter `main`, without a second manual deployment step. The portfolio already uses Pages Direct Upload and a full validation/browser harness.

## Decision

Trigger the Cloudflare workflow on pushes to `main`. Require validation, privacy audit, strict type checks, Node tests and the root plus both base-path browser suites to succeed before rebuilding the production artifact and uploading it. Keep an explicitly confirmed `workflow_dispatch` retry on `main` only.

Use the existing Pages project and production branch marker. Store a dedicated account-scoped Pages Write token in the GitHub `cloudflare-pages` environment, which permits only `main`. Never reuse the local Wrangler OAuth credential. Retain verified artifacts and previous deployments for rollback.

Acceptance into `main` is the deployment approval boundary. It does not approve private content, bypass candidate review, or authorize an agent to merge unrelated changes. Feature branches and pull requests remain non-deploying.

## Consequences

- Approved main changes no longer require another publication click.
- Failed checks stop publication and leave the last deployment live.
- Deployment credentials and artifact handling remain separate from private career analysis.
- The dedicated CI token must be rotated before its configured expiry; no token value is stored in this repository.
- Activating this workflow on the repository still requires integrating its reviewed source into `main`.

See [Cloudflare release](../cloudflare-release.md) for operation and recovery.
