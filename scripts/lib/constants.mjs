import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));

export const PATHS = Object.freeze({
  root: ROOT,
  publicContent: path.join(ROOT, 'content', 'public'),
  publicEntries: path.join(ROOT, 'content', 'public', 'entries'),
  publicProjects: path.join(ROOT, 'content', 'public', 'projects'),
  profile: path.join(ROOT, 'content', 'public', 'profile.json'),
  taxonomy: path.join(ROOT, 'content', 'public', 'taxonomy.json'),
  localConfig: path.join(ROOT, 'career.local.json'),
  localConfigExample: path.join(ROOT, 'career.local.example.json'),
  careerPrivate: path.join(ROOT, '.career', 'private'),
  scans: path.join(ROOT, '.career', 'private', 'scans'),
  drafts: path.join(ROOT, '.career', 'private', 'drafts'),
  initiatives: path.join(ROOT, '.career', 'private', 'initiatives'),
  candidates: path.join(ROOT, '.career', 'private', 'public-candidates'),
  approvedCandidates: path.join(ROOT, '.career', 'private', 'approved-candidates'),
  outcomeReviews: path.join(ROOT, '.career', 'private', 'outcome-reviews'),
  contexts: path.join(ROOT, '.career', 'private', 'contexts'),
  state: path.join(ROOT, '.career', 'state'),
  reports: path.join(ROOT, '.career', 'reports'),
  tmp: path.join(ROOT, '.career', 'tmp'),
  site: path.join(ROOT, 'site'),
  siteAssets: path.join(ROOT, 'site', 'assets'),
  siteStatic: path.join(ROOT, 'site', 'static'),
  dist: path.join(ROOT, 'dist')
});

export const PRIVATE_PATH_PREFIXES = Object.freeze([
  '.career/private/',
  '.career/state/',
  '.career/reports/',
  '.career/tmp/'
]);

export const LOCAL_ONLY_FILES = Object.freeze([
  'career.local.json'
]);
