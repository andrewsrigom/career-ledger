import type { EntryRecord, ProjectRecord, ResumeRecord, ProfileRecord, TaxonomyRecord, PublicContent, PrivateActivity, PrivateWorkstream, PrivateInitiative, LocalConfig, PublicRecord, FileRecord } from './model.ts';
import { errorMessage, isObject } from './files.ts';
export { isObject } from './files.ts';

export interface RecordOptions { mode?: 'public' | 'candidate'; source?: string; }
interface ValueOptions { min?: number; max?: number; pattern?: RegExp; nullable?: boolean; exclusiveMin?: boolean; itemMin?: number; itemMax?: number; }
export interface ContentPaths { entriesDir?: string; projectsDir?: string; profileFile?: string; resumeFile?: string; taxonomyFile?: string; }
export interface PrivatePaths { activitiesDir?: string; workstreamsDir?: string; draftsDir?: string; initiativesDir?: string; }

import path from 'node:path';
import { PATHS } from './constants.ts';
import { ACTIVITY_DOMAINS } from './domains.ts';
import { listJsonFiles, pathExists, readJson, walkFiles } from './files.ts';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ENTRY_KINDS = new Set(['architecture', 'improvement', 'investigation', 'launch', 'leadership', 'learning', 'project', 'reliability', 'research']);
const ENTRY_STATUSES = new Set(['active', 'completed', 'archived']);
const PROJECT_KINDS = new Set(['application', 'open-source', 'platform', 'product', 'research', 'tool']);
const PROJECT_STATUSES = new Set(['active', 'completed', 'archived', 'paused']);
const RESUME_ENGAGEMENTS = new Set(['full-time', 'contract', 'independent']);
const LOCALIZATION_CODES = new Set(['pt-BR']);
const EVIDENCE_LEVELS = new Set(['observed', 'measured', 'self-reported', 'public']);
const ATTRIBUTION_SCOPES = new Set(['implemented', 'contributed', 'designed', 'led', 'owned', 'investigated']);
const PRIVATE_STATUSES = new Set(['detected', 'active', 'completed', 'ready-for-sanitization', 'archived']);
const ACTIVITY_TYPES = new Set([
  'build', 'design', 'architecture', 'implementation', 'investigation', 'research', 'migration', 'optimization',
  'performance', 'testing', 'reliability', 'security', 'accessibility', 'infrastructure', 'automation', 'integration',
  'maintenance', 'refactoring', 'leadership', 'mentoring', 'planning', 'release', 'product', 'developer-experience',
  'documentation', 'observability'
]);
const ACTIVITY_DOMAIN_SET = new Set(ACTIVITY_DOMAINS);
const SIGNIFICANCE_LEVELS = new Set(['activity', 'notable', 'milestone', 'achievement']);
const ACTIVITY_PROGRESSIONS = new Set(['started', 'continued', 'expanded', 'completed', 'revisited']);
const PROVENANCE_STATES = new Set(['observed', 'provided', 'derived', 'inferred', 'unverified']);
const SUPPORTED_PROVENANCE_STATES = new Set(['observed', 'provided', 'derived']);
const PRIVATE_EVIDENCE_TYPES = new Set([
  'scan', 'commit', 'file', 'diff', 'pull-request', 'branch', 'test', 'configuration', 'architecture', 'document',
  'dependency', 'release', 'deployment', 'issue', 'user-context', 'manual-note', 'public-source'
]);
const ENRICHMENT_REASONS = new Set(['impact', 'ownership', 'scale', 'adoption', 'public-safety', 'accuracy', 'resume-strength']);

export class ValidationError extends Error {
  issues: string[];
  constructor(message: string, issues: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

function issue(issues: string[], location: string, message: string) {
  issues.push(`${location}: ${message}`);
}

function required(value: Record<string, unknown>, keys: string[], location: string, issues: string[]) {
  for (const key of keys) {
    if (!(key in value)) {
      issue(issues, location, `missing required field "${key}"`);
    }
  }
}

function exactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, location: string, issues: string[]) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issue(issues, `${location}.${key}`, 'unexpected field');
    }
  }
}

function stringValue(value: unknown, location: string, issues: string[], options: ValueOptions = {}) {
  const { min = 0, max = Infinity, pattern, nullable = false } = options;
  if (nullable && value === null) {
    return;
  }
  if (typeof value !== 'string') {
    issue(issues, location, 'must be a string');
    return;
  }
  if (value.length < min) {
    issue(issues, location, `must contain at least ${min} characters`);
  }
  if (value.length > max) {
    issue(issues, location, `must contain at most ${max} characters`);
  }
  if (pattern && !pattern.test(value)) {
    issue(issues, location, 'has an invalid format');
  }
}

function booleanValue(value: unknown, location: string, issues: string[]) {
  if (typeof value !== 'boolean') {
    issue(issues, location, 'must be a boolean');
  }
}

function integerValue(value: unknown, location: string, issues: string[], options: ValueOptions = {}) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    issue(issues, location, 'must be an integer');
    return;
  }
  if (value < min || value > max) {
    issue(issues, location, `must be between ${min} and ${max}`);
  }
}

function numberValue(value: unknown, location: string, issues: string[], options: ValueOptions = {}) {
  const { min = -Infinity, max = Infinity, exclusiveMin = false } = options;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issue(issues, location, 'must be a finite number');
    return;
  }
  if ((exclusiveMin ? value <= min : value < min) || value > max) {
    issue(issues, location, `must be ${exclusiveMin ? 'greater than' : 'at least'} ${min} and at most ${max}`);
  }
}

function arrayValue(value: unknown, location: string, issues: string[], options: ValueOptions = {}): value is unknown[] {
  const { min = 0, max = Infinity } = options;
  if (!Array.isArray(value)) {
    issue(issues, location, 'must be an array');
    return false;
  }
  if (value.length < min) {
    issue(issues, location, `must contain at least ${min} item(s)`);
  }
  if (value.length > max) {
    issue(issues, location, `must contain at most ${max} item(s)`);
  }
  return true;
}

function uniqueStrings(value: unknown, location: string, issues: string[]) {
  if (!Array.isArray(value)) {
    return;
  }
  const normalized = value.map((item) => String(item).toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    issue(issues, location, 'must not contain duplicate values');
  }
}

function enumValue(value: unknown, allowed: ReadonlySet<string>, location: string, issues: string[]) {
  if (typeof value !== 'string' || !allowed.has(value)) {
    issue(issues, location, `must be one of: ${[...allowed].join(', ')}`);
  }
}

function validateDate(value: unknown, location: string, issues: string[], nullable = false) {
  stringValue(value, location, issues, { pattern: DATE, nullable });
  if (value === null || typeof value !== 'string' || !DATE.test(value)) {
    return;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    issue(issues, location, 'must be a real ISO calendar date');
  }
}

function validatePeriod(value: unknown, location: string, issues: string[]) {
  if (!isObject(value)) {
    issue(issues, location, 'must be an object');
    return;
  }
  const allowed = new Set(['start', 'end', 'label']);
  required(value, [...allowed], location, issues);
  exactKeys(value, allowed, location, issues);
  validateDate(value.start, `${location}.start`, issues);
  validateDate(value.end, `${location}.end`, issues, true);
  stringValue(value.label, `${location}.label`, issues, { min: 4, max: 80 });
  if (typeof value.start === 'string' && typeof value.end === 'string' && value.end < value.start) {
    issue(issues, location, 'end date must not be earlier than start date');
  }
}

function validateLinks(value: unknown, location: string, issues: string[]) {
  if (!arrayValue(value, location, issues, { max: 8 })) {
    return;
  }
  value.forEach((link, index) => {
    const itemLocation = `${location}[${index}]`;
    if (!isObject(link)) {
      issue(issues, itemLocation, 'must be an object');
      return;
    }
    const allowed = new Set(['label', 'href']);
    required(link, [...allowed], itemLocation, issues);
    exactKeys(link, allowed, itemLocation, issues);
    stringValue(link.label, `${itemLocation}.label`, issues, { min: 1, max: 80 });
    stringValue(link.href, `${itemLocation}.href`, issues, { min: 8, max: 500 });
    if (typeof link.href === 'string' && !link.href.startsWith('https://') && !link.href.startsWith('mailto:')) {
      issue(issues, `${itemLocation}.href`, 'must use https:// or mailto:');
    }
  });
}

function validateStringList(value: unknown, location: string, issues: string[], options: ValueOptions = {}) {
  const { min = 0, max = Infinity, itemMin = 1, itemMax = 300 } = options;
  if (!arrayValue(value, location, issues, { min, max })) {
    return;
  }
  value.forEach((item, index) => stringValue(item, `${location}[${index}]`, issues, { min: itemMin, max: itemMax }));
  uniqueStrings(value, location, issues);
}

function validateLocalizationMap(value: unknown, location: string, issues: string[], validateTranslation: (translation: Record<string, unknown>, location: string) => void) {
  if (value === undefined) return;
  if (!isObject(value)) {
    issue(issues, location, 'must be an object');
    return;
  }
  exactKeys(value, LOCALIZATION_CODES, location, issues);
  for (const [locale, translation] of Object.entries(value)) {
    if (!LOCALIZATION_CODES.has(locale)) continue;
    if (!isObject(translation)) {
      issue(issues, `${location}.${locale}`, 'must be an object');
      continue;
    }
    validateTranslation(translation, `${location}.${locale}`);
  }
}

function requireMatchingLength(translated: unknown, sourceValue: unknown, location: string, issues: string[]) {
  if (Array.isArray(translated) && Array.isArray(sourceValue) && translated.length !== sourceValue.length) {
    issue(issues, location, `must contain exactly ${sourceValue.length} item(s) to match the source record`);
  }
}

function validateEntryLocalizations(value: Record<string, unknown>, source: string, issues: string[]) {
  validateLocalizationMap(value.localizations, `${source}.localizations`, issues, (translation, location) => {
    const allowed = new Set(['title', 'periodLabel', 'summary', 'context', 'contributions', 'outcomes', 'links']);
    const requiredFields = ['title', 'periodLabel', 'summary', 'contributions', 'outcomes', 'links'];
    if ('context' in value) requiredFields.push('context');
    required(translation, requiredFields, location, issues);
    exactKeys(translation, allowed, location, issues);
    stringValue(translation.title, `${location}.title`, issues, { min: 4, max: 120 });
    stringValue(translation.periodLabel, `${location}.periodLabel`, issues, { min: 4, max: 80 });
    stringValue(translation.summary, `${location}.summary`, issues, { min: 40, max: 500 });
    if ('context' in translation) stringValue(translation.context, `${location}.context`, issues, { min: 20, max: 1200 });
    validateStringList(translation.contributions, `${location}.contributions`, issues, { min: 1, max: 12, itemMin: 15, itemMax: 300 });
    validateStringList(translation.outcomes, `${location}.outcomes`, issues, { max: 10, itemMin: 15, itemMax: 300 });
    validateStringList(translation.links, `${location}.links`, issues, { max: 8, itemMin: 1, itemMax: 80 });
    requireMatchingLength(translation.contributions, value.contributions, `${location}.contributions`, issues);
    requireMatchingLength(translation.outcomes, value.outcomes, `${location}.outcomes`, issues);
    requireMatchingLength(translation.links, value.links, `${location}.links`, issues);
  });
}

