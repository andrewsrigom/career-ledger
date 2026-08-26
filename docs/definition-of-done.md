# Definition of Done

## Public content

- The record describes meaningful work rather than a sequence of commits.
- Scope and ownership language are conservative and accurate.
- Deliverables and outcomes are separated.
- Every outcome has an accepted evidence level.
- Confidential names, identifiers, paths, URLs, metrics, and security details are absent.
- The record has explicit approval metadata.
- It does not duplicate an existing initiative.

## Tooling

- The default workflow remains offline.
- Public generation reads only `content/public/` and static site assets.
- Generated output is deterministic.
- Windows, WSL, Linux, and macOS behavior is considered.
- New logic has tests.

## Site

- Navigation works with and without a GitHub Pages base path.
- Pages are usable with keyboard navigation and visible focus.
- Content remains readable on mobile and large screens.
- Reduced-motion preferences are respected.
- `dist/` contains no private data.

## Verification

```bash
npm run check
```

Also inspect the home page, timeline, one area page, one project page, and one entry page locally.
