import type { ActivityDomain } from './model.ts';
import { isObject } from './files.ts';
export const ACTIVITY_DOMAINS = Object.freeze<ActivityDomain[]>([
  'frontend',
  'backend',
  'devops',
  'infrastructure',
  'data',
  'ai-ml',
  'mobile',
  'desktop',
  'embedded',
  'quality-engineering',
  'security',
  'developer-experience',
  'product-design',
  'other'
]);

export function calculateActivityDomainMix(activities: readonly unknown[]) {
  const weights = new Map<ActivityDomain, number>();
  let activityCount = 0;

  for (const activity of activities) {
    if (!isObject(activity) || !Array.isArray(activity.domains)) continue;
    const classified = activity.domains.filter((domain: unknown): domain is ActivityDomain => typeof domain === 'string' && ACTIVITY_DOMAINS.some((known) => known === domain));
    if (classified.length === 0) continue;
    const domains = [...new Set(classified)];
    const weight = 1 / domains.length;
    activityCount += 1;
    for (const domain of domains) {
      weights.set(domain, (weights.get(domain) ?? 0) + weight);
    }
  }

  const items = [...weights.entries()]
    .map(([domain, weight]) => ({
      domain,
      weight,
      percentage: activityCount === 0 ? 0 : (weight / activityCount) * 100
    }))
    .sort((a, b) => b.weight - a.weight || a.domain.localeCompare(b.domain));

  return { activityCount, items };
}
