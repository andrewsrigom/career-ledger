# Frontend architecture and review

## Entry points

`npm run build` loads approved JSON through the Node validation/audit layer, stages a temporary dataset and an explicit set of approved assets, and invokes Astro. Astro renders the bilingual route descriptors. Node then adds JSON, RSS, sitemap, localized manifests, robots, and the Pages marker, verifies links/resources, audits output, and enforces bundle budgets.

`npm run dev` serves that public build on loopback port 4321. `npm run dev:preview` separately overlays validated candidates and calculated activity mix on port 4322. Preview generation writes only ignored reports, not public content or `dist/`. It is noindex, visibly labeled, and never grants publication approval.

## Presentation

- `src/components/BaseLayout.astro`: shared metadata, navigation, footer, stylesheet, and lightweight entry script.
- `src/components/home/`: editorial hero, project index, architecture fallback, SVG landscape, experience, professional principles, and toolbox.
- `src/components/pages/`: static timeline, directories, project/entry/area details, about, and not-found views.
- `scripts/lib/model.ts`: shared record and dataset contracts matching the runtime schemas.
- `src/lib/types.ts`: re-exports the shared contracts and defines presentation context; validated Node schemas remain authoritative.
- `src/scripts/site.ts`: section observation, project focus/hover, filters, and eligibility-based dynamic imports.
- `src/scripts/motion.ts`: removable GSAP/ScrollTrigger effects.
- `src/scripts/architecture-scene.ts`: lazy orthographic WebGL, capped pixel ratio, coalesced event-driven frames, visibility suspension, and disposal.

The MPA uses standard links and native CSS cross-document view transitions. Unsupported browsers retain normal document navigation. System fonts, inline authored SVGs, and bundled scripts keep runtime requests local.

The old `site/assets/` and HTML functions in `scripts/lib/render.ts` are retained as migration reference for the pre-existing uncommitted redesign. They are not copied or used for Astro HTML. Only feed, manifest, robots, and sitemap functions remain active from that module; remove the legacy reference after owner review, not by discarding unrelated work.

## TypeScript toolchain

All active Node scripts and tests use TypeScript with native Node type stripping, explicit `.ts` imports, and erasable syntax. No emitted Node JavaScript tree or new runtime dependency is needed. The Astro configuration is `astro.config.ts`; browser bundles are still generated JavaScript.

`npm run typecheck` runs `tsc --project tsconfig.node.json` plus Astro checks. Both configurations are strict and enable unchecked-index protection. Node tools, Node tests, compile-only contract regressions, Astro components, browser scripts, Playwright tests, and configuration are covered. Legacy site assets are not active source and remain outside these checks.

`readJson` returns `unknown`. Named parsers validate inputs before exposing shared contracts; malformed records fail closed before relationship traversal. Static types never substitute for schema, approval, asset, or privacy validation. The temporary Astro build dataset is an internal serialization boundary written by the validating Node adapter.

## Image review

Run `npm run career:media-review`. Its ignored inventory records local references, file sizes, project associations, and review state; it never copies an image. Licensed-source collections and generated/dependency folders are excluded. Every remaining asset still needs ownership/license and confidentiality review.

After the owner selects and approves an image, manually export a WebP/AVIF into `public/assets/projects/`, at most 250 KiB with declared dimensions. Add the reviewed presentation metadata to the candidate, including image-specific owner approval and PT-BR alternative text. Do not put a screenshot with internal/customer data into this directory. If no image is approved, the site uses an explicitly abstract diagram, not a fake product screenshot.

The build stages only the site icon and images referenced by its validated dataset. Unreferenced files are never copied automatically. Referenced images must be regular files, have no symlink path components, and match their declared WebP/AVIF encoding.

## Verification

```bash
npm ci
npx playwright install chromium
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
BASE_PATH=/test-repository npm run build
```

Inspect home, timeline, about, project, entry, area, localized 404, focus previews, mobile widths, no-JavaScript, reduced motion, and WebGL failure. Browser tests use an isolated loopback server on port 4399 and default to approved public data in CI.

Bundle limits are enforced on every build: all non-architecture JavaScript together ≤90 KB gzip; the lazy architecture chunk ≤180 KB gzip. LCP <2.5 s, CLS <0.1, and Lighthouse performance/accessibility ≥90 are lab targets. Record device/throttling conditions with measurements; do not present them as production field metrics.

The local server rebuilds Astro source, content, and approved assets. Preview mode also watches candidate and activity records. Restart it after changes to Node tooling or Astro configuration. Builds are serialized and only a completely verified output replaces the last local build.
