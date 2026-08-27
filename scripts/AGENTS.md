# Tooling Rules

- Keep the private ledger engine dependency-free and ESM-only.
- Author active modules in TypeScript with explicit `.ts` imports and erasable syntax. Run through the npm commands, which enable native Node type stripping on the supported minimum version.
- Keep `readJson` results unknown until runtime validation. Share domain contracts through `lib/model.ts`; do not replace validation with casts or disable strict checks to make a migration pass.
- Use Node.js standard-library APIs for ledger processing; the site-build adapter may invoke the owner-approved Astro compiler.
- Build frontend output in an isolated temporary workspace and never make candidate data an input to public `dist/`.
- Make filesystem writes atomic when practical.
- Never follow symlinks while collecting public files or building `dist/`.
- Never read `.career/private/` or `career.local.json` from public generation functions.
- Keep validation and privacy rules fail-closed.
- Do not weaken a check merely because a fixture or existing record fails; fix the data or add a narrowly documented safe rule.
- Keep commands usable from Windows, WSL, macOS, and Linux.
- Avoid shell commands when a Node API is sufficient. Git commands are the expected exception.
- Add Node test coverage for validation, privacy, URL generation, aggregation, and Git scan behavior.
- Run `npm run check` after changes.
