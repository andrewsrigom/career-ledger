export type { LocaleCode } from '../../scripts/lib/model.ts';
import type { LocaleCode } from '../../scripts/lib/model.ts';
export type { UrlContext } from '../../scripts/lib/url.ts';
import type { UrlContext } from '../../scripts/lib/url.ts';
export type { SiteCopy } from '../../scripts/lib/i18n.ts';
import type { SiteCopy } from '../../scripts/lib/i18n.ts';

export type { PublicLink, Period, Outcome, Publication, ActivityDomain, ActivityMix,
  ProjectVisual, Project, Entry, Profile, Resume, CareerDataset } from '../../scripts/lib/model.ts';
import type { CareerDataset } from '../../scripts/lib/model.ts';

export interface SiteContext {
  data: CareerDataset;
  urls: UrlContext;
  copy: SiteCopy;
  locale: LocaleCode;
}

export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
