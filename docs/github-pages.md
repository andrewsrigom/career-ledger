# GitHub Pages Deployment

The repository includes `.github/workflows/pages.yml`.

The workflow:

1. checks out the repository;
2. configures Node.js and installs locked dependencies with `npm ci`;
3. derives `SITE_URL` and `BASE_PATH` from the repository name;
4. runs validation, privacy audit, Node tests, Astro type-check, the static build, link checks, and bundle budgets;
5. uploads `dist/` as the Pages artifact;
6. retains an additional verified public artifact for 90 days and deploys with the GitHub Pages deployment action.

It runs **only** through `workflow_dispatch` on `main`, with `confirm_publication` explicitly checked. A push or merge does not deploy. CI still verifies pushes to `main` and pull requests automatically.

## Repository types

For a project repository:

```text
https://username.github.io/career-ledger/
```

The workflow sets:

```text
SITE_URL=https://username.github.io
BASE_PATH=/career-ledger
```

For a special user-pages repository named `username.github.io`:

```text
SITE_URL=https://username.github.io
BASE_PATH=
```

All generated links and assets use the configured base path.

## Initial setup

After pushing the repository:

1. open repository **Settings**;
2. open **Pages**;
3. choose **GitHub Actions** as the source;
4. review the localhost candidate preview and approve the intended public records;
5. run the deployment workflow manually from `main` and confirm publication.

No push, merge, or workflow dispatch should be performed before owner approval. Changes to this workflow take effect remotely only after an authorized push/merge; editing it locally does not change the existing deployed site.

## Rollback

The currently deployed site remains available until a successful, explicitly approved replacement. Before the first redesign deployment, record the last successful Pages deployment's full source commit SHA in the release review and retain its artifact locally if available.

For subsequent releases, `public-site-<run-id>` retains the verified static output for 90 days. Keep the last stable artifact outside this expiration window when long-term retention is needed.

To roll back, manually dispatch the current workflow from `main`, check `confirm_publication`, and supply the stable full SHA in `source_commit`. The workflow verifies that it belongs to `main` history and checks it out detached for the build; it does not change or force-push branches. Historical dependency-free revisions skip installation if no lockfile exists. The normal validation/audit/build still runs. Blank `source_commit` publishes current `main`.

## Custom domain

Set repository variables:

```text
SITE_URL=https://career.example.com
BASE_PATH=
```

Then add your domain configuration in GitHub Pages and place a `CNAME` file under `site/static/` containing the domain.

The workflow prefers explicit repository variables over automatically derived values.

## Local production build

Test a project-pages path locally:

```bash
SITE_URL=https://username.github.io BASE_PATH=/career-ledger npm run build
```

On PowerShell:

```powershell
$env:SITE_URL="https://username.github.io"
$env:BASE_PATH="/career-ledger"
npm run build
```