function validateProjectLocalizations(value: Record<string, unknown>, source: string, issues: string[]) {
  validateLocalizationMap(value.localizations, `${source}.localizations`, issues, (translation, location) => {
    const allowed = new Set(['name', 'summary', 'description', 'previewAlt', 'gallery', 'links']);
    const requiredFields = ['name', 'summary', 'description', 'links'];
    if (value.presentation) requiredFields.push('previewAlt');
    required(translation, requiredFields, location, issues);
    exactKeys(translation, allowed, location, issues);
    stringValue(translation.name, `${location}.name`, issues, { min: 2, max: 100 });
    stringValue(translation.summary, `${location}.summary`, issues, { min: 30, max: 400 });
    stringValue(translation.description, `${location}.description`, issues, { min: 40, max: 1500 });
    if ('previewAlt' in translation) stringValue(translation.previewAlt, `${location}.previewAlt`, issues, { min: 8, max: 240 });
    const gallery = isObject(value.presentation) ? value.presentation.gallery : undefined;
    if (gallery !== undefined || translation.gallery !== undefined) {
      if (!Array.isArray(gallery)) issue(issues, `${location}.gallery`, 'requires a source gallery');
      if (arrayValue(translation.gallery, `${location}.gallery`, issues, { min: 1, max: 6 })) {
        requireMatchingLength(translation.gallery, gallery, `${location}.gallery`, issues);
        translation.gallery.forEach((image, index) => {
          const imageLocation = `${location}.gallery[${index}]`;
          if (!isObject(image)) { issue(issues, imageLocation, 'must be an object'); return; }
          exactKeys(image, new Set(['alt', 'caption']), imageLocation, issues);
          stringValue(image.alt, `${imageLocation}.alt`, issues, { min: 8, max: 240 });
          stringValue(image.caption, `${imageLocation}.caption`, issues, { min: 8, max: 500 });
        });
      }
    }
    validateStringList(translation.links, `${location}.links`, issues, { max: 8, itemMin: 1, itemMax: 80 });
    requireMatchingLength(translation.links, value.links, `${location}.links`, issues);
  });
}

function validatePresentation(value: unknown, location: string, issues: string[]) {
  if (!isObject(value)) {
    issue(issues, location, 'must be an object');
    return;
  }
  const allowed = new Set(['preview', 'gallery']);
  required(value, ['preview'], location, issues);
  exactKeys(value, allowed, location, issues);
  const preview = value.preview;
  if (!isObject(preview)) {
    issue(issues, `${location}.preview`, 'must be an object');
    return;
  }
  const previewAllowed = new Set(['kind', 'src', 'alt', 'width', 'height', 'approval']);
  required(preview, ['kind', 'alt'], `${location}.preview`, issues);
  exactKeys(preview, previewAllowed, `${location}.preview`, issues);
  enumValue(preview.kind, new Set(['image', 'diagram']), `${location}.preview.kind`, issues);
  stringValue(preview.alt, `${location}.preview.alt`, issues, { min: 8, max: 240 });
  if (preview.kind === 'image') {
    required(preview, ['src', 'width', 'height', 'approval'], `${location}.preview`, issues);
    stringValue(preview.src, `${location}.preview.src`, issues, {
      pattern: /^assets\/projects\/[a-z0-9][a-z0-9._-]*\.(?:avif|webp)$/
    });
    integerValue(preview.width, `${location}.preview.width`, issues, { min: 320, max: 2400 });
    integerValue(preview.height, `${location}.preview.height`, issues, { min: 180, max: 1800 });
    if (!isObject(preview.approval)) {
      issue(issues, `${location}.preview.approval`, 'requires explicit owner image approval');
    } else {
      exactKeys(preview.approval, new Set(['approvedBy', 'reviewedAt']), `${location}.preview.approval`, issues);
      if (preview.approval.approvedBy !== 'owner') issue(issues, `${location}.preview.approval.approvedBy`, 'must equal "owner"');
      validateDate(preview.approval.reviewedAt, `${location}.preview.approval.reviewedAt`, issues);
    }
  } else if (preview.kind === 'diagram' && ['src', 'width', 'height', 'approval'].some((key) => key in preview)) {
    issue(issues, `${location}.preview`, 'abstract diagrams accept only kind and alt');
  }
  if ('gallery' in value && arrayValue(value.gallery, `${location}.gallery`, issues, { min: 1, max: 6 })) {
    const sources = new Set<unknown>();
    value.gallery.forEach((image, index) => {
      const itemLocation = `${location}.gallery[${index}]`;
      if (!isObject(image)) { issue(issues, itemLocation, 'must be an object'); return; }
      const { caption, source, ...visual } = image;
      if (visual.kind !== 'image') issue(issues, `${itemLocation}.kind`, 'must equal "image"');
      validatePresentation({ preview: visual }, itemLocation, issues);
      stringValue(caption, `${itemLocation}.caption`, issues, { min: 8, max: 500 });
      if (sources.has(visual.src)) issue(issues, `${itemLocation}.src`, 'must be unique within the gallery');
      sources.add(visual.src);
      if (!isObject(source)) { issue(issues, `${itemLocation}.source`, 'requires reviewed provenance'); return; }
      const sourceLocation = `${itemLocation}.source`;
      const kind = source.kind;
      enumValue(kind, new Set(['web', 'owner-provided', 'local-capture', 'project-asset']), `${sourceLocation}.kind`, issues);
      const dateKey = kind === 'owner-provided' ? 'providedAt' : kind === 'project-asset' ? 'collectedAt' : 'capturedAt';
      exactKeys(source, new Set(['kind', dateKey, ...(kind === 'web' ? ['url'] : [])]), sourceLocation, issues);
      validateDate(source[dateKey], `${sourceLocation}.${dateKey}`, issues);
      if (kind === 'web' && source.url !== null) {
        try {
          if (typeof source.url !== 'string' || source.url.length > 500) throw new Error('Invalid URL');
          const url = new URL(source.url);
          if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid URL');
        } catch { issue(issues, `${sourceLocation}.url`, 'must be null or a public HTTPS URL without credentials, queries or fragments'); }
      }
    });
  }
}

function validateActivityMix(value: unknown, location: string, issues: string[]) {
  if (!isObject(value)) {
    issue(issues, location, 'must be an object');
    return;
  }
  const allowed = new Set(['basis', 'activityCount', 'items']);
  required(value, ['basis', 'items'], location, issues);
  exactKeys(value, allowed, location, issues);
  if (value.basis === 'recorded-activities') {
    required(value, ['activityCount'], location, issues);
    integerValue(value.activityCount, `${location}.activityCount`, issues, { min: 1 });
  } else if (value.basis === 'owner-estimate') {
    if ('activityCount' in value) issue(issues, `${location}.activityCount`, 'is not allowed for an owner estimate');
  } else {
    issue(issues, `${location}.basis`, 'must equal "recorded-activities" or "owner-estimate"');
  }
  const domains = new Set<unknown>();
  if (arrayValue(value.items, `${location}.items`, issues, { min: 1, max: ACTIVITY_DOMAINS.length })) {
    let total = 0;
    value.items.forEach((item, index) => {
      const itemLocation = `${location}.items[${index}]`;
      if (!isObject(item)) {
        issue(issues, itemLocation, 'must be an object');
        return;
      }
      const itemAllowed = new Set(['domain', 'percentage']);
      required(item, [...itemAllowed], itemLocation, issues);
      exactKeys(item, itemAllowed, itemLocation, issues);
      enumValue(item.domain, ACTIVITY_DOMAIN_SET, `${itemLocation}.domain`, issues);
      numberValue(item.percentage, `${itemLocation}.percentage`, issues, { min: 0, max: 100, exclusiveMin: true });
      if (domains.has(item.domain)) issue(issues, `${itemLocation}.domain`, 'must be unique');
      domains.add(item.domain);
      if (typeof item.percentage === 'number') total += item.percentage;
    });
    if (Math.abs(total - 100) > 0.2) issue(issues, `${location}.items`, 'percentages must total 100');
  }
}

function validatePublication(value: unknown, location: string, issues: string[], mode: RecordOptions['mode']) {
  if (!isObject(value)) {
    issue(issues, location, 'must be an object');
    return;
  }
  const allowed = new Set(['status', 'sanitized', 'reviewedAt', 'approvedBy']);
  required(value, [...allowed], location, issues);
  exactKeys(value, allowed, location, issues);
  enumValue(value.status, new Set(['candidate', 'approved']), `${location}.status`, issues);
  booleanValue(value.sanitized, `${location}.sanitized`, issues);
  validateDate(value.reviewedAt, `${location}.reviewedAt`, issues, true);
  stringValue(value.approvedBy, `${location}.approvedBy`, issues, { max: 80, nullable: true });

  if (mode === 'public') {
    if (value.status !== 'approved') {
      issue(issues, `${location}.status`, 'public records must be approved');
    }
    if (value.sanitized !== true) {
      issue(issues, `${location}.sanitized`, 'public records must be sanitized');
    }
    if (!value.reviewedAt) {
      issue(issues, `${location}.reviewedAt`, 'public records require a review date');
    }
    if (!value.approvedBy) {
      issue(issues, `${location}.approvedBy`, 'public records require an approver');
    }
  }

  if (mode === 'candidate') {
    if (value.status !== 'candidate') {
      issue(issues, `${location}.status`, 'candidate records must have candidate status');
    }
    if (value.sanitized !== true) {
      issue(issues, `${location}.sanitized`, 'candidate records must already be sanitized');
    }
    if (value.reviewedAt !== null || value.approvedBy !== null) {
      issue(issues, location, 'candidate records must not contain approval metadata');
    }
  }
}

