import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { ResumeRecord } from '../scripts/lib/model.ts';
import { validateResume } from '../scripts/lib/validation.ts';
import { createPublicDataset } from '../scripts/lib/content.ts';
import { localizeCareerDataset } from '../scripts/lib/i18n.ts';
import { stagePublicAssets } from '../scripts/lib/frontend-guards.ts';
import { recommendationFixture, PORTRAIT_WEBP } from './helpers.ts';
import { contactLinks, emailHref, formatPhone, hasContact } from '../scripts/lib/contact.ts';

function resumeFixture(): ResumeRecord {
  return {
    schemaVersion: 1, recordType: 'resume', id: 'resume', slug: 'resume', experienceStart: '2020-01-01',
    summary: 'Software engineer building interfaces, services and tools with thoughtful colleagues.',
    highlights: [], skills: ['TypeScript', 'Node.js', 'Testing'], education: [],
    experiences: [{ id: 'example-role', organization: 'Example Organization', role: 'Software Engineer', engagement: 'full-time', location: 'Remote', domain: 'Software products',
      period: { start: '2020-01-01', end: null, label: '2020–present' },
      summary: 'Built software products with colleagues across design and engineering.',
      contributions: ['Implemented product features and automated tests.'], outcomes: [], technologies: [], relatedProjects: [] }],
    recommendations: [recommendationFixture()],
    publication: { status: 'approved', sanitized: true, reviewedAt: '2026-08-27', approvedBy: 'owner' },
    localizations: { 'pt-BR': {
      summary: 'Engenheiro de software que desenvolve interfaces, serviços e ferramentas com sua equipe.',
      highlights: [], skills: ['TypeScript', 'Node.js', 'Testes'], education: [],
      experiences: [{ id: 'example-role', role: 'Engenheiro de Software', location: 'Remoto', domain: 'Produtos de software', periodLabel: '2020–presente',
        summary: 'Desenvolveu produtos com colegas das áreas de design e engenharia.', contributions: ['Implementou funcionalidades e testes automatizados.'], outcomes: [] }],
      recommendations: [{ id: 'example-colleague', relationship: 'Trabalhou comigo na mesma equipe', quote: 'Um colega atencioso que compartilhou conhecimento e ajudou a equipe a resolver problemas difíceis.' }]
    } }
  };
}

