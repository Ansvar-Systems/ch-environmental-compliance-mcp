import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface BffArgs {
  bff_type?: string;
  quality_level?: string;
  jurisdiction?: string;
}

export function handleGetBffRequirements(db: Database, args: BffArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = 'SELECT * FROM bff_types WHERE jurisdiction = ?';
  const params: unknown[] = [jv.jurisdiction];

  if (args.bff_type) {
    sql += ' AND (LOWER(id) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?))';
    params.push(`%${args.bff_type}%`, `%${args.bff_type}%`);
  }

  if (args.quality_level) {
    sql += ' AND UPPER(quality_level) = UPPER(?)';
    params.push(args.quality_level);
  }

  sql += ' ORDER BY name, quality_level';

  const types = db.all<{
    id: string; name: string; quality_level: string;
    payment_chf_ha: number; min_area_pct: number;
    botanical_criteria: string; notes: string;
  }>(sql, params);

  return {
    jurisdiction: jv.jurisdiction,
    types_count: types.length,
    types: types.map(t => ({
      id: t.id,
      name: t.name,
      quality_level: t.quality_level,
      payment_chf_ha: t.payment_chf_ha,
      min_area_pct: t.min_area_pct,
      botanical_criteria: t.botanical_criteria,
      notes: t.notes,
    })),
    _citation: buildCitation(
      'CH BFF Requirements',
      'Biodiversitätsförderflächen',
      'get_bff_requirements',
      { ...(args.bff_type ? { bff_type: args.bff_type } : {}) },
    ),
    _meta: buildMeta({
      source_url: 'https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen/biodiversitaetsbeitraege.html',
    }),
  };
}
