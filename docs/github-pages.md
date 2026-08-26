# GitHub Pages Deployment

The repository includes `.github/workflows/pages.yml`.

The workflow:

1. checks out the repository;
2. configures Node.js;
3. derives `SITE_URL` and `BASE_PATH` from the repository name;
4. runs validation, privacy audit, tests, and the static build;
5. uploads `dist/` as the Pages artifact;
6. deploys with the GitHub Pages deployment action.

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
4. run the deployment workflow or push to `main`.

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
