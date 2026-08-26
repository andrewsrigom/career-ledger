import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildCodexCommand, parseGitLog, runGit } from '../scripts/lib/git.mjs';

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


test('Git log parser handles separators between multiple commits', () => {
  const first = 'a'.repeat(40);
  const second = 'b'.repeat(40);
  const output = [
    first, '2026-08-26T10:00:00Z', 'Andrews', 'engineer@example.test', 'First change', '',
    `\n${second}`, '2026-08-25T10:00:00Z', 'Andrews', 'engineer@example.test', 'Second change', 'Details'
  ].join('\0') + '\0';

  const commits = parseGitLog(output);
  assert.equal(commits.length, 2);
  assert.equal(commits[0].hash, first);
  assert.equal(commits[1].hash, second);
  assert.equal(commits[1].body, 'Details');
});
