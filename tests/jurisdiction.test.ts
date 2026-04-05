import { describe, test, expect } from 'vitest';
import { validateJurisdiction, SUPPORTED_JURISDICTIONS } from '../src/jurisdiction.js';

describe('jurisdiction validation', () => {
  test('accepts CH', () => {
    const result = validateJurisdiction('CH');
    expect(result).toEqual({ valid: true, jurisdiction: 'CH' });
  });

  test('defaults to CH when undefined', () => {
    const result = validateJurisdiction(undefined);
    expect(result).toEqual({ valid: true, jurisdiction: 'CH' });
  });

  test('rejects unsupported jurisdiction', () => {
    const result = validateJurisdiction('DE');
    expect(result).toEqual({
      valid: false,
      error: {
        error: 'jurisdiction_not_supported',
        supported: ['CH'],
        message: 'This server currently covers Switzerland. More jurisdictions are planned.',
      },
    });
  });

  test('normalises lowercase input', () => {
    const result = validateJurisdiction('ch');
    expect(result).toEqual({ valid: true, jurisdiction: 'CH' });
  });

  test('SUPPORTED_JURISDICTIONS contains CH', () => {
    expect(SUPPORTED_JURISDICTIONS).toContain('CH');
  });
});
