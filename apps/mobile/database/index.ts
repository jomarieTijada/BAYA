/**
 * apps/mobile/database/index.ts
 *
 * Primary entry point for the BAYA SQLite database foundation.
 * Exposes database lifecycle services, migration runners, and repositories.
 */

export * from './types';
export * from './connection';
export * from './migrate';
export * from './seed';
export * from './lifecycle';
export * from './migrations';
export * from './repositories/lessonRepository';
export * from './repositories/profileRepository';
export * from './repositories/progressRepository';
export * from './repositories/workspaceRepository';
export * from './repositories/syncRepository';
export * from './services/curriculumService';
export * from './services/localLearnerService';
