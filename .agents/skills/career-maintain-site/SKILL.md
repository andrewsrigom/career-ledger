---
name: career-maintain-site
description: Maintain or extend the static Career Ledger public website, templates, styles, accessibility, and generated pages. Use for visual or site behavior changes, not for analyzing private projects or publishing unapproved content.
---

# Maintain the Public Site

## Goal

Improve the static site while preserving privacy boundaries, editorial design, accessibility, and GitHub Pages portability.

## Workflow

1. Read `site/AGENTS.md`, `src/AGENTS.md`, and relevant Astro/component or Node build code.
2. Confirm the change remains static and within the owner-approved Astro, TypeScript, GSAP, and Three.js frontend boundary. The private ledger engine remains dependency-free, using strict TypeScript with native Node execution and shared validated contracts.
3. Use the existing public data model instead of introducing parallel content sources.
4. Generate internal links through the URL context helper.
5. Keep reading and navigation functional without client JavaScript.
6. Use progressive enhancement for filtering, editorial motion, project previews, and the isolated lazy hero scene. No core content may depend on animation or WebGL.
7. Preserve semantic structure, keyboard behavior, visible focus, and reduced motion.
8. Add or update tests for renderer or URL behavior.
9. Run the complete harness and browser checks; verify reduced motion, no-JavaScript reading, mobile, keyboard, and WebGL fallback behavior.
10. Keep media discovery reference-only. A project image needs separate explicit owner image approval, localized alt text, dimensions, and a bounded local WebP/AVIF file. Missing imagery uses the abstract diagram.
11. Keep calculated activity mix in the private preview until approved with a project or resume. Preserve the sample and recorded-activities label.

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
npm run check:browser
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