export function validateEntry(value: unknown, options: RecordOptions = {}) {
  const { mode = 'public', source = 'entry' } = options;
  const issues: string[] = [];
  if (!isObject(value)) {
    return [`${source}: must be an object`];
  }

  const allowed = new Set([
    '$schema', 'schemaVersion', 'recordType', 'id', 'slug', 'title', 'kind', 'significance', 'activityTypes', 'status',
    'period', 'summary', 'context', 'contributions', 'outcomes', 'areas', 'technologies', 'featured', 'publication',
    'links', 'localizations'
  ]);
  required(value, ['schemaVersion', 'recordType', 'id', 'slug', 'title', 'kind', 'status', 'period', 'summary', 'contributions', 'outcomes', 'areas', 'technologies', 'featured', 'publication', 'links'], source, issues);
  exactKeys(value, allowed, source, issues);

  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');
  if (value.recordType !== 'entry') issue(issues, `${source}.recordType`, 'must equal "entry"');
  stringValue(value.id, `${source}.id`, issues, { min: 1, max: 120, pattern: SLUG });
  stringValue(value.slug, `${source}.slug`, issues, { min: 1, max: 120, pattern: SLUG });
  if (value.id !== value.slug) issue(issues, source, 'id and slug must match');
  stringValue(value.title, `${source}.title`, issues, { min: 4, max: 120 });
  enumValue(value.kind, ENTRY_KINDS, `${source}.kind`, issues);
  if ('significance' in value) enumValue(value.significance, SIGNIFICANCE_LEVELS, `${source}.significance`, issues);
  if ('activityTypes' in value && arrayValue(value.activityTypes, `${source}.activityTypes`, issues, { max: 8 })) {
    value.activityTypes.forEach((type, index) => enumValue(type, ACTIVITY_TYPES, `${source}.activityTypes[${index}]`, issues));
    uniqueStrings(value.activityTypes, `${source}.activityTypes`, issues);
  }
  enumValue(value.status, ENTRY_STATUSES, `${source}.status`, issues);
  validatePeriod(value.period, `${source}.period`, issues);
  stringValue(value.summary, `${source}.summary`, issues, { min: 40, max: 500 });
  if ('context' in value) stringValue(value.context, `${source}.context`, issues, { min: 20, max: 1200 });
  validateStringList(value.contributions, `${source}.contributions`, issues, { min: 1, max: 12, itemMin: 15, itemMax: 300 });

  if (arrayValue(value.outcomes, `${source}.outcomes`, issues, { max: 10 })) {
    value.outcomes.forEach((outcome, index) => {
      const location = `${source}.outcomes[${index}]`;
      if (!isObject(outcome)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const outcomeAllowed = new Set(['text', 'evidenceLevel']);
      required(outcome, [...outcomeAllowed], location, issues);
      exactKeys(outcome, outcomeAllowed, location, issues);
      stringValue(outcome.text, `${location}.text`, issues, { min: 15, max: 300 });
      enumValue(outcome.evidenceLevel, EVIDENCE_LEVELS, `${location}.evidenceLevel`, issues);
    });
  }

  validateStringList(value.areas, `${source}.areas`, issues, { min: 1, max: 20, itemMin: 2, itemMax: 80 });
  validateStringList(value.technologies, `${source}.technologies`, issues, { max: 30, itemMin: 1, itemMax: 80 });
  booleanValue(value.featured, `${source}.featured`, issues);
  validatePublication(value.publication, `${source}.publication`, issues, mode);
  validateLinks(value.links, `${source}.links`, issues);
  validateEntryLocalizations(value, source, issues);
  if ((value.significance === 'milestone' || value.significance === 'achievement') && value.status !== 'completed') {
    issue(issues, `${source}.status`, `${value.significance} entries must be completed`);
  }
  if (value.significance === 'achievement' && (!Array.isArray(value.outcomes) || value.outcomes.length === 0)) {
    issue(issues, `${source}.outcomes`, 'achievement entries require at least one supported outcome');
  }
  return issues;
}

export function validateProject(value: unknown, options: RecordOptions = {}) {
  const { mode = 'public', source = 'project' } = options;
  const issues: string[] = [];
  if (!isObject(value)) {
    return [`${source}: must be an object`];
  }

  const allowed = new Set([
    '$schema', 'schemaVersion', 'recordType', 'id', 'slug', 'name', 'kind', 'status', 'summary', 'description',
    'areas', 'technologies', 'relatedEntries', 'featured', 'workContext', 'ownership', 'presentation', 'activityMix', 'publication', 'links', 'localizations'
  ]);
  required(value, ['schemaVersion', 'recordType', 'id', 'slug', 'name', 'kind', 'status', 'summary', 'description', 'areas', 'technologies', 'relatedEntries', 'featured', 'publication', 'links'], source, issues);
  exactKeys(value, allowed, source, issues);

  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');
  if (value.recordType !== 'project') issue(issues, `${source}.recordType`, 'must equal "project"');
  stringValue(value.id, `${source}.id`, issues, { min: 1, max: 120, pattern: SLUG });
  stringValue(value.slug, `${source}.slug`, issues, { min: 1, max: 120, pattern: SLUG });
  if (value.id !== value.slug) issue(issues, source, 'id and slug must match');
  stringValue(value.name, `${source}.name`, issues, { min: 2, max: 100 });
  enumValue(value.kind, PROJECT_KINDS, `${source}.kind`, issues);
  enumValue(value.status, PROJECT_STATUSES, `${source}.status`, issues);
  if ('workContext' in value) enumValue(value.workContext, new Set(['professional', 'independent']), `${source}.workContext`, issues);
  if ('ownership' in value) enumValue(value.ownership, new Set(['end-to-end', 'shared']), `${source}.ownership`, issues);
  stringValue(value.summary, `${source}.summary`, issues, { min: 30, max: 400 });
  stringValue(value.description, `${source}.description`, issues, { min: 40, max: 1500 });
  validateStringList(value.areas, `${source}.areas`, issues, { min: 1, max: 20, itemMin: 2, itemMax: 80 });
  validateStringList(value.technologies, `${source}.technologies`, issues, { max: 30, itemMin: 1, itemMax: 80 });
  validateStringList(value.relatedEntries, `${source}.relatedEntries`, issues, { max: 40, itemMin: 1, itemMax: 120 });
  if (Array.isArray(value.relatedEntries)) {
    value.relatedEntries.forEach((id, index) => {
      if (typeof id === 'string' && !SLUG.test(id)) issue(issues, `${source}.relatedEntries[${index}]`, 'must be kebab-case');
    });
  }
  booleanValue(value.featured, `${source}.featured`, issues);
  if ('presentation' in value) validatePresentation(value.presentation, `${source}.presentation`, issues);
  if ('activityMix' in value) validateActivityMix(value.activityMix, `${source}.activityMix`, issues);
  validatePublication(value.publication, `${source}.publication`, issues, mode);
  validateLinks(value.links, `${source}.links`, issues);
  validateProjectLocalizations(value, source, issues);
  return issues;
}

function validateOutcomeList(value: unknown, location: string, issues: string[], options: ValueOptions = {}) {
  const { max = 10 } = options;
  if (!arrayValue(value, location, issues, { max })) {
    return;
  }
  value.forEach((outcome, index) => {
    const itemLocation = `${location}[${index}]`;
    if (!isObject(outcome)) {
      issue(issues, itemLocation, 'must be an object');
      return;
    }
    const allowed = new Set(['text', 'evidenceLevel']);
    required(outcome, [...allowed], itemLocation, issues);
    exactKeys(outcome, allowed, itemLocation, issues);
    stringValue(outcome.text, `${itemLocation}.text`, issues, { min: 15, max: 300 });
    enumValue(outcome.evidenceLevel, EVIDENCE_LEVELS, `${itemLocation}.evidenceLevel`, issues);
  });
}

function objectItems(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}
function arrayItems(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }

function validateRecommendationUrl(value: unknown, location: string, issues: string[]) {
  stringValue(value, location, issues, { min: 12, max: 300 });
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
      || !['www.linkedin.com', 'linkedin.com'].includes(url.hostname)
      || !/^\/in\/[a-zA-Z0-9%-]+\/(?:details\/recommendations\/)?$/.test(url.pathname)) {
      issue(issues, location, 'must be a canonical public LinkedIn profile or recommendations URL');
    }
  } catch { issue(issues, location, 'must be a valid HTTPS URL'); }
}

