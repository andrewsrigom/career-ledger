export type TechnologyArea = 'backend' | 'frontend' | 'devops';

const priorityNames = ['node.js', 'python', 'typescript', 'next.js', 'react'];
const areaNames: Record<TechnologyArea, ReadonlySet<string>> = {
  backend: new Set([
    'node.js', 'python', 'express.js', 'nestjs', 'fastify', 'django', 'flask', 'fastapi', 'bun', 'deno',
    'postgresql', 'mysql', 'mongodb', 'redis', 'prisma', 'drizzle orm', 'pgvector', 'graphql', 'openapi', 'zod'
  ]),
  frontend: new Set([
    'next.js', 'react', 'vue', 'angular', 'svelte', 'astro', 'lit', 'web components', 'html', 'css',
    'tailwind css', 'storybook', 'gsap', 'three.js', 'redux', 'highcharts', 'browser extensions'
  ]),
  devops: new Set([
    'aws', 'aws lambda', 'azure', 'google cloud', 'docker', 'podman', 'kubernetes', 'terraform',
    'ansible', 'nginx', 'linux', 'systemd', 'github actions', 'gitlab ci', 'ci/cd', 'opentelemetry'
  ])
};

function technologyKey(name: string): string {
  const key = name.trim().toLowerCase();
  if (key === 'node' || key === 'nodejs') return 'node.js';
  if (key === 'next' || key === 'nextjs') return 'next.js';
  if (key === 'react.js' || key === 'reactjs') return 'react';
  if (key === 'express') return 'express.js';
  return key;
}

export function technologyArea(name: string): TechnologyArea | undefined {
  const key = technologyKey(name);
  return (Object.keys(areaNames) as TechnologyArea[]).find((area) => areaNames[area].has(key));
}

export function isPriorityTechnology(name: string): boolean {
  return priorityNames.includes(technologyKey(name));
}

function technologyRank(name: string): number {
  const priority = priorityNames.indexOf(technologyKey(name));
  if (priority !== -1) return priority;
  const area = technologyArea(name);
  return priorityNames.length + (area === 'backend' ? 0 : area === 'frontend' ? 1 : area === 'devops' ? 2 : 3);
}

// Keep labels intact, deduplicate aliases, and retain source order within a rank.
export function orderTechnologies(technologies: readonly string[]): string[] {
  const seen = new Set<string>();
  return technologies.filter((technology) => {
    const key = technologyKey(technology);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((first, second) => technologyRank(first) - technologyRank(second));
}
