import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface BufferZoneArgs {
  zone_type?: string;
  jurisdiction?: string;
}

export function handleGetBufferZoneRules(db: Database, args: BufferZoneArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = 'SELECT * FROM buffer_zones WHERE jurisdiction = ?';
  const params: unknown[] = [jv.jurisdiction];

  if (args.zone_type) {
    sql += ' AND LOWER(type) LIKE LOWER(?)';
    params.push(`%${args.zone_type}%`);
  }

  sql += ' ORDER BY distance_m DESC';

  const zones = db.all<{
    type: string; distance_m: number; requirement: string;
    source_law: string; notes: string;
  }>(sql, params);

  return {
    jurisdiction: jv.jurisdiction,
    rules_count: zones.length,
    rules: zones.map(z => ({
      type: z.type,
      distance_m: z.distance_m,
      requirement: z.requirement,
      source_law: z.source_law,
      notes: z.notes,
    })),
    _meta: buildMeta({
      source_url: 'https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen/oekologischer-leistungsnachweis.html',
    }),
  };
}
