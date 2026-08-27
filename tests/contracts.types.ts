// Compile-only regressions: npm run typecheck checks these with no emit.
import type { CareerDataset, ActivityDomain, ActivityMix, ProjectVisual, Entry } from '../scripts/lib/model.ts';
import type { readJson } from '../scripts/lib/files.ts';
import type { createCareerDataset } from '../scripts/lib/content.ts';
import type { parseProject } from '../scripts/lib/validation.ts';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type IsAny<T> = 0 extends (1 & T) ? true : false;

export type JsonIsUntrusted = Assert<Equal<Awaited<ReturnType<typeof readJson>>, unknown>>;
export type DatasetIsShared = Assert<Equal<ReturnType<typeof createCareerDataset>, CareerDataset>>;
export type ProjectIsTyped = Assert<Equal<IsAny<ReturnType<typeof parseProject>>, false>>;
export type ActivityIsNotEffort = Assert<Equal<Extract<ActivityMix['basis'], 'hours'>, never>>;
export type NoFullStackBucket = Assert<Equal<Extract<ActivityDomain, 'full-stack'>, never>>;
export type EntryHasNormalizedSignificance = Assert<Equal<Extract<Entry['significance'], undefined>, never>>;
export type ImagesRequireApproval = Assert<Equal<Extract<ProjectVisual, { kind: 'image' }>['approval']['approvedBy'], 'owner'>>;
