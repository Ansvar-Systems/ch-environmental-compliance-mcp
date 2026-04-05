import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface ComplianceArgs {
  facility_type: string;
  animal_count?: number;
  area_ha?: number;
  jurisdiction?: string;
}

export function handleCheckEnvironmentalCompliance(db: Database, args: ComplianceArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const applicable: {
    category: string;
    rule: string;
    requirement: string;
    legal_basis: string;
    applies: boolean;
    reason: string;
  }[] = [];

  // Check water protection requirements
  const waterZones = db.all<{ zone_type: string; restrictions: string; legal_basis: string }>(
    'SELECT zone_type, restrictions, legal_basis FROM water_protection_zones WHERE jurisdiction = ?',
    [jv.jurisdiction]
  );
  for (const z of waterZones) {
    applicable.push({
      category: 'Gewaesserschutz',
      rule: `Grundwasserschutzzone ${z.zone_type}`,
      requirement: z.restrictions,
      legal_basis: z.legal_basis ?? 'GSchG Art. 20',
      applies: true,
      reason: 'Pruefen Sie, ob Ihr Standort in einer Schutzzone liegt (kantonaler Zonenplan).',
    });
  }

  // Check buffer zone requirements
  const buffers = db.all<{ type: string; distance_m: number; requirement: string; source_law: string }>(
    'SELECT type, distance_m, requirement, source_law FROM buffer_zones WHERE jurisdiction = ?',
    [jv.jurisdiction]
  );
  for (const b of buffers) {
    applicable.push({
      category: 'Pufferstreifen',
      rule: `${b.type} — ${b.distance_m}m`,
      requirement: b.requirement,
      legal_basis: b.source_law,
      applies: true,
      reason: 'OELN-Pflicht fuer alle Direktzahlungsempfaenger.',
    });
  }

  // Check ammonia rules
  const ammoniaRules = db.all<{ technique: string; requirement: string; legal_basis: string }>(
    'SELECT technique, requirement, legal_basis FROM ammonia_rules WHERE jurisdiction = ?',
    [jv.jurisdiction]
  );
  const hasLivestock = args.animal_count !== undefined && args.animal_count > 0;
  for (const a of ammoniaRules) {
    applicable.push({
      category: 'Ammoniakemissionen',
      rule: a.technique,
      requirement: a.requirement,
      legal_basis: a.legal_basis ?? 'LRV Anhang 2',
      applies: hasLivestock,
      reason: hasLivestock
        ? `Relevant bei ${args.animal_count} Tieren.`
        : 'Nur relevant bei Tierhaltung.',
    });
  }

  // Check BFF minimum
  const bffMin = db.get<{ min_area_pct: number }>(
    `SELECT min_area_pct FROM bff_types WHERE min_area_pct > 0 AND jurisdiction = ? ORDER BY min_area_pct DESC LIMIT 1`,
    [jv.jurisdiction]
  );
  if (bffMin && args.area_ha) {
    applicable.push({
      category: 'Biodiversitaetsfoerderflaechen',
      rule: 'Mindestanteil BFF',
      requirement: `Mindestens ${bffMin.min_area_pct}% der LN als BFF (${(args.area_ha * bffMin.min_area_pct / 100).toFixed(2)} ha bei ${args.area_ha} ha LN)`,
      legal_basis: 'DZV Art. 14',
      applies: true,
      reason: 'OELN-Pflicht fuer alle Direktzahlungsempfaenger.',
    });
  }

  // Check UVP thresholds
  const uvpRules = db.all<{ rule: string; threshold: string; legal_basis: string }>(
    `SELECT rule, threshold, legal_basis FROM environmental_rules WHERE topic = 'UVP' AND jurisdiction = ?`,
    [jv.jurisdiction]
  );
  for (const u of uvpRules) {
    const uvpApplies = args.animal_count !== undefined && args.animal_count >= 150;
    applicable.push({
      category: 'UVP (Umweltvertraeglichkeitspruefung)',
      rule: u.rule,
      requirement: u.threshold ?? '',
      legal_basis: u.legal_basis,
      applies: uvpApplies,
      reason: uvpApplies
        ? `Bei ${args.animal_count} Tieren ist eine UVP-Pruefung wahrscheinlich erforderlich.`
        : 'UVP-Schwellenwerte pruefen (kantonal, ab ca. 150 GVE).',
    });
  }

  // Check Pa.Iv. 19.475 nutrient loss limits
  const currentYear = new Date().getFullYear();
  const limits = db.all<{ nutrient: string; limit_pct: number; target: string }>(
    'SELECT nutrient, limit_pct, target FROM nutrient_loss_limits WHERE year <= ? AND jurisdiction = ? ORDER BY year DESC',
    [currentYear, jv.jurisdiction]
  );
  const latestN = limits.find(l => l.nutrient === 'N');
  const latestP = limits.find(l => l.nutrient === 'P');
  if (latestN || latestP) {
    applicable.push({
      category: 'Naehrstoffverluste (Pa.Iv. 19.475)',
      rule: 'Absenkpfad Stickstoff und Phosphor',
      requirement: [
        latestN ? `N: -${latestN.limit_pct}% (${latestN.target})` : '',
        latestP ? `P: -${latestP.limit_pct}% (${latestP.target})` : '',
      ].filter(Boolean).join('; '),
      legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
      applies: true,
      reason: 'Betrifft alle Betriebe mit Direktzahlungen.',
    });
  }

  return {
    facility_type: args.facility_type,
    animal_count: args.animal_count ?? null,
    area_ha: args.area_ha ?? null,
    jurisdiction: jv.jurisdiction,
    applicable_rules: applicable.length,
    rules: applicable,
    note: 'Diese Zusammenstellung ist indikativ. Kantonale Auflagen und standortspezifische Anforderungen sind separat zu pruefen.',
    _meta: buildMeta(),
  };
}
