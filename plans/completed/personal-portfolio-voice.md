# Personal portfolio voice

## Purpose

Make the portfolio sound like Andrews describing his own work, not a report about an anonymous owner. Replace generic section copy and internal review terminology in EN/PT-BR.

## Context

The shared presentation copy lives in `src/lib/portfolio-copy.ts` and `scripts/lib/i18n.ts`; the personal bio and working principles live in `content/public/profile.json`. Project and entry templates repeat publication-process footers. Work charts distinguish recorded activities from owner estimates. Existing staged and unstaged changes must be preserved.

## Privacy impact

No candidate, screenshot, or metric is promoted or approved. Preserve percentages, sample counts, basis fields, audit rules, preview noindex protections, and explicit publication approval. This is local editorial work only: no commit, push, merge, or deployment.

## Plan

1. Replace third-person labels and vague headings with direct personal copy in both languages.
2. Rewrite the existing bio/principles without adding new claims; remove redundant publication-process footers while retaining the unpublished preview banner.
3. Update presentation regressions and documentation, run the complete validation and browser suites, and inspect the local preview.

## Progress

- [x] 2026-08-27: Inspected shared labels, profile, detail templates, existing tests, and privacy requirements.
- [x] 2026-08-27: Applied bilingual editorial changes, removed process footers, and updated regression coverage without altering publication controls.
- [x] 2026-08-27: Validated public isolation, alternate base paths, and rendered preview. Restarted the local preview on port 4322 with the current code and root-path assets.

## Decisions

- Keep the owner-approved hero headline and 10+ years introduction.
- Describe estimates as “My estimate.” / “Minha estimativa.”; do not erase their distinction from calculated activity counts.
- Keep all project identities, descriptions, contribution scope, and outcomes unchanged in this pass.
- Existing Connect and Intelie review captions describe the visible interface instead of referring to the author in the third person; provenance and image-review status are unchanged.
- The top preview banner is sufficient to state that changes are unpublished and require approval; repeated process explanations do not belong in project narratives.

## Surprises

- The inactive legacy HTML renderer still references the shared copy contract; update only the affected references for type compatibility.
- The private alternate-base browser run exposed an intermittent hidden heading on direct `#landscape` navigation, reproduced in a focused repeated run. Keep native anchor-target compositions complete when motion mounts, and add delayed-motion section/heading anchor coverage instead of weakening the existing assertion.
- The trace also showed the initial native smooth jump stopping partway down the long preview page. Keep initial fragment positioning immediate and enable smooth in-page navigation only after document load.

## Validation

```bash
npm run check
npm run check:browser
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Inspect home, About, timeline, project, entry, and area pages in EN/PT-BR, including mobile, keyboard, reduced motion, and no-JavaScript coverage. Check generated public output for private data and restore the root-path preview after alternate-base testing.

Completed checks:

- `npm run check`: 64 Node tests passed; 49 Astro files checked with no errors or warnings; generated output contains 60 files, with 48.6 KB main / 130.8 KB lazy JavaScript gzip.
- `npm run check:browser`: all 32 final public browser tests passed.
- `CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser`: all 32 final private browser tests passed, including the complete reviewed-image dataset and late-motion regression.
- `CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser -- --grep anchors --repeat-each=3`: all six focused cases passed after the complete anchor fix.
- Inspected the EN/PT-BR About pages visually, home/mobile screenshots, timeline, backend area, entry, and project DOM. Public output contains only the approved Career Ledger records, no review assets, and none of the checked private-preview project identifiers or local paths.

## Outcome

The shared EN/PT-BR copy, profile, section titles, About introduction, and two review captions now use direct personal language. Repeated publication-process footers are gone; estimates and recorded-activity samples remain distinguishable and the preview still clearly requires approval. All existing project identities, claims, percentages, and approval metadata remain unchanged. The incidental direct-anchor motion race is fixed and covered by repeated regressions. The root preview is available on port 4322 with no alternate-base references. No commit, push, merge, or deployment was performed.
