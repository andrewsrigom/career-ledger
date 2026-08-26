# Tooling Rules

- Keep scripts dependency-free and ESM-only.
- Use Node.js standard-library APIs.
- Make filesystem writes atomic when practical.
- Never follow symlinks while collecting public files or building `dist/`.
- Never read `.career/private/` or `career.local.json` from public generation functions.
- Keep validation and privacy rules fail-closed.
- Do not weaken a check merely because a fixture or existing record fails; fix the data or add a narrowly documented safe rule.
- Keep commands usable from Windows, WSL, macOS, and Linux.
- Avoid shell commands when a Node API is sufficient. Git commands are the expected exception.
- Add Node test coverage for validation, privacy, URL generation, aggregation, and Git scan behavior.
- Run `npm run check` after changes.
