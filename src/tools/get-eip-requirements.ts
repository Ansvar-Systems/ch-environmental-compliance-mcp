import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface EipArgs {
  project_type?: string;
  jurisdiction?: string;
}

export function handleGetEipRequirements(db: Database, args: EipArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = `SELECT * FROM environmental_rules WHERE topic = 'UVP' AND jurisdiction = ?`;
  const params: unknown[] = [jv.jurisdiction];

  if (args.project_type) {
    sql += ' AND LOWER(rule) LIKE LOWER(?)';
    params.push(`%${args.project_type}%`);
  }

  sql += ' ORDER BY id';

  const rules = db.all<{
    topic: string; rule: string; authority: string;
    legal_basis: string; threshold: string; notes: string;
  }>(sql, params);

  // Also get VBBo (soil contamination) rules
  const vbbo = db.all<{
    topic: string; rule: string; authority: string;
    legal_basis: string; threshold: string; notes: string;
  }>(`SELECT * FROM environmental_rules WHERE topic = 'VBBo' AND jurisdiction = ? ORDER BY id`, [jv.jurisdiction]);

  return {
    jurisdiction: jv.jurisdiction,
    uvp_rules_count: rules.length,
    uvp_rules: rules.map(r => ({
      rule: r.rule,
      authority: r.authority,
      legal_basis: r.legal_basis,
      threshold: r.threshold,
      notes: r.notes,
    })),
    vbbo_rules_count: vbbo.length,
    vbbo_rules: vbbo.map(r => ({
      rule: r.rule,
      authority: r.authority,
      legal_basis: r.legal_basis,
      threshold: r.threshold,
      notes: r.notes,
    })),
    _meta: buildMeta({
      source_url: 'https://www.bafu.admin.ch/bafu/de/home/themen/uvp.html',
    }),
  };
}
