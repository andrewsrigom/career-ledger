# Project copy and professional ordering

## Purpose

Present current client work first, show completed work in a grounded chronology, and describe design-system leadership using the owner's confirmed scope. Keep all content changes available only in the local preview until publication is separately approved.

## Context

Projects currently sort by featured flag and alphabetic name. They have lifecycle status and links to dated entries; some also have explicit resume relationships. The project schema has no work-context classification. Existing private candidates contain generic naming and an unnecessary development-stage qualifier. Existing staged and unstaged redesign changes must be preserved.

## Privacy impact

Content and owner confirmations remain in ignored private storage. A narrowly released company display name may be removed from the owner's local blocked-term list with its authorization recorded privately; all other identity, secret, ticket, domain, screenshot, and publication checks remain intact. No candidate approval, public-content edit, Git write, push, or deployment is authorized.

## Plan

1. Record owner confirmations and update candidate copy in English and Portuguese.
2. Add optional validated project work context and deterministic professional/status/chronology ordering using existing dataset relationships only.
3. Test schema, ordering, bilingual output, local preview, and public isolation; document the behavior.

## Progress

- [x] 2026-08-27: Inspected the existing sort, candidate records, resume periods, and private attribution notes.
- [x] 2026-08-27: Recorded owner confirmation privately, revised bilingual project/entry/resume copy, and updated the component-library attribution with provided evidence.
- [x] 2026-08-27: Added optional work context, deterministic sorting, schema coverage, and bilingual/no-JavaScript ordering regressions.
- [x] 2026-08-27: Completed validation, audited all 12 changed candidates, inspected the external-browser preview, and restored the default public build.

## Decisions

- Client/company projects precede independent or unclassified projects. Within each group, active work precedes paused, completed, and archived work; dated work sorts newest first.
- Project-specific entry dates are recency anchors, with explicitly related resume periods as a fallback. Neither is presented as an invented project inception date. Undated projects follow dated peers; stable identity breaks ties.
- Preserve existing IDs and URLs when changing display names.
- Leadership confirmation applies to creating the component library and primitives, not sole ownership of every related frontend/content system.
- Omit development-stage qualifiers without adding launch, adoption, or commercial-success claims.

## Surprises

- Some existing contribution periods predate the associated employer period; retain the distinction rather than silently replacing dates.
- One historical storefront contribution was labeled active because the current product website exists; project status should describe the owner's work, not product availability.
- The first candidate validation caught nine activity types after adding leadership; retained the eight most relevant categories without changing the validator.

## Validation

```bash
npm run check
npm run career:validate-private
npm run career:audit -- --candidate <changed-slug>
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Inspect home/project directory order, changed project and entry pages, timeline/area navigation, EN/PT-BR equivalence, and mobile reading in the external browser. Check public dist for private identity and media leakage; preserve the original staged diff.

Results on 2026-08-27:

- `npm run check`: 55 Node tests passed; TypeScript/Astro checked 44 files with zero errors, warnings, or hints; approved public build passed.
- Private workspace: 91 activities, 43 workstreams, and existing legacy records validated. All 12 changed candidates passed schema and privacy audit.
- Each browser command above passed 19 tests, with zero skips: 57 browser checks across preview and both hosting base paths.
- External Chrome: inspected the home ordering and copy, design-system detail in EN/PT-BR, its leadership entry, and related-project ordering. Inspected a full-page mobile screenshot at 390 px and confirmed no horizontal overflow. Restored the normal viewport and left the Portuguese home preview open.
- Default `npm run build`: 60 public files; 47.7 KB gzip primary JavaScript / 131.2 KB lazy architecture. No newly released private identity, review-media reference, or private path was found in `dist/`.
- Original nine staged file diffs remain unchanged. No `content/public/`, dependency, approval, commit, push, or deployment change.

## Outcome

Current company work leads the portfolio, followed by completed company work in recorded chronology and then independent/unclassified projects. The design-system contribution now reflects owner-confirmed creation leadership and atomic-design primitives. Development-stage phrasing was removed without inventing release or impact outcomes. Display-name changes preserve all existing IDs and URLs.

Unknown project dates remain an enrichment gap, not a blocker; existing entry/employer start-date differences were preserved and recorded privately for owner review. Local preview is running at port 4322. Publication and image approval remain separate owner decisions.