function validateContact(value: unknown, source: string, issues: string[]) {
  if (!isObject(value)) { issue(issues, source, 'must be an object'); return; }
  exactKeys(value, new Set(['email', 'phone', 'whatsapp', 'links']), source, issues);
  required(value, ['links'], source, issues);
  if ('email' in value) stringValue(value.email, `${source}.email`, issues, { max: 254,
    pattern: /^[a-zA-Z0-9.!#$&'*+\/=^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/ });
  if ('phone' in value) stringValue(value.phone, `${source}.phone`, issues, { pattern: /^\+[1-9][0-9]{6,14}$/ });
  for (const key of ['email', 'phone']) {
    if (typeof value[key] === 'string' && /\s/.test(value[key])) issue(issues, `${source}.${key}`, 'must not contain whitespace');
  }
  if ('whatsapp' in value) {
    booleanValue(value.whatsapp, `${source}.whatsapp`, issues);
    required(value, ['phone'], source, issues);
  }
  if (arrayValue(value.links, `${source}.links`, issues, { max: 8 })) {
    const hrefs = new Set<string>();
    value.links.forEach((link, index) => {
      const location = `${source}.links[${index}]`;
      if (!isObject(link)) { issue(issues, location, 'must be an object'); return; }
      exactKeys(link, new Set(['label', 'href']), location, issues);
      required(link, ['label', 'href'], location, issues);
      stringValue(link.label, `${location}.label`, issues, { min: 1, max: 80 });
      stringValue(link.href, `${location}.href`, issues, { min: 12, max: 300 });
      if (typeof link.href !== 'string') return;
      try {
        const url = new URL(link.href);
        if (url.protocol !== 'https:' || !url.hostname.includes('.') || url.username || url.password || url.search || url.hash || /\s/.test(link.href)) {
          issue(issues, `${location}.href`, 'must be a public HTTPS profile URL without credentials or tracking parameters');
        }
      } catch { issue(issues, `${location}.href`, 'must be a valid HTTPS URL'); }
      if (hrefs.has(link.href)) issue(issues, `${location}.href`, 'must be unique');
      hrefs.add(link.href);
    });
  }
}

function validateRecommendations(value: unknown, source: string, issues: string[]) {
  if (!arrayValue(value, source, issues, { max: 12 })) return;
  const ids = new Set<unknown>();
  value.forEach((item, index) => {
    const location = `${source}[${index}]`;
    if (!isObject(item)) { issue(issues, location, 'must be an object'); return; }
    const fields = ['id', 'name', 'relationship', 'quote', 'profileUrl', 'sourceUrl'];
    required(item, fields, location, issues);
    exactKeys(item, new Set([...fields, 'portrait']), location, issues);
    stringValue(item.id, `${location}.id`, issues, { min: 1, max: 100, pattern: SLUG });
    if (ids.has(item.id)) issue(issues, `${location}.id`, 'must be unique');
    ids.add(item.id);
    stringValue(item.name, `${location}.name`, issues, { min: 2, max: 120 });
    stringValue(item.relationship, `${location}.relationship`, issues, { min: 4, max: 160 });
    stringValue(item.quote, `${location}.quote`, issues, { min: 30, max: 700 });
    validateRecommendationUrl(item.profileUrl, `${location}.profileUrl`, issues);
    validateRecommendationUrl(item.sourceUrl, `${location}.sourceUrl`, issues);
    if ('portrait' in item) {
      const portrait = item.portrait;
      if (!isObject(portrait)) { issue(issues, `${location}.portrait`, 'must be an object'); return; }
      const portraitLocation = `${location}.portrait`;
      const keys = new Set(['src', 'width', 'height', 'approval']);
      required(portrait, [...keys], portraitLocation, issues);
      exactKeys(portrait, keys, portraitLocation, issues);
      stringValue(portrait.src, `${portraitLocation}.src`, issues, { min: 1, max: 160, pattern: /^assets\/portraits\/[a-z0-9][a-z0-9._-]*\.webp$/ });
      integerValue(portrait.width, `${portraitLocation}.width`, issues, { min: 64, max: 512 });
      integerValue(portrait.height, `${portraitLocation}.height`, issues, { min: 64, max: 512 });
      if (portrait.width !== portrait.height) issue(issues, portraitLocation, 'must be square');
      if (!isObject(portrait.approval)) { issue(issues, `${portraitLocation}.approval`, 'must be an object'); return; }
      exactKeys(portrait.approval, new Set(['approvedBy', 'reviewedAt']), `${portraitLocation}.approval`, issues);
      if (portrait.approval.approvedBy !== 'owner') issue(issues, `${portraitLocation}.approval`, 'requires owner approval');
      validateDate(portrait.approval.reviewedAt, `${portraitLocation}.approval.reviewedAt`, issues);
    }
  });
}

function validateResumeLocalizations(value: Record<string, unknown>, source: string, issues: string[]) {
  validateLocalizationMap(value.localizations, `${source}.localizations`, issues, (translation, location) => {
    const allowed = new Set(['summary', 'highlights', 'skills', 'experiences', 'education', 'recommendations']);
    required(translation, ['summary', 'highlights', 'skills', 'experiences', 'education'], location, issues);
    exactKeys(translation, allowed, location, issues);
    stringValue(translation.summary, `${location}.summary`, issues, { min: 50, max: 800 });
    validateStringList(translation.highlights, `${location}.highlights`, issues, { max: 10, itemMin: 15, itemMax: 300 });
    validateStringList(translation.skills, `${location}.skills`, issues, { min: 3, max: 40, itemMin: 1, itemMax: 80 });
    requireMatchingLength(translation.highlights, value.highlights, `${location}.highlights`, issues);

    // Optional translations fall back to the English original, never a fabricated quote.
    if ('recommendations' in translation && arrayValue(translation.recommendations, `${location}.recommendations`, issues, { max: 12 })) {
      const sourceIds = new Set(objectItems(value.recommendations).map((item) => item.id));
      const translatedIds = new Set<unknown>();
      translation.recommendations.forEach((item, index) => {
        const itemLocation = `${location}.recommendations[${index}]`;
        if (!isObject(item)) { issue(issues, itemLocation, 'must be an object'); return; }
        const keys = new Set(['id', 'quote', 'relationship']);
        required(item, [...keys], itemLocation, issues);
        exactKeys(item, keys, itemLocation, issues);
        stringValue(item.id, `${itemLocation}.id`, issues, { min: 1, max: 100, pattern: SLUG });
        stringValue(item.quote, `${itemLocation}.quote`, issues, { min: 30, max: 700 });
        stringValue(item.relationship, `${itemLocation}.relationship`, issues, { min: 4, max: 160 });
        if (!sourceIds.has(item.id)) issue(issues, `${itemLocation}.id`, 'must reference a source recommendation');
        if (translatedIds.has(item.id)) issue(issues, `${itemLocation}.id`, 'must be unique');
        translatedIds.add(item.id);
      });
      requireMatchingLength(translation.recommendations, arrayItems(value.recommendations), `${location}.recommendations`, issues);
    }

    const sourceExperiences = new Map(objectItems(value.experiences).map((item) => [item.id, item]));
    const translatedExperienceIds = new Set<unknown>();
    if (arrayValue(translation.experiences, `${location}.experiences`, issues, { min: 1, max: 20 })) {
      translation.experiences.forEach((experience, index) => {
        const itemLocation = `${location}.experiences[${index}]`;
        if (!isObject(experience)) {
          issue(issues, itemLocation, 'must be an object');
          return;
        }
        const itemAllowed = new Set(['id', 'role', 'location', 'domain', 'periodLabel', 'summary', 'contributions', 'outcomes']);
        required(experience, [...itemAllowed], itemLocation, issues);
        exactKeys(experience, itemAllowed, itemLocation, issues);
        stringValue(experience.id, `${itemLocation}.id`, issues, { min: 1, max: 120, pattern: SLUG });
        stringValue(experience.role, `${itemLocation}.role`, issues, { min: 4, max: 120 });
        stringValue(experience.location, `${itemLocation}.location`, issues, { max: 120 });
        stringValue(experience.domain, `${itemLocation}.domain`, issues, { min: 4, max: 160 });
        stringValue(experience.periodLabel, `${itemLocation}.periodLabel`, issues, { min: 4, max: 80 });
        stringValue(experience.summary, `${itemLocation}.summary`, issues, { min: 40, max: 500 });
        validateStringList(experience.contributions, `${itemLocation}.contributions`, issues, { min: 1, max: 10, itemMin: 15, itemMax: 300 });
        validateStringList(experience.outcomes, `${itemLocation}.outcomes`, issues, { max: 8, itemMin: 15, itemMax: 300 });
        const sourceExperience = sourceExperiences.get(experience.id);
        if (!sourceExperience) {
          issue(issues, `${itemLocation}.id`, 'must reference an experience in the source record');
        } else {
          requireMatchingLength(experience.contributions, sourceExperience.contributions, `${itemLocation}.contributions`, issues);
          requireMatchingLength(experience.outcomes, sourceExperience.outcomes, `${itemLocation}.outcomes`, issues);
        }
        if (translatedExperienceIds.has(experience.id)) issue(issues, `${itemLocation}.id`, 'must be unique');
        translatedExperienceIds.add(experience.id);
      });
      requireMatchingLength(translation.experiences, value.experiences, `${location}.experiences`, issues);
    }

    const sourceEducation = new Set(objectItems(value.education).map((item) => item.id));
    const translatedEducationIds = new Set<unknown>();
    if (arrayValue(translation.education, `${location}.education`, issues, { max: 12 })) {
      translation.education.forEach((education, index) => {
        const itemLocation = `${location}.education[${index}]`;
        if (!isObject(education)) {
          issue(issues, itemLocation, 'must be an object');
          return;
        }
        const itemAllowed = new Set(['id', 'credential', 'institution', 'periodLabel']);
        required(education, [...itemAllowed], itemLocation, issues);
        exactKeys(education, itemAllowed, itemLocation, issues);
        stringValue(education.id, `${itemLocation}.id`, issues, { min: 1, max: 120, pattern: SLUG });
        stringValue(education.credential, `${itemLocation}.credential`, issues, { min: 4, max: 160 });
        stringValue(education.institution, `${itemLocation}.institution`, issues, { min: 2, max: 160 });
        stringValue(education.periodLabel, `${itemLocation}.periodLabel`, issues, { min: 4, max: 80 });
        if (!sourceEducation.has(education.id)) issue(issues, `${itemLocation}.id`, 'must reference education in the source record');
        if (translatedEducationIds.has(education.id)) issue(issues, `${itemLocation}.id`, 'must be unique');
        translatedEducationIds.add(education.id);
      });
      requireMatchingLength(translation.education, value.education, `${location}.education`, issues);
    }
  });
}

export function validateResume(value: unknown, options: RecordOptions = {}) {
  const { mode = 'public', source = 'resume' } = options;
  const issues: string[] = [];
  if (!isObject(value)) {
    return [`${source}: must be an object`];
  }

  const allowed = new Set([
    '$schema', 'schemaVersion', 'recordType', 'id', 'slug', 'experienceStart', 'summary', 'highlights',
    'skills', 'activityMix', 'experiences', 'education', 'recommendations', 'contact', 'publication', 'localizations'
  ]);
  required(value, ['schemaVersion', 'recordType', 'id', 'slug', 'experienceStart', 'summary', 'highlights', 'skills', 'experiences', 'education', 'publication'], source, issues);
  exactKeys(value, allowed, source, issues);

  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');
  if (value.recordType !== 'resume') issue(issues, `${source}.recordType`, 'must equal "resume"');
  if (value.id !== 'resume') issue(issues, `${source}.id`, 'must equal "resume"');
  if (value.slug !== 'resume') issue(issues, `${source}.slug`, 'must equal "resume"');
  validateDate(value.experienceStart, `${source}.experienceStart`, issues);
  stringValue(value.summary, `${source}.summary`, issues, { min: 50, max: 800 });
  validateOutcomeList(value.highlights, `${source}.highlights`, issues, { max: 10 });
  validateStringList(value.skills, `${source}.skills`, issues, { min: 3, max: 40, itemMin: 1, itemMax: 80 });
  if ('activityMix' in value) validateActivityMix(value.activityMix, `${source}.activityMix`, issues);

  if ('recommendations' in value) validateRecommendations(value.recommendations, `${source}.recommendations`, issues);
  if ('contact' in value) validateContact(value.contact, `${source}.contact`, issues);

  const experienceIds = new Set<unknown>();
  if (arrayValue(value.experiences, `${source}.experiences`, issues, { min: 1, max: 20 })) {
    value.experiences.forEach((experience, index) => {
      const location = `${source}.experiences[${index}]`;
      if (!isObject(experience)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const experienceAllowed = new Set([
        'id', 'organization', 'role', 'engagement', 'location', 'domain', 'period', 'summary',
        'contributions', 'outcomes', 'technologies', 'relatedProjects'
      ]);
      required(experience, [...experienceAllowed], location, issues);
      exactKeys(experience, experienceAllowed, location, issues);
      stringValue(experience.id, `${location}.id`, issues, { min: 1, max: 120, pattern: SLUG });
      if (experienceIds.has(experience.id)) issue(issues, `${location}.id`, 'must be unique');
      experienceIds.add(experience.id);
      stringValue(experience.organization, `${location}.organization`, issues, { min: 2, max: 120 });
      stringValue(experience.role, `${location}.role`, issues, { min: 4, max: 120 });
      enumValue(experience.engagement, RESUME_ENGAGEMENTS, `${location}.engagement`, issues);
      stringValue(experience.location, `${location}.location`, issues, { max: 120 });
      stringValue(experience.domain, `${location}.domain`, issues, { min: 4, max: 160 });
      validatePeriod(experience.period, `${location}.period`, issues);
      stringValue(experience.summary, `${location}.summary`, issues, { min: 40, max: 500 });
      validateStringList(experience.contributions, `${location}.contributions`, issues, { min: 1, max: 10, itemMin: 15, itemMax: 300 });
      validateOutcomeList(experience.outcomes, `${location}.outcomes`, issues, { max: 8 });
      validateStringList(experience.technologies, `${location}.technologies`, issues, { max: 30, itemMin: 1, itemMax: 80 });
      validateStringList(experience.relatedProjects, `${location}.relatedProjects`, issues, { max: 20, itemMin: 1, itemMax: 120 });
      for (const [relatedIndex, projectId] of arrayItems(experience.relatedProjects).entries()) {
        if (typeof projectId === 'string' && !SLUG.test(projectId)) {
          issue(issues, `${location}.relatedProjects[${relatedIndex}]`, 'must be kebab-case');
        }
      }
    });
  }

  const educationIds = new Set<unknown>();
  if (arrayValue(value.education, `${source}.education`, issues, { max: 12 })) {
    value.education.forEach((education, index) => {
      const location = `${source}.education[${index}]`;
      if (!isObject(education)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const educationAllowed = new Set(['id', 'credential', 'institution', 'period']);
      required(education, [...educationAllowed], location, issues);
      exactKeys(education, educationAllowed, location, issues);
      stringValue(education.id, `${location}.id`, issues, { min: 1, max: 120, pattern: SLUG });
      if (educationIds.has(education.id)) issue(issues, `${location}.id`, 'must be unique');
      educationIds.add(education.id);
      stringValue(education.credential, `${location}.credential`, issues, { min: 4, max: 160 });
      stringValue(education.institution, `${location}.institution`, issues, { min: 2, max: 160 });
      validatePeriod(education.period, `${location}.period`, issues);
    });
  }

  validatePublication(value.publication, `${source}.publication`, issues, mode);
  validateResumeLocalizations(value, source, issues);
  return issues;
}

function validateProfileLocalizations(value: Record<string, unknown>, source: string, issues: string[]) {
  validateLocalizationMap(value.localizations, `${source}.localizations`, issues, (translation, location) => {
    const allowed = new Set(['headline', 'location', 'intro', 'bio', 'principles', 'links']);
    required(translation, [...allowed], location, issues);
    exactKeys(translation, allowed, location, issues);
    stringValue(translation.headline, `${location}.headline`, issues, { min: 4, max: 120 });
    stringValue(translation.location, `${location}.location`, issues, { max: 120 });
    stringValue(translation.intro, `${location}.intro`, issues, { min: 30, max: 500 });
    validateStringList(translation.bio, `${location}.bio`, issues, { min: 1, max: 6, itemMin: 30, itemMax: 800 });
    validateStringList(translation.links, `${location}.links`, issues, { max: 8, itemMin: 1, itemMax: 80 });
    requireMatchingLength(translation.bio, value.bio, `${location}.bio`, issues);
    requireMatchingLength(translation.links, value.links, `${location}.links`, issues);
    if (arrayValue(translation.principles, `${location}.principles`, issues, { min: 1, max: 8 })) {
      translation.principles.forEach((principle, index) => {
        const itemLocation = `${location}.principles[${index}]`;
        if (!isObject(principle)) {
          issue(issues, itemLocation, 'must be an object');
          return;
        }
        const itemAllowed = new Set(['title', 'description']);
        required(principle, [...itemAllowed], itemLocation, issues);
        exactKeys(principle, itemAllowed, itemLocation, issues);
        stringValue(principle.title, `${itemLocation}.title`, issues, { min: 2, max: 80 });
        stringValue(principle.description, `${itemLocation}.description`, issues, { min: 20, max: 300 });
      });
      requireMatchingLength(translation.principles, value.principles, `${location}.principles`, issues);
    }
  });
}

export function validateProfile(value: unknown, source: string = 'profile') {
  const issues: string[] = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set(['$schema', 'schemaVersion', 'name', 'headline', 'location', 'intro', 'bio', 'links', 'principles', 'updatedAt', 'localizations']);
  required(value, ['schemaVersion', 'name', 'headline', 'location', 'intro', 'bio', 'links', 'principles', 'updatedAt'], source, issues);
  exactKeys(value, allowed, source, issues);
  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');
  stringValue(value.name, `${source}.name`, issues, { min: 1, max: 80 });
  stringValue(value.headline, `${source}.headline`, issues, { min: 4, max: 120 });
  stringValue(value.location, `${source}.location`, issues, { max: 120 });
  stringValue(value.intro, `${source}.intro`, issues, { min: 30, max: 500 });
  validateStringList(value.bio, `${source}.bio`, issues, { min: 1, max: 6, itemMin: 30, itemMax: 800 });
  validateLinks(value.links, `${source}.links`, issues);
  if (arrayValue(value.principles, `${source}.principles`, issues, { min: 1, max: 8 })) {
    value.principles.forEach((principle, index) => {
      const location = `${source}.principles[${index}]`;
      if (!isObject(principle)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const principleAllowed = new Set(['title', 'description']);
      required(principle, [...principleAllowed], location, issues);
      exactKeys(principle, principleAllowed, location, issues);
      stringValue(principle.title, `${location}.title`, issues, { min: 2, max: 80 });
      stringValue(principle.description, `${location}.description`, issues, { min: 20, max: 300 });
    });
  }
  validateDate(value.updatedAt, `${source}.updatedAt`, issues);
  validateProfileLocalizations(value, source, issues);
  return issues;
}

function validateTaxonomyLocalizations(value: Record<string, unknown>, source: string, issues: string[]) {
  validateLocalizationMap(value.localizations, `${source}.localizations`, issues, (translation, location) => {
    const allowed = new Set(['areas', 'kinds']);
    required(translation, [...allowed], location, issues);
    exactKeys(translation, allowed, location, issues);
    const areaSlugs = new Set(objectItems(value.areas).map((area) => area.slug));
    const translatedAreaSlugs = new Set<unknown>();
    if (arrayValue(translation.areas, `${location}.areas`, issues, { min: 1 })) {
      translation.areas.forEach((area, index) => {
        const itemLocation = `${location}.areas[${index}]`;
        if (!isObject(area)) {
          issue(issues, itemLocation, 'must be an object');
          return;
        }
        const itemAllowed = new Set(['slug', 'label', 'description']);
        required(area, [...itemAllowed], itemLocation, issues);
        exactKeys(area, itemAllowed, itemLocation, issues);
        stringValue(area.slug, `${itemLocation}.slug`, issues, { min: 1, max: 100, pattern: SLUG });
        stringValue(area.label, `${itemLocation}.label`, issues, { min: 2, max: 80 });
        stringValue(area.description, `${itemLocation}.description`, issues, { min: 20, max: 300 });
        if (!areaSlugs.has(area.slug)) issue(issues, `${itemLocation}.slug`, 'must reference an area in the source taxonomy');
        if (translatedAreaSlugs.has(area.slug)) issue(issues, `${itemLocation}.slug`, 'must be unique');
        translatedAreaSlugs.add(area.slug);
      });
      requireMatchingLength(translation.areas, value.areas, `${location}.areas`, issues);
    }

    const kindValues = new Set(objectItems(value.kinds).map((kind) => kind.value));
    const translatedKindValues = new Set<unknown>();
    if (arrayValue(translation.kinds, `${location}.kinds`, issues, { min: 1 })) {
      translation.kinds.forEach((kind, index) => {
        const itemLocation = `${location}.kinds[${index}]`;
        if (!isObject(kind)) {
          issue(issues, itemLocation, 'must be an object');
          return;
        }
        const itemAllowed = new Set(['value', 'label', 'description']);
        required(kind, [...itemAllowed], itemLocation, issues);
        exactKeys(kind, itemAllowed, itemLocation, issues);
        stringValue(kind.value, `${itemLocation}.value`, issues, { min: 1, max: 100, pattern: SLUG });
        stringValue(kind.label, `${itemLocation}.label`, issues, { min: 2, max: 80 });
        stringValue(kind.description, `${itemLocation}.description`, issues, { min: 15, max: 240 });
        if (!kindValues.has(kind.value)) issue(issues, `${itemLocation}.value`, 'must reference a kind in the source taxonomy');
        if (translatedKindValues.has(kind.value)) issue(issues, `${itemLocation}.value`, 'must be unique');
        translatedKindValues.add(kind.value);
      });
      requireMatchingLength(translation.kinds, value.kinds, `${location}.kinds`, issues);
    }
  });
}

export function validateTaxonomy(value: unknown, source: string = 'taxonomy') {
  const issues: string[] = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set(['$schema', 'schemaVersion', 'areas', 'kinds', 'localizations']);
  required(value, ['schemaVersion', 'areas', 'kinds'], source, issues);
  exactKeys(value, allowed, source, issues);
  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');

  if (arrayValue(value.areas, `${source}.areas`, issues, { min: 1 })) {
    const slugs = new Set<unknown>();
    const labels = new Set<unknown>();
    const orders = new Set<unknown>();
    value.areas.forEach((area, index) => {
      const location = `${source}.areas[${index}]`;
      if (!isObject(area)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const areaAllowed = new Set(['slug', 'label', 'description', 'order']);
      required(area, [...areaAllowed], location, issues);
      exactKeys(area, areaAllowed, location, issues);
      stringValue(area.slug, `${location}.slug`, issues, { min: 1, max: 100, pattern: SLUG });
      stringValue(area.label, `${location}.label`, issues, { min: 2, max: 80 });
      stringValue(area.description, `${location}.description`, issues, { min: 20, max: 300 });
      integerValue(area.order, `${location}.order`, issues, { min: 0, max: 10000 });
      const slug = String(area.slug).toLowerCase();
      const label = String(area.label).toLowerCase();
      if (slugs.has(slug)) issue(issues, `${location}.slug`, 'must be unique');
      if (labels.has(label)) issue(issues, `${location}.label`, 'must be unique');
      if (orders.has(area.order)) issue(issues, `${location}.order`, 'must be unique');
      slugs.add(slug);
      labels.add(label);
      orders.add(area.order);
    });
  }

  if (arrayValue(value.kinds, `${source}.kinds`, issues, { min: 1 })) {
    const values = new Set<unknown>();
    value.kinds.forEach((kind, index) => {
      const location = `${source}.kinds[${index}]`;
      if (!isObject(kind)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const kindAllowed = new Set(['value', 'label', 'description']);
      required(kind, [...kindAllowed], location, issues);
      exactKeys(kind, kindAllowed, location, issues);
      stringValue(kind.value, `${location}.value`, issues, { min: 1, max: 100, pattern: SLUG });
      stringValue(kind.label, `${location}.label`, issues, { min: 2, max: 80 });
      stringValue(kind.description, `${location}.description`, issues, { min: 15, max: 240 });
      if (values.has(kind.value)) issue(issues, `${location}.value`, 'must be unique');
      values.add(kind.value);
    });
  }
  validateTaxonomyLocalizations(value, source, issues);
  return issues;
}

export function validateLocalConfig(value: unknown, source: string = 'career.local.json') {
  const issues: string[] = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set(['$schema', 'schemaVersion', 'owner', 'projects', 'privacy']);
  required(value, ['schemaVersion', 'owner', 'projects', 'privacy'], source, issues);
  exactKeys(value, allowed, source, issues);
  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');

  if (!isObject(value.owner)) {
    issue(issues, `${source}.owner`, 'must be an object');
  } else {
    const ownerAllowed = new Set(['name', 'gitIdentities']);
    required(value.owner, [...ownerAllowed], `${source}.owner`, issues);
    exactKeys(value.owner, ownerAllowed, `${source}.owner`, issues);
    stringValue(value.owner.name, `${source}.owner.name`, issues, { min: 1, max: 80 });
    if (arrayValue(value.owner.gitIdentities, `${source}.owner.gitIdentities`, issues)) {
      value.owner.gitIdentities.forEach((identity, index) => {
        const location = `${source}.owner.gitIdentities[${index}]`;
        if (!isObject(identity)) {
          issue(issues, location, 'must be an object');
          return;
        }
        const identityAllowed = new Set(['name', 'emails']);
        required(identity, [...identityAllowed], location, issues);
        exactKeys(identity, identityAllowed, location, issues);
        stringValue(identity.name, `${location}.name`, issues, { max: 100 });
        validateStringList(identity.emails, `${location}.emails`, issues, { max: 20, itemMin: 3, itemMax: 254 });
      });
    }
  }

  if (arrayValue(value.projects, `${source}.projects`, issues)) {
    const ids = new Set<unknown>();
    value.projects.forEach((project, index) => {
      const location = `${source}.projects[${index}]`;
      if (!isObject(project)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const projectAllowed = new Set(['id', 'label', 'path', 'kind', 'visibility', 'contextFile', 'scan']);
      required(project, [...projectAllowed], location, issues);
      exactKeys(project, projectAllowed, location, issues);
      stringValue(project.id, `${location}.id`, issues, { min: 1, max: 100, pattern: SLUG });
      stringValue(project.label, `${location}.label`, issues, { min: 2, max: 100 });
      stringValue(project.path, `${location}.path`, issues, { min: 1, max: 1000 });
      enumValue(project.kind, new Set(['work', 'personal', 'open-source', 'research']), `${location}.kind`, issues);
      enumValue(project.visibility, new Set(['private', 'public-source']), `${location}.visibility`, issues);
      stringValue(project.contextFile, `${location}.contextFile`, issues, { min: 1, max: 1000 });
      if (ids.has(project.id)) issue(issues, `${location}.id`, 'must be unique');
      ids.add(project.id);
      if (!isObject(project.scan)) {
        issue(issues, `${location}.scan`, 'must be an object');
      } else {
        const scanAllowed = new Set(['since', 'maxCommits', 'includeUncommitted']);
        required(project.scan, [...scanAllowed], `${location}.scan`, issues);
        exactKeys(project.scan, scanAllowed, `${location}.scan`, issues);
        validateDate(project.scan.since, `${location}.scan.since`, issues);
        integerValue(project.scan.maxCommits, `${location}.scan.maxCommits`, issues, { min: 1, max: 10000 });
        booleanValue(project.scan.includeUncommitted, `${location}.scan.includeUncommitted`, issues);
      }
    });
  }

  if (!isObject(value.privacy)) {
    issue(issues, `${source}.privacy`, 'must be an object');
  } else {
    const privacyAllowed = new Set(['blockedTerms', 'blockedPatterns']);
    required(value.privacy, [...privacyAllowed], `${source}.privacy`, issues);
    exactKeys(value.privacy, privacyAllowed, `${source}.privacy`, issues);
    validateStringList(value.privacy.blockedTerms, `${source}.privacy.blockedTerms`, issues, { max: 1000, itemMin: 2, itemMax: 300 });
    validateStringList(value.privacy.blockedPatterns, `${source}.privacy.blockedPatterns`, issues, { max: 200, itemMin: 2, itemMax: 500 });
  }

  return issues;
}

function validatePrivateAttribution(value: unknown, location: string, issues: string[]) {
  if (!isObject(value)) {
    issue(issues, location, 'must be an object');
    return;
  }
  const allowed = new Set(['scope', 'confidence', 'notes']);
  required(value, [...allowed], location, issues);
  exactKeys(value, allowed, location, issues);
  enumValue(value.scope, ATTRIBUTION_SCOPES, `${location}.scope`, issues);
  enumValue(value.confidence, new Set(['low', 'medium', 'high']), `${location}.confidence`, issues);
  stringValue(value.notes, `${location}.notes`, issues, { max: 1500 });
}

function validatePrivateOutcomes(value: unknown, location: string, issues: string[], options: ValueOptions = {}) {
  const { max = 30 } = options;
  if (!arrayValue(value, location, issues, { max })) return;
  value.forEach((outcome, index) => {
    const itemLocation = `${location}[${index}]`;
    if (!isObject(outcome)) {
      issue(issues, itemLocation, 'must be an object');
      return;
    }
    const allowed = new Set(['text', 'status', 'evidenceLevel', 'notes']);
    required(outcome, [...allowed], itemLocation, issues);
    exactKeys(outcome, allowed, itemLocation, issues);
    stringValue(outcome.text, `${itemLocation}.text`, issues, { min: 10, max: 500 });
    enumValue(outcome.status, new Set(['needs-confirmation', 'confirmed', 'rejected']), `${itemLocation}.status`, issues);
    enumValue(outcome.evidenceLevel, new Set(['unknown', ...EVIDENCE_LEVELS]), `${itemLocation}.evidenceLevel`, issues);
    stringValue(outcome.notes, `${itemLocation}.notes`, issues, { max: 1000 });
    if (outcome.status === 'confirmed' && outcome.evidenceLevel === 'unknown') {
      issue(issues, itemLocation, 'confirmed outcomes require a known evidence level');
    }
  });
}

function validatePrivateSensitivity(value: unknown, location: string, issues: string[]) {
  if (!isObject(value)) {
    issue(issues, location, 'must be an object');
    return;
  }
  const allowed = new Set(['level', 'blockedTerms', 'notes']);
  required(value, [...allowed], location, issues);
  exactKeys(value, allowed, location, issues);
  enumValue(value.level, new Set(['low', 'medium', 'high']), `${location}.level`, issues);
  validateStringList(value.blockedTerms, `${location}.blockedTerms`, issues, { max: 1000, itemMin: 1, itemMax: 300 });
  stringValue(value.notes, `${location}.notes`, issues, { max: 1500 });
}

function validateRecordReferences(value: unknown, location: string, issues: string[], options: ValueOptions = {}) {
  const { min = 0, max = 1000 } = options;
  validateStringList(value, location, issues, { min, max, itemMin: 1, itemMax: 160 });
  if (!Array.isArray(value)) return;
  value.forEach((reference, index) => {
    if (typeof reference === 'string' && !SLUG.test(reference)) {
      issue(issues, `${location}[${index}]`, 'has an invalid record ID format');
    }
  });
}

export function validatePrivateActivity(value: unknown, source: string = 'private activity') {
  const issues: string[] = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set([
    '$schema', 'schemaVersion', 'recordType', 'id', 'projectId', 'workstreamId', 'title', 'summary', 'occurredAt',
    'types', 'domains', 'significance', 'progression', 'attribution', 'evidence', 'outcomes', 'areas', 'technologies',
    'sensitivity', 'sourceScans', 'updatedAt'
  ]);
  required(value, [
    'schemaVersion', 'recordType', 'id', 'projectId', 'workstreamId', 'title', 'summary', 'occurredAt', 'types', 'domains',
    'significance', 'progression', 'attribution', 'evidence', 'outcomes', 'areas', 'technologies', 'sensitivity',
    'sourceScans', 'updatedAt'
  ], source, issues);
  exactKeys(value, allowed, source, issues);

  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');
  if (value.recordType !== 'activity') issue(issues, `${source}.recordType`, 'must equal "activity"');
  stringValue(value.id, `${source}.id`, issues, { min: 1, max: 160, pattern: SLUG });
  stringValue(value.projectId, `${source}.projectId`, issues, { min: 1, max: 100, pattern: SLUG });
  stringValue(value.workstreamId, `${source}.workstreamId`, issues, { min: 1, max: 160, pattern: SLUG, nullable: true });
  stringValue(value.title, `${source}.title`, issues, { min: 4, max: 160 });
  stringValue(value.summary, `${source}.summary`, issues, { min: 20, max: 800 });
  validateDate(value.occurredAt, `${source}.occurredAt`, issues);

  if (arrayValue(value.types, `${source}.types`, issues, { min: 1, max: 8 })) {
    value.types.forEach((type, index) => enumValue(type, ACTIVITY_TYPES, `${source}.types[${index}]`, issues));
    uniqueStrings(value.types, `${source}.types`, issues);
  }
  if (arrayValue(value.domains, `${source}.domains`, issues, { min: 1, max: 8 })) {
    value.domains.forEach((domain, index) => enumValue(domain, ACTIVITY_DOMAIN_SET, `${source}.domains[${index}]`, issues));
    uniqueStrings(value.domains, `${source}.domains`, issues);
  }
  enumValue(value.significance, SIGNIFICANCE_LEVELS, `${source}.significance`, issues);
  enumValue(value.progression, ACTIVITY_PROGRESSIONS, `${source}.progression`, issues);
  validatePrivateAttribution(value.attribution, `${source}.attribution`, issues);

  const evidenceIds = new Set<unknown>();
  if (arrayValue(value.evidence, `${source}.evidence`, issues, { min: 1 })) {
    value.evidence.forEach((evidence, index) => {
      const location = `${source}.evidence[${index}]`;
      if (!isObject(evidence)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const evidenceAllowed = new Set(['id', 'type', 'reference', 'supports', 'provenance']);
      required(evidence, [...evidenceAllowed], location, issues);
      exactKeys(evidence, evidenceAllowed, location, issues);
      stringValue(evidence.id, `${location}.id`, issues, { min: 1, max: 160, pattern: SLUG });
      if (evidenceIds.has(evidence.id)) issue(issues, `${location}.id`, 'duplicates another evidence ID in this activity');
      evidenceIds.add(evidence.id);
      enumValue(evidence.type, PRIVATE_EVIDENCE_TYPES, `${location}.type`, issues);
      stringValue(evidence.reference, `${location}.reference`, issues, { min: 1, max: 1000 });
      stringValue(evidence.supports, `${location}.supports`, issues, { min: 10, max: 500 });
      enumValue(evidence.provenance, PROVENANCE_STATES, `${location}.provenance`, issues);
    });
  }

  validatePrivateOutcomes(value.outcomes, `${source}.outcomes`, issues, { max: 20 });
  validateStringList(value.areas, `${source}.areas`, issues, { min: 1, max: 20, itemMin: 2, itemMax: 80 });
  validateStringList(value.technologies, `${source}.technologies`, issues, { max: 40, itemMin: 1, itemMax: 80 });
  validatePrivateSensitivity(value.sensitivity, `${source}.sensitivity`, issues);
  validateStringList(value.sourceScans, `${source}.sourceScans`, issues, { max: 1000, itemMin: 1, itemMax: 500 });
  validateDate(value.updatedAt, `${source}.updatedAt`, issues);

  if (value.significance === 'milestone' && value.progression !== 'completed') {
    issue(issues, `${source}.progression`, 'milestone activities must represent completed progression');
  }
  if (value.significance === 'achievement') {
    const confirmed = Array.isArray(value.outcomes)
      && value.outcomes.some((outcome) => outcome?.status === 'confirmed' && EVIDENCE_LEVELS.has(outcome.evidenceLevel));
    if (!confirmed) issue(issues, `${source}.outcomes`, 'achievement activities require at least one confirmed outcome');
  }
  if (value.significance === 'milestone' || value.significance === 'achievement') {
    const supported = Array.isArray(value.evidence)
      && value.evidence.some((evidence) => SUPPORTED_PROVENANCE_STATES.has(evidence?.provenance));
    if (!supported) issue(issues, `${source}.evidence`, `${value.significance} activities require observed, provided, or derived evidence`);
  }

  return issues;
}

export function validatePrivateWorkstream(value: unknown, source: string = 'private workstream') {
  const issues: string[] = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set([
    '$schema', 'schemaVersion', 'recordType', 'id', 'projectId', 'title', 'summary', 'context', 'period', 'status',
    'attribution', 'activityIds', 'contributions', 'potentialOutcomes', 'milestones', 'achievements', 'narrativeSignals',
    'enrichmentQuestions', 'areas', 'technologies', 'sensitivity', 'sourceScans', 'updatedAt'
  ]);
  required(value, [
    'schemaVersion', 'recordType', 'id', 'projectId', 'title', 'summary', 'context', 'period', 'status', 'attribution',
    'activityIds', 'contributions', 'potentialOutcomes', 'milestones', 'achievements', 'narrativeSignals',
    'enrichmentQuestions', 'areas', 'technologies', 'sensitivity', 'sourceScans', 'updatedAt'
  ], source, issues);
  exactKeys(value, allowed, source, issues);

  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');
  if (value.recordType !== 'workstream') issue(issues, `${source}.recordType`, 'must equal "workstream"');
  stringValue(value.id, `${source}.id`, issues, { min: 1, max: 160, pattern: SLUG });
  stringValue(value.projectId, `${source}.projectId`, issues, { min: 1, max: 100, pattern: SLUG });
  stringValue(value.title, `${source}.title`, issues, { min: 4, max: 160 });
  stringValue(value.summary, `${source}.summary`, issues, { min: 30, max: 1000 });

  if (!isObject(value.context)) {
    issue(issues, `${source}.context`, 'must be an object');
  } else {
    const contextAllowed = new Set(['internal', 'public']);
    required(value.context, [...contextAllowed], `${source}.context`, issues);
    exactKeys(value.context, contextAllowed, `${source}.context`, issues);
    stringValue(value.context.internal, `${source}.context.internal`, issues, { min: 10, max: 3000 });
    stringValue(value.context.public, `${source}.context.public`, issues, { min: 10, max: 1200, nullable: true });
  }

  validatePeriod(value.period, `${source}.period`, issues);
  enumValue(value.status, PRIVATE_STATUSES, `${source}.status`, issues);
  validatePrivateAttribution(value.attribution, `${source}.attribution`, issues);
  validateRecordReferences(value.activityIds, `${source}.activityIds`, issues, { min: 1 });
  validateStringList(value.contributions, `${source}.contributions`, issues, { min: 1, max: 30, itemMin: 15, itemMax: 500 });
  validatePrivateOutcomes(value.potentialOutcomes, `${source}.potentialOutcomes`, issues);

  const milestoneIds = new Set<unknown>();
  if (arrayValue(value.milestones, `${source}.milestones`, issues, { max: 30 })) {
    value.milestones.forEach((milestone, index) => {
      const location = `${source}.milestones[${index}]`;
      if (!isObject(milestone)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const milestoneAllowed = new Set(['id', 'date', 'title', 'summary', 'activityIds', 'evidenceRefs', 'provenance']);
      required(milestone, [...milestoneAllowed], location, issues);
      exactKeys(milestone, milestoneAllowed, location, issues);
      stringValue(milestone.id, `${location}.id`, issues, { min: 1, max: 160, pattern: SLUG });
      if (milestoneIds.has(milestone.id)) issue(issues, `${location}.id`, 'duplicates another milestone ID');
      milestoneIds.add(milestone.id);
      validateDate(milestone.date, `${location}.date`, issues);
      stringValue(milestone.title, `${location}.title`, issues, { min: 4, max: 160 });
      stringValue(milestone.summary, `${location}.summary`, issues, { min: 20, max: 800 });
      validateRecordReferences(milestone.activityIds, `${location}.activityIds`, issues, { min: 1 });
      validateRecordReferences(milestone.evidenceRefs, `${location}.evidenceRefs`, issues, { min: 1 });
      enumValue(milestone.provenance, SUPPORTED_PROVENANCE_STATES, `${location}.provenance`, issues);
    });
  }

  const achievementIds = new Set<unknown>();
  if (arrayValue(value.achievements, `${source}.achievements`, issues, { max: 20 })) {
    value.achievements.forEach((achievement, index) => {
      const location = `${source}.achievements[${index}]`;
      if (!isObject(achievement)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const achievementAllowed = new Set(['id', 'date', 'statement', 'evidenceLevel', 'activityIds', 'evidenceRefs', 'provenance']);
      required(achievement, [...achievementAllowed], location, issues);
      exactKeys(achievement, achievementAllowed, location, issues);
      stringValue(achievement.id, `${location}.id`, issues, { min: 1, max: 160, pattern: SLUG });
      if (achievementIds.has(achievement.id)) issue(issues, `${location}.id`, 'duplicates another achievement ID');
      achievementIds.add(achievement.id);
      validateDate(achievement.date, `${location}.date`, issues);
      stringValue(achievement.statement, `${location}.statement`, issues, { min: 15, max: 500 });
      enumValue(achievement.evidenceLevel, EVIDENCE_LEVELS, `${location}.evidenceLevel`, issues);
      validateRecordReferences(achievement.activityIds, `${location}.activityIds`, issues, { min: 1 });
      validateRecordReferences(achievement.evidenceRefs, `${location}.evidenceRefs`, issues, { min: 1 });
      enumValue(achievement.provenance, SUPPORTED_PROVENANCE_STATES, `${location}.provenance`, issues);
    });
  }

  if (arrayValue(value.narrativeSignals, `${source}.narrativeSignals`, issues, { max: 30 })) {
    value.narrativeSignals.forEach((signal, index) => {
      const location = `${source}.narrativeSignals[${index}]`;
      if (!isObject(signal)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const signalAllowed = new Set(['label', 'strength', 'activityIds']);
      required(signal, [...signalAllowed], location, issues);
      exactKeys(signal, signalAllowed, location, issues);
      stringValue(signal.label, `${location}.label`, issues, { min: 3, max: 120 });
      enumValue(signal.strength, new Set(['emerging', 'supported']), `${location}.strength`, issues);
      validateRecordReferences(signal.activityIds, `${location}.activityIds`, issues, { min: 1 });
      if (signal.strength === 'supported' && Array.isArray(signal.activityIds) && new Set(signal.activityIds).size < 2) {
        issue(issues, `${location}.activityIds`, 'supported narrative signals require at least two distinct activities');
      }
    });
  }

  if (arrayValue(value.enrichmentQuestions, `${source}.enrichmentQuestions`, issues, { max: 30 })) {
    value.enrichmentQuestions.forEach((question, index) => {
      const location = `${source}.enrichmentQuestions[${index}]`;
      if (!isObject(question)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const questionAllowed = new Set(['question', 'reason', 'status']);
      required(question, [...questionAllowed], location, issues);
      exactKeys(question, questionAllowed, location, issues);
      stringValue(question.question, `${location}.question`, issues, { min: 10, max: 500 });
      enumValue(question.reason, ENRICHMENT_REASONS, `${location}.reason`, issues);
      enumValue(question.status, new Set(['open', 'answered', 'dismissed']), `${location}.status`, issues);
    });
  }

  validateStringList(value.areas, `${source}.areas`, issues, { min: 1, max: 20, itemMin: 2, itemMax: 80 });
  validateStringList(value.technologies, `${source}.technologies`, issues, { max: 40, itemMin: 1, itemMax: 80 });
  validatePrivateSensitivity(value.sensitivity, `${source}.sensitivity`, issues);
  validateStringList(value.sourceScans, `${source}.sourceScans`, issues, { max: 1000, itemMin: 1, itemMax: 500 });
  validateDate(value.updatedAt, `${source}.updatedAt`, issues);
  return issues;
}

export function validatePrivateInitiative(value: unknown, source: string = 'private initiative') {
  const issues: string[] = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set(['$schema', 'schemaVersion', 'id', 'projectId', 'title', 'period', 'status', 'attribution', 'evidence', 'contributions', 'potentialOutcomes', 'areas', 'technologies', 'sensitivity', 'sourceScans', 'updatedAt']);
  required(value, ['schemaVersion', 'id', 'projectId', 'title', 'period', 'status', 'attribution', 'evidence', 'contributions', 'potentialOutcomes', 'areas', 'technologies', 'sensitivity', 'sourceScans', 'updatedAt'], source, issues);
  exactKeys(value, allowed, source, issues);
  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');
  stringValue(value.id, `${source}.id`, issues, { min: 1, max: 160, pattern: SLUG });
  stringValue(value.projectId, `${source}.projectId`, issues, { min: 1, max: 100, pattern: SLUG });
  stringValue(value.title, `${source}.title`, issues, { min: 4, max: 160 });
  validatePeriod(value.period, `${source}.period`, issues);
  enumValue(value.status, PRIVATE_STATUSES, `${source}.status`, issues);

  if (!isObject(value.attribution)) {
    issue(issues, `${source}.attribution`, 'must be an object');
  } else {
    const allowedAttribution = new Set(['scope', 'confidence', 'notes']);
    required(value.attribution, [...allowedAttribution], `${source}.attribution`, issues);
    exactKeys(value.attribution, allowedAttribution, `${source}.attribution`, issues);
    enumValue(value.attribution.scope, ATTRIBUTION_SCOPES, `${source}.attribution.scope`, issues);
    enumValue(value.attribution.confidence, new Set(['low', 'medium', 'high']), `${source}.attribution.confidence`, issues);
    stringValue(value.attribution.notes, `${source}.attribution.notes`, issues, { max: 1500 });
  }

  if (arrayValue(value.evidence, `${source}.evidence`, issues)) {
    value.evidence.forEach((evidence, index) => {
      const location = `${source}.evidence[${index}]`;
      if (!isObject(evidence)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const allowedEvidence = new Set(['type', 'reference', 'supports']);
      required(evidence, [...allowedEvidence], location, issues);
      exactKeys(evidence, allowedEvidence, location, issues);
      enumValue(evidence.type, new Set(['commit', 'file', 'test', 'document', 'manual-note', 'public-source']), `${location}.type`, issues);
      stringValue(evidence.reference, `${location}.reference`, issues, { min: 1, max: 1000 });
      stringValue(evidence.supports, `${location}.supports`, issues, { min: 10, max: 500 });
    });
  }

  validateStringList(value.contributions, `${source}.contributions`, issues, { min: 1, max: 30, itemMin: 15, itemMax: 500 });

  if (arrayValue(value.potentialOutcomes, `${source}.potentialOutcomes`, issues)) {
    value.potentialOutcomes.forEach((outcome, index) => {
      const location = `${source}.potentialOutcomes[${index}]`;
      if (!isObject(outcome)) {
        issue(issues, location, 'must be an object');
        return;
      }
      const outcomeAllowed = new Set(['text', 'status', 'evidenceLevel', 'notes']);
      required(outcome, [...outcomeAllowed], location, issues);
      exactKeys(outcome, outcomeAllowed, location, issues);
      stringValue(outcome.text, `${location}.text`, issues, { min: 10, max: 500 });
      enumValue(outcome.status, new Set(['needs-confirmation', 'confirmed', 'rejected']), `${location}.status`, issues);
      enumValue(outcome.evidenceLevel, new Set(['unknown', ...EVIDENCE_LEVELS]), `${location}.evidenceLevel`, issues);
      stringValue(outcome.notes, `${location}.notes`, issues, { max: 1000 });
      if (outcome.status === 'confirmed' && outcome.evidenceLevel === 'unknown') {
        issue(issues, location, 'confirmed outcomes require a known evidence level');
      }
    });
  }

  validateStringList(value.areas, `${source}.areas`, issues, { min: 1, max: 20, itemMin: 2, itemMax: 80 });
  validateStringList(value.technologies, `${source}.technologies`, issues, { max: 40, itemMin: 1, itemMax: 80 });

  if (!isObject(value.sensitivity)) {
    issue(issues, `${source}.sensitivity`, 'must be an object');
  } else {
    const sensitivityAllowed = new Set(['level', 'blockedTerms', 'notes']);
    required(value.sensitivity, [...sensitivityAllowed], `${source}.sensitivity`, issues);
    exactKeys(value.sensitivity, sensitivityAllowed, `${source}.sensitivity`, issues);
    enumValue(value.sensitivity.level, new Set(['low', 'medium', 'high']), `${source}.sensitivity.level`, issues);
    validateStringList(value.sensitivity.blockedTerms, `${source}.sensitivity.blockedTerms`, issues, { max: 1000, itemMin: 1, itemMax: 300 });
    stringValue(value.sensitivity.notes, `${source}.sensitivity.notes`, issues, { max: 1500 });
  }

  validateStringList(value.sourceScans, `${source}.sourceScans`, issues, { max: 1000, itemMin: 1, itemMax: 500 });
  validateDate(value.updatedAt, `${source}.updatedAt`, issues);
  return issues;
}

export async function loadPublicContent(options: ContentPaths = {}) {
  const {
    entriesDir = PATHS.publicEntries,
    projectsDir = PATHS.publicProjects,
    profileFile = PATHS.profile,
    resumeFile = PATHS.resume,
    taxonomyFile = PATHS.taxonomy
  } = options;
  const [profile, taxonomy, entryFiles, projectFiles, resumeExists] = await Promise.all([
    readJson(profileFile),
    readJson(taxonomyFile),
    listJsonFiles(entriesDir),
    listJsonFiles(projectsDir),
    pathExists(resumeFile)
  ]);

  const [entries, projects, resume] = await Promise.all([
    Promise.all(entryFiles.map(async (file) => ({ file, value: await readJson(file) }))),
    Promise.all(projectFiles.map(async (file) => ({ file, value: await readJson(file) }))),
    resumeExists ? readJson(resumeFile) : null
  ]);
  return { profile, resume, taxonomy, entries, projects };
}

export async function validatePublicContent(options: ContentPaths = {}) {
  const raw = await loadPublicContent(options);
  const issues = [
    ...validateProfile(raw.profile, 'profile'),
    ...validateTaxonomy(raw.taxonomy, 'taxonomy')
  ];
  if (raw.resume) {
    issues.push(...validateResume(raw.resume, { mode: 'public', source: 'resume.json' }));
  }

  for (const entry of raw.entries) {
    issues.push(...validateEntry(entry.value, { mode: 'public', source: path.basename(entry.file) }));
  }
  for (const project of raw.projects) {
    issues.push(...validateProject(project.value, { mode: 'public', source: path.basename(project.file) }));
  }

  // Only validated records cross into the typed model. Invalid shapes never reach relationship checks.
  throwIfIssues(issues, 'Public content validation failed');
  const content = raw as PublicContent;

  const areaLabels = new Set((content.taxonomy.areas ?? []).map((area) => area.label));
  const kindValues = new Set((content.taxonomy.kinds ?? []).map((kind) => kind.value));
  const entryIds = new Set<unknown>();
  const projectIds = new Set<unknown>();

  for (const { file, value } of content.entries) {
    const source = path.basename(file);
    if (entryIds.has(value.id)) issue(issues, `${source}.id`, 'duplicates another entry ID');
    entryIds.add(value.id);
    if (!kindValues.has(value.kind)) issue(issues, `${source}.kind`, 'is missing from taxonomy.kinds');
    for (const area of value.areas ?? []) {
      if (!areaLabels.has(area)) issue(issues, `${source}.areas`, `unknown taxonomy area "${area}"`);
    }
  }

  for (const { file, value } of content.projects) {
    const source = path.basename(file);
    if (projectIds.has(value.id)) issue(issues, `${source}.id`, 'duplicates another project ID');
    projectIds.add(value.id);
    for (const area of value.areas ?? []) {
      if (!areaLabels.has(area)) issue(issues, `${source}.areas`, `unknown taxonomy area "${area}"`);
    }
    for (const related of value.relatedEntries ?? []) {
      if (!entryIds.has(related)) issue(issues, `${source}.relatedEntries`, `references unknown entry "${related}"`);
    }
  }

  if (content.resume) {
    for (const [experienceIndex, experience] of content.resume.experiences.entries()) {
      for (const related of experience.relatedProjects ?? []) {
        if (!projectIds.has(related)) {
          issue(issues, `resume.json.experiences[${experienceIndex}].relatedProjects`, `references unknown project "${related}"`);
        }
      }
    }
  }

  return { ...content, issues };
}

function privateRecordKey(projectId: string, recordId: string) {
  return `${projectId}:${recordId}`;
}

async function loadPrivateRecords<T>(root: string, validator: (value: unknown, source: string) => string[], issues: string[]): Promise<Array<FileRecord<T> & { source: string }>> {
  const records: Array<FileRecord<T> & { source: string }> = [];
  const files = (await walkFiles(root)).filter((file) => file.endsWith('.json'));
  for (const file of files) {
    const source = path.relative(PATHS.root, file);
    try {
      const value = await readJson(file);
      const recordIssues = validator(value, source);
      issues.push(...recordIssues);
      if (recordIssues.length === 0) records.push({ file, source, value: value as T });
    } catch (error) {
      issue(issues, source, errorMessage(error));
    }
  }
  return records;
}

function checkWithinPeriod(date: unknown, period: unknown, location: string, issues: string[]) {
  if (typeof date !== 'string' || !DATE.test(date) || !isObject(period)) return;
  if (typeof period.start === 'string' && date < period.start) {
    issue(issues, location, 'must not be earlier than the workstream start date');
  }
  if (typeof period.end === 'string' && date > period.end) {
    issue(issues, location, 'must not be later than the workstream end date');
  }
}

export async function validatePrivateWorkspace(options: PrivatePaths = {}) {
  const issues: string[] = [];
  const activitiesDir = options.activitiesDir ?? PATHS.activities;
  const workstreamsDir = options.workstreamsDir ?? PATHS.workstreams;
  const draftsDir = options.draftsDir ?? PATHS.drafts;
  const initiativesDir = options.initiativesDir ?? PATHS.initiatives;

  const activities = await loadPrivateRecords<PrivateActivity>(activitiesDir, validatePrivateActivity, issues);
  const workstreams = await loadPrivateRecords<PrivateWorkstream>(workstreamsDir, validatePrivateWorkstream, issues);
  await loadPrivateRecords<PrivateInitiative>(draftsDir, validatePrivateInitiative, issues);
  await loadPrivateRecords<PrivateInitiative>(initiativesDir, validatePrivateInitiative, issues);

  const activitiesByKey = new Map<string, FileRecord<PrivateActivity> & { source: string }>();
  const workstreamsByKey = new Map<string, FileRecord<PrivateWorkstream> & { source: string }>();
  const evidenceByKey = new Map<string, { activity: FileRecord<PrivateActivity> & { source: string }; evidence: PrivateActivity['evidence'][number] }>();

  for (const record of activities) {
    const { value, source } = record;
    if (typeof value.projectId !== 'string' || typeof value.id !== 'string') continue;
    const key = privateRecordKey(value.projectId, value.id);
    if (activitiesByKey.has(key)) issue(issues, `${source}.id`, 'duplicates another activity ID in this project');
    activitiesByKey.set(key, record);
    for (const evidence of value.evidence ?? []) {
      if (typeof evidence?.id !== 'string') continue;
      const evidenceKey = privateRecordKey(value.projectId, evidence.id);
      if (evidenceByKey.has(evidenceKey)) issue(issues, `${source}.evidence`, `evidence ID "${evidence.id}" is not unique within this project`);
      evidenceByKey.set(evidenceKey, { activity: record, evidence });
    }
  }

  for (const record of workstreams) {
    const { value, source } = record;
    if (typeof value.projectId !== 'string' || typeof value.id !== 'string') continue;
    const key = privateRecordKey(value.projectId, value.id);
    if (workstreamsByKey.has(key)) issue(issues, `${source}.id`, 'duplicates another workstream ID in this project');
    workstreamsByKey.set(key, record);
  }

  for (const record of activities) {
    const { value, source } = record;
    if (typeof value.projectId !== 'string' || typeof value.id !== 'string' || typeof value.workstreamId !== 'string') continue;
    const workstream = workstreamsByKey.get(privateRecordKey(value.projectId, value.workstreamId));
    if (!workstream) {
      issue(issues, `${source}.workstreamId`, `references unknown workstream "${value.workstreamId}" in project "${value.projectId}"`);
    } else if (!workstream.value.activityIds?.includes(value.id)) {
      issue(issues, `${source}.workstreamId`, `workstream "${value.workstreamId}" does not reference this activity`);
    }
  }

  for (const record of workstreams) {
    const { value, source } = record;
    if (typeof value.projectId !== 'string') continue;
    const activityIds = new Set(Array.isArray(value.activityIds) ? value.activityIds : []);
    const resolvedActivities = [];

    for (const activityId of activityIds) {
      const activity = activitiesByKey.get(privateRecordKey(value.projectId, activityId));
      if (!activity) {
        issue(issues, `${source}.activityIds`, `references unknown activity "${activityId}" in project "${value.projectId}"`);
        continue;
      }
      resolvedActivities.push(activity);
      if (activity.value.workstreamId !== value.id) {
        issue(issues, `${source}.activityIds`, `activity "${activityId}" does not point back to workstream "${value.id}"`);
      }
      checkWithinPeriod(activity.value.occurredAt, value.period, `${activity.source}.occurredAt`, issues);
    }

    const evidenceIds = new Set(resolvedActivities.flatMap((activity) =>
      (activity.value.evidence ?? []).map((evidence) => evidence?.id).filter((id) => typeof id === 'string')));
    const validateProjectionReferences = (item: PrivateWorkstream['milestones'][number] | PrivateWorkstream['achievements'][number], location: string) => {
      for (const activityId of item.activityIds ?? []) {
        if (!activityIds.has(activityId)) issue(issues, `${location}.activityIds`, `activity "${activityId}" is not part of this workstream`);
      }
      for (const evidenceId of item.evidenceRefs ?? []) {
        if (!evidenceIds.has(evidenceId)) issue(issues, `${location}.evidenceRefs`, `references unknown workstream evidence "${evidenceId}"`);
      }
      checkWithinPeriod(item.date, value.period, `${location}.date`, issues);
    };

    for (const [index, milestone] of (value.milestones ?? []).entries()) {
      validateProjectionReferences(milestone, `${source}.milestones[${index}]`);
    }
    for (const [index, achievement] of (value.achievements ?? []).entries()) {
      const location = `${source}.achievements[${index}]`;
      validateProjectionReferences(achievement, location);
      const supportingActivities = resolvedActivities.filter((activity) => achievement.activityIds?.includes(activity.value.id));
      const confirmed = supportingActivities.some((activity) =>
        (activity.value.outcomes ?? []).some((outcome) => outcome?.status === 'confirmed' && EVIDENCE_LEVELS.has(outcome.evidenceLevel)));
      if (!confirmed) issue(issues, `${location}.activityIds`, 'achievements require a confirmed outcome in at least one referenced activity');
    }
    for (const [index, signal] of (value.narrativeSignals ?? []).entries()) {
      for (const activityId of signal.activityIds ?? []) {
        if (!activityIds.has(activityId)) {
          issue(issues, `${source}.narrativeSignals[${index}].activityIds`, `activity "${activityId}" is not part of this workstream`);
        }
      }
    }
  }

  return issues;
}

export function throwIfIssues(issues: string[], message: string = 'Validation failed') {
  if (issues.length > 0) {
    throw new ValidationError(message, issues);
  }
}

// Assertions are centralized here and only run after the corresponding runtime validator succeeds.
function parsed<T>(value: unknown, issues: string[]): T {
  throwIfIssues(issues);
  return value as T;
}
export function parseEntry(value: unknown, options: RecordOptions = {}): EntryRecord { return parsed<EntryRecord>(value, validateEntry(value, options)); }
export function parseProject(value: unknown, options: RecordOptions = {}): ProjectRecord { return parsed<ProjectRecord>(value, validateProject(value, options)); }
export function parseResume(value: unknown, options: RecordOptions = {}): ResumeRecord { return parsed<ResumeRecord>(value, validateResume(value, options)); }
export function parseProfile(value: unknown): ProfileRecord { return parsed<ProfileRecord>(value, validateProfile(value)); }
export function parseTaxonomy(value: unknown): TaxonomyRecord { return parsed<TaxonomyRecord>(value, validateTaxonomy(value)); }
export function parseLocalConfig(value: unknown): LocalConfig { return parsed<LocalConfig>(value, validateLocalConfig(value)); }
export function parsePrivateActivity(value: unknown): PrivateActivity { return parsed<PrivateActivity>(value, validatePrivateActivity(value)); }
export function parsePrivateWorkstream(value: unknown): PrivateWorkstream { return parsed<PrivateWorkstream>(value, validatePrivateWorkstream(value)); }
export function parsePrivateInitiative(value: unknown): PrivateInitiative { return parsed<PrivateInitiative>(value, validatePrivateInitiative(value)); }
export function parseCandidate(value: unknown, source = 'candidate'): PublicRecord {
  if (isObject(value)) {
    if (value.recordType === 'entry') return parseEntry(value, { mode: 'candidate', source });
    if (value.recordType === 'project') return parseProject(value, { mode: 'candidate', source });
    if (value.recordType === 'resume') return parseResume(value, { mode: 'candidate', source });
  }
  throw new ValidationError('Candidate validation failed', [source + '.recordType: must equal "entry", "project", or "resume"']);
}
