#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { buildSite, publishPublicDataset } from './lib/build.mjs';
import { PATHS } from './lib/constants.mjs';
import {
  countFiles,
  currentDate,
  pathExists,
  readJson,
  timestampForPath,
  toPosixPath,
  walkFiles,
  writeJson
} from './lib/files.mjs';
import {
  initializeLocalWorkspace,
  inspectConfiguredProject,
  loadLocalConfig,
  runGit,
  scanConfiguredProject
} from './lib/git.mjs';
import {
  auditCandidateFile,
  auditPublicFiles,
  auditStagedFiles
} from './lib/privacy.mjs';
import {
  ValidationError,
  throwIfIssues,
  validateEntry,
  validateLocalConfig,
  validatePrivateWorkspace,
  validateProject,
  validatePublicContent
} from './lib/validation.mjs';

const COMMANDS = new Set([
  'help',
  'init',
  'hooks',
  'doctor',
  'scan',
  'review',
  'validate',
  'validate-private',
  'audit',
  'approve',
  'publish',
  'build'
]);

function parseArgs(values) {
  const positional = [];
  const flags = {};

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }

    const raw = value.slice(2);
    const equals = raw.indexOf('=');
    if (equals >= 0) {
      flags[raw.slice(0, equals)] = raw.slice(equals + 1);
      continue;
    }

    if (raw.startsWith('no-')) {
      flags[raw.slice(3)] = false;
      continue;
    }

    const next = values[index + 1];
    if (next && !next.startsWith('--')) {
      flags[raw] = next;
      index += 1;
    } else {
      flags[raw] = true;
    }
  }

  return { positional, flags };
}

function integerFlag(value, name) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return parsed;
}

function printIssues(issues, prefix = '  - ') {
  for (const issue of issues) {
    console.error(`${prefix}${issue}`);
  }
}

function printHelp() {
  console.log(`Career Ledger\n\nUsage:\n  node scripts/career.mjs <command> [options]\n\nCommands:\n  init                         Create ignored local workspace and config\n  hooks                        Install repository-managed Git hooks\n  doctor                       Check local setup and configured projects\n  scan --project <id>          Create an incremental private Git scan\n  review                       Summarize private review queues\n  validate                     Validate approved public content\n  validate-private             Validate private drafts and initiatives\n  audit [--candidate <slug>]   Audit public, staged, or candidate content\n  approve --candidate <slug>   Interactively promote a reviewed candidate\n  publish                      Generate dist/data/career.json\n  build                        Generate the complete static site\n\nScan options:\n  --since YYYY-MM-DD\n  --max-commits <number>\n  --all-authors\n  --reset\n  --include-uncommitted\n  --no-include-uncommitted\n\nApproval options:\n  --replace                    Replace an existing approved record\n\nBuild environment:\n  SITE_URL=https://username.github.io\n  BASE_PATH=/repository\n`);
}

async function installHooks() {
  const gitDirectory = path.join(PATHS.root, '.git');
  if (!(await pathExists(gitDirectory))) {
    throw new Error('This directory is not a Git repository. Run git init first.');
  }

  const result = runGit(PATHS.root, ['config', 'core.hooksPath', '.githooks'], { allowFailure: true });
  if (!result.ok) {
    throw new Error(result.stderr.trim() || 'Unable to configure Git hooks');
  }

  if (process.platform !== 'win32') {
    const files = await walkFiles(path.join(PATHS.root, '.githooks'));
    await Promise.all(files.map((file) => fs.chmod(file, 0o755)));
  }

  console.log('Git hooks installed from .githooks/.');
}

async function commandInit() {
  const result = await initializeLocalWorkspace();
  console.log(result.createdConfig
    ? 'Created career.local.json from the example configuration.'
    : 'career.local.json already exists; it was not changed.');
  console.log(`Private workspace ready at ${toPosixPath(path.relative(PATHS.root, PATHS.careerPrivate))}/.`);
  console.log('Next: edit career.local.json and the matching private project context file.');
}

function checkNodeVersion() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  return major > 22 || (major === 22 && minor >= 12);
}

