# Owner-confirmed work distributions

## Purpose

Apply the owner's explicit work percentages for the Integritas engagement and Connect, replacing the computed mix where supplied without presenting these estimates as activity counts.

## Context

The existing activityMix contract only supports recorded-activities with a positive activityCount. ProjectWorkChart and ActivityMix render that basis. The Integritas engagement is the existing financial-product-platform candidate. Connect is an existing private candidate. The owner supplied 90% frontend / 10% backend and 50% frontend / 35% backend / 15% DevOps respectively.

## Privacy impact

Extend the existing presentation contract with a distinct owner-estimate basis, rejecting activityCount on that basis. No approval or publication metadata changes. Canonical activities and calculated mixes remain intact; only the two private candidates receive owner-provided values. Keep the confirmation and projection precedence private.

## Plan

1. Extend schema, runtime validation, and strict shared types for owner estimates.
2. Update both renderers and the two candidates; preserve owner values during later private derivation.
3. Test both bases, inspect EN/PT-BR, and run checks and browser verification.

## Progress

- [x] 2026-08-27: Confirmed project mapping and inspected the existing contract and renderers.
- [x] 2026-08-27: Added the owner-estimate union, strict provenance validation, source-aware renderers, exact supplied values, and a guard against overwriting owner estimates in private derivation.
- [x] 2026-08-27: Validated schema/runtime/type behavior and both renderers; confirmed the supplied values in EN/PT-BR cards and detail pages. All checks passed.

## Decisions

- Keep the existing activityMix field and add a discriminated basis instead of a parallel data source.
- Owner estimates have no fabricated sample count or equal-activity weighting explanation.
- Keep Backend first in charts, while applying the exact supplied percentages.

## Surprises

- The former recorded-only contract cannot honestly store these supplied estimates without distinguishing their source.

## Validation

```bash
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Checked both project cards and detail pages, localization, the absence of recorded sample labels on owner estimates, approval isolation, and unchanged computed mixes elsewhere. `npm run check` passed with 64 tests and zero TypeScript/Astro diagnostics. Browser runs passed all 31 scenarios in the private preview and all 31 under public `/test-repository`, including keyboard, no-JavaScript, reduced motion, mobile, and header regressions. Restarted the existing preview server after the Node validation change; it remains on port 4322. Generated root outputs are restored after verification. Whitespace and staged-file checks remain clean.

## Outcome

Complete. Integritas displays Frontend 90% / Backend 10%; Connect displays Frontend 50% / Backend 35% / DevOps 15%. Both retain candidate publication status and null approval fields. Their source is explicitly owner-estimate, without invented activity counts or recorded-weight explanations. The private derivation helper preserves these owner values. No canonical activity tags, other project percentages, image approvals, or public content changed; no commit, staging, or publication was performed.
