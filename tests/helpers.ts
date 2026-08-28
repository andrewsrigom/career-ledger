import assert from 'node:assert/strict';
import type { RecommendationRecord } from '../scripts/lib/model.ts';

// A solid-color portrait-size test asset, not a real person's photo.
export const PORTRAIT_WEBP = Buffer.from('UklGRlQAAABXRUJQVlA4IEgAAACwBQCdASpkAGQAPm02mUmkIyKhIKgAgA2JaW7hc+AAY2upxQjZYBrqb3EXlgGupvcReWAa4AAA/v71o/oPiaSYt76dgAAAAAA=', 'base64');

export function recommendationFixture(): RecommendationRecord {
  return {
    id: 'example-colleague', name: 'Example Colleague', relationship: 'Worked on the same team',
    quote: 'A thoughtful colleague who shared knowledge and helped our team solve difficult problems.',
    profileUrl: 'https://www.linkedin.com/in/example-colleague/',
    sourceUrl: 'https://www.linkedin.com/in/example-owner/details/recommendations/'
  };
}

export function portraitFixture() {
  return { recommendationId: 'example-colleague', image: {
    file: 'colleague.webp', width: 100, height: 100,
    source: { kind: 'web', url: 'https://www.linkedin.com/in/example-colleague/', capturedAt: '2026-08-27' },
    en: { alt: 'Portrait of Example Colleague', caption: 'Profile photo for the recommendation review.' },
    'pt-BR': { alt: 'Retrato de Example Colleague', caption: 'Foto do perfil para revisão da recomendação.' }
  } };
}

// Deterministic 320 × 180 solid-color WebP; no screenshot or private data.
export const REVIEW_WEBP = Buffer.from('UklGRqoAAABXRUJQVlA4IJ4AAAAQEACdASpAAbQAPm02mUmkIyKhICgAgA2JaW7hdrEbQAtLZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TEAD+/6pK//xF094AwAAAAAAAAAAAAA==', 'base64');

export function reviewMediaFixture(projectId: string) {
  return { schemaVersion: 1, projects: [{ projectId, images: [{
    file: 'sample.webp', width: 320, height: 180,
    source: { kind: 'web', url: 'https://example.com/product/', capturedAt: '2026-08-27' },
    en: { alt: 'A sample product interface for image review.', caption: 'Current product interface supplied for local review.' },
    'pt-BR': { alt: 'Interface de exemplo do produto para revisão visual.', caption: 'Interface atual do produto apresentada para revisão local.' }
  }] }] };
}

export function first<T>(items: readonly T[]): T {
  const value = items[0];
  assert.ok(value !== undefined, 'Expected a non-empty fixture collection');
  return value;
}