async function commandDoctor() {
  const checks = [];
  const add = (level, message) => checks.push({ level, message });

  add(checkNodeVersion() ? 'OK' : 'FAIL', `Node.js ${process.versions.node} (requires 22.12 or newer)`);

  const git = spawnSync('git', ['--version'], { encoding: 'utf8' });
  add(git.status === 0 ? 'OK' : 'FAIL', git.status === 0 ? git.stdout.trim() : 'Git is not available');

  const gitignore = await fs.readFile(path.join(PATHS.root, '.gitignore'), 'utf8');
  for (const required of ['career.local.json', '.career/private/', '.career/state/', '.career/reports/', '.career/tmp/', 'dist/']) {
    add(gitignore.split(/\r?\n/).includes(required) ? 'OK' : 'FAIL', `.gitignore protects ${required}`);
  }

  try {
    const content = await validatePublicContent();
    add(content.issues.length === 0 ? 'OK' : 'FAIL', content.issues.length === 0
      ? 'Approved public content is valid'
      : `Approved public content has ${content.issues.length} validation issue(s)`);
    for (const issue of content.issues) add('DETAIL', issue);
  } catch (error) {
    add('FAIL', `Unable to read public content: ${error.message}`);
  }

  try {
    const findings = await auditPublicFiles({ includeLocalRules: true });
    add(findings.length === 0 ? 'OK' : 'FAIL', findings.length === 0
      ? 'Approved public content passes the privacy audit'
      : `Approved public content has ${findings.length} privacy finding(s)`);
    for (const finding of findings) add('DETAIL', finding);
  } catch (error) {
    add('FAIL', `Unable to audit public content: ${error.message}`);
  }

  if (!(await pathExists(PATHS.localConfig))) {
    add('WARN', 'career.local.json is missing; run npm run career:init before scanning projects');
  } else {
    try {
      const config = await readJson(PATHS.localConfig);
      const issues = validateLocalConfig(config);
      add(issues.length === 0 ? 'OK' : 'FAIL', issues.length === 0
        ? `Local configuration is valid (${config.projects.length} project(s))`
        : `Local configuration has ${issues.length} issue(s)`);
      for (const issue of issues) add('DETAIL', issue);

      if (issues.length === 0) {
        for (const project of config.projects) {
          const findings = await inspectConfiguredProject(project, config);
          if (findings.length === 0) {
            add('OK', `Project ${project.id} is accessible and configured`);
          } else {
            for (const finding of findings) add('WARN', finding);
          }
        }
      }
    } catch (error) {
      add('FAIL', `Unable to inspect local configuration: ${error.message}`);
    }
  }

  const hookResult = runGit(PATHS.root, ['config', '--get', 'core.hooksPath'], { allowFailure: true });
  if (hookResult.ok && hookResult.stdout.trim() === '.githooks') {
    add('OK', 'Repository Git hooks are installed');
  } else if (await pathExists(path.join(PATHS.root, '.git'))) {
    add('WARN', 'Repository Git hooks are not installed; run npm run career:hooks');
  } else {
    add('WARN', 'Git repository is not initialized yet');
  }

  for (const check of checks) {
    if (check.level === 'DETAIL') {
      console.log(`       ${check.message}`);
    } else {
      console.log(`${check.level.padEnd(5)} ${check.message}`);
    }
  }

  if (checks.some((check) => check.level === 'FAIL')) {
    process.exitCode = 1;
  }
}

async function commandScan(flags) {
  const projectId = flags.project;
  if (typeof projectId !== 'string' || !projectId) {
    throw new Error('scan requires --project <id>');
  }

  const options = {
    since: typeof flags.since === 'string' ? flags.since : undefined,
    maxCommits: integerFlag(flags['max-commits'], 'max-commits'),
    allAuthors: flags['all-authors'] === true,
    reset: flags.reset === true
  };
  if ('include-uncommitted' in flags) {
    options.includeUncommitted = flags['include-uncommitted'] === true;
  }

  const result = await scanConfiguredProject(projectId, options);
  console.log(`Private scan created: ${toPosixPath(path.relative(PATHS.root, result.scanFile))}`);
  console.log(`Commits selected: ${result.snapshot.summary.commitCount}`);
  console.log(`Changed files observed: ${result.snapshot.summary.changedFileCount}`);
  console.log(`Uncommitted files observed: ${result.snapshot.summary.uncommittedFileCount}`);
  for (const warning of result.snapshot.warnings) {
    console.log(`Warning: ${warning}`);
  }
  console.log('\nSuggested Codex command:\n');
  console.log(result.codexCommand);
}

async function latestFiles(directory, limit = 8) {
  const files = await walkFiles(directory);
  const values = await Promise.all(files.map(async (file) => ({
    file,
    stat: await fs.stat(file)
  })));
  return values
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs || a.file.localeCompare(b.file))
    .slice(0, limit);
}

