# 0006 — Manual Cloudflare Pages release and Web Analytics

Status: accepted by the owner on 2026-08-28.

## Context

The owner approved the complete local portfolio, including drafts, reviewed imagery and contact information, and requested Cloudflare hosting with access analytics. The static-first architecture and private/public boundary remain requirements.

## Decision

Use Cloudflare Pages Direct Upload for `andrewsrigom.pages.dev`. Keep Astro's static output, EN/PT-BR routes and alternative base-path support. Add pinned Wrangler as a development/deployment dependency only; it is never shipped to browsers or used by the private ledger engine.

Enable Cloudflare Web Analytics on the Pages project. Pages injects the beacon on deployment; the repository does not embed a second copy. This is the only owner-approved third-party runtime exception, limited to the deployed site. Keep the default offline build, local previews and external-resource audit unchanged.

Promote the explicitly approved records through the existing interactive approval command. Export only the exact reviewed images into public assets, with approval metadata and validated bilingual galleries. Publication is not a bulk copy of private storage.

Keep deployment manual. The GitHub workflow requires `workflow_dispatch` and an explicit confirmation; a push or passing CI never grants publication authority. Initial deployment uses the existing authenticated local CLI. Future CI credentials must be separately configured as restricted secrets. Do not merge the redesign branch implicitly.

## Consequences

- The site has no runtime application backend or hosting migration of the private engine.
- GitHub Pages remains an unchanged prior deployment and root/subpath builds stay tested.
- Direct Upload does not support switching the same project to native Git integration; manual CLI/CI remains supported.
- Analytics is verified after deployment, not inferred from local build success. Blocking or disabling JavaScript can omit visits.
- Prior production deployments and retained build artifacts provide owner-approved rollback without Git history rewriting.

Operational details and official references: [Cloudflare release](../cloudflare-release.md).
