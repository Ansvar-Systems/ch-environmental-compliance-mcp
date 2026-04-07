import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface AmmoniaArgs {
  technique?: string;
  jurisdiction?: string;
}

export function handleGetAmmoniaRules(db: Database, args: AmmoniaArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = 'SELECT * FROM ammonia_rules WHERE jurisdiction = ?';
  const params: unknown[] = [jv.jurisdiction];

  if (args.technique) {
    sql += ' AND LOWER(technique) LIKE LOWER(?)';
    params.push(`%${args.technique}%`);
  }

  sql += ' ORDER BY technique';

  const rules = db.all<{
    technique: string; emission_factor: number; requirement: string;
    legal_basis: string; effective_date: string; notes: string;
  }>(sql, params);

  return {
    jurisdiction: jv.jurisdiction,
    rules_count: rules.length,
    rules: rules.map(r => ({
      technique: r.technique,
      emission_factor_pct: r.emission_factor,
      requirement: r.requirement,
      legal_basis: r.legal_basis,
      effective_date: r.effective_date,
      notes: r.notes,
    })),
    _citation: buildCitation(
      'CH Ammonia Rules',
      'Ammoniak-Emissionsvorschriften',
      'get_ammonia_rules',
      { ...(args.technique ? { technique: args.technique } : {}) },
    ),
    _meta: buildMeta({
      source_url: 'https://www.bafu.admin.ch/bafu/de/home/themen/luft/fachinformationen/luftschadstoffquellen/emissionen-der-landwirtschaft.html',
    }),
  };
}
