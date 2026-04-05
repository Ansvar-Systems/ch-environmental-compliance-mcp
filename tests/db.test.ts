import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createDatabase, type Database } from '../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-database.db';

describe('database layer', () => {
  let db: Database;

  beforeAll(() => {
    db = createDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('creates database with db_metadata table', () => {
    const row = db.get<{ value: string }>(
      'SELECT value FROM db_metadata WHERE key = ?',
      ['schema_version']
    );
    expect(row?.value).toBe('1.0');
  });

  test('creates water_protection_zones table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='water_protection_zones'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates buffer_zones table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='buffer_zones'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates ammonia_rules table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ammonia_rules'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates bff_types table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='bff_types'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates nutrient_loss_limits table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='nutrient_loss_limits'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates environmental_rules table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='environmental_rules'"
    );
    expect(result).toHaveLength(1);
  });

  test('FTS5 search_index exists', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='search_index'"
    );
    expect(result).toHaveLength(1);
  });

  test('journal mode is DELETE', () => {
    const row = db.get<{ journal_mode: string }>('PRAGMA journal_mode');
    expect(row?.journal_mode).toBe('delete');
  });
});
