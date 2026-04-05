import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface WaterProtectionArgs {
  zone_type?: string;
  jurisdiction?: string;
}

export function handleGetWaterProtectionZones(db: Database, args: WaterProtectionArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = 'SELECT * FROM water_protection_zones WHERE jurisdiction = ?';
  const params: unknown[] = [jv.jurisdiction];

  if (args.zone_type) {
    sql += ' AND LOWER(zone_type) = LOWER(?)';
    params.push(args.zone_type);
  }

  sql += ' ORDER BY zone_type';

  const zones = db.all<{
    zone_type: string; name: string; restrictions: string;
    description: string; legal_basis: string;
  }>(sql, params);

  if (zones.length === 0 && args.zone_type) {
    return {
      error: 'not_found',
      message: `No water protection zone of type '${args.zone_type}' found. Valid types: S1, S2, S3, Sm, Zu.`,
    };
  }

  return {
    jurisdiction: jv.jurisdiction,
    zones_count: zones.length,
    zones: zones.map(z => ({
      zone_type: z.zone_type,
      name: z.name,
      restrictions: z.restrictions,
      description: z.description,
      legal_basis: z.legal_basis,
    })),
    _meta: buildMeta({
      source_url: 'https://www.bafu.admin.ch/bafu/de/home/themen/wasser/fachinformationen/gewaesserschutz.html',
    }),
  };
}
