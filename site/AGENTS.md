# Public Site Rules

- Preserve an editorial, career-journal visual language rather than a SaaS dashboard aesthetic.
- Keep content readable, restrained, and evidence-focused.
- Use semantic HTML, visible focus, keyboard-accessible controls, and sufficient contrast.
- Respect reduced-motion preferences.
- Keep JavaScript optional for reading core content.
- Generate every internal link and asset URL through the base-path helper.
- Use system fonts only; the site must not depend on external font, analytics, image, or script requests.
- Do not add forms, authentication, a CMS, a backend, or tracking without an explicit product requirement.
- Do not edit `dist/`; change templates or assets and rebuild.
- Run `npm run check` after site changes.
