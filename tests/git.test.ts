import { first as firstItem } from './helpers.ts';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildCodexCommand, buildScanRevisionArgs, parseGitLog, resolveScanHead, runGit } from '../scripts/lib/git.ts';

test('Git helper executes commands in a local repository', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-git-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  runGit(directory, ['init']);
  runGit(directory, ['config', 'user.name', 'Test Engineer']);
  runGit(directory, ['config', 'user.email', 'engineer@example.test']);
  await fs.writeFile(path.join(directory, 'README.md'), '# Local project\n');
  runGit(directory, ['add', 'README.md']);
  runGit(directory, ['commit', '-m', 'Initialize local project']);

  assert.equal(runGit(directory, ['rev-list', '--count', 'HEAD']).stdout.trim(), '1');
  assert.equal(runGit(directory, ['status', '--porcelain']).stdout.trim(), '');
});

test('Codex command grants access only to the configured project directory', () => {
  const command = buildCodexCommand('/workspace/private-project', 'private-project', '/workspace/ledger/scan.json');
  assert.match(command, /^codex --add-dir /);
  assert.match(command, /career-analyze-project/);
  assert.match(command, /private drafts only/);
});

test('Scan head falls back to a reachable remote branch when HEAD is unborn', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-unborn-head-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  runGit(directory, ['init']);
  runGit(directory, ['config', 'user.name', 'Test Engineer']);
  runGit(directory, ['config', 'user.email', 'engineer@example.test']);
  await fs.writeFile(path.join(directory, 'README.md'), '# Preserved history\n');
  runGit(directory, ['add', 'README.md']);
  runGit(directory, ['commit', '-m', 'Preserve reachable history']);

  const commit = runGit(directory, ['rev-parse', 'HEAD']).stdout.trim();
  runGit(directory, ['update-ref', 'refs/remotes/origin/main', commit]);
  runGit(directory, ['symbolic-ref', 'HEAD', 'refs/heads/unborn']);

  assert.deepEqual(resolveScanHead(directory), {
    head: commit,
    reference: 'refs/remotes/origin/main',
    fallback: true
  });
});

test('Scan head reports no history when the repository has no reachable commits', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-empty-head-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  runGit(directory, ['init']);

  assert.equal(resolveScanHead(directory), null);
});

test('All-reference scans include branches, remotes, and tags without including stashes', () => {
  assert.deepEqual(buildScanRevisionArgs({
    allRefs: true,
    head: 'a'.repeat(40),
    range: null,
    since: '2025-11-01'
  }), [
    '--since=2025-11-01',
    '--branches',
    '--remotes',
    '--tags'
  ]);
});

test('Selected-head scans retain incremental ranges and normal head windows', () => {
  assert.deepEqual(buildScanRevisionArgs({
    allRefs: false,
    head: 'a'.repeat(40),
    range: null,
    since: '2025-11-01'
  }), ['--since=2025-11-01', 'a'.repeat(40)]);

  assert.deepEqual(buildScanRevisionArgs({
    allRefs: false,
    head: 'b'.repeat(40),
    range: `${'a'.repeat(40)}..${'b'.repeat(40)}`,
    since: '2025-11-01'
  }), [`${'a'.repeat(40)}..${'b'.repeat(40)}`]);
});


test('Git log parser handles separators between multiple commits', () => {
  const first = 'a'.repeat(40);
  const second = 'b'.repeat(40);
  const output = [
    first, '2026-08-26T10:00:00Z', 'Andrews', 'engineer@example.test', 'First change', '',
    `\n${second}`, '2026-08-25T10:00:00Z', 'Andrews', 'engineer@example.test', 'Second change', 'Details'
  ].join('\0') + '\0';

  const commits = parseGitLog(output);
  assert.equal(commits.length, 2);
  assert.equal(firstItem(commits).hash, first);
  assert.equal(firstItem(commits.slice(1)).hash, second);
  assert.equal(firstItem(commits.slice(1)).body, 'Details');
});
