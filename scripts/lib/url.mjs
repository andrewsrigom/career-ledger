import { normalizeBasePath, normalizeSiteUrl } from './files.mjs';

export function createUrlContext(options = {}) {
  const siteUrl = normalizeSiteUrl(options.siteUrl ?? process.env.SITE_URL);
  const basePath = normalizeBasePath(options.basePath ?? process.env.BASE_PATH);

  function href(target = '') {
    const clean = String(target).replace(/^\/+/, '');
    if (!clean) {
      return `${basePath}/` || '/';
    }
    return `${basePath}/${clean}`;
  }

  function absolute(target = '') {
    return `${siteUrl}${href(target)}`;
  }

  return {
    siteUrl,
    basePath,
    href,
    absolute
  };
}
