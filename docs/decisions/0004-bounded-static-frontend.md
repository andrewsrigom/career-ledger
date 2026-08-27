# ADR 0004: Static-first frontend with bounded dependencies

- Status: Accepted by the owner in the interactive redesign plan
- Date: 2026-08-26
- Supersedes: ADR 0003 for the frontend only

## Context

The portfolio itself is an engineering work sample. Maintaining bilingual editorial routes, accessible interactions, isolated motion, and a small architectural visualization now justifies a frontend compiler and a limited set of libraries. The private ledger and its approval model do not require a framework.

## Decision

- Astro generates static, multi-page HTML. TypeScript defines component and interaction contracts.
- Existing Node ESM loaders, validation, audits, localization, and approval commands remain independent modules. They do not import GSAP, Three.js, or browser code.
- GSAP/ScrollTrigger is loaded only on the enhanced homepage. It handles reveals, line drawing, and scroll progression without controlling scrolling.
- Three.js is a separate lazy chunk, used only by the hero on eligible desktop devices. Rendering is event-driven; there is no permanent animation loop.
- The authored SVG is the complete no-JavaScript, mobile, reduced-motion, and WebGL-failure composition. Text always exists in HTML.
- Cross-document CSS view transitions enhance ordinary links. No client-side router is installed.
- No React, Tailwind, CMS, database, CDN assets, remote fonts, runtime API, or server adapter is introduced.
- Approved packages are `astro`, `gsap`, `three`, `typescript`, `@astrojs/check`, and `@playwright/test`. Node/Three type declarations are development-only support. Further runtime dependencies require explicit owner approval.
- `package-lock.json` and `npm ci` make installations reproducible. Astro telemetry is disabled in the build/check adapter.

## Boundary and asset handling

The public adapter loads approved `content/public/`, validates it, then writes a temporary build dataset. Astro reads that dataset, not private repositories. The temporary directory is removed after success or failure. Preview data requires an explicit preview flag and cannot target `dist/`.

Astro receives an isolated public-asset directory containing the favicon and only referenced, owner-approved WebP/AVIF previews. Unreferenced images are not copied. The discovery command records private references only.

## Budgets and verification

The build enforces a combined 90,000-byte gzip budget for non-architecture JavaScript and a 180,000-byte gzip budget for the lazy architecture chunk. Project previews are at most 256,000 bytes with declared dimensions and localized alternative text.

Node tests protect data/approval boundaries and base-path routes; Astro checks types; Playwright checks keyboard, mobile, reduced-motion, no-JavaScript, WebGL failure, localization, and local-only requests. Lighthouse targets remain performance/accessibility ≥90, LCP <2.5 seconds, and CLS <0.1. Lab results are not field guarantees.

## Deployment

GitHub Pages remains the host. CI verifies changes automatically; publication requires a manually dispatched workflow with an explicit approval confirmation on `main`. Local work never performs push, merge, or deploy without owner approval.

## Consequences

The frontend has a reproducible installation and an upgrade/supply-chain maintenance cost. In return, presentation is componentized and typed, scripts are bundled locally, and the interactive layer can fail without removing content or navigation. Native view transitions are optional browser support, not a required feature.

## References

- [Astro static GitHub Pages deployment](https://docs.astro.build/en/guides/deploy/github/)
- [Astro scripts and bundling](https://docs.astro.build/en/guides/client-side-scripts/)
- [Cross-document view transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using)
