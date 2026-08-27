# Create a project-first single-page portfolio

## Purpose

Make the homepage immediately show each project and the work completed inside it, using the visual rhythm of the timeline without requiring visitors to open detail pages.

## Context

- The current homepage separates achievements, areas, projects, statistics, and publishing methodology into several sections.
- The timeline has the strongest visual hierarchy, but its cards still require a second page to reveal contributions and outcomes.
- Project and entry detail routes remain useful as durable permalinks, but they should no longer be required for the primary reading experience.
- The private candidate preview contains the three owner-created projects being reviewed.

## Privacy impact

This is a presentation change only. It reuses the existing public dataset and the isolated candidate preview dataset. It does not create another content source, approve candidates, or move private material into `content/public/`.

## Plan

1. Replace the multi-section homepage with a compact introduction and a project-led chronological record.
2. Render project context, achievements, contributions, and supported outcomes inline, with optional permanent links remaining secondary.
3. Simplify primary navigation and codify an evidence-safe XYZ-inspired writing pattern.
4. Add renderer tests, run the complete validation suite, and inspect the review site on desktop and mobile.

## Progress

- [x] 2026-08-26: Confirmed the desired hierarchy: project first, completed work second, supported result third.
- [x] 2026-08-26: Implemented the single-page project record and removed the statistics, area cards, duplicate project cards, and publishing-method section from the homepage.
- [x] 2026-08-26: Added renderer coverage and passed the full validation, privacy audit, test, build, and private-preview commands.
- [x] 2026-08-26: Applied owner feedback: switched to a white minimal surface, removed the large editorial hero and duplicated descriptions, reduced type and spacing, placed results first, and limited the homepage to three key contributions per achievement.
- [x] 2026-08-26: Reworked the page toward the supplied editorial reference: added a concise portfolio introduction, serif project display type, restrained rust accents, compact project rows, and native inline expansion with the first project open.
- [x] 2026-08-26: Owner reviewed the direction through multiple iterations and chose to evolve the result into a broader portfolio/CV experience.

## Decisions

- Keep detail routes for permalinks and structured metadata, but make them unnecessary for understanding the work.
- Remove dashboard-like counts, area cards, duplicate project cards, and methodology from the homepage.
- Follow the XYZ structure without manufacturing the Y: use a measurement only when evidence exists, otherwise state a verified result and the method.
- Keep technologies and taxonomy on detail routes so they do not compete with the project narrative on the homepage.
- Keep the homepage dense and neutral: system sans-serif typography, white background, quiet dividers, no theme control, and no decorative numbering.
- Show supported results before implementation details and reserve the full contribution inventory for detail routes.
- Present the site as Andrews's software engineering portfolio in visible copy and page metadata; keep "Career Ledger" as a project name rather than the homepage identity.
- Use native `details` elements so compact project rows expand in place without JavaScript or a required page transition.

## Surprises

- Automated browser inspection of the localhost preview was blocked by the browser URL policy. The generated markup and responsive rules were validated by tests, but the final visual judgment remains with the owner in the already-running local preview.

## Validation

```bash
npm run check
npm run career:preview
```

Inspect the home, retained detail routes, one area route, desktop and mobile layouts, keyboard focus, base-path links, and browser console.

## Outcome

The review homepage now presents Andrews's portfolio through a concise professional introduction and a compact project index. The first project is open by default; every other project expands inline to reveal supported outcomes under "Results," three central contributions under "Key work," and short secondary links. Detail routes retain the complete record without being required for the primary reading experience. Publication status and content boundaries are unchanged; the three private project candidates remain only in the ignored preview.
