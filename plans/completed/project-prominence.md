# One continuous body of work

## Purpose

Keep the existing portfolio identity and hero while showing the full available project collection with evidence-led order and varied editorial prominence. Independent products must not be buried behind a professional-first selection.

## Context

The homepage currently expands six projects and reduces the remainder to an archive. Dataset ordering favors professional context before technical scope. The existing approved public dataset and isolated candidate/media preview remain the only content sources.

## Privacy impact

No publication, new workflow, repository analysis, or external content source. Ranking is a pure calculation over the already validated dataset. Review images affect only the existing private preview. Scores are never serialized. Optional contribution scope is explicit, not inferred from Git, technology tags, or independent status. Existing candidate approvals remain unchanged.

## Plan

1. Add a deterministic, documented ranking heuristic and minimal optional ownership metadata.
2. Replace selected/archive markup with one complete sequence and four unlabelled presentation densities.
3. Keep GSAP pacing, static/mobile reading, layer signatures and actual imagery; reduce visible stack tags.
4. Test ordering, localization, visual behavior, public/private boundaries and alternate base paths; inspect the live browser.

## Progress

- [x] 2026-08-27: Read request, applicable instructions, source data and current implementation.
- [x] 2026-08-27: Implement deterministic ranking, optional explicit scope and the complete connected project sequence.
- [x] 2026-08-27: Validate public/private output and inspect the live external browser plus desktop/mobile captures.
- [x] 2026-08-27: Document weights, media boundaries, presentation densities and remaining limits.

## Decisions

- Full-stack, backend/systems, AI and explicit end-to-end work outweigh professional context. Only one evidence-backed current professional project receives an opening-anchor bonus.
- Recency uses recorded dates and dataset review date, never the build clock. Imagery cannot establish authorship or outcomes.
- All projects remain visible, including records without images; no empty screenshot placeholders.
- Preserve the current hero, other sections, publication boundary and user edits.

## Surprises

- Most review projects have no explicit work-context field; unknown context must not be relabelled as independent.
- Existing tests encoded the removed six-project/archive split and absence of layer signatures; replacement tests assert breadth, evidence order, meaningful summaries, every available image, and four visual densities instead.
- Editing a stylesheet during an initial browser run invalidated a hashed CSS URL. Stable-source reruns passed without relaxing resource/console checks.
- Long screenshot captures include the sticky header; live viewport inspection, settled states and DOM geometry were used together rather than treating screenshot artifacts as layout defects.

## Validation

```bash
npm run check
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Passed: 72 Node tests; strict TypeScript and Astro check (49 files, zero errors/warnings); privacy audit and build; 33 public browser tests under `/career-ledger`; 33 private-preview browser tests under `/test-repository`. JavaScript budgets remain 48.6 KB gzip main / 130.8 KB lazy architecture.

Inspected actual external-browser project transitions, opening/proprietary-product highlights, standard text-only rows, compact image-rich rows, a project gallery, an entry, an area, timeline and Portuguese home. Reviewed 390px screenshots and geometry tests down to 320px. Existing suites cover keyboard, no JavaScript, reduced motion, WebGL failure, history, anchors and console/resource errors.

Public output still contains only the one approved project, no review media, private project IDs, local paths or serialized scores. Generated artifacts remain ignored. The normal root-path preview is restored on loopback port 4322.

## Outcome

The local preview now presents all 16 available projects: one opening flagship, five further featured rows, seven standard rows and three compact rows in a single continuous sequence. Technical scope, AI, explicit end-to-end work, recorded contributions/outcomes, recency and bounded imagery signals outweigh client/company context. Independent products appear immediately after the professional anchor. Four visible technologies support each summary; full stacks and all supplied activity mixes remain on detail pages. Candidate approvals, source provenance and the public/private boundary are unchanged.

Hero implementation, GSAP/ScrollTrigger language, typography, architecture, timeline, principles and toolbox were preserved. No dependencies, CMS, alternative approval flow, commits, pushes, merges or deployments were introduced.

Limits: the page is intentionally longer because the full body of work is present. Image availability is a proxy, not automated visual-quality judgment. Records with incomplete taxonomy, dates or contributions may rank lower until existing content is enriched and reviewed; no missing evidence was invented to improve scores. No new field-performance or Lighthouse claim is made.
