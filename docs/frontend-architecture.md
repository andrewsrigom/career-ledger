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
- `src/scripts/site.ts`: section observation, filters, and eligibility-based dynamic imports.
- `src/scripts/motion.ts`: removable GSAP/ScrollTrigger effects.
- `src/scripts/architecture-scene.ts`: lazy orthographic WebGL, capped pixel ratio, coalesced event-driven frames, visibility suspension, and disposal.

The MPA uses standard links and native CSS cross-document view transitions. Unsupported browsers retain normal document navigation. System fonts, inline authored SVGs, and bundled scripts keep runtime requests local.

Production hosting is Cloudflare Pages Direct Upload. The owner-approved Web Analytics beacon is injected by Pages after deployment; it is not part of the source build and never runs in the local preview. This narrow runtime exception is documented in ADR 0006. All other resources remain local, and the existing offline build/resource audit remains strict.

Approved project galleries preserve the same image sequence and bilingual captions as local review, using `presentation.gallery` and explicit public asset references. The gallery and homepage components prefer isolated review images only when supplied by preview mode, otherwise use approved images. Promotion does not add any private-storage dependency to public rendering.

Portfolio prose speaks in the first person: concrete contributions, tools, and decisions rather than a report about an anonymous owner. EN/PT-BR section headings and the profile bio follow that voice. About introduces the validated profile name. Project and entry pages do not repeat internal sanitization/publication-process footers; the shared preview banner still states that changes are unpublished and await approval. This editorial choice changes neither evidence requirements nor approval metadata.

Initial fragment navigation uses the browser's immediate positioning. Smooth in-page navigation is enabled only after document load and the next animation frame, so scroll-trigger measurements cannot interrupt a long initial smooth jump. With JavaScript disabled, anchors remain native immediate links; reduced motion keeps smooth scrolling disabled.

Headline reveals explicitly initialize both pixel and percentage translations; the text must end inside its clipping masks. Each section heading has one GSAP timeline rather than overlapping parent/child triggers. Project timelines coordinate the narrative, visible evidence, work-distribution bars when present, and results. The landscape assembles its grid, nodes, paths, and labels; experience entries reveal a rail segment, dates, role, and supporting narrative. There are no pinned sections or scrubbed timelines.

`scripts/lib/project-ranking.ts` supplies one deterministic editorial order for the homepage, directories, taxonomy relationships, and localized JSON. `ProjectIndex.astro` renders every available project in that order, with flagship, featured, standard and compact CSS treatments rather than a selected/archive split. The levels are not UI labels; compact entries retain summaries, scope, imagery when available, and detail links. No pagination or six-project cutoff hides the body of work.

Flagship and featured rows combine the existing summary, first recorded contribution, explicitly related resume roles when available, and first recorded outcome. Standard and compact rows reduce typography, image width and contextual density without discarding projects. All treatments retain summaries and taxonomy-based layer signatures; missing roles/results are omitted and outcomes are never synthesized. Existing reviewed images and captions remain visible at rest, not in hover overlays. Projects without images use a typographic row, with an adjacent outcome when available; the opening record and explicitly authored diagram previews can retain the abstract system plate. No empty screenshot placeholders are added. Focus/hover accents titles and evidence borders; mobile retains every project, images, results and normal links.

`src/lib/technology-presentation.ts` orders stack labels with Node.js, Python, TypeScript, Next.js, and React first when present, then Backend, Frontend, DevOps, and uncategorized tools, preserving order within each group and original labels. Known aliases are deduplicated. Homepage stacks show up to four names, with a localized `+N` description linking through to complete project details. The same ordering applies to project/entry details and resume skills on About. Toolbox leads with available priority technologies before grouped tools. An AI / IA label derives from the existing `ai-engineering` area slug. Model Context Protocol appears as MCP with its full abbreviation title. Absent technologies are never added.

Flagship/featured rows show a static “Recorded activity mix” chart when that project's optional `activityMix` exists; explicit owner estimates also remain visible on standard/compact rows. The detail page retains every supplied mix. Bars use a fixed 0–100% scale: Backend, Frontend, DevOps (including infrastructure), and any remaining domains under Other. Percentages are never discarded or renormalized. Calculated charts retain their basis and sample count. No project mix means no chart: taxonomy, technology lists, role descriptions, and portfolio-wide percentages never supply substitute values. Labels and bars remain readable without JavaScript and with reduced motion.

`calculateProjectWorkMix` supports a private, focused projection of canonical activities onto frontend, backend, and delivery surfaces. It merges devops/infrastructure before splitting each qualifying activity's unit equally across distinct surfaces; cross-cutting tags do not change those weights. Records without those surfaces are outside the displayed sample. Canonical activities and the existing full-domain aggregate remain unchanged. A separately reviewed private scope mapping may write only aggregate percentages and the sample into a candidate's existing `activityMix`. It must preserve approval metadata and keep source IDs, evidence, and the derivation report private. Public builds only read approved records and never run this calculation against private storage.

