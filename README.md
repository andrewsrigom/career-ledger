# Career Ledger

Career Ledger is a private-first system for turning local engineering activity into a reviewed, sanitized, public record of projects, initiatives, and outcomes.

It is intentionally static and backend-free:

```text
local repositories
      ↓
private scans and evidence
      ↓
Codex analysis and consolidation
      ↓
public candidate
      ↓
manual approval
      ↓
static website and public JSON
      ↓
GitHub Pages
```

The repository has zero runtime dependencies and does not require `npm install`. Node.js generates the site from approved JSON, and GitHub Actions publishes the generated `dist/` directory.

## What this project protects against

A normal portfolio depends on memory and tends to reduce work to technologies and screenshots. Career Ledger keeps evidence close to the work while enforcing a hard boundary between private analysis and public claims.

The public build cannot read local repositories, private scans, draft initiatives, or local configuration. It only reads `content/public/`.

## First run

Requirements:

- Node.js 22.12 or newer
- Git
- Codex CLI or the Codex IDE extension for the agent workflows

```bash
git init
git branch -M main
npm run setup
npm run dev
```

Open `http://localhost:4321`.

`npm run setup` creates ignored local folders, a private scoped `AGENTS.md`, and `career.local.json`, then installs the repository Git hooks when the directory is already a Git repository.

## Personalize the public site

Edit:

```text
content/public/profile.json
content/public/entries/
content/public/projects/
content/public/taxonomy.json
```

The included entry describes Career Ledger itself so the site renders immediately. Replace or extend it with approved career records.

Run the full verification harness:

```bash
npm run check
```

## Add a local project

Edit `career.local.json`:

```json
{
  "owner": {
    "name": "Andrews",
    "gitIdentities": [
      {
        "name": "Andrews",
        "emails": ["your-email@example.com"]
      }
    ]
  },
  "projects": [
    {
      "id": "work-application",
      "label": "Private work application",
      "path": "../work-application",
      "kind": "work",
      "visibility": "private",
      "contextFile": ".career/private/contexts/work-application.md",
      "scan": {
        "since": "2026-01-01",
        "maxCommits": 200,
        "includeUncommitted": true
      }
    }
  ],
  "privacy": {
    "blockedTerms": ["Client Name", "Internal Product Name"],
    "blockedPatterns": []
  }
}
```

Create the context file from `templates/project-context.md`. It should explain your role, ownership boundaries, sensitive terms, and what the agent may inspect.

Then run:

```bash
npm run career:scan -- --project work-application
```

The scan stores Git metadata in `.career/private/scans/`. It does not copy source code into this repository.

The command prints a Codex command that grants read access to the configured project directory with `--add-dir`. Run it or invoke the `$career-analyze-project` skill manually.

## Recommended Codex loop

```text
1. npm run career:scan -- --project <id>
2. Use $career-analyze-project
3. Use $career-consolidate-work when related drafts exist
4. Confirm attribution and real outcomes
5. Use $career-sanitize-entry
6. Use $career-review-publication
7. npm run career:approve -- --candidate <slug>
8. npm run check
9. Commit and push
```

Codex maintains evidence and drafts. You remain the approval layer.

## Public approval gate

A candidate is first written to:

```text
.career/private/public-candidates/<slug>.json
```

It cannot appear on the website until you approve it:

```bash
npm run career:approve -- --candidate <slug>
```

The command displays the candidate, runs validation and privacy checks, and asks you to type the slug. Only then is it copied into `content/public/entries/` or `content/public/projects/`.

## Publish with GitHub Pages

Create a GitHub repository and push:

```bash
git add .
git commit -m "Initialize Career Ledger"
git remote add origin git@github.com:<username>/<repository>.git
git push -u origin main
```

In GitHub:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`, or run the **Deploy GitHub Pages** workflow manually.

The workflow automatically derives the correct base path for both project pages and `<username>.github.io` repositories.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build, serve, and watch the public site locally |
| `npm run build` | Generate the production site in `dist/` |
| `npm run check` | Validate, audit, test, and build |
| `npm run career:doctor` | Check Node, Git, configuration, paths, and public data |
| `npm run career:scan -- --project <id>` | Create a private incremental repository scan |
| `npm run career:review` | Show scans, drafts, candidates, and pending outcome reviews |
| `npm run career:validate` | Validate approved public content |
| `npm run career:validate-private` | Validate private drafts and initiatives |
| `npm run career:audit` | Scan public content and staged files for leakage |
| `npm run career:publish` | Regenerate the public JSON API |
| `npm run career:approve -- --candidate <slug>` | Manually promote a reviewed candidate |

## Repository boundaries

```text
content/public/          committed and publishable
site/                    committed public presentation
scripts/                 committed deterministic tooling
.agents/skills/          committed Codex workflows
.career/private/         ignored private evidence and drafts
career.local.json        ignored local paths and sensitive terms
dist/                    ignored generated website
```

Never place raw work evidence in `content/public/`, even temporarily.

## Documentation

- `docs/privacy-model.md`
- `docs/data-model.md`
- `docs/codex-workflow.md`
- `docs/github-pages.md`
- `docs/github-enrichment.md`
- `docs/roadmap.md`
- `docs/definition-of-done.md`
- `docs/decisions/`

## Optional future integrations

The initial system treats local repositories as the primary source. A GitHub adapter can later enrich personal projects with public pull requests, issues, releases, and repository metadata. That integration should feed the private evidence layer and must not bypass review or publication approval.
