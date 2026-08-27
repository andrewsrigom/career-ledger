# Career Ledger

Career Ledger is a private-first system for preserving meaningful engineering activity over time and projecting selected, reviewed evidence into a sanitized public portfolio.

It is intentionally static and backend-free:

```text
local repositories
      ↓
private scans and evidence
      ↓
chronological activities
      ↓
evolving workstreams
      ↓
milestones and evidence-backed achievements
      ↓
career narratives and private material drafts
      ↓
public candidate
      ↓
manual approval
      ↓
static website and public JSON
      ↓
GitHub Pages
```

The private ledger engine uses strict TypeScript, Node.js standard-library modules, and native type stripping, without a runtime framework or TS runner. The frontend is a static Astro + TypeScript multi-page site, with progressive GSAP motion and a lazy Three.js hero. Dependencies are installed with `npm ci`; no fonts, scripts, images, or APIs are fetched from external services at runtime. GitHub Actions verifies changes automatically, but publication is manual.

## What this project protects against

A normal portfolio depends on memory and tends to reduce work to technologies and screenshots. Career Ledger keeps evidence close to the work while enforcing a hard boundary between private analysis and public claims.

The public build cannot read local repositories, private scans, draft initiatives, or local configuration. It only reads `content/public/`.

The ledger is the source of truth. Timeline pages, projects, resumes, summaries, and interview stories are different projections of the same evidence; they are not independent places to invent experience.

## First run

Requirements:

- Node.js 22.12 or newer
- Git
- Codex CLI or the Codex IDE extension for the agent workflows

Use the npm entrypoints below: they include `--experimental-strip-types` for compatibility with Node 22.12. That release prints an experimental-feature warning; newer Node versions support the same commands. Type stripping executes code but does not check it. `npm run typecheck` separately runs strict Node/test and Astro/browser checks without emitting files.

```bash
git init
git branch -M main
npm ci
npm run setup
npm run dev
```

Open `http://127.0.0.1:4321/` for the approved-content build. To review the complete local portfolio, including candidates and recorded activity mix, run `npm run dev:preview` and open `http://127.0.0.1:4322/`. Both servers bind to loopback by default. Seeing a record locally does not publish or approve it.

`npm run setup` creates ignored local folders, a private scoped `AGENTS.md`, and `career.local.json`, then installs the repository Git hooks when the directory is already a Git repository.

## Personalize the public site

Edit:

```text
content/public/profile.json
content/public/resume.json       optional approved CV extension
content/public/entries/
content/public/projects/
content/public/taxonomy.json
```

The included entry describes Career Ledger itself so the site renders immediately. Replace or extend it with approved career records.

The generated portfolio is bilingual. Existing English routes remain at the site root and Brazilian Portuguese is generated under `/pt-br/`. Each record may contain a validated `localizations.pt-BR` block beside its canonical English copy; translations inherit the same publication status and privacy boundary as the source record. The header language switch keeps visitors on the equivalent page.

Run the full verification harness:

```bash
npm run check
npx playwright install chromium
npm run check:browser
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
2. Use $career-analyze-project to capture meaningful activities and workstream progression
3. Use $career-consolidate-work when related activities form a larger effort
4. Confirm attribution, milestones, and real outcomes
5. Optionally use $career-compose-material for private resume, summary, or interview drafts
6. Use $career-sanitize-entry
7. Use $career-review-publication
8. npm run career:preview
9. Review the isolated local site
10. npm run career:approve -- --candidate <slug>
11. npm run check
12. Commit and push
```

Codex maintains evidence and drafts. You remain the approval layer.

## Public approval gate

A candidate is first written to:

```text
.career/private/public-candidates/<slug>.json
```

It can appear in the isolated localhost preview immediately; it cannot appear in the public build until you approve it:

```bash
npm run career:preview
npm run career:approve -- --candidate <slug>
```

The preview command validates and audits every candidate, combines them with the approved records, and renders ignored English and PT-BR review routes at `.career/reports/publication-preview/`. It never writes to `content/public/` or `dist/`, marks every page as a non-indexable draft preview, and cannot approve a record.

After visual review, the approval command displays one candidate, repeats validation and privacy checks, and asks you to type the slug. Only then is it copied into `content/public/entries/`, `content/public/projects/`, or the optional `content/public/resume.json` source.

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
3. Review the local preview and explicitly approve the intended records.
4. After an authorized merge to `main`, manually run **Deploy GitHub Pages** with **confirm_publication** checked. Pushing to `main` runs CI only, not deployment.

The workflow automatically derives the correct base path for both project pages and `<username>.github.io` repositories.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build, serve, and watch the public site locally |
| `npm run dev:preview` | Serve the isolated full candidate preview on port 4322 |
| `npm run build` | Generate the production site in `dist/` |
| `npm run typecheck` | Strictly check shared contracts, Node tooling/tests, and Astro/browser code without emitting files |
| `npm run check` | Validate, audit, type-check, run Node tests, build, check links and bundle budgets |
| `npm run check:browser` | Check public desktop, mobile, keyboard, localization, and fallback behavior |
| `CAREER_BROWSER_PREVIEW=1 npm run check:browser` | Run the same checks against local candidates (WSL/bash) |
| `npm run career:media-review` | Inventory private image references for owner review; copies no assets |
| `npm run career:doctor` | Check Node, Git, configuration, paths, and public data |
| `npm run career:scan -- --project <id>` | Create a private incremental repository scan |
| `npm run career:review` | Show scans, activities, workstreams, projections, candidates, and pending outcomes |
| `npm run career:validate` | Validate approved public content |
| `npm run career:validate-private` | Validate private activities, workstreams, and legacy initiatives |
| `npm run career:audit` | Scan public content and staged files for leakage |
| `npm run career:preview` | Build an ignored, non-indexable site for visual candidate review |
| `npm run career:publish` | Regenerate the public JSON API |
| `npm run career:approve -- --candidate <slug>` | Manually promote a reviewed candidate |

## Repository boundaries

```text
content/public/          committed and publishable
src/                     typed Astro presentation and browser enhancements
public/assets/           local favicon and explicitly approved project images
site/static/             optional CNAME deployment file
scripts/                 strict TypeScript deterministic tooling and shared record contracts
.agents/skills/          committed Codex workflows
.career/private/         ignored evidence, activities, workstreams, projections, and drafts
.career/reports/         ignored audits and candidate review builds
career.local.json        ignored local paths and sensitive terms
dist/                    ignored generated website
```

Never place raw work evidence in `content/public/`, even temporarily.

## Documentation

- `docs/privacy-model.md`
- `docs/operating-model.md`
- `docs/data-model.md`
- `docs/codex-workflow.md`
- `docs/github-pages.md`
- `docs/github-enrichment.md`
- `docs/achievement-writing.md`
- `docs/roadmap.md`
- `docs/definition-of-done.md`
- `docs/decisions/`
- `docs/frontend-architecture.md`
- `docs/decisions/0005-typescript-toolchain.md`

## Optional future integrations

The initial system treats local repositories as the primary source. A GitHub adapter can later enrich personal projects with public pull requests, issues, releases, and repository metadata. That integration should feed the private evidence layer and must not bypass review or publication approval.
