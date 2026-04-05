import { describe, test, expect } from 'vitest';
import { handleAbout } from '../../src/tools/about.js';

describe('about tool', () => {
  test('returns server metadata', () => {
    const result = handleAbout();
    expect(result.name).toBe('Switzerland Environmental Compliance MCP');
    expect(result.description).toContain('GSchG');
    expect(result.jurisdiction).toEqual(['CH']);
    expect(result.tools_count).toBe(11);
    expect(result.links).toHaveProperty('homepage');
    expect(result.links).toHaveProperty('repository');
    expect(result._meta).toHaveProperty('disclaimer');
  });

  test('includes version', () => {
    const result = handleAbout();
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('lists data sources', () => {
    const result = handleAbout();
    expect(result.data_sources).toBeDefined();
    expect(result.data_sources.length).toBeGreaterThan(0);
  });
});
