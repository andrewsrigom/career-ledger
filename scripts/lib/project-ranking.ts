import type { CareerDataset, Project } from './model.ts';

export type ProjectProminence = 'flagship' | 'featured' | 'standard' | 'compact';
export interface RankedProject {
  project: Project;
  prominence: ProjectProminence;
  // Build-time diagnostics only. Never add these to Project or the JSON dataset.
  score: number;
  signals: Record<string, number>;
  date: string;
}

type RankingInput = Pick<CareerDataset, 'projects' | 'entries' | 'resume' | 'taxonomy' | 'updatedAt' | 'preview' | 'reviewMedia'>;

function recencyScore(date: string, reference: string): number {
  if (!date) return 0;
  const days = Math.max(0, (Date.parse(reference) - Date.parse(date)) / 86_400_000);
  if (days <= 90) return 12;
  if (days <= 180) return 10;
  if (days <= 365) return 8;
  if (days <= 3 * 365) return 3;
  if (days <= 5 * 365) return -8;
  return -18;
}

function compare(a: RankedProject, b: RankedProject): number {
  // Stable IDs, not translated names, resolve ties across locales.
  return b.score - a.score || b.date.localeCompare(a.date) || a.project.id.localeCompare(b.project.id);
}

function evidenceOverlap(a: Project, b: Project): boolean {
  const first = new Set(a.relatedEntries);
  const second = new Set(b.relatedEntries);
  if (!first.size || !second.size) return false;
  const shared = [...first].filter((id) => second.has(id)).length;
  return shared / new Set([...first, ...second]).size >= .75;
}

/** Editorial prominence, not a measure of skill, effort or business impact. */
export function rankProjects(data: RankingInput): RankedProject[] {
  const entries = new Map(data.entries.map((entry) => [entry.id, entry]));
  const areaSlugs = new Map(data.taxonomy.areas.map((area) => [area.label, area.slug]));
  const scored: RankedProject[] = data.projects.map((project) => {
    const related = project.relatedEntries.flatMap((id) => {
      const entry = entries.get(id);
      return entry ? [entry] : [];
    });
    const areas = new Set([...project.areas, ...related.flatMap((entry) => entry.areas)].map((area) => areaSlugs.get(area)));
    const backend = areas.has('backend-architecture');
    const systems = ['system-design', 'data-databases', 'authentication-security', 'cloud-infrastructure'].some((area) => areas.has(area));
    const roles = data.resume?.experiences.filter((role) => role.relatedProjects.includes(project.id)) ?? [];
    // Role dates are a fallback, not an invented project start/end date.
    const entryDates = related.map((entry) => entry.period.end ?? entry.period.start);
    const roleDates = roles.map((role) => role.period.end ?? role.period.start);
    const date = (entryDates.length ? entryDates : roleDates).sort().at(-1) ?? '';
    const imageCount = data.preview && data.reviewMedia?.[project.id]?.length
      ? data.reviewMedia[project.id]!.length
      : project.presentation?.gallery?.length ?? (project.presentation?.preview.kind === 'image' ? 1 : 0);
    // Translation validation preserves item counts, not wording. Never score prose.
    const contributionCount = related.reduce((count, entry) => count + entry.contributions.length, 0);
    const outcomes = related.flatMap((entry) => entry.outcomes);
    const outcomePoints = outcomes.reduce((sum, outcome) => sum + (outcome.evidenceLevel === 'self-reported' ? 5 : 8), 0);
    const signals: Record<string, number> = {
      fullStack: backend && areas.has('frontend-architecture') ? 24 : 0,
      backendSystems: backend ? 18 + (systems ? 10 : 0) : systems ? 14 : 0,
      ai: areas.has('ai-engineering') ? 24 : 0,
      ownership: project.ownership === 'end-to-end' ? 24 : 0,
      recency: recencyScore(date, data.updatedAt),
      // Existing reviewed assets only. More images cannot overwhelm technical scope.
      visuals: imageCount ? 18 + (imageCount > 1 ? 4 : 0) : project.presentation?.preview.kind === 'diagram' ? 4 : 0,
      substance: Math.min(3, contributionCount) * 4,
      outcomes: Math.min(10, outcomePoints),
      thinEvidence: !contributionCount && !outcomes.length && !project.ownership ? -16 : 0,
      anchor: 0,
      overlap: 0
    };
    return { project, score: Object.values(signals).reduce((sum, value) => sum + value, 0), signals, date, prominence: 'compact' };
  });

  // One current, substantive professional anchor; no professional-first bucket.
  const anchor = [...scored].sort(compare).find(({ project, score }) =>
    score >= 65 && project.status === 'active' && project.workContext === 'professional'
      && data.resume?.experiences.some((role) => role.period.end === null && role.relatedProjects.includes(project.id)));
  if (anchor) {
    anchor.signals.anchor = 50;
    anchor.score += 50;
  }

  const remaining = [...scored];
  const ranked: RankedProject[] = [];
  while (remaining.length) {
    // Penalize duplicate evidence, not similar stacks or independent context.
    for (const item of remaining) {
      const penalty = ranked.some((higher) => evidenceOverlap(item.project, higher.project)) ? -24 : 0;
      item.score += penalty - (item.signals.overlap ?? 0);
      item.signals.overlap = penalty;
    }
    remaining.sort(compare);
    const next = remaining.shift()!;
    next.prominence = ranked.length === 0 ? 'flagship' : next.score >= 105 ? 'featured' : next.score >= 48 ? 'standard' : 'compact';
    ranked.push(next);
  }
  return ranked;
}

/** Keep home, directories and locale data in the same order, without scores. */
export function withRankedProjects(data: CareerDataset): CareerDataset {
  const projects = rankProjects(data).map(({ project }) => project);
  return {
    ...data,
    projects,
    taxonomy: {
      ...data.taxonomy,
      areas: data.taxonomy.areas.map((area) => ({ ...area, projectIds: projects.filter((project) => area.projectIds.includes(project.id)).map((project) => project.id) }))
    }
  };
}
