# Astro frontend

Read `site/AGENTS.md` and `.agents/skills/career-maintain-site/SKILL.md` before changing presentation.

- `src/lib/build-context.ts` is build-only. Browser modules must never import it or filesystem/private tooling.
- `src/lib/types.ts` re-exports the shared record contracts from `scripts/lib/model.ts` and adds presentation context; runtime schemas remain the validation authority. Browser imports of shared contracts must be type-only.
- Preserve all EN/PT-BR routes, URL-helper base paths, canonical/hreflang links, and static fallbacks.
- Keep the complete narrative in HTML. Motion and WebGL must remain removable enhancements.
- Use locally bundled Astro, TypeScript, GSAP, and the lazy hero-only Three.js chunk. Do not add a client router, React, Tailwind, CMS, remote assets, or runtime APIs.
- Preserve no-JavaScript, mobile, reduced-motion, keyboard, and WebGL failure states.
- No public-data promotion is implied by frontend work. Do not change candidate approval metadata.
- Run `npm run check` and `npm run check:browser`; inspect the local preview and a non-root base-path build.
