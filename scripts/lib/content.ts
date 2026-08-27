import type { EntryRecord, Entry, Project, Experience, DatasetInput, CareerDataset } from './model.ts';
import { validatePublicContent, throwIfIssues } from './validation.ts';

function withoutSchema<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(withoutSchema) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '$schema')
        .map(([key, child]) => [key, withoutSchema(child)])
    ) as T;
  }
  return value;
}

function entryDate(entry: EntryRecord) {
  return entry.period.end ?? entry.period.start;
}

function normalizeEntry(entry: EntryRecord): Entry {
  return {
    ...entry,
    significance: entry.significance ?? 'activity',
    activityTypes: entry.activityTypes ?? []
  };
}

function sortEntries(entries: Entry[]) {
  return [...entries].sort((a, b) => {
    const dateOrder = entryDate(b).localeCompare(entryDate(a));
    if (dateOrder !== 0) return dateOrder;
    return a.title.localeCompare(b.title);
  });
}

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
    return a.name.localeCompare(b.name);
  });
}

function sortExperiences(experiences: Experience[]) {
  return [...experiences].sort((a, b) => {
    const activeOrder = Number(b.period.end === null) - Number(a.period.end === null);
    if (activeOrder !== 0) return activeOrder;
    const aDate = a.period.end ?? a.period.start;
    const bDate = b.period.end ?? b.period.start;
    const dateOrder = bDate.localeCompare(aDate);
    if (dateOrder !== 0) return dateOrder;
    return a.organization.localeCompare(b.organization);
  });
}

function completedYears(start: string, end: string | null) {
  if (!start || !end) return null;
  const startDate = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);
  let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  const beforeAnniversary = endDate.getUTCMonth() < startDate.getUTCMonth()
    || (endDate.getUTCMonth() === startDate.getUTCMonth() && endDate.getUTCDate() < startDate.getUTCDate());
  if (beforeAnniversary) years -= 1;
  return Math.max(0, years);
}

function maximumDate(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

export function createCareerDataset(content: DatasetInput, options: { preview?: boolean } = {}): CareerDataset {
  const { preview = false } = options;
  const profile = withoutSchema(content.profile);
  const resume = content.resume ? withoutSchema(content.resume) : null;
  const taxonomy = withoutSchema(content.taxonomy);
  const entries = sortEntries(content.entries.map((record) => normalizeEntry(withoutSchema('value' in record ? record.value : record))));
  const projects = sortProjects(content.projects.map((record) => withoutSchema('value' in record ? record.value : record)));
  const entryIds = new Set(entries.map((entry) => entry.id));

  const areas = taxonomy.areas
    .map((area) => {
      const areaEntries = entries.filter((entry) => entry.areas.includes(area.label));
      const areaProjects = projects.filter((project) => project.areas.includes(area.label));
      return {
        ...area,
        entryCount: areaEntries.length,
        projectCount: areaProjects.length,
        count: areaEntries.length + areaProjects.length,
        entryIds: areaEntries.map((entry) => entry.id),
        projectIds: areaProjects.map((project) => project.id)
      };
    })
    .sort((a, b) => a.order - b.order);

  const technologyCounts = new Map<string, number>();
  for (const record of [...entries, ...projects]) {
    for (const technology of record.technologies) {
      technologyCounts.set(technology, (technologyCounts.get(technology) ?? 0) + 1);
    }
  }

  const technologies = [...technologyCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const years = [...new Set(entries.map((entry) => entry.period.start.slice(0, 4)))]
    .sort((a, b) => b.localeCompare(a));

  const kinds = taxonomy.kinds.map((kind) => ({
    ...kind,
    count: entries.filter((entry) => entry.kind === kind.value).length
  }));

  const updatedAt = maximumDate([
    profile.updatedAt,
    resume?.publication.reviewedAt,
    ...entries.map((entry) => entry.publication.reviewedAt),
    ...projects.map((project) => project.publication.reviewedAt)
  ]);

  const normalizedResume = resume ? {
    ...resume,
    experienceYears: completedYears(resume.experienceStart, updatedAt),
    experiences: sortExperiences(resume.experiences)
  } : null;

  const data: CareerDataset = {
    schemaVersion: 1,
    updatedAt: updatedAt ?? profile.updatedAt,
    profile,
    stats: {
      entries: entries.length,
      projects: projects.length,
      activeAreas: areas.filter((area) => area.count > 0).length,
      featuredEntries: entries.filter((entry) => entry.featured).length,
      activeProjects: projects.filter((project) => project.status === 'active').length,
      years: years.length,
      experienceYears: normalizedResume?.experienceYears ?? null,
      experiences: normalizedResume?.experiences.length ?? 0
    },
    taxonomy: {
      areas,
      kinds,
      ...(taxonomy.localizations ? { localizations: taxonomy.localizations } : {})
    },
    technologies,
    resume: normalizedResume,
    entries,
    projects: projects.map((project) => ({
      ...project,
      relatedEntries: project.relatedEntries.filter((entryId) => entryIds.has(entryId))
    }))
  };

  if (preview) {
    data.preview = true;
  }

  return data;
}

export async function createPublicDataset() {
  const content = await validatePublicContent();
  throwIfIssues(content.issues, 'Public content validation failed');
  return createCareerDataset(content);
}
