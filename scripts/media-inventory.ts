#!/usr/bin/env node

import { parseLocalConfig } from './lib/validation.ts';
interface ImageReference { relative: string; bytes: number; score: number; }

import fs from 'node:fs/promises';
import path from 'node:path';
import { PATHS } from './lib/constants.ts';
import { readJson, toPosixPath, writeJson, writeText } from './lib/files.ts';

const IMAGE_EXTENSIONS = new Set(['.avif', '.webp', '.png', '.jpg', '.jpeg']);
const SKIP_DIRECTORIES = new Set(['.git', '.next', '.astro', '.cache', '.career', 'node_modules', 'dist', 'build', 'coverage', 'playwright-report', 'test-results', 'vendor', 'licensed-sources']);
const outputDirectory = path.join(PATHS.careerPrivate, 'media-review');

function scoreAsset(relative: string) {
  let score = 0;
  if (/screenshot|showcase|preview|hero|dashboard|cover|og-image/i.test(relative)) score += 8;
  if (/public\/|docs\/|assets\//i.test(relative)) score += 3;
  if (/test|fixture|snapshot|audit|baseline/i.test(relative)) score -= 4;
  if (/logo|icon|avatar|flag/i.test(relative)) score -= 6;
  return score;
}

async function collectImages(root: string, directory = root, results: ImageReference[] = []): Promise<ImageReference[]> {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries.sort((first, second) => first.name.localeCompare(second.name))) {
    if (entry.isSymbolicLink()) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRECTORIES.has(entry.name) && !entry.name.includes('.local-')) await collectImages(root, absolute, results);
      continue;
    }
    if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    const relative = toPosixPath(path.relative(root, absolute));
    const stat = await fs.stat(absolute);
    results.push({ relative, bytes: stat.size, score: scoreAsset(relative) });
  }
  return results;
}

const configuration = parseLocalConfig(await readJson(PATHS.localConfig));
const projects = [];

for (const project of configuration.projects) {
  if (project.id === 'licensed-sources' || project.id.includes('-local-')) {
    projects.push({ projectId: project.id, sourceRoot: project.path, status: 'excluded', reason: 'Licensed or generated source; not a publication asset source.', imageCount: 0, candidates: [] });
    continue;
  }
  const images = await collectImages(project.path);
  images.sort((first, second) => second.score - first.score || first.relative.localeCompare(second.relative));
  projects.push({
    projectId: project.id,
    sourceRoot: project.path,
    status: 'needs-owner-review',
    imageCount: images.length,
    candidates: images.slice(0, 12).map(({ relative, bytes }) => ({
      source: relative,
      bytes,
      review: 'unreviewed',
      publication: 'not-approved',
      reviewRequired: ['confidential data', 'license', 'product identity', 'visual relevance']
    }))
  });
}

const inventory = {
  schemaVersion: 1,
  purpose: 'Private source references only. No image has been copied or approved for publication.',
  approvalRule: 'Owner must explicitly approve and export an image before it can be referenced by public presentation metadata.',
  projects
};

await writeJson(path.join(outputDirectory, 'inventory.json'), inventory);
const lines = [
  '# Private project-media review',
  '',
  'No asset below is approved or copied into the public site. The live preview currently uses abstract diagrams.',
  '',
  'Review confidentiality, licensing, product identity, and relevance before exporting an approved WebP/AVIF image to `public/assets/projects/`. Keep previews near 250 KB and provide dimensions plus EN/PT-BR alternative text.',
  '',
  ...projects.flatMap((project) => [
    `## ${project.projectId}`,
    '',
    `${project.imageCount} image file(s). Status: ${project.status}.`,
    '',
    ...project.candidates.map((candidate) => `- [ ] \`${candidate.source}\` (${Math.round(candidate.bytes / 1024)} KB) — not approved`),
    ''
  ])
];
await writeText(path.join(outputDirectory, 'review.md'), `${lines.join('\n')}\n`);
console.log(`Private media inventory written for ${projects.length} configured roots. No assets copied.`);
