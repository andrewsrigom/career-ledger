import path from 'node:path';
import { PATHS } from './constants.mjs';
import { listJsonFiles, pathExists, readJson } from './files.mjs';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ENTRY_KINDS = new Set(['architecture', 'improvement', 'investigation', 'launch', 'leadership', 'learning', 'project', 'reliability', 'research']);
const ENTRY_STATUSES = new Set(['active', 'completed', 'archived']);
const PROJECT_KINDS = new Set(['application', 'open-source', 'platform', 'product', 'research', 'tool']);
const PROJECT_STATUSES = new Set(['active', 'completed', 'archived', 'paused']);
const EVIDENCE_LEVELS = new Set(['observed', 'measured', 'self-reported', 'public']);
const ATTRIBUTION_SCOPES = new Set(['implemented', 'contributed', 'designed', 'led', 'owned', 'investigated']);
const PRIVATE_STATUSES = new Set(['detected', 'active', 'completed', 'ready-for-sanitization', 'archived']);

export class ValidationError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function issue(issues, location, message) {
  issues.push(`${location}: ${message}`);
}

function required(value, keys, location, issues) {
  for (const key of keys) {
    if (!(key in value)) {
      issue(issues, location, `missing required field "${key}"`);
    }
  }
}

function exactKeys(value, allowed, location, issues) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      issue(issues, `${location}.${key}`, 'unexpected field');
    }
  }
}

function stringValue(value, location, issues, options = {}) {
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

function booleanValue(value, location, issues) {
  if (typeof value !== 'boolean') {
    issue(issues, location, 'must be a boolean');
  }
}

function integerValue(value, location, issues, options = {}) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = options;
  if (!Number.isInteger(value)) {
    issue(issues, location, 'must be an integer');
    return;
  }
  if (value < min || value > max) {
    issue(issues, location, `must be between ${min} and ${max}`);
  }
}

