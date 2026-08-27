import type { FileRecord, EntryRecord, ProjectRecord, ResumeRecord, PublicRecord, PublicContent } from './model.ts';
import type { BuildOptions } from './build.ts';
import { parseCandidate, isObject } from './validation.ts';

import path from 'node:path';
import { buildSite } from './build.ts';
import { createCareerDataset } from './content.ts';
import { PATHS } from './constants.ts';
import { calculateActivityDomainMix } from './domains.ts';
import { listJsonFiles, readJson, toPosixPath, walkFiles } from './files.ts';
import { auditCandidateFile, auditPublicFiles } from './privacy.ts';
import {
  throwIfIssues,
  validateEntry,
  validateProject,
  validateResume,
  validatePublicContent
} from './validation.ts';

function sourceName(file: string) {
  return path.basename(file);
}

function validateCandidate(value: unknown, file: string) {
  const source = sourceName(file);
  if (isObject(value) && value.recordType === 'entry') {
    return validateEntry(value, { mode: 'candidate', source });
  }
  if (isObject(value) && value.recordType === 'project') {
    return validateProject(value, { mode: 'candidate', source });
  }
  if (isObject(value) && value.recordType === 'resume') {
    return validateResume(value, { mode: 'candidate', source });
  }
  return [`${source}.recordType: must equal "entry", "project", or "resume"`];
}

function overlayRecords<T extends EntryRecord | ProjectRecord>(approved: FileRecord<T>[], candidates: FileRecord<T>[]) {
  const records = new Map(approved.map(({ value }) => [value.id, value]));
  const seenCandidateIds = new Set<string>();
  const seenCandidateSlugs = new Set<string>();
  const issues = [];

  for (const { file, value } of candidates) {
    const source = sourceName(file);
    if (seenCandidateIds.has(value.id)) issues.push(`${source}.id: duplicates another candidate ID`);
    if (seenCandidateSlugs.has(value.slug)) issues.push(`${source}.slug: duplicates another candidate slug`);
    seenCandidateIds.add(value.id);
    seenCandidateSlugs.add(value.slug);
    records.set(value.id, value);
  }

  return { records: [...records.values()], issues };
}

function overlayResume(approved: ResumeRecord | null, candidates: FileRecord<PublicRecord>[]) {
  const matches = candidates.filter((record): record is FileRecord<ResumeRecord> => record.value.recordType === 'resume');
  if (matches.length > 1) {
    return { value: approved, issues: ['resume candidates: only one resume candidate is allowed'] };
  }
  return { value: matches[0]?.value ?? approved, issues: [] };
}

function validateRelationships(content: Omit<PublicContent, 'entries' | 'projects'> & { entries: EntryRecord[]; projects: ProjectRecord[] }, candidates: FileRecord<PublicRecord>[]) {
  const issues = [];
  const areaLabels = new Set(content.taxonomy.areas.map((area) => area.label));
  const kindValues = new Set(content.taxonomy.kinds.map((kind) => kind.value));
  const entryIds = new Set(content.entries.map((entry) => entry.id));
  const projectIds = new Set(content.projects.map((project) => project.id));

  for (const { file, value } of candidates) {
    const source = sourceName(file);
    for (const area of 'areas' in value ? value.areas : []) {
      if (!areaLabels.has(area)) issues.push(`${source}.areas: unknown taxonomy area "${area}"`);
    }
    if (value.recordType === 'entry' && !kindValues.has(value.kind)) {
      issues.push(`${source}.kind: is missing from taxonomy.kinds`);
    }
    if (value.recordType === 'project') {
      for (const related of value.relatedEntries ?? []) {
        if (!entryIds.has(related)) issues.push(`${source}.relatedEntries: references unknown entry "${related}"`);
      }
    }
    if (value.recordType === 'resume') {
      for (const [experienceIndex, experience] of value.experiences.entries()) {
        for (const related of experience.relatedProjects ?? []) {
          if (!projectIds.has(related)) {
            issues.push(`${source}.experiences[${experienceIndex}].relatedProjects: references unknown project "${related}"`);
          }
        }
      }
    }
  }

  return issues;
}

export async function buildCandidatePreview(options: Omit<BuildOptions, 'data'> & { candidatesDir?: string; activitiesDir?: string } = {}) {
  const candidatesDir = options.candidatesDir ?? PATHS.candidates;
  const activitiesDir = options.activitiesDir ?? PATHS.activities;
  const distDir = options.distDir ?? PATHS.publicationPreview;
  const files = await listJsonFiles(candidatesDir);
  if (files.length === 0) {
    throw new Error('No private public candidates are available for preview.');
  }

  const publicContent = await validatePublicContent();
  throwIfIssues(publicContent.issues, 'Approved public content validation failed');
  throwIfIssues(await auditPublicFiles({ includeLocalRules: true }), 'Approved public privacy audit failed');

  const rawCandidates = await Promise.all(files.map(async (file) => ({ file, value: await readJson(file) })));
  const candidateIssues = rawCandidates.flatMap(({ file, value }) => validateCandidate(value, file));
  throwIfIssues(candidateIssues, 'Candidate validation failed');
  const candidates = rawCandidates.map(({ file, value }) => ({ file, value: parseCandidate(value, sourceName(file)) }));

  const privacyFindings = (await Promise.all(files.map((file) => auditCandidateFile(file)))).flat();
  throwIfIssues([...new Set(privacyFindings)].sort(), 'Candidate privacy audit failed');

  const entryOverlay = overlayRecords(publicContent.entries, candidates.filter((record): record is FileRecord<EntryRecord> => record.value.recordType === 'entry'));
  const projectOverlay = overlayRecords(publicContent.projects, candidates.filter((record): record is FileRecord<ProjectRecord> => record.value.recordType === 'project'));
  const resumeOverlay = overlayResume(publicContent.resume, candidates);
  throwIfIssues([...entryOverlay.issues, ...projectOverlay.issues, ...resumeOverlay.issues], 'Candidate overlay validation failed');

  const merged = {
    profile: publicContent.profile,
    resume: resumeOverlay.value,
    taxonomy: publicContent.taxonomy,
    entries: entryOverlay.records,
    projects: projectOverlay.records
  };
  throwIfIssues(validateRelationships(merged, candidates), 'Candidate relationship validation failed');

  const data = createCareerDataset(merged, { preview: true });
  const activityFiles = (await walkFiles(activitiesDir)).filter((file) => path.extname(file) === '.json');
  if (activityFiles.length > 0) {
    const activities = await Promise.all(activityFiles.map((file) => readJson(file)));
    const mix = calculateActivityDomainMix(activities);
    if (mix.activityCount > 0) {
      data.activityMix = {
        basis: 'recorded-activities',
        activityCount: mix.activityCount,
        items: mix.items
      };
    }
  }
  const result = await buildSite({
    distDir,
    data,
    siteUrl: options.siteUrl ?? 'http://127.0.0.1:4173',
    basePath: options.basePath ?? '',
    includeLocalRules: true
  });

  return {
    ...result,
    candidateCount: candidates.length,
    candidateFiles: files.map((file) => toPosixPath(path.relative(PATHS.root, file)))
  };
}
