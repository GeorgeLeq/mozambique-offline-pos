/**
 * @file db.ts
 * @description Decoupled database entry-point. Forwards all database connection,
 * schema migration, and data cleanup tools to the modular src/lib/db/ folder.
 */

export * from './db/index';

