import assert from 'node:assert/strict';
import test from 'node:test';
import { ACTIVITY_DOMAINS, calculateActivityDomainMix, calculateProjectWorkMix } from '../scripts/lib/domains.ts';

test('activity domain vocabulary is normalized and excludes a full-stack bucket', () => {
  assert.ok(ACTIVITY_DOMAINS.includes('frontend'));
  assert.ok(ACTIVITY_DOMAINS.includes('backend'));
  assert.ok(ACTIVITY_DOMAINS.includes('devops'));
  assert.equal(ACTIVITY_DOMAINS.some((domain: string) => domain === 'full-stack'), false);
});

test('recorded activity mix gives every activity one equally divided unit', () => {
  const result = calculateActivityDomainMix([
    { domains: ['frontend'] },
    { domains: ['frontend', 'backend'] },
    { domains: ['backend', 'devops'] }
  ]);

  assert.equal(result.activityCount, 3);
  assert.deepEqual(result.items.map(({ domain, weight }) => [domain, weight]), [
    ['frontend', 1.5],
    ['backend', 1],
    ['devops', 0.5]
  ]);
  assert.equal(result.items.reduce((sum, item) => sum + item.weight, 0), 3);
  assert.ok(Math.abs(result.items.reduce((sum, item) => sum + item.percentage, 0) - 100) < Number.EPSILON * 10);
});

test('recorded activity mix ignores records without a usable domain classification', () => {
  assert.deepEqual(calculateActivityDomainMix([{}, { domains: [] }]), { activityCount: 0, items: [] });
});

test('project work mix divides each classified activity across its delivery surfaces, not its tools', () => {
  const activities = [
    { domains: ['backend', 'frontend', 'quality-engineering'], technologies: ['Node.js'] },
    { domains: ['backend', 'devops', 'infrastructure', 'security'] },
    { domains: ['frontend', 'frontend', 'developer-experience'] },
    { domains: ['data', 'quality-engineering'] },
    {}, null
  ];
  const original = structuredClone(activities);
  const mix = calculateProjectWorkMix(activities);
  assert.equal(mix.activityCount, 3);
  assert.deepEqual(mix.items.map(({ domain, weight }) => [domain, weight]), [
    ['frontend', 1.5], ['backend', 1], ['devops', .5]
  ]);
  assert.ok(Math.abs(mix.items.reduce((sum, item) => sum + item.percentage, 0) - 100) < 1e-10);
  assert.deepEqual(activities, original);
  assert.deepEqual(calculateProjectWorkMix([{ domains: ['unknown', 'data'] }]), { activityCount: 0, items: [] });
});
