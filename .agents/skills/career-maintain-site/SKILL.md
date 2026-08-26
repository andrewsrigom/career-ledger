---
name: career-maintain-site
description: Maintain or extend the static Career Ledger public website, templates, styles, accessibility, and generated pages. Use for visual or site behavior changes, not for analyzing private projects or publishing unapproved content.
---

# Maintain the Public Site

## Goal

Improve the static site while preserving privacy boundaries, editorial design, accessibility, and GitHub Pages portability.

## Workflow

1. Read `site/AGENTS.md` and relevant renderer code.
2. Confirm the change can remain static and dependency-free.
3. Use the existing public data model instead of introducing parallel content sources.
4. Generate internal links through the URL context helper.
5. Keep reading and navigation functional without client JavaScript.
6. Use progressive enhancement for filtering, theme preference, and small interactions.
7. Preserve semantic structure, keyboard behavior, visible focus, and reduced motion.
8. Add or update tests for renderer or URL behavior.
9. Run the complete harness.

## Visual direction

- editorial engineering journal;
- generous whitespace and strong typography;
- quiet borders and restrained metadata;
- no decorative dashboard charts without meaningful data;
- no generic gradient-heavy SaaS hero;
- system fonts and no external assets.

## Completion checks

```bash
npm run check
```

Inspect at minimum:

- home;
- timeline;
- one entry;
- one project;
- one area;
- mobile width;
- keyboard focus;
- a build with `BASE_PATH=/test-repository`.
