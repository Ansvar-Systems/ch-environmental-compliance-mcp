import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleListSources } from '../../src/tools/list-sources.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-list-sources.db';

describe('list_sources tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns sources array', () => {
    const result = handleListSources(db);
    expect(result.sources).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
  });

  test('each source has required fields', () => {
    const result = handleListSources(db);
    for (const source of result.sources) {
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('authority');
      expect(source).toHaveProperty('official_url');
      expect(source).toHaveProperty('license');
    }
  });

  test('includes GSchG source', () => {
    const result = handleListSources(db);
    const gschg = result.sources.find(s => s.name.includes('GSchG'));
    expect(gschg).toBeDefined();
    expect(gschg!.authority).toContain('BAFU');
  });

  test('includes LRV source', () => {
    const result = handleListSources(db);
    const lrv = result.sources.find(s => s.name.includes('LRV'));
    expect(lrv).toBeDefined();
  });

  test('includes DZV source', () => {
    const result = handleListSources(db);
    const dzv = result.sources.find(s => s.name.includes('DZV'));
    expect(dzv).toBeDefined();
    expect(dzv!.authority).toContain('BLW');
  });

  test('includes _meta with disclaimer', () => {
    const result = handleListSources(db);
    expect(result._meta).toHaveProperty('disclaimer');
  });
});