async function collectPendingOutcomes() {
  const files = await walkFiles(PATHS.initiatives);
  const pending = [];
  for (const file of files.filter((item) => item.endsWith('.json'))) {
    try {
      const value = await readJson(file);
      const count = (value.potentialOutcomes ?? []).filter((outcome) => outcome.status === 'needs-confirmation').length;
      if (count > 0) {
        pending.push({ file, title: value.title ?? path.basename(file), count });
      }
    } catch {
      pending.push({ file, title: path.basename(file), count: 0, invalid: true });
    }
  }
  return pending;
}

async function commandReview() {
  const sections = [
    ['Scans', PATHS.scans],
    ['Drafts', PATHS.drafts],
    ['Initiatives', PATHS.initiatives],
    ['Public candidates', PATHS.candidates],
    ['Outcome reviews', PATHS.outcomeReviews]
  ];

  for (const [label, directory] of sections) {
    const files = await walkFiles(directory);
    console.log(`${label}: ${files.length}`);
    const latest = await latestFiles(directory, 3);
    for (const item of latest) {
      console.log(`  ${toPosixPath(path.relative(PATHS.root, item.file))}`);
    }
  }

  const pending = await collectPendingOutcomes();
  console.log(`Pending outcome confirmations: ${pending.reduce((sum, item) => sum + item.count, 0)}`);
  for (const item of pending.slice(0, 10)) {
    console.log(`  ${item.title}: ${item.invalid ? 'invalid file' : `${item.count} pending`}`);
  }
}

async function commandValidate() {
  const content = await validatePublicContent();
  throwIfIssues(content.issues, 'Approved public content validation failed');
  console.log(`Public content valid: ${content.entries.length} entry record(s), ${content.projects.length} project record(s).`);
}

async function commandValidatePrivate() {
  const issues = await validatePrivateWorkspace();
  throwIfIssues(issues, 'Private workspace validation failed');
  const drafts = await countFiles(PATHS.drafts, (file) => file.endsWith('.json'));
  const initiatives = await countFiles(PATHS.initiatives, (file) => file.endsWith('.json'));
  console.log(`Private records valid: ${drafts} draft(s), ${initiatives} initiative(s).`);
}

