import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface NutrientLossArgs {
  nutrient?: string;
  jurisdiction?: string;
}

export function handleGetNutrientLossLimits(db: Database, args: NutrientLossArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = 'SELECT * FROM nutrient_loss_limits WHERE jurisdiction = ?';
  const params: unknown[] = [jv.jurisdiction];

  if (args.nutrient) {
    sql += ' AND LOWER(nutrient) = LOWER(?)';
    params.push(args.nutrient);
  }

  sql += ' ORDER BY nutrient, year';

  const limits = db.all<{
    nutrient: string; year: number; limit_pct: number;
    target: string; legal_basis: string; notes: string;
  }>(sql, params);

  return {
    jurisdiction: jv.jurisdiction,
    limits_count: limits.length,
    limits: limits.map(l => ({
      nutrient: l.nutrient,
      year: l.year,
      reduction_target_pct: l.limit_pct,
      target: l.target,
      legal_basis: l.legal_basis,
      notes: l.notes,
    })),
    _citation: buildCitation(
      'CH Nutrient Loss Limits',
      'Nährstoffverlust-Grenzwerte',
      'get_nutrient_loss_limits',
      { ...(args.nutrient ? { nutrient: args.nutrient } : {}) },
    ),
    _meta: buildMeta({
      source_url: 'https://www.blw.admin.ch/blw/de/home/nachhaltige-produktion/umwelt/naehrstoffe.html',
    }),
  };
}
