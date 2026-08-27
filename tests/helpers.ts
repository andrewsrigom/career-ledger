import assert from 'node:assert/strict';

export function first<T>(items: readonly T[]): T {
  const value = items[0];
  assert.ok(value !== undefined, 'Expected a non-empty fixture collection');
  return value;
}
