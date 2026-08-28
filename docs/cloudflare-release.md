# Cloudflare release and analytics

## Production

The public portfolio uses the existing Astro static build on Cloudflare Pages at <https://andrewsrigom.pages.dev/> (Portuguese at `/pt-br/`). The Pages project is `andrewsrigom`, with Direct Upload and production branch marker `main`. This marker selects the Cloudflare environment; it does not merge or switch the Git branch. The initial approved source branch is `portfolio-interactive-redesign`.

Only `dist/`, produced from validated `content/public/` and explicitly approved assets, is uploaded. Never upload `.career/reports/publication-preview/`, private candidates, the workspace root or credentials. No SSR, Worker, database, paid service or CMS is required. The prior GitHub Pages deployment is left intact.

## Automatic release from main

The owner approved automatic publication of reviewed changes accepted into `main`. `.github/workflows/cloudflare-pages.yml` runs on `push` to `main`; feature branches and pull requests do not deploy. Its job repeats validation, audit, type checks, Node tests and all three browser suites, then rebuilds for the production URL, retains the artifact for 90 days and deploys that exact revision. A failed step prevents upload and leaves the previous production deployment intact.

The GitHub `cloudflare-pages` environment permits only `main`. It holds `CLOUDFLARE_ACCOUNT_ID` and a dedicated `CLOUDFLARE_API_TOKEN` limited to Pages Write on the intended account. The local Wrangler OAuth login is never reused by CI. Restrict the environment to `main` without a second required-reviewer gate, since approval now happens before a change enters `main`.

Private candidates still require explicit content review and approval before entering `content/public/`. This policy does not authorize bulk promotion, branch merges by an agent, or publication from feature branches. The reviewed workflow must be integrated into `main` before the trigger becomes active there.

For an explicit retry, manually run **Deploy Cloudflare Pages** on `main` and check `confirm_publication`. Manual runs on other branches are rejected. Older successful Cloudflare deployments remain available for an explicitly requested rollback.

## Explicit local recovery release

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

## CI credential maintenance

The dedicated `career-ledger-github-pages` account token has Pages Write permission only. Its configured expiry is 2027-08-28; rotate it before that date by creating a replacement with the same scope, updating the environment secret, verifying a main release, and then revoking the old token. Never print the token, store it in repository files, or grant unrelated account permissions to resolve a deployment error.

If credentials are absent or expired, the upload fails and the current site stays live. Fix the restricted environment secret, then explicitly retry the failed main run. The initial release used local Wrangler; routine releases now use the authenticated Actions workflow after it reaches `main`.

## Analytics

Web Analytics is enabled in Cloudflare → Workers & Pages → `andrewsrigom` → Metrics. Pages injects its beacon on subsequent deployments. Do not also embed a beacon in Astro: that would double count. The source build and localhost preview remain tracker-free, with the existing external-resource audit unchanged.

The owner approved this narrow production runtime exception. Cloudflare Web Analytics reports visits, page views, referring sites, geography, browsers/devices and performance metrics; it is not a custom click/event tracker. Ad blockers and JavaScript-disabled visits can prevent measurement. Do not promise individual identification or treat analytics as a complete access log.

After deployment, check both languages, projects/galleries, contact links, canonical/hreflang, sitemap, robots and a missing route. Confirm that served HTML includes one Cloudflare beacon, its request succeeds and the dashboard begins receiving measurements. Localhost must contain no beacon. Measurements may take time to appear.

References: [Pages Web Analytics](https://developers.cloudflare.com/pages/how-to/web-analytics/), [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [manual CI uploads](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

## Rollback

Keep the preceding successful Cloudflare production deployment. Select it in Deployments and use the rollback action only with explicit owner approval; never delete it as cleanup. The first Cloudflare release has no earlier Cloudflare revision, so the unchanged GitHub Pages site remains the prior live fallback. A retained verified artifact or an explicitly approved source commit can also be rebuilt and redeployed. Rollback never requires a force-push or rewriting Git history.
