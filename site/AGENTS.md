# Public Site Rules

- Preserve an editorial, career-journal visual language rather than a SaaS dashboard aesthetic.
- Keep content readable, restrained, and evidence-focused.
- Use semantic HTML, visible focus, keyboard-accessible controls, and sufficient contrast.
- Respect reduced-motion preferences.
- The Astro frontend lives under `src/`; `site/static/` remains a compatibility source for deployment files such as `CNAME`.
- Astro, TypeScript, GSAP, and Three.js are approved. No React, client router, CMS, CDN, or runtime service is required.
- Three.js is lazy-loaded only for eligible desktop hero views and renders on demand; retain the static SVG fallback.
- Keep JavaScript optional for reading core content.
- Generate every internal link and asset URL through the base-path helper.
- Use system fonts only; the site must not depend on external font, analytics, image, or script requests.
- Do not add forms, authentication, a CMS, a backend, or tracking without an explicit product requirement.
- Do not edit `dist/`; change templates or assets and rebuild.
- Run `npm run check` after site changes.
- Run `npm run check:browser` before completing interaction changes.
