# Local Career Workspace

Everything under `.career/private/`, `.career/state/`, `.career/reports/`, and `.career/tmp/` is local-only and ignored by Git.

The setup command also places a scoped private `AGENTS.md` inside this boundary and creates:

```text
.career/private/contexts/
.career/private/scans/
.career/private/drafts/
.career/private/initiatives/
.career/private/public-candidates/
.career/private/outcome-reviews/
.career/state/
.career/reports/
.career/tmp/
```

Do not remove these paths from `.gitignore`.
