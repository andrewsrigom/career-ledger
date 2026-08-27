import fs from 'node:fs';
import { localizeCareerDataset, messagesFor, SUPPORTED_LOCALES } from '../../scripts/lib/i18n.ts';
import { createUrlContext } from '../../scripts/lib/url.ts';
import type { CareerDataset, LocaleCode, SiteContext } from './types';

export type { LocaleCode } from './types';
export type PageKind = 'home' | 'timeline' | 'areas' | 'area' | 'projects' | 'project' | 'entry' | 'about' | 'not-found';

export interface PageDescriptor {
  locale: LocaleCode;
  kind: PageKind;
  path: string;
  slug?: string;
}

const dataPath = process.env.CAREER_BUILD_DATA_PATH;

if (!dataPath) {
  throw new Error('CAREER_BUILD_DATA_PATH is required during the Astro build.');
}

// This ephemeral file is written by the validating Node adapter, not a content source.
const sourceData: CareerDataset = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

export function siteContext(locale: LocaleCode): SiteContext {
  // The Node adapter validates the JSON before this build-only boundary.
  const data = localizeCareerDataset(sourceData, locale);
  const urls = createUrlContext({
    siteUrl: process.env.SITE_URL,
    basePath: process.env.BASE_PATH,
    locale
  });

  return {
    data,
    urls,
    copy: messagesFor(locale),
    locale
  };
}

export function pageDescriptors(): PageDescriptor[] {
  const descriptors: PageDescriptor[] = [];

  for (const localeDefinition of SUPPORTED_LOCALES) {
    const locale = localeDefinition.code;
    const prefix = localeDefinition.routePrefix ? `${localeDefinition.routePrefix}/` : '';
    const data = localizeCareerDataset(sourceData, locale);

    descriptors.push(
      { locale, kind: 'home', path: prefix },
      { locale, kind: 'timeline', path: `${prefix}timeline` },
      { locale, kind: 'areas', path: `${prefix}areas` },
      { locale, kind: 'projects', path: `${prefix}projects` },
      { locale, kind: 'about', path: `${prefix}about` }
    );

    if (locale === 'pt-BR') {
      descriptors.push({ locale, kind: 'not-found', path: `${prefix}404.html` });
    }

    for (const area of data.taxonomy.areas) {
      descriptors.push({ locale, kind: 'area', path: `${prefix}areas/${area.slug}`, slug: area.slug });
    }

    for (const project of data.projects) {
      descriptors.push({ locale, kind: 'project', path: `${prefix}projects/${project.slug}`, slug: project.slug });
    }

    for (const entry of data.entries) {
      descriptors.push({ locale, kind: 'entry', path: `${prefix}entries/${entry.slug}`, slug: entry.slug });
    }
  }

  return descriptors;
}