function arrayValue(value, location, issues, options = {}) {
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

function uniqueStrings(value, location, issues) {
  if (!Array.isArray(value)) {
    return;
  }
  const normalized = value.map((item) => String(item).toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    issue(issues, location, 'must not contain duplicate values');
  }
}

function enumValue(value, allowed, location, issues) {
  if (!allowed.has(value)) {
    issue(issues, location, `must be one of: ${[...allowed].join(', ')}`);
  }
}

function validateDate(value, location, issues, nullable = false) {
  stringValue(value, location, issues, { pattern: DATE, nullable });
  if (value === null || typeof value !== 'string' || !DATE.test(value)) {
    return;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    issue(issues, location, 'must be a real ISO calendar date');
  }
}

function validatePeriod(value, location, issues) {
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

function validateLinks(value, location, issues) {
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

function validateStringList(value, location, issues, options = {}) {
  const { min = 0, max = Infinity, itemMin = 1, itemMax = 300 } = options;
  if (!arrayValue(value, location, issues, { min, max })) {
    return;
  }
  value.forEach((item, index) => stringValue(item, `${location}[${index}]`, issues, { min: itemMin, max: itemMax }));
  uniqueStrings(value, location, issues);
}

function validatePublication(value, location, issues, mode) {
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

export function validateEntry(value, options = {}) {
  const { mode = 'public', source = 'entry' } = options;
  const issues = [];
  if (!isObject(value)) {
    return [`${source}: must be an object`];
  }

  const allowed = new Set([
    '$schema', 'schemaVersion', 'recordType', 'id', 'slug', 'title', 'kind', 'status', 'period', 'summary', 'context',
    'contributions', 'outcomes', 'areas', 'technologies', 'featured', 'publication', 'links'
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
  return issues;
}

export function validateProject(value, options = {}) {
  const { mode = 'public', source = 'project' } = options;
  const issues = [];
  if (!isObject(value)) {
    return [`${source}: must be an object`];
  }

  const allowed = new Set([
    '$schema', 'schemaVersion', 'recordType', 'id', 'slug', 'name', 'kind', 'status', 'summary', 'description',
    'areas', 'technologies', 'relatedEntries', 'featured', 'publication', 'links'
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
  validatePublication(value.publication, `${source}.publication`, issues, mode);
  validateLinks(value.links, `${source}.links`, issues);
  return issues;
}

export function validateProfile(value, source = 'profile') {
  const issues = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set(['$schema', 'schemaVersion', 'name', 'headline', 'location', 'intro', 'bio', 'links', 'principles', 'updatedAt']);
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
  return issues;
}

export function validateTaxonomy(value, source = 'taxonomy') {
  const issues = [];
  if (!isObject(value)) return [`${source}: must be an object`];
  const allowed = new Set(['$schema', 'schemaVersion', 'areas', 'kinds']);
  required(value, ['schemaVersion', 'areas', 'kinds'], source, issues);
  exactKeys(value, allowed, source, issues);
  if (value.schemaVersion !== 1) issue(issues, `${source}.schemaVersion`, 'must equal 1');

  if (arrayValue(value.areas, `${source}.areas`, issues, { min: 1 })) {
    const slugs = new Set();
    const labels = new Set();
    const orders = new Set();
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
    const values = new Set();
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
  return issues;
}

export function validateLocalConfig(value, source = 'career.local.json') {
  const issues = [];
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
    const ids = new Set();
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
        integerValue(project.scan.maxCommits, `${location}.scan.maxCommits`, issues, { min: 1, max: 2000 });
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

export function validatePrivateInitiative(value, source = 'private initiative') {
  const issues = [];
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

export async function loadPublicContent(options = {}) {
  const { entriesDir = PATHS.publicEntries, projectsDir = PATHS.publicProjects, profileFile = PATHS.profile, taxonomyFile = PATHS.taxonomy } = options;
  const [profile, taxonomy, entryFiles, projectFiles] = await Promise.all([
    readJson(profileFile),
    readJson(taxonomyFile),
    listJsonFiles(entriesDir),
    listJsonFiles(projectsDir)
  ]);

  const entries = await Promise.all(entryFiles.map(async (file) => ({ file, value: await readJson(file) })));
  const projects = await Promise.all(projectFiles.map(async (file) => ({ file, value: await readJson(file) })));
  return { profile, taxonomy, entries, projects };
}

export async function validatePublicContent(options = {}) {
  const content = await loadPublicContent(options);
  const issues = [
    ...validateProfile(content.profile, 'profile'),
    ...validateTaxonomy(content.taxonomy, 'taxonomy')
  ];

  for (const entry of content.entries) {
    issues.push(...validateEntry(entry.value, { mode: 'public', source: path.basename(entry.file) }));
  }
  for (const project of content.projects) {
    issues.push(...validateProject(project.value, { mode: 'public', source: path.basename(project.file) }));
  }

  const areaLabels = new Set((content.taxonomy.areas ?? []).map((area) => area.label));
  const kindValues = new Set((content.taxonomy.kinds ?? []).map((kind) => kind.value));
  const entryIds = new Set();
  const projectIds = new Set();

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

  return { ...content, issues };
}

export async function validatePrivateWorkspace() {
  const issues = [];
  const roots = [PATHS.drafts, PATHS.initiatives];
  for (const root of roots) {
    if (!(await pathExists(root))) continue;
    const projectDirectories = await import('node:fs/promises').then(({ readdir }) => readdir(root, { withFileTypes: true }));
    for (const directory of projectDirectories.filter((entry) => entry.isDirectory())) {
      const files = await listJsonFiles(path.join(root, directory.name));
      for (const file of files) {
        const value = await readJson(file);
        issues.push(...validatePrivateInitiative(value, path.relative(PATHS.root, file)));
      }
    }
  }
  return issues;
}

export function throwIfIssues(issues, message = 'Validation failed') {
  if (issues.length > 0) {
    throw new ValidationError(message, issues);
  }
}
