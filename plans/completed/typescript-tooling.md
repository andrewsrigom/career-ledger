# TypeScript across the active toolchain

## Purpose

Share checked TypeScript contracts across maintained tooling, tests, and frontend without changing portfolio content, appearance, or approval.

## Context

The frontend is typed; Node tooling and its 42 tests use JavaScript. Preserve all existing work on `portfolio-interactive-redesign`. No commit, push, merge, or deployment is authorized.

## Privacy impact

No content promotion. JSON stays untrusted until runtime validation. Preserve audits, preview isolation, and public-only build inputs.

## Plan

1. Establish baseline and Node-compatible execution.
2. Migrate tooling/tests and share domain contracts with Astro.
3. Enforce strict checks, update commands/documentation, verify runtime behavior.

## Progress

- [x] 2026-08-27: All 42 baseline Node tests pass; runtime is Node 24.19.
- [x] 2026-08-27: Migrated all 17 Node modules, 10 existing Node test files, and Astro configuration to TypeScript. Added shared schema-aligned contracts, explicit unknown-input parsers, and no-emit NodeNext/Astro checks.
- [x] 2026-08-27: Retained all 42 baseline tests and added 6 runtime boundary tests plus compile-only contract assertions. Updated npm commands, hooks, rules, documentation, and stale skill commands.
- [x] 2026-08-27: Completed strict checks and runtime/browser verification; restarted the public server on 4321 and isolated preview on 4322.

## Decisions

- Native Node type stripping, erasable syntax, explicit `.ts` imports; no new runtime dependency or emitted toolchain directory.
- Preserve Node >=22.12 compatibility with explicit `--experimental-strip-types` in entrypoints.
- Static types complement, never replace, runtime schema/privacy checks.
- Preserve old site assets as migration reference, outside active TS source.

## Surprises

- Strict checks exposed unsafe traversal of malformed JSON before validation. Invalid public shapes now fail with validation findings before relationship checks; invalid private records stay findings and do not enter typed relationship maps.
- Unknown technical domains are excluded from the preview aggregate, with regression coverage. Valid activity weighting is unchanged.
- The old Node 22.12 installation has no bundled npm. Compatibility verification used the existing npm CLI with Node 22.12 first in PATH; no installation or project dependency change was needed.

## Validation

- `npm run check` on Node 24.19: passes; 48 Node tests, strict Node/Astro checks, audit, static build, links, and bundle budgets.
- The same complete `npm run check` on the existing Node 22.12 runtime: passes, with its expected experimental type-stripping warnings.
- `CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser`: 10 passed.
- `CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser`: 10 passed.
- `CAREER_BROWSER_PREVIEW=1 npm run check:browser`: 10 passed.
- Browser inspection: EN/PT-BR home, project, entry, area, timeline, and about; screenshot confirmed the homepage composition remains intact.
- Four edited repository skills pass the skill validator; `git diff --check` passes.
- Final generated-output audit with local privacy rules: zero findings. Public output still has only 1 approved entry and 1 approved project, no resume and no activity mix. No private storage or generated output is tracked.
- Build remains 60 public files; JavaScript gzip budgets measure 46.7 KB main and 130.4 KB lazy architecture.

## Outcome

The active toolchain uses strict TypeScript without new runtime dependencies or emitted Node artifacts. Runtime validators and publication controls remain intact. Existing public content and private records were not edited; legacy site assets were preserved. No commit, push, merge, or deployment was performed. Local review is available at http://127.0.0.1:4322/.
