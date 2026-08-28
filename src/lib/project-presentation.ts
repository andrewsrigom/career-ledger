import type { ActivityMix, CareerDataset, Project } from '../../scripts/lib/model.ts';

// These are recorded areas, not proficiency, effort, or an asserted architecture.
const layerAreas = [
  ['frontend-architecture', 'accessibility'],
  ['product-engineering', 'commerce', 'mobile'],
  ['backend-architecture', 'system-design', 'data-databases', 'authentication-security', 'observability-reliability', 'ai-engineering'],
  ['cloud-infrastructure', 'developer-experience']
] as const;

export function recordedProjectLayers(project: Project, taxonomy: CareerDataset['taxonomy']): boolean[] {
  const slugs = new Set(taxonomy.areas.filter((area) => project.areas.includes(area.label)).map((area) => area.slug));
  return layerAreas.map((areas) => areas.some((area) => slugs.has(area)));
}

export function projectWorkItems(mix: ActivityMix) {
  const percentages = { backend: 0, frontend: 0, devops: 0, other: 0 };
  for (const item of mix.items) {
    const area = item.domain === 'backend' || item.domain === 'frontend' ? item.domain
      : item.domain === 'devops' || item.domain === 'infrastructure' ? 'devops' : 'other';
    percentages[area] += item.percentage;
  }
  return (Object.keys(percentages) as Array<keyof typeof percentages>)
    .map((area) => ({ area, percentage: percentages[area] }))
    .filter((item) => item.percentage > 0);
}
