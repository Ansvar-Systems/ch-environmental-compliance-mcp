import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleSearchEnvironmentalRules } from '../../src/tools/search-environmental-rules.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-search-env.db';

describe('search_environmental_rules tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns results for Schleppschlauch query', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'Schleppschlauch' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('returns results for Grundwasser query', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'Grundwasser' });
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('respects limit parameter', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'Schutz', limit: 2 });
    const typed = result as { results: unknown[] };
    expect(typed.results.length).toBeLessThanOrEqual(2);
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'Ammoniak', jurisdiction: 'FR' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });

  test('returns jurisdiction CH in results', () => {
    const result = handleSearchEnvironmentalRules(db, { query: 'Cadmium' });
    expect((result as { jurisdiction: string }).jurisdiction).toBe('CH');
  });
});
