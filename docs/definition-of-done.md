# Definition of Done

## Public content

- The record describes meaningful work rather than a sequence of commits.
- Scope and ownership language are conservative and accurate.
- Deliverables and outcomes are separated.
- Every outcome has an accepted evidence level.
- Confidential names, identifiers, paths, URLs, metrics, and security details are absent.
- The record has explicit approval metadata.
- It does not duplicate an existing initiative.
- Significance is the least promotional supported level; achievements include supported outcomes.

## Private ledger

- Meaningful work is captured as dated activity rather than commit noise.
- Workstream relationships preserve chronology and pass bidirectional reference validation.
- Evidence provenance, attribution uncertainty, and unconfirmed outcomes remain explicit.
- Milestones represent supported progress; achievements represent confirmed results.
- Narrative signals are supported by repeated meaningful evidence rather than a single trivial activity.

## Tooling

- The default workflow remains offline.
- Public generation reads only `content/public/` and static site assets.
- Generated output is deterministic.
- Windows, WSL, Linux, and macOS behavior is considered.
- New logic has tests.
- `npm run typecheck` passes for shared contracts, Node tooling/tests, and Astro/browser source. Native TS execution is not a type check; keep the separate strict checks and runtime JSON validation.

## Site

- Navigation works with and without a GitHub Pages base path.
- English and PT-BR routes render the equivalent records with correct `lang`, canonical, and `hreflang` metadata.
- The language switch preserves the current page and remains keyboard accessible.
- Pages are usable with keyboard navigation and visible focus.
- Content remains readable on mobile and large screens.
- The complete available project sequence stays visible across desktop/mobile and EN/PT-BR. Evidence-led prominence must not restore a professional-first bucket or six-project cutoff. Compact entries retain meaningful summaries and real imagery when available; internal scores never appear in generated JSON or client scripts.
- Reduced-motion preferences are respected.
- The narrative and links work without JavaScript or WebGL; mobile uses the static composition.
- Local builds and previews load no third-party font, script, image, or API. Production permits only the explicitly approved Cloudflare Web Analytics beacon injected by Pages; verify it separately after deployment, without weakening the offline resource audit.
- Published project previews have explicit image approval, local WebP/AVIF encoding, dimensions, and localized alternative text. Owner-requested, unapproved screenshots may appear only through the isolated private review path, never in public assets or `dist/`.
- Calculated activity percentages show their recorded-activities basis and sample, never hours or effort. Owner-supplied distributions show their owner-estimate source without a fabricated activity count or weighting explanation.
- Build-enforced budgets remain ≤90 KB gzip for non-architecture JavaScript and ≤180 KB for the lazy architecture chunk.
- Measure LCP <2.5 s, CLS <0.1, and Lighthouse performance/accessibility ≥90 in a documented lab run; do not claim unmeasured field performance.
- `dist/` contains no private data.

## Verification

```bash
npm run check
npm run check:browser
```

Also inspect the English and PT-BR home pages, the experience section when a resume exists, timeline, one area page, one project page, and one entry page locally.

Candidate review also runs `CAREER_BROWSER_PREVIEW=1 npm run check:browser` locally. CI must use only public data. Verify a second base path such as `/test-repository` in addition to `/career-ledger`. The owner-approved deployment policy publishes revisions accepted into `main` only after the complete harness passes. Feature-branch CI does not publish, and a successful build never promotes private candidates. Manual redeployment is restricted to `main` with explicit confirmation.
