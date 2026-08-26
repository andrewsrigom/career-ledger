import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PATHS } from './constants.mjs';
import { currentDate, ensureDir, pathExists, readJson, timestampForPath, writeJson, writeText } from './files.mjs';
import { validateLocalConfig, throwIfIssues } from './validation.mjs';

const GIT_LOG_FORMAT = '%H%x00%aI%x00%an%x00%ae%x00%s%x00%b%x00';

export function runGit(cwd, args, options = {}) {
  const { allowFailure = false, maxBuffer = 50 * 1024 * 1024 } = options;
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer
  });

  if (result.status !== 0 && !allowFailure) {
    const detail = result.stderr.trim() || result.stdout.trim() || `git ${args.join(' ')} failed`;
    throw new Error(detail);
  }

  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status
  };
}

export function resolveConfiguredPath(configuredPath) {
  if (path.isAbsolute(configuredPath)) {
    return path.normalize(configuredPath);
  }
  return path.resolve(PATHS.root, configuredPath);
}

export async function loadLocalConfig() {
  if (!(await pathExists(PATHS.localConfig))) {
    throw new Error('career.local.json is missing. Run npm run career:init first.');
  }
  const config = await readJson(PATHS.localConfig);
  throwIfIssues(validateLocalConfig(config), 'Local configuration validation failed');
  return config;
}

export function getConfiguredProject(config, projectId) {
  const project = config.projects.find((item) => item.id === projectId);
  if (!project) {
    const available = config.projects.map((item) => item.id).join(', ') || 'none';
    throw new Error(`Unknown project "${projectId}". Configured projects: ${available}`);
  }
  return project;
}

export function parseGitLog(output) {
  const fields = output.split('\0');
  while (fields.at(-1) === '') fields.pop();
  const commits = [];
  for (let index = 0; index + 5 < fields.length; index += 6) {
    commits.push({
      hash: fields[index].replace(/^[\r\n]+/, '').trim(),
      date: fields[index + 1].trim(),
      authorName: fields[index + 2].trim(),
      authorEmail: fields[index + 3].trim(),
      subject: fields[index + 4].trim(),
      body: fields[index + 5].trim()
    });
  }
  return commits;
}

function matchesIdentity(commit, identities) {
  if (identities.length === 0) {
    return true;
  }
  const authorName = commit.authorName.trim().toLocaleLowerCase();
  const authorEmail = commit.authorEmail.trim().toLocaleLowerCase();
  return identities.some((identity) => {
    const nameMatch = identity.name && identity.name.trim().toLocaleLowerCase() === authorName;
    const emailMatch = (identity.emails ?? []).some((email) => email.trim().toLocaleLowerCase() === authorEmail);
    return nameMatch || emailMatch;
  });
}

function parseNumstat(output) {
  const files = [];
  for (const line of output.split('\n')) {
    if (!line.trim()) continue;
    const [additionsRaw, deletionsRaw, ...pathParts] = line.split('\t');
    const filePath = pathParts.join('\t');
    if (!filePath) continue;
    const binary = additionsRaw === '-' || deletionsRaw === '-';
    files.push({
      path: filePath,
      additions: binary ? null : Number(additionsRaw),
      deletions: binary ? null : Number(deletionsRaw),
      binary
    });
  }
  return files;
}

function parseStatus(output) {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => ({
      status: line.slice(0, 2),
      path: line.slice(3)
    }));
}

function extensionOf(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return extension || '[no extension]';
}

function summarize(commits, uncommitted) {
  const fileMap = new Map();
  let additions = 0;
  let deletions = 0;
  let binaryFiles = 0;

  for (const commit of commits) {
    for (const file of commit.files) {
      fileMap.set(file.path, (fileMap.get(file.path) ?? 0) + 1);
      if (file.binary) {
        binaryFiles += 1;
      } else {
        additions += file.additions;
        deletions += file.deletions;
      }
    }
  }

  const extensionCounts = new Map();
  for (const filePath of fileMap.keys()) {
    const extension = extensionOf(filePath);
    extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
  }

  return {
    commitCount: commits.length,
    changedFileCount: fileMap.size,
    additions,
    deletions,
    binaryFileChanges: binaryFiles,
    uncommittedFileCount: uncommitted.length,
    mostChangedFiles: [...fileMap.entries()]
      .map(([file, changes]) => ({ file, changes }))
      .sort((a, b) => b.changes - a.changes || a.file.localeCompare(b.file))
      .slice(0, 30),
    extensions: [...extensionCounts.entries()]
      .map(([extension, count]) => ({ extension, count }))
      .sort((a, b) => b.count - a.count || a.extension.localeCompare(b.extension))
  };
}

