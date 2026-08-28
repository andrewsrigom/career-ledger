# Product-led copy and consolidated client work

## Purpose

Present one coherent client engagement instead of separate application and infrastructure projects, and make product descriptions clearer while emphasizing supported backend and AI contributions.

## Context

This is a private candidate edit with a small responsive-layout correction found during verification. Existing projects and chronological entries already hold the relevant implementation evidence; the owner has supplied additional accounting-platform responsibilities and clarified product positioning. The deployed site and approved content remain untouched.

## Privacy impact

Use only names the owner already released. Preserve private source histories, outcomes, attribution limits, and publication metadata. Archive the superseded standalone infrastructure candidate outside the active candidate directory; do not delete its canonical activities or workstream. Do not change audit rules or activity classifications to alter presentation percentages.

## Plan

1. Record owner context and map the requested copy to existing evidence.
2. Consolidate the client project and update project, entry, and experience copy in both languages.
3. Audit every changed candidate, build the preview, verify grouping and rendering, and run the harness.

## Progress

- [x] 2026-08-27: Read existing context, candidate relationships, and supporting workstreams.
- [x] Update private candidate copy and preserve the superseded presentation record.
- [x] Verify privacy, relationships, bilingual copy, mobile rendering, and public-build isolation.

## Decisions

- Keep the application project ID and URL; attach infrastructure chronology to that project.
- Preserve separate engineering-tool projects rather than folding them into the banking application solely because they supported integration work.
- Describe the actual API layer and infrastructure contribution without claiming ownership of the bank's whole backend or infrastructure estate.
- Treat search visibility and professional development as product purposes, not measured results.
- Do not invent a database engine for the accounting project or apply unrelated employer outcomes to it.

## Surprises

- The old infrastructure candidate uses generic container tooling and a narrower date window than its canonical workstream. Align the merged entry with the already recorded infrastructure evidence.
- Some related entries have no Portuguese translation; add equivalent copy while editing them so the product narrative is consistent.
- External-browser review found an existing 320-pixel minimum body width that overflowed when a desktop scrollbar consumed part of that viewport. Remove the forced minimum and strengthen the mobile regression to reserve a scrollbar gutter and inspect the actual available width. The regression failed before the CSS fix.

## Validation

```bash
npm run career:audit -- --candidate <changed-slug>
npm run check
CAREER_BROWSER_PREVIEW=1 npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_PREVIEW=1 CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser -- --workers=1
```

Verify one client project retains both entries, the superseded project is absent, all links resolve, recorded activity mix is unchanged, and public output has no candidate or review-image data. Inspect desktop and mobile in the external browser and check non-root bases.

## Outcome

Updated sixteen private candidates, including project, chronological-entry, and experience copy in English and Portuguese. One client project now links both application and infrastructure records; the superseded standalone project candidate is archived, not deleted. Product descriptions lead with supported backend, data, and AI contributions where applicable. Educational material retains its actual purpose rather than being relabeled as an AI system.

All sixteen changed candidates passed validation and privacy auditing. The complete harness passed 56 Node tests, strict TypeScript, 44 Astro checks with no diagnostics, public auditing, and a 60-file static build. The full public browser suite passed all 19 tests with the project-page base; the full private-preview suite passed all 19 tests with an alternate base. One earlier parallel preview run timed out while visiting the image galleries; the sequential repeat passed with the same timeout and assertions. The gallery test completed in 10 seconds on that repeat.

External Chrome inspection verified bilingual copy, the consolidated project's two entries and their reverse links, and narrow layouts. A scrollbar-width regression failed before removing the body's fixed minimum width and passed afterward. The accounting project now fits the actual 305-pixel content area of a 320-pixel viewport with desktop scrollbars.

The generated preview contains 16 projects and 14 entries. Recorded activity mix is unchanged across the same 91 activities. Public output contains only previously approved records and no review images or private-preview fields. Existing staged changes remain unchanged. No public-content, approval, dependency, audit-rule, canonical-activity, or source-repository changes were made. No commit, push, merge, or deployment occurred; the local preview is available for owner review.
