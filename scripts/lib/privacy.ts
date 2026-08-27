import { errorMessage } from './files.ts';
import { parseLocalConfig } from './validation.ts';
export interface AuditOptions { source?: string; blockedTerms?: string[]; blockedPatterns?: string[]; includeTicketIds?: boolean; includeScriptTags?: boolean; }

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { LOCAL_ONLY_FILES, PATHS, PRIVATE_PATH_PREFIXES } from './constants.ts';
import { pathExists, readJson, toPosixPath, walkFiles } from './files.ts';

const PUBLIC_BLOCKED_KEYS = new Set([
  'client',
  'clientName',
  'company',
  'companyName',
  'customer',
  'customerName',
  'ticket',
  'ticketId',
  'commit',
  'commitHash',
  'branch',
  'repositoryPath',
  'repositoryRemote',
  'remoteUrl',
  'internalUrl',
  'rawEvidence',
  'sourcePath',
  'employee',
  'employeeName'
]);

const BASE_PATTERNS: Array<[string, RegExp]> = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/i],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/],
  ['database connection string', /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'<>]+/i],
  ['secret assignment', /\b(?:api[_-]?key|client[_-]?secret|private[_-]?key|password|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*["']?[A-Za-z0-9+/_=.-]{12,}/i],
  ['Windows local path', /\b[A-Za-z]:\\(?:Users|Documents|Projects|Work|Source|Repos)\\/i],
  ['Unix local path', /(?:^|[\s"'(])\/(?:Users|home|var\/www|opt|srv)\/[A-Za-z0-9._-]+/i],
  ['private IPv4 address', /(?<![0-9a-f]{2}\.)\b(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3}\.)\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.(?:\d{1,3}\.)\d{1,3})\b(?!\.[0-9a-f]{2}(?:\.|`))/i],
  ['internal domain', /\bhttps?:\/\/[^\s"'<>]+\.(?:internal|corp|local)(?:[\/:]|$)/i],
  ['ticket identifier', /\b[A-Z][A-Z0-9]{1,9}-\d{2,}\b/],
  ['full commit hash', /\b[0-9a-f]{40}\b/i],
  ['script injection', /<script\b/i]
];

const TEXT_EXTENSIONS = new Set([
  '.astro', '.cjs', '.css', '.csv', '.html', '.js', '.json', '.jsonc', '.jsx', '.mjs', '.md', '.markdown', '.svg', '.toml', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml'
]);

function normalizeBlockedTerms(terms: string[] = []) {
  return terms
    .map((term) => String(term).trim())
    .filter((term) => term.length >= 2);
}

function compileCustomPatterns(patterns: string[] = []) {
  const compiled: Array<[string, RegExp]> = [];
  const errors: string[] = [];
  patterns.forEach((pattern, index) => {
    try {
      compiled.push([`custom pattern ${index + 1}`, new RegExp(pattern, 'i')]);
    } catch (error) {
      errors.push(`privacy.blockedPatterns[${index}]: ${errorMessage(error)}`);
    }
  });
  return { compiled, errors };
}

function testPattern(regex: RegExp, text: string) {
  const safe = new RegExp(regex.source, regex.flags.replace('g', ''));
  return safe.test(text);
}

export function auditText(text: string, options: AuditOptions = {}) {
  const {
    source = 'text',
    blockedTerms = [],
    blockedPatterns = [],
    includeTicketIds = true,
    includeScriptTags = true
  } = options;
  const findings: string[] = [];
  const patterns = BASE_PATTERNS.filter(([name]) => {
    if (!includeTicketIds && name === 'ticket identifier') return false;
    if (!includeScriptTags && name === 'script injection') return false;
    return true;
  });

  for (const [name, regex] of patterns) {
    if (testPattern(regex, text)) {
      findings.push(`${source}: detected ${name}`);
    }
  }

  for (const term of normalizeBlockedTerms(blockedTerms)) {
    if (text.toLocaleLowerCase().includes(term.toLocaleLowerCase())) {
      findings.push(`${source}: contains blocked term "${term}"`);
    }
  }

  const custom = compileCustomPatterns(blockedPatterns);
  findings.push(...custom.errors.map((error) => `${source}: ${error}`));
  for (const [name, regex] of custom.compiled) {
    if (testPattern(regex, text)) {
      findings.push(`${source}: matched ${name}`);
    }
  }

  return [...new Set(findings)];
}

export function auditObject(value: unknown, options: AuditOptions = {}) {
  const { source = 'record' } = options;
  const findings: string[] = [];

  function visit(current: unknown, location: string): void {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${location}[${index}]`));
      return;
    }

    if (current && typeof current === 'object') {
      for (const [key, child] of Object.entries(current)) {
        if (PUBLIC_BLOCKED_KEYS.has(key)) {
          findings.push(`${location}.${key}: blocked public field name`);
        }
        visit(child, `${location}.${key}`);
      }
      return;
    }

    if (typeof current === 'string') {
      findings.push(...auditText(current, { ...options, source: location }));
    }
  }

  visit(value, source);
  return [...new Set(findings)];
}

export async function loadLocalPrivacyRules() {
  if (!(await pathExists(PATHS.localConfig))) {
    return { blockedTerms: [], blockedPatterns: [] };
  }
  const config = parseLocalConfig(await readJson(PATHS.localConfig));
  return {
    blockedTerms: config.privacy?.blockedTerms ?? [],
    blockedPatterns: config.privacy?.blockedPatterns ?? []
  };
}

export async function auditPublicFiles(options: { includeLocalRules?: boolean } = {}) {
  const { includeLocalRules = true } = options;
  const localRules = includeLocalRules ? await loadLocalPrivacyRules() : { blockedTerms: [], blockedPatterns: [] };
  const files = await walkFiles(PATHS.publicContent);
  const findings: string[] = [];

  for (const file of files) {
    if (path.extname(file).toLowerCase() !== '.json') {
      continue;
    }
    const relative = toPosixPath(path.relative(PATHS.root, file));
    const value = await readJson(file);
    findings.push(...auditObject(value, { source: relative, ...localRules }));
  }

  return [...new Set(findings)].sort();
}

export async function auditCandidateFile(file: string) {
  const localRules = await loadLocalPrivacyRules();
  const value = await readJson(file);
  return auditObject(value, { source: toPosixPath(path.relative(PATHS.root, file)), ...localRules }).sort();
}

export async function auditGeneratedDirectory(directory: string, options: { includeLocalRules?: boolean } = {}) {
  const localRules = options.includeLocalRules === true
    ? await loadLocalPrivacyRules()
    : { blockedTerms: [], blockedPatterns: [] };
  const files = await walkFiles(directory);
  const findings: string[] = [];

  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      continue;
    }
    const source = toPosixPath(path.relative(PATHS.root, file));
    const text = await fs.readFile(file, 'utf8');
    findings.push(...auditText(text, {
      source,
      ...localRules,
      includeTicketIds: true,
      includeScriptTags: false
    }));
  }

  return [...new Set(findings)].sort();
}

export function getStagedFiles(options: { cwd?: string } = {}) {
  const { cwd = PATHS.root } = options;
  const repository = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd,
    encoding: 'utf8'
  });
  if (repository.status !== 0 || repository.stdout.trim() !== 'true') {
    return { files: [], error: 'Unable to audit staged files because the Career Ledger directory is not a Git work tree' };
  }

  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRT', '-z'], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024
  });

  if (result.status !== 0) {
    return { files: [], error: result.stderr.trim() || 'Unable to read staged files' };
  }

  return {
    files: result.stdout.split('\0').filter(Boolean).map((file) => file.replaceAll('\\', '/')),
    error: null
  };
}

