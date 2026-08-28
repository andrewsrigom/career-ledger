# Cloudflare release and analytics

## Production

The public portfolio uses the existing Astro static build on Cloudflare Pages at <https://andrewsrigom.pages.dev/> (Portuguese at `/pt-br/`). The Pages project is `andrewsrigom`, with Direct Upload and production branch marker `main`. This marker selects the Cloudflare environment; it does not merge or switch the Git branch. The initial approved source branch is `portfolio-interactive-redesign`.

Only `dist/`, produced from validated `content/public/` and explicitly approved assets, is uploaded. Never upload `.career/reports/publication-preview/`, private candidates, the workspace root or credentials. No SSR, Worker, database, paid service or CMS is required. The prior GitHub Pages deployment is left intact.

## Approved manual release

Run in WSL or another shell with Node 24 and the owner's existing Wrangler login. Dependencies, including the deployment-only Wrangler CLI, are pinned in the lockfile.

```bash
npm ci
npx --no-install wrangler whoami
SITE_URL=https://andrewsrigom.pages.dev BASE_PATH=/ npm run check
npm run check:browser
CAREER_BROWSER_BASE_PATH=/career-ledger npm run check:browser
CAREER_BROWSER_BASE_PATH=/test-repository npm run check:browser
```

Review the source diff and public output, then commit/push only when explicitly authorized. Browser tests build their own localhost output, so rebuild immediately before upload:

```bash
SITE_URL=https://andrewsrigom.pages.dev BASE_PATH=/ npm run build
test -z "$(git status --porcelain)" || { echo 'Review and commit the source first.'; exit 1; }
WRANGLER_SEND_METRICS=false npx --no-install wrangler pages deploy dist --project-name andrewsrigom --branch main --commit-hash "$(git rev-parse HEAD)" --commit-dirty=false
```

`dist/`, `.wrangler/`, `.dev.vars*` and private release manifests remain ignored. An OAuth login is not a GitHub Actions credential and must never be copied into the repository.

## Optional GitHub Actions release

`.github/workflows/cloudflare-pages.yml` has only `workflow_dispatch`; pushes and CI success do not publish. The owner must select the reviewed branch and check the explicit publication confirmation. The workflow must be present on the repository's default branch before GitHub exposes manual dispatch; the initial branch is not merged implicitly.

To enable this optional route later, configure the `cloudflare-pages` GitHub environment with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`, restricted to the intended account with Cloudflare Pages Edit. Keep tokens in GitHub Secrets, not files or chat. The workflow runs checks, retains the verified artifact for 90 days and deploys the exact selected revision. The first release can use the local authenticated CLI without adding a CI token.

## Analytics

Web Analytics is enabled in Cloudflare → Workers & Pages → `andrewsrigom` → Metrics. Pages injects its beacon on subsequent deployments. Do not also embed a beacon in Astro: that would double count. The source build and localhost preview remain tracker-free, with the existing external-resource audit unchanged.

The owner approved this narrow production runtime exception. Cloudflare Web Analytics reports visits, page views, referring sites, geography, browsers/devices and performance metrics; it is not a custom click/event tracker. Ad blockers and JavaScript-disabled visits can prevent measurement. Do not promise individual identification or treat analytics as a complete access log.

After deployment, check both languages, projects/galleries, contact links, canonical/hreflang, sitemap, robots and a missing route. Confirm that served HTML includes one Cloudflare beacon, its request succeeds and the dashboard begins receiving measurements. Localhost must contain no beacon. Measurements may take time to appear.

References: [Pages Web Analytics](https://developers.cloudflare.com/pages/how-to/web-analytics/), [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [manual CI uploads](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

## Rollback

Keep the preceding successful Cloudflare production deployment. Select it in Deployments and use the rollback action only with explicit owner approval; never delete it as cleanup. The first Cloudflare release has no earlier Cloudflare revision, so the unchanged GitHub Pages site remains the prior live fallback. A retained verified artifact or an explicitly approved source commit can also be rebuilt and redeployed. Rollback never requires a force-push or rewriting Git history.
