import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleCheckFreshness } from '../../src/tools/check-freshness.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-freshness.db';

describe('check_data_freshness tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns freshness status', () => {
    const result = handleCheckFreshness(db);
    expect(['fresh', 'stale', 'unknown']).toContain(result.status);
  });

  test('returns last_ingest date', () => {
    const result = handleCheckFreshness(db);
    expect(result.last_ingest).toBe('2026-04-01');
  });

  test('returns schema_version', () => {
    const result = handleCheckFreshness(db);
    expect(result.schema_version).toBe('1.0');
  });

  test('includes staleness threshold', () => {
    const result = handleCheckFreshness(db);
    expect(result.staleness_threshold_days).toBe(90);
  });

  test('includes refresh command', () => {
    const result = handleCheckFreshness(db);
    expect(result.refresh_command).toContain('ingest.yml');
  });

  test('includes _meta with disclaimer', () => {
    const result = handleCheckFreshness(db);
    expect(result._meta).toHaveProperty('disclaimer');
  });
});
