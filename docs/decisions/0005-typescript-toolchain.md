# ADR 0005: Strict TypeScript for the active toolchain

- Status: Accepted by the owner when authorizing the tooling/test migration
- Date: 2026-08-27
- Extends: ADR 0004's frontend TypeScript decision to maintained Node tooling and tests

## Decision

Use TypeScript for active Node modules, Node tests, Astro configuration, and frontend code. Keep Node ESM and standard-library APIs in the private engine. Existing TypeScript development tooling checks types; no new runtime package, loader, framework, or generated tooling directory is introduced.

Npm commands and hooks explicitly pass `--experimental-strip-types` so the declared Node >=22.12 minimum remains supported. Use erasable syntax, explicit `.ts` imports, and type-only imports. Do not use enums, parameter properties, or TS path aliases in Node modules. The minimum version emits an experimental warning; the verified Node 24 runtime does not.

## Contracts and validation

`scripts/lib/model.ts` holds record contracts corresponding to the JSON schemas and normalized dataset types. Astro re-exports these types instead of independently describing the same records. Keep contract changes aligned with schemas and runtime validators.

`readJson` returns `unknown`; named parsers return record types only after runtime validation. Public relationship traversal and private relationship maps must not assume malformed records are valid. The internal, temporary Astro dataset remains a serialization boundary after Node validation, not an alternate content source.

Two no-emit checks cover different module environments: NodeNext for tooling/Node tests, Astro's strict configuration for presentation, browser tests, and frontend configuration. Both enable unchecked-index protection. Compile-only regressions protect important contract distinctions, including candidate approval and recorded activity versus effort.

## Consequences

- The supported commands remain offline after installation, with no new runtime dependencies.
- Browser output remains JavaScript. Source-language uniformity does not change hosting.
- Existing schema/audit tests remain, supplemented by unknown-input and CLI regressions.
- Legacy `site/assets/` remain untouched as migration reference; they are not active Astro assets.
- Privacy, explicit owner approval, manual deployment, and the existing public site are unchanged.

## Reference

[Node.js TypeScript execution and limitations](https://nodejs.org/api/typescript.html).