async function readTextIfSafe(file: string) {
  const stat = await fs.stat(file);
  if (stat.size > 2 * 1024 * 1024) {
    return null;
  }
  const buffer = await fs.readFile(file);
  if (buffer.includes(0)) {
    return null;
  }
  return buffer.toString('utf8');
}

export async function auditStagedFiles() {
  const staged = getStagedFiles();
  if (staged.error) {
    return [staged.error];
  }

  const localRules = await loadLocalPrivacyRules();
  const findings: string[] = [];

  for (const relative of staged.files) {
    const normalized = relative.replace(/^\.\//, '');
    if (PRIVATE_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix)) || LOCAL_ONLY_FILES.includes(normalized) || normalized.endsWith('.local.json')) {
      findings.push(`${normalized}: local-only file must not be committed`);
      continue;
    }

    if (normalized.startsWith('tests/fixtures/unsafe-')) {
      continue;
    }

    const absolute = path.join(PATHS.root, normalized);
    if (!(await pathExists(absolute))) {
      continue;
    }

    const extension = path.extname(absolute).toLowerCase();
    if (extension && !TEXT_EXTENSIONS.has(extension)) {
      continue;
    }

    const text = await readTextIfSafe(absolute);
    if (text === null) {
      continue;
    }

    findings.push(...auditText(text, { source: normalized, ...localRules, includeTicketIds: true, includeScriptTags: false }));
  }

  return [...new Set(findings)].sort();
}