An explicit owner estimate uses `activityMix.basis: "owner-estimate"` with the same domain/percentage items and no activityCount. Both the compact project chart and detail-page chart say “My contribution” and “My estimate.” (“Minha atuação” / “Minha estimativa.”), without the calculated sample or weighting explanation. Runtime validation and the shared discriminated type keep the two bases distinct. Private projection scripts preserve owner estimates instead of replacing them with derived numbers.

Abstract fallback plates still derive their four layers only from existing taxonomy slugs. Interface uses frontend/accessibility areas; Product uses product/commerce/mobile areas; Systems uses backend/system/data/security/reliability/AI areas; Infrastructure uses infrastructure/developer-experience areas. They remain explicitly labeled as abstract diagrams. No screenshot or architecture is fabricated for missing evidence. Hero layers and the separate recorded-activity mix are unchanged; the latter keeps its recorded-activities basis, sample count, and weighting explanation.

Once read, a composition retains its final state when motion is remounted after a preference or viewport change. Focus completes a composition immediately; a late motion import never hides already focused content. Compositions containing or inside the current native `:target` remain complete on mount, including direct section and heading links; they do not wait for scroll-trigger measurements. Fast scroll completes passed timelines; initial positions above the viewport are not hidden again. Image load, expanded details, fonts, visibility, and hash changes request a coalesced safe ScrollTrigger refresh, which waits for scrolling to settle instead of interrupting native smooth anchor navigation. Context cleanup removes the timelines, triggers, and refresh/focus listeners. Static HTML is the complete final state without JavaScript, on mobile/coarse pointers, or with reduced motion.

The hero retains the dark editorial composition and uses three locale-aware headline lines. Soft CSS alpha masks follow the measured line bounds; they reduce the network behind the text without adding a painted gradient. The static fallback has four explicit layer groups. Once WebGL is ready, only its network is shown, retaining the quiet SVG grid without a duplicate stack. Each WebGL layer owns its nodes, local connections, and handoff connections to the next layer.

`src/scripts/hero-layers.ts` owns semantic button selection independently of GSAP and WebGL. Mouse hover, focus, click/touch, arrow keys, Home, and End select the same layer and update `aria-pressed`, the accent line, and the diagram. A deliberate hover can preview another layer; leaving restores the focused/selected layer. Keyboard focus is not moved by scroll. With JavaScript disabled, the disabled buttons remain a complete, readable legend. No core links or descriptions depend on enhancement.

Native, coalesced scroll updates progressively select Interface → Product → Systems → Infrastructure while the diagram and legend remain visible. The network becomes modestly clearer. Mask geometry is read only on resize/visibility refresh, before style writes. Reduced motion disables automatic progression and transitions but keeps manual selection. Mobile retains all four descriptions in a compact two-column legend and uses a cropped, simplified SVG without its grid; neither GSAP nor Three.js loads on narrow/coarse-pointer views. Preference and viewport changes dispose motion listeners and WebGL resources and can re-enable eligible desktop enhancement.

WebGL draws only for scroll, pointer, resize, visibility changes, or a finite layer transition. It stops when idle, offscreen, or hidden, with pixel ratio capped at 1.6. Nodes and halos are smaller; no decorative star field or random scene state remains. Layer text stays fully opaque in the contrast-checked hero palette.

The existing `PreviewBanner.astro` supports draft and public modes. Draft output says “Local preview” and “Not published. Waiting for your approval.” with equivalent PT-BR copy and unchanged noindex protections. Public output renders “My work” / “Meu trabalho” with a localized month/year derived from the validated dataset `updatedAt`, using UTC and no build timestamp. The hero summary comes from the owner-approved profile, including the owner's requested “10+ years” sentence. These presentation changes do not approve or publish candidate records.

The sticky navigation reserves its expanded height in `.site-header-frame` while the inner header compacts on scroll. Compaction must not change document flow: browser scroll anchoring could otherwise cross the state threshold repeatedly and shake the record/preview bar. The frame's unused area passes pointer events through to the content; navigation remains interactive. `tests/browser/header-scroll.spec.ts` samples full transitions around the threshold in both scroll directions, including desktop, tablet, mobile, and reduced motion, on home and localized detail layouts in public and private preview runs.

The old `site/assets/` and HTML functions in `scripts/lib/render.ts` are retained as migration reference for the pre-existing uncommitted redesign. They are not copied or used for Astro HTML. Only feed, manifest, robots, and sitemap functions remain active from that module; remove the legacy reference after owner review, not by discarding unrelated work.

## TypeScript toolchain

All active Node scripts and tests use TypeScript with native Node type stripping, explicit `.ts` imports, and erasable syntax. No emitted Node JavaScript tree or new runtime dependency is needed. The Astro configuration is `astro.config.ts`; browser bundles are still generated JavaScript.

`npm run typecheck` runs `tsc --project tsconfig.node.json` plus Astro checks. Both configurations are strict and enable unchecked-index protection. Node tools, Node tests, compile-only contract regressions, Astro components, browser scripts, Playwright tests, and configuration are covered. Legacy site assets are not active source and remain outside these checks.

