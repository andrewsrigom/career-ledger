import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { auditObject, auditText, getStagedFiles } from '../scripts/lib/privacy.ts';

test('privacy audit detects common credentials and internal identifiers', () => {
  const token = ['ghp', 'A'.repeat(30)].join('_');
  const ticket = ['PLAT', '204'].join('-');
  const text = `credential ${token} and work item ${ticket}`;
  const findings = auditText(text);

  assert.ok(findings.some((item) => item.includes('GitHub token')));
  assert.ok(findings.some((item) => item.includes('ticket identifier')));
});

test('privacy audit detects blocked public field names', () => {
  const findings = auditObject({
    title: 'Sanitized title',
    clientName: 'Hidden organization'
  });

  assert.ok(findings.some((item) => item.includes('blocked public field name')));
});

test('privacy audit applies owner-defined terms and patterns', () => {
  const findings = auditText('A private codename and restricted marker.', {
    blockedTerms: ['private codename'],
    blockedPatterns: ['restricted\\s+marker']
  });

  assert.equal(findings.length, 2);
});

test('normal public engineering language remains safe', () => {
  const findings = auditText('Designed a static publishing workflow with manual approval and conservative attribution.');
  assert.deepEqual(findings, []);
});

test('bundled hexadecimal lookup tables are not mistaken for private IPv4 addresses', () => {
  const lookup = '00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a';
  assert.deepEqual(auditText(lookup, { source: 'vendor bundle' }), []);
  assert.ok(auditText('service available at 10.11.12.13', { source: 'public copy' }).some((finding) => finding.includes('private IPv4 address')));
});

test('staged-file audit fails closed outside a Git work tree', async (context) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-ledger-no-git-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));

  const result = getStagedFiles({ cwd: directory });

  assert.deepEqual(result.files, []);
  assert.ok(result.error);
  assert.match(result.error, /not a Git work tree/);
});