async function loadState(projectId) {
  const stateFile = path.join(PATHS.state, `${projectId}.json`);
  if (!(await pathExists(stateFile))) return null;
  return readJson(stateFile);
}

function quote(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

export function buildCodexCommand(projectPath, projectId, scanFile) {
  const prompt = `Use $career-analyze-project for ${projectId}. Read the latest scan at ${scanFile}, inspect the configured project directly, and update private drafts only.`;
  return `codex --add-dir ${quote(projectPath)} ${quote(prompt)}`;
}

export async function scanConfiguredProject(projectId, options = {}) {
  const config = await loadLocalConfig();
  const project = getConfiguredProject(config, projectId);
  const projectPath = resolveConfiguredPath(project.path);

  if (!(await pathExists(projectPath))) {
    throw new Error(`Configured project path does not exist: ${projectPath}`);
  }

  const repositoryCheck = runGit(projectPath, ['rev-parse', '--is-inside-work-tree'], { allowFailure: true });
  if (!repositoryCheck.ok || repositoryCheck.stdout.trim() !== 'true') {
    throw new Error(`Configured project is not a Git work tree: ${projectPath}`);
  }

  const repositoryRoot = runGit(projectPath, ['rev-parse', '--show-toplevel']).stdout.trim();
  const headResult = runGit(repositoryRoot, ['rev-parse', 'HEAD'], { allowFailure: true });
  if (!headResult.ok) {
    throw new Error(`Repository has no commits yet: ${repositoryRoot}`);
  }

  const head = headResult.stdout.trim();
  const branchResult = runGit(repositoryRoot, ['symbolic-ref', '--short', 'HEAD'], { allowFailure: true });
  const branch = branchResult.ok ? branchResult.stdout.trim() : 'detached';
  const state = options.reset ? null : await loadState(project.id);
  const warnings = [];
  let range = null;
  let strategy = 'since-date';

  if (state?.lastHead) {
    const ancestor = runGit(repositoryRoot, ['merge-base', '--is-ancestor', state.lastHead, head], { allowFailure: true });
    if (ancestor.ok) {
      range = `${state.lastHead}..${head}`;
      strategy = 'incremental';
    } else {
      warnings.push('Previous scan head is not an ancestor of the current head. Falling back to the configured date.');
    }
  }

  const maxCommits = Number(options.maxCommits ?? project.scan.maxCommits);
  const since = options.since ?? project.scan.since;
  const countArgs = range
    ? ['rev-list', '--count', range]
    : ['rev-list', '--count', `--since=${since}`, head];
  const availableCommitCount = Number(runGit(repositoryRoot, countArgs).stdout.trim() || 0);
  if (availableCommitCount > maxCommits) {
    throw new Error(`Scan window contains ${availableCommitCount} commits, exceeding the configured limit of ${maxCommits}. Increase --max-commits so the scan can complete without skipping history.`);
  }

  const logArgs = ['log', `--max-count=${maxCommits}`, `--format=${GIT_LOG_FORMAT}`];
  if (range) {
    logArgs.push(range);
  } else {
    logArgs.push(`--since=${since}`, head);
  }

  const rawCommits = parseGitLog(runGit(repositoryRoot, logArgs).stdout);
  let identities = config.owner.gitIdentities ?? [];
  if (identities.length === 0) {
    const name = runGit(repositoryRoot, ['config', 'user.name'], { allowFailure: true }).stdout.trim();
    const email = runGit(repositoryRoot, ['config', 'user.email'], { allowFailure: true }).stdout.trim();
    if (name || email) {
      identities = [{ name, emails: email ? [email] : [] }];
      warnings.push('No Git identity was configured. Repository Git user settings were used for this scan.');
    } else {
      warnings.push('No Git identity was configured. All commit authors were included.');
    }
  }

  const selectedCommits = options.allAuthors ? rawCommits : rawCommits.filter((commit) => matchesIdentity(commit, identities));
  const identityMismatch = !options.allAuthors && rawCommits.length > 0 && selectedCommits.length === 0;
  if (identityMismatch) {
    warnings.push('Commits were found, but none matched the configured Git identities. Scan state was not advanced; fix the identities and rerun.');
  }

  const commits = [];
  for (const commit of selectedCommits) {
    const files = parseNumstat(runGit(repositoryRoot, ['diff-tree', '--root', '--no-commit-id', '--numstat', '-r', '--find-renames', commit.hash]).stdout);
    commits.push({ ...commit, files });
  }

  const includeUncommitted = options.includeUncommitted ?? project.scan.includeUncommitted;
  const uncommitted = includeUncommitted
    ? parseStatus(runGit(repositoryRoot, ['status', '--porcelain=v1', '--untracked-files=normal']).stdout)
    : [];

  const createdAt = new Date().toISOString();
  const scanId = `${project.id}-${timestampForPath(new Date(createdAt))}`;
  const scanDirectory = path.join(PATHS.scans, project.id, scanId);
  const scanFile = path.join(scanDirectory, 'scan.json');
  const contextFile = resolveConfiguredPath(project.contextFile);

  if (!(await pathExists(contextFile))) {
    warnings.push(`Project context file is missing: ${contextFile}`);
  }

  const snapshot = {
    schemaVersion: 1,
    scanId,
    project: {
      id: project.id,
      label: project.label,
      kind: project.kind,
      visibility: project.visibility,
      contextFile
    },
    repository: {
      path: repositoryRoot,
      branch,
      head
    },
    window: {
      strategy,
      previousHead: state?.lastHead ?? null,
      range,
      since: range ? null : since,
      maxCommits,
      availableCommitCount
    },
    authorFilter: options.allAuthors ? { mode: 'all-authors', identities: [] } : { mode: 'configured-identities', identities },
    commits,
    uncommitted,
    summary: summarize(commits, uncommitted),
    warnings,
    createdAt
  };

  await ensureDir(scanDirectory);
  await writeJson(scanFile, snapshot);

  const codexCommand = buildCodexCommand(repositoryRoot, project.id, scanFile);
  const request = `# Project analysis request\n\n- Project: ${project.label} (${project.id})\n- Repository: ${repositoryRoot}\n- Scan: ${scanFile}\n- Context: ${contextFile}\n- Created: ${createdAt}\n\n## Instructions\n\nUse \`$career-analyze-project\`. Read the latest scan, project context, existing private drafts, and existing private initiatives. Inspect the repository directly. Create or update private drafts only. Do not write public portfolio copy and do not modify \`content/public/\`.\n\n## Suggested command\n\n\`\`\`bash\n${codexCommand}\n\`\`\`\n`;
  await writeText(path.join(scanDirectory, 'analysis-request.md'), request);

  if (!identityMismatch) {
    await writeJson(path.join(PATHS.state, `${project.id}.json`), {
      schemaVersion: 1,
      projectId: project.id,
      lastHead: head,
      lastScanId: scanId,
      lastScanAt: createdAt,
      lastScanFile: scanFile
    });
  }

  return { snapshot, scanDirectory, scanFile, codexCommand, stateAdvanced: !identityMismatch };
}

export async function inspectConfiguredProject(project, config) {
  const findings = [];
  const projectPath = resolveConfiguredPath(project.path);
  const contextFile = resolveConfiguredPath(project.contextFile);

  if (!(await pathExists(projectPath))) {
    findings.push(`Project ${project.id}: path does not exist (${projectPath})`);
    return findings;
  }

  const gitCheck = runGit(projectPath, ['rev-parse', '--is-inside-work-tree'], { allowFailure: true });
  if (!gitCheck.ok || gitCheck.stdout.trim() !== 'true') {
    findings.push(`Project ${project.id}: path is not a Git work tree`);
  }

  if (!(await pathExists(contextFile))) {
    findings.push(`Project ${project.id}: context file is missing (${contextFile})`);
  }

  const placeholderIdentity = (config.owner.gitIdentities ?? []).some((identity) =>
    (identity.emails ?? []).some((email) => email.includes('your-email@example.com'))
  );
  if (placeholderIdentity) {
    findings.push('Owner Git identity still contains the example email.');
  }

  return findings;
}

export async function initializeLocalWorkspace() {
  const directories = [
    PATHS.scans,
    PATHS.drafts,
    PATHS.initiatives,
    PATHS.candidates,
    PATHS.approvedCandidates,
    PATHS.outcomeReviews,
    PATHS.contexts,
    PATHS.state,
    PATHS.reports,
    PATHS.tmp
  ];
  await Promise.all(directories.map(ensureDir));

  let createdConfig = false;
  if (!(await pathExists(PATHS.localConfig))) {
    await fs.copyFile(PATHS.localConfigExample, PATHS.localConfig);
    createdConfig = true;
  }

  const privateAgent = path.join(PATHS.careerPrivate, 'AGENTS.md');
  if (!(await pathExists(privateAgent))) {
    await fs.copyFile(path.join(PATHS.root, 'templates', 'private-AGENTS.md'), privateAgent);
  }

  const exampleContext = path.join(PATHS.contexts, 'example-local-project.md');
  if (!(await pathExists(exampleContext))) {
    await fs.copyFile(path.join(PATHS.root, 'templates', 'project-context.md'), exampleContext);
  }

  return { createdConfig, privateAgent, exampleContext, date: currentDate() };
}
