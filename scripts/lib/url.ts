export interface UrlOptions { siteUrl?: string; basePath?: string; locale?: string; }
export type UrlContext = ReturnType<typeof createUrlContext>;

import { normalizeBasePath, normalizeSiteUrl } from './files.ts';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, localeDefinition } from './i18n.ts';

export function createUrlContext(options: UrlOptions = {}) {
  const siteUrl = normalizeSiteUrl(options.siteUrl ?? process.env.SITE_URL);
  const basePath = normalizeBasePath(options.basePath ?? process.env.BASE_PATH);
  const locale = localeDefinition(options.locale ?? DEFAULT_LOCALE);

  function joinPath(prefix: string, target = '') {
    const clean = String(target).replace(/^\/+/, '');
    const parts = [prefix, clean].filter(Boolean);
    if (!parts.length) return `${basePath}/` || '/';
    return `${basePath}/${parts.join('/')}${clean ? '' : '/'}`;
  }

  function href(target = '') {
    return joinPath(locale.routePrefix, target);
  }

  function rootHref(target = '') {
    return joinPath('', target);
  }

  function absolute(target = '') {
    return `${siteUrl}${href(target)}`;
  }

  function alternateHref(targetLocale: string, target = '') {
    return joinPath(localeDefinition(targetLocale).routePrefix, target);
  }

  function alternateAbsolute(targetLocale: string, target = '') {
    return `${siteUrl}${alternateHref(targetLocale, target)}`;
  }

  return {
    siteUrl,
    basePath,
    locale: locale.code,
    routePrefix: locale.routePrefix,
    supportedLocales: SUPPORTED_LOCALES,
    href,
    rootHref,
    absolute,
    alternateHref,
    alternateAbsolute
  };
}