async function findCandidate(slug) {
  const direct = path.join(PATHS.candidates, `${slug}.json`);
  if (await pathExists(direct)) return direct;

  const files = await walkFiles(PATHS.candidates);
  const matches = files.filter((file) => file.endsWith('.json') && path.basename(file, '.json') === slug);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Multiple candidate files use the slug "${slug}".`);
  throw new Error(`Candidate not found: ${slug}`);
}

function validateCandidateRecord(value, file) {
  const source = toPosixPath(path.relative(PATHS.root, file));
  if (value.recordType === 'entry') {
    return validateEntry(value, { mode: 'candidate', source });
  }
  if (value.recordType === 'project') {
    return validateProject(value, { mode: 'candidate', source });
  }
  return [`${source}.recordType: must equal "entry" or "project"`];
}

async function commandAudit(flags) {
  if (typeof flags.candidate === 'string') {
    const file = await findCandidate(flags.candidate);
    const value = await readJson(file);
    throwIfIssues(validateCandidateRecord(value, file), 'Candidate validation failed');
    const findings = await auditCandidateFile(file);
    throwIfIssues(findings, 'Candidate privacy audit failed');
    console.log(`Candidate passes validation and privacy audit: ${toPosixPath(path.relative(PATHS.root, file))}`);
    return;
  }

  const publicFindings = await auditPublicFiles({ includeLocalRules: true });
  const stagedFindings = await auditStagedFiles();
  const findings = [...new Set([...publicFindings, ...stagedFindings])].sort();
  throwIfIssues(findings, 'Privacy audit failed');
  console.log('Public content and staged files pass the privacy audit.');
}

function approvedDestination(value) {
  if (value.recordType === 'entry') {
    return path.join(PATHS.publicEntries, `${value.slug}.json`);
  }
  if (value.recordType === 'project') {
    return path.join(PATHS.publicProjects, `${value.slug}.json`);
  }
  throw new Error(`Unsupported candidate recordType: ${value.recordType}`);
}

function publicSchemaPath(value) {
  return value.recordType === 'entry'
    ? '../../../schemas/public-entry.schema.json'
    : '../../../schemas/public-project.schema.json';
}

function recordTypeDirectory(value) {
  return value.recordType === 'entry' ? 'entries' : 'projects';
}

async function confirmApproval(value) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Approval requires an interactive terminal. Automated publication is intentionally disabled.');
  }

  console.log('\nCandidate proposed for public publication:\n');
  console.log(JSON.stringify(value, null, 2));
  console.log('\nThis operation makes the sanitized record part of the public build.');
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await prompt.question(`Type "${value.slug}" to approve: `);
    return answer.trim() === value.slug;
  } finally {
    prompt.close();
  }
}

async function commandApprove(flags) {
  const slug = flags.candidate;
  if (typeof slug !== 'string' || !slug) {
    throw new Error('approve requires --candidate <slug>');
  }

  const file = await findCandidate(slug);
  const value = await readJson(file);
  throwIfIssues(validateCandidateRecord(value, file), 'Candidate validation failed');
  throwIfIssues(await auditCandidateFile(file), 'Candidate privacy audit failed');

  const destination = approvedDestination(value);
  if (await pathExists(destination) && flags.replace !== true) {
    throw new Error(`Approved record already exists: ${toPosixPath(path.relative(PATHS.root, destination))}. Re-run with --replace only after reviewing the existing record.`);
  }

  if (!(await confirmApproval(value))) {
    throw new Error('Approval cancelled. The candidate remains private.');
  }

  const approved = {
    ...value,
    $schema: publicSchemaPath(value),
    publication: {
      status: 'approved',
      sanitized: true,
      reviewedAt: currentDate(),
      approvedBy: 'owner'
    }
  };

  const approvedIssues = value.recordType === 'entry'
    ? validateEntry(approved, { mode: 'public', source: value.slug })
    : validateProject(approved, { mode: 'public', source: value.slug });
  throwIfIssues(approvedIssues, 'Approved record validation failed');

  const previous = await pathExists(destination) ? await readJson(destination) : null;
  await writeJson(destination, approved);

  try {
    const content = await validatePublicContent();
    throwIfIssues(content.issues, 'Public content validation failed after approval');
    throwIfIssues(await auditPublicFiles({ includeLocalRules: true }), 'Public privacy audit failed after approval');
  } catch (error) {
    if (previous) {
      await writeJson(destination, previous);
    } else {
      await fs.rm(destination, { force: true });
    }
    throw error;
  }

  const archive = path.join(
    PATHS.approvedCandidates,
    recordTypeDirectory(value),
    `${timestampForPath()}-${value.slug}.json`
  );
  await writeJson(archive, value);
  await fs.rm(file);

  console.log(`Approved and published source: ${toPosixPath(path.relative(PATHS.root, destination))}`);
  console.log(`Private candidate archived: ${toPosixPath(path.relative(PATHS.root, archive))}`);
}

async function commandPublish() {
  throwIfIssues(await auditPublicFiles({ includeLocalRules: true }), 'Public privacy audit failed');
  const result = await publishPublicDataset();
  console.log(`Public JSON generated: ${toPosixPath(path.relative(PATHS.root, result.destination))}`);
  console.log(`${result.data.stats.entries} entry record(s), ${result.data.stats.projects} project record(s).`);
}

async function commandBuild() {
  throwIfIssues(await auditPublicFiles({ includeLocalRules: true }), 'Public privacy audit failed');
  const result = await buildSite();
  console.log(`Static site generated in ${toPosixPath(path.relative(PATHS.root, result.distDir))}/.`);
  console.log(`Pages and assets: ${result.files.length}`);
  console.log(`Public URL base: ${result.siteUrl}${result.basePath || ''}/`);
}

async function main() {
  const [rawCommand = 'help', ...rest] = process.argv.slice(2);
  const command = rawCommand === '--help' || rawCommand === '-h' ? 'help' : rawCommand;
  if (!COMMANDS.has(command)) {
    throw new Error(`Unknown command "${command}". Run node scripts/career.mjs help.`);
  }

  const { flags } = parseArgs(rest);
  switch (command) {
    case 'help': printHelp(); break;
    case 'init': await commandInit(); break;
    case 'hooks': await installHooks(); break;
    case 'doctor': await commandDoctor(); break;
    case 'scan': await commandScan(flags); break;
    case 'review': await commandReview(); break;
    case 'validate': await commandValidate(); break;
    case 'validate-private': await commandValidatePrivate(); break;
    case 'audit': await commandAudit(flags); break;
    case 'approve': await commandApprove(flags); break;
    case 'publish': await commandPublish(); break;
    case 'build': await commandBuild(); break;
    default: printHelp();
  }
}

main().catch((error) => {
  console.error(`\n${error.name === 'ValidationError' ? error.message : `Error: ${error.message}`}`);
  if (error instanceof ValidationError && error.issues.length) {
    printIssues(error.issues);
  }
  process.exitCode = 1;
});