test('contact fields accept reviewed channels without requiring unprovided data', async () => {
  const resume = resumeFixture();
  const contact = { email: 'owner+work@example.com', phone: '+5521987654321', whatsapp: true,
    links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/example-owner/' }] };
  assert.deepEqual(validateResume({ ...resume, contact }), []);
  assert.deepEqual(validateResume({ ...resume, contact: { links: contact.links } }), []);
  assert.deepEqual(validateResume({ ...resume, contact: { links: [] } }), []);
  for (const invalid of [null, {}, { ...contact, phone: '021987654321' }, { ...contact, phone: '+123' },
    { ...contact, phone: '+5521987654321\n' }, { ...contact, email: 'owner@example.com\n' },
    { ...contact, email: 'owner@example.com?bcc=other@example.com' }, { ...contact, email: 'not-an-email' },
    { ...contact, whatsapp: 'yes' }, { links: [], whatsapp: true }, { ...contact, internalUrl: 'https://example.com/' },
    ...['javascript:alert(1)', 'https://user:pass@example.com/', 'https://example.com/?token=value', 'https://example.com/\n'].map(href => ({ ...contact, links: [{ label: 'Profile', href }] })),
    { ...contact, links: [...contact.links, ...contact.links] }]) {
    assert.ok(validateResume({ ...resume, contact: invalid }).some(issue => issue.includes('contact')));
  }
  const data = { ...await createPublicDataset(), resume: { ...resume, contact, experienceYears: 6 } };
  assert.deepEqual(localizeCareerDataset(data, 'pt-BR').resume!.contact, contact);
  assert.equal(hasContact(undefined), false);
  assert.equal(hasContact({ links: [] }), false);
  assert.equal(hasContact(contact), true);
  assert.equal(hasContact(undefined, contact.links), true);
  assert.deepEqual(contactLinks(undefined, contact.links), contact.links);
  assert.equal(formatPhone(contact.phone), '+55 (21) 98765-4321');
  assert.equal(formatPhone('+442079460000'), '+442079460000');
  assert.equal(emailHref(contact.email), 'mailto:owner%2Bwork@example.com');
  assert.equal(emailHref('owner#work@example.com'), 'mailto:owner%23work@example.com');
});

test('recommendations validate optional records, explicit portrait approval and bounded quotes', () => {
  const resume = resumeFixture();
  assert.deepEqual(validateResume(resume), []);
  const { recommendations: _recommendations, localizations: _localizations, ...without } = resume;
  assert.deepEqual(validateResume(without), []);
  const item = recommendationFixture();
  for (const recommendations of [null, {}, [null], Array(13).fill(item), [item, item],
    [{ ...item, date: '2023-09-19' }], [{ ...item, name: '' }], [{ ...item, id: '../person' }],
    [{ ...item, quote: 'Too short' }], [{ ...item, quote: 'a'.repeat(701) }],
    ...['javascript:alert(1)', 'http://linkedin.com/in/person/', 'https://linkedin.com.evil.invalid/in/person/', 'https://user:pass@linkedin.com/in/person/', 'https://www.linkedin.com/in/person/?token=value'].map(profileUrl => [{ ...item, profileUrl }])]) {
    assert.ok(validateResume({ ...resume, recommendations }).some(issue => issue.includes('recommendations')));
  }
  const portrait = { src: 'assets/portraits/colleague.webp', width: 100, height: 100, approval: { approvedBy: 'owner', reviewedAt: '2026-08-27' } };
  assert.deepEqual(validateResume({ ...resume, recommendations: [{ ...item, portrait }] }), []);
  for (const invalid of [null, { ...portrait, approval: undefined }, { ...portrait, approval: { ...portrait.approval, reviewedAt: '2026-02-30' } },
    { ...portrait, width: 20 }, { ...portrait, height: 101 }, { ...portrait, src: 'assets/review/colleague.webp' }, { ...portrait, src: 'https://example.com/face.webp' }]) {
    assert.ok(validateResume({ ...resume, recommendations: [{ ...item, portrait: invalid }] }).some(issue => issue.includes('portrait')));
  }
});

test('recommendation translations must match canonical IDs and preserve attribution', async () => {
  const resume = resumeFixture();
  const translation = resume.localizations!['pt-BR']!;
  const translated = translation.recommendations![0]!;
  for (const recommendations of [[], [translated, translated], [{ ...translated, id: 'another-person' }], [{ ...translated, name: 'New author' }]]) {
    assert.ok(validateResume({ ...resume, localizations: { 'pt-BR': { ...translation, recommendations } } }).some(issue => issue.includes('recommendations')));
  }
  const data = { ...await createPublicDataset(), resume: { ...resume, experienceYears: 6 } };
  const english = localizeCareerDataset(data, 'en').resume!.recommendations![0]!;
  const portuguese = localizeCareerDataset(data, 'pt-BR').resume!.recommendations![0]!;
  assert.equal(english.translated, undefined);
  assert.equal(portuguese.translated, true);
  assert.equal(portuguese.quote, translated.quote);
  for (const key of ['name', 'id', 'profileUrl', 'sourceUrl'] as const) assert.equal(english[key], portuguese[key]);
  delete translation.recommendations;
  assert.deepEqual(validateResume(resume), []);
  assert.equal(localizeCareerDataset(data, 'pt-BR').resume!.recommendations![0]!.translated, undefined);
  assert.equal(localizeCareerDataset(data, 'pt-BR').resume!.recommendations![0]!.quote, english.quote);
});

test('public portrait staging copies only approved references and checks exact pixels', async context => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'career-portraits-'));
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  const source = path.join(directory, 'source');
  await fs.mkdir(path.join(source, 'assets', 'portraits'), { recursive: true });
  await fs.writeFile(path.join(source, 'assets', 'favicon.svg'), '<svg/>');
  const file = path.join(source, 'assets', 'portraits', 'colleague.webp');
  await fs.writeFile(file, PORTRAIT_WEBP);
  const destination = path.join(directory, 'output');
  await stagePublicAssets([], source, destination);
  await assert.rejects(fs.access(path.join(destination, 'assets', 'portraits')));
  const portrait = { src: 'assets/portraits/colleague.webp', width: 100, height: 100, approval: { approvedBy: 'owner', reviewedAt: '2026-08-27' } };
  for (const invalid of [{ ...portrait, approval: null }, { ...portrait, src: '../colleague.webp' }, { ...portrait, width: 101, height: 101 }, { ...portrait, approval: { ...portrait.approval, reviewedAt: '2026-02-30' } }]) {
    await assert.rejects(stagePublicAssets([], source, destination, [{ ...recommendationFixture(), portrait: invalid }]));
  }
  await stagePublicAssets([], source, destination, [{ ...recommendationFixture(), portrait }]);
  assert.deepEqual(await fs.readFile(path.join(destination, 'assets', 'portraits', 'colleague.webp')), PORTRAIT_WEBP);
  await fs.rename(file, path.join(source, 'original.webp'));
  await fs.symlink(path.join(source, 'original.webp'), file);
  await assert.rejects(stagePublicAssets([], source, destination, [{ ...recommendationFixture(), portrait }]), /symbolic links/);
});
