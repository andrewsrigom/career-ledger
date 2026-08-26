import { validatePublicContent, throwIfIssues } from './validation.mjs';

function withoutSchema(value) {
  if (Array.isArray(value)) {
    return value.map(withoutSchema);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== '$schema')
        .map(([key, child]) => [key, withoutSchema(child)])
    );
  }
  return value;
}

function entryDate(entry) {
  return entry.period.end ?? entry.period.start;
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const dateOrder = entryDate(b).localeCompare(entryDate(a));
    if (dateOrder !== 0) return dateOrder;
    return a.title.localeCompare(b.title);
  });
}

function sortProjects(projects) {
  return [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
    return a.name.localeCompare(b.name);
  });
}

function maximumDate(values) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

export async function createPublicDataset() {
  const content = await validatePublicContent();
  throwIfIssues(content.issues, 'Public content validation failed');

  const profile = withoutSchema(content.profile);
  const taxonomy = withoutSchema(content.taxonomy);
  const entries = sortEntries(content.entries.map(({ value }) => withoutSchema(value)));
  const projects = sortProjects(content.projects.map(({ value }) => withoutSchema(value)));
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

  const technologyCounts = new Map();
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
    ...entries.map((entry) => entry.publication.reviewedAt),
    ...projects.map((project) => project.publication.reviewedAt)
  ]);

  return {
    schemaVersion: 1,
    updatedAt,
    profile,
    stats: {
      entries: entries.length,
      projects: projects.length,
      activeAreas: areas.filter((area) => area.count > 0).length,
      featuredEntries: entries.filter((entry) => entry.featured).length,
      activeProjects: projects.filter((project) => project.status === 'active').length,
      years: years.length
    },
    taxonomy: {
      areas,
      kinds
    },
    technologies,
    entries,
    projects: projects.map((project) => ({
      ...project,
      relatedEntries: project.relatedEntries.filter((entryId) => entryIds.has(entryId))
    }))
  };
}