`readJson` returns `unknown`. Named parsers validate inputs before exposing shared contracts; malformed records fail closed before relationship traversal. Static types never substitute for schema, approval, asset, or privacy validation. The temporary Astro build dataset is an internal serialization boundary written by the validating Node adapter.

## Image review

Owner-requested screenshot preparation can be reviewed before public image approval. The private `media-review/preview.json` manifest supplies one to six genuine, bounded WebP images per project to the preview adapter only. `scripts/lib/review-media.ts` validates provenance, bilingual text, exact encoded dimensions, regular files, and safe destinations. The build receives selected bytes rather than private paths; public generation rejects review media and never reads its manifest. The public project schema and image-approval requirement remain unchanged.

`ProjectGallery.astro` renders static, keyboard-accessible full-size image links on project pages, with original source and capture/provision dates when available. Every homepage project with review imagery uses its first review image locally, fitting the complete screenshot without cropping. Image choice and provenance are independent of editorial prominence and never imply publication approval.

Run `npm run career:media-review`. Its ignored inventory records local references, file sizes, project associations, and review state; it never copies an image. Licensed-source collections and generated/dependency folders are excluded. Every remaining asset still needs ownership/license and confidentiality review.

After the owner selects and approves an image, manually export a WebP/AVIF into `public/assets/projects/`, at most 250 KiB with declared dimensions. Add reviewed presentation metadata to the candidate, including image-specific approval and PT-BR alternative text. Never place screenshots with internal/customer data in that directory. Missing imagery uses a typographic treatment or an explicitly abstract diagram, not a fake screenshot.

The build stages only the site icon and images referenced by its validated dataset. Unreferenced files are never copied automatically. Referenced images must be regular files, have no symlink path components, and match their declared WebP/AVIF encoding.

## Verification

### Recommendations

`Recommendations.astro` follows experience when the resume includes recommendations. It uses a two-column editorial list on desktop and a single column on mobile, semantic blockquotes, genuine local portraits (or initials), author profile links, and a link to the original recommendations. No carousel, rating, visible date, embed, or external runtime request is added. Quotes and authors remain readable with JavaScript disabled; section reveals are progressive enhancement and finish when a contained link receives focus. Portuguese translations are explicitly identified. Progress navigation and subsequent section numbering adapt when the section is present.

Portrait preparation is an explicit, owner-requested action outside the build. Until approval, excerpts and images remain in the ignored candidate/media-review workflow, not public content or public assets. Current employers are not presented as endorsing the owner; relationship labels describe the actual collaboration. Public builds stage portrait bytes only after content and image-specific approval. The smaller portrait limits do not change screenshot constraints.

`tests/recommendations.test.ts`, `tests/review-media.test.ts`, and `tests/preview.test.ts` cover schema/runtime validation, matching translations, escaped quotes, initials, local-only staging, and private/public isolation. `tests/browser/recommendations.spec.ts` verifies both locales, keyboard focus, mobile widths, reduced motion, no JavaScript, local image loading and console/network errors.

### Contact

`Contact.astro` closes the homepage with direct email, phone, optional WhatsApp, and social links. A populated contact record changes the hero's secondary action to “Get in touch” / “Fale comigo”; the footer links back to the localized contact anchor from every route. No form, sending service, tracking, or runtime dependency is added. Missing channels remain absent until the owner supplies them. Contact links and quoted recommendations are ordinary HTML links usable without JavaScript.

### Commands

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

Inspect home, timeline, about, project, entry, area, localized 404, resting/focused project evidence, mobile widths, no-JavaScript, reduced motion, and WebGL failure. Browser tests use an isolated loopback server on port 4399 and default to approved public data in CI.

`tests/browser/visual-regressions.spec.ts` also checks headline clipping and hierarchy across desktop/mobile widths in both languages, motion-chunk failure, evidence containment, non-overlapping results, keyboard/touch layers, scroll progression, preference/viewport changes, static legends and instrumented WebGL draw calls. Direct anchors, fast/reverse scrolling, reload, history return and expanded experience details remain covered. Text presence and opacity alone do not prove readability. Ranking tests cover independent work outranking professional work, one current anchor, bounded images/outcomes, recency, explicit ownership, evidence overlap, locale stability and score-free JSON. Browser tests verify the complete ordered sequence, all image-bearing rows and meaningful text-only entries in both languages without JavaScript.

Bundle limits are enforced on every build: all non-architecture JavaScript together ≤90 KB gzip; the lazy architecture chunk ≤180 KB gzip. LCP <2.5 s, CLS <0.1, and Lighthouse performance/accessibility ≥90 are lab targets. Record device/throttling conditions with measurements; do not present them as production field metrics.

The local server rebuilds Astro source, content, and approved assets. Preview mode also watches candidate, activity, and media-review records. Restart it after changes to Node tooling or Astro configuration. Builds are serialized and only a completely verified output replaces the last local build.
