# Project identity and screenshot review

## Purpose

Restore owner-cleared project names and add genuine page screenshots to the local portfolio review. Preserve a clear distinction between a product's identity, the owner's contribution, image selection, and permission to publish.

## Context

Several private candidates currently use generic names. The owner states that the project names are not confidential and requests screenshots of named storefront and component-library pages. Existing candidate and image approval gates must not be silently converted into publication approval. Preserve the current staged frontend work and prior unstaged fixes.

## Privacy impact

Only private candidates and locally reviewed media gain real project identity. Record the owner's name-release instruction privately; amend only explicitly released identity terms, retaining secret, customer-data, internal-URL, and ticket detection. Unreviewed captures stay ignored and must never enter public assets or `dist/`. No commit, push, merge, or deployment.

## Plan

1. Resolve project identities and existing contribution evidence; inspect available public pages.
2. Capture genuine interfaces, record source/date and review status, and integrate them into the private preview without claiming owner image approval.
3. Validate both preview and public isolation, automated tests, EN/PT-BR content, and external-browser presentation.

## Progress

- [x] Read the maintenance and candidate-writing skills and repository workflow.
- [x] Confirm identity mappings and screenshot sources.
- [x] Restore ten display identities and add three owner-confirmed project candidates, including links from the two identified resume experiences.
- [x] Prepare three genuine public browser captures and two owner-provided images, with bilingual captions and accurate capture/provision provenance.
- [x] Add a private-only media projection and static galleries, preserving the public schema and image approval gate.
- [x] Complete validation and external Chrome visual review.

## Decisions

- Keep published slugs and existing contribution scope stable when restoring display names.
- Use actual browser captures, not generated or fabricated screenshots.
- A current public storefront screenshot is context, not proof of authorship of every visible element or a historical snapshot.
- Keep publication approval separate from this request to prepare the local preview.
- Supplied screenshots do not acquire an invented capture date, and their visible data is not implicitly cleared for publication by a project-name release.
- Preserve the employment-level, self-reported adoption evidence for the newly identified accounting product. Do not transfer unrelated metrics or the entire employment stack into new projects.
- Keep the operational analytics contribution focused on the explicitly confirmed frontend/data visualization work, not the product's AI or downtime marketing claims.

## Surprises

- Existing local blocked terms include most project names, not just confidential identifiers. Any identity-policy correction must be traceable to the owner's current instruction.
- A hard-coded first-eleven limit hid newly identified featured projects; the homepage now honors the full explicit featured selection.
- Private candidate translations require a links array even when empty; initial preview validation caught missing arrays and they were corrected without weakening validation.
- Some supplementary external documentation capture attempts timed out. The successful home capture was used; no failed or fabricated image was substituted.

## Validation

```bash
npm run check
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
npm run build
```

- All 14 changed candidate records passed individual CLI validation and privacy audits.
- `npm run check`: 53 Node tests passed; strict TypeScript/Astro validation reported no errors, warnings, or hints across 43 files.
- Browser tests: 18 passed in each of three modes, without skips (54 executions). They cover image loading, bilingual captions, full-size keyboard links, no-JavaScript mobile layout, and the existing visual/animation regression suite.
- Five images total 335,460 bytes; each is below 110 KB and has verified WebP dimensions. Original supplied PNGs remain intact.
- External Chrome inspection confirmed loaded gallery images, named project content, and a 390px mobile view without horizontal overflow. The temporary viewport override was reset.
- Default public output restored: 60 files, 47.7 KB gzip main JavaScript, 131.2 KB lazy architecture. No review media, new private project names, or screenshots appear in public output.
- Existing nine staged changes preserved exactly; no public content or dependency change. Staged and unstaged whitespace checks passed; private records and images remain ignored.

## Outcome

Delivered locally on port 4322: recognizable project names, five genuine/reused images across four projects, full-size image galleries, and updated bilingual experience associations. No commit, push, merge, or publication occurred. Before a later publication, the owner must review visible financial/operational data and confirm precise storefront contribution scope; those pending items are recorded privately and do not block local review.
