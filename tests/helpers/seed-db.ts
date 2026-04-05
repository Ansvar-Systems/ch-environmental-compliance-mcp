import { createDatabase, type Database } from '../../src/db.js';

export function createSeededDatabase(dbPath: string): Database {
  const db = createDatabase(dbPath);

  // Water protection zones (S1, S2, S3)
  db.run(
    `INSERT INTO water_protection_zones (zone_type, name, restrictions, description, legal_basis, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['S1', 'Fassungsbereich', 'Kein Zugang, keine Bauten, keine Duengung, keine PSM', 'Engste Schutzzone direkt um die Trinkwasserfassung', 'GSchG Art. 20, GSchV Art. 29', 'CH']
  );
  db.run(
    `INSERT INTO water_protection_zones (zone_type, name, restrictions, description, legal_basis, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['S2', 'Engere Schutzzone', 'Keine Bauten, kein Aushub, keine Guellegrube, eingeschraenkte Duengung', 'Schutzzone zum Schutz vor bakterieller Verunreinigung', 'GSchG Art. 20, GSchV Art. 29', 'CH']
  );
  db.run(
    `INSERT INTO water_protection_zones (zone_type, name, restrictions, description, legal_basis, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['S3', 'Weitere Schutzzone', 'Einschraenkungen fuer Grabungen, Lagerung von Gefahrstoffen', 'Schutzzone zum Schutz vor schwer abbaubaren Stoffen', 'GSchG Art. 20, GSchV Art. 29', 'CH']
  );

  // Buffer zones
  db.run(
    `INSERT INTO buffer_zones (type, distance_m, requirement, source_law, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Gewaesser — Pflanzenschutzmittel', 6, 'Kein Einsatz von PSM innerhalb 6m entlang Oberflaechengewaessern', 'ChemRRV Anhang 2.5', 'Standardabstand, produktspezifisch erhoehbar (SPe-Auflagen)', 'CH']
  );
  db.run(
    `INSERT INTO buffer_zones (type, distance_m, requirement, source_law, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Gewaesser — Duenger', 3, 'Kein Einsatz von Duenger innerhalb 3m entlang Oberflaechengewaessern', 'OELN/DZV Art. 18', 'Gilt fuer alle Direktzahlungsempfaenger', 'CH']
  );
  db.run(
    `INSERT INTO buffer_zones (type, distance_m, requirement, source_law, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Hecke/Feldgehoelz', 3, 'Kein Einsatz von PSM und Duenger innerhalb 3m ab Stockmitte', 'OELN/DZV Art. 18', null, 'CH']
  );

  // Ammonia rules
  db.run(
    `INSERT INTO ammonia_rules (technique, emission_factor, requirement, legal_basis, effective_date, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Schleppschlauch', 30, 'Pflicht ab 2024 fuer Betriebe >3 ha in Talzone', 'LRV Anhang 2 Ziff. 5', '2024-01-01', 'Reduktion gegenueber Prallteller ca. 30-50%', 'CH']
  );
  db.run(
    `INSERT INTO ammonia_rules (technique, emission_factor, requirement, legal_basis, effective_date, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Prallteller', 100, 'Referenztechnik — hoechster Emissionsfaktor', 'LRV Anhang 2 Ziff. 5', null, 'Basisvergleich fuer Agrammon-Modell', 'CH']
  );
  db.run(
    `INSERT INTO ammonia_rules (technique, emission_factor, requirement, legal_basis, effective_date, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['Injektion', 10, 'Niedrigste Emissionen, geeignet fuer Ackerbau', 'LRV Anhang 2 Ziff. 5', null, 'Nicht auf allen Boeden einsetzbar', 'CH']
  );

  // BFF types
  db.run(
    `INSERT INTO bff_types (id, name, quality_level, payment_chf_ha, min_area_pct, botanical_criteria, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['extensiv-wiese-qi', 'Extensiv genutzte Wiese', 'QI', 1500, 7, 'Keine Duengung, 1 Schnitt ab 15. Juni', 'Haeufigster BFF-Typ', 'CH']
  );
  db.run(
    `INSERT INTO bff_types (id, name, quality_level, payment_chf_ha, min_area_pct, botanical_criteria, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['extensiv-wiese-qii', 'Extensiv genutzte Wiese', 'QII', 2800, 7, 'Mind. 6 Indikatorpflanzen pro Areal, Strukturvielfalt', 'QII erfordert botanische Kartierung', 'CH']
  );
  db.run(
    `INSERT INTO bff_types (id, name, quality_level, payment_chf_ha, min_area_pct, botanical_criteria, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['buntbrache-qi', 'Buntbrache', 'QI', 3800, 0, 'Ansaat von mind. 30 einheimischen Wildkraeutern', 'Mindestens 1 Jahr stehenlassen', 'CH']
  );
  db.run(
    `INSERT INTO bff_types (id, name, quality_level, payment_chf_ha, min_area_pct, botanical_criteria, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['hecke-qi', 'Hecke mit Krautsaum', 'QI', 2700, 0, 'Einheimische Strauch- und Baumarten, 3m Krautsaum', 'Pflege alle 5-8 Jahre', 'CH']
  );

  // Nutrient loss limits
  db.run(
    `INSERT INTO nutrient_loss_limits (nutrient, year, limit_pct, target, legal_basis, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['N', 2025, 10, 'Reduktion N-Verluste um 10% gegenueber 2014-2016', 'LwG Art. 6a (Pa.Iv. 19.475)', 'Zwischenziel', 'CH']
  );
  db.run(
    `INSERT INTO nutrient_loss_limits (nutrient, year, limit_pct, target, legal_basis, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['N', 2030, 20, 'Reduktion N-Verluste um 20% gegenueber 2014-2016', 'LwG Art. 6a (Pa.Iv. 19.475)', 'Endziel 2030', 'CH']
  );
  db.run(
    `INSERT INTO nutrient_loss_limits (nutrient, year, limit_pct, target, legal_basis, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['P', 2025, 10, 'Reduktion P-Verluste um 10% gegenueber 2014-2016', 'LwG Art. 6a (Pa.Iv. 19.475)', 'Zwischenziel', 'CH']
  );
  db.run(
    `INSERT INTO nutrient_loss_limits (nutrient, year, limit_pct, target, legal_basis, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['P', 2030, 20, 'Reduktion P-Verluste um 20% gegenueber 2014-2016', 'LwG Art. 6a (Pa.Iv. 19.475)', 'Endziel 2030', 'CH']
  );

  // Environmental rules — UVP
  db.run(
    `INSERT INTO environmental_rules (topic, rule, authority, legal_basis, threshold, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['UVP', 'UVP-Pflicht fuer Stallbauten ab Schwellenwert', 'BAFU / kantonale Umweltaemter', 'UVPV Anhang Nr. 80.4', 'Ab 150 GVE (kantonal abweichend)', 'Schwellenwerte variieren je nach Kanton und Tierart', 'CH']
  );
  db.run(
    `INSERT INTO environmental_rules (topic, rule, authority, legal_basis, threshold, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['UVP', 'UVP-Pflicht fuer Biogasanlagen', 'BAFU / kantonale Umweltaemter', 'UVPV Anhang Nr. 80.5', 'Ab 5000 t Substrat pro Jahr', null, 'CH']
  );

  // Environmental rules — VBBo
  db.run(
    `INSERT INTO environmental_rules (topic, rule, authority, legal_basis, threshold, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['VBBo', 'Richtwert Cadmium im Boden', 'BAFU', 'VBBo Anhang 1', '0.8 mg/kg (Richtwert)', 'Bei Ueberschreitung: Ursachenabklaerung und Massnahmenplan', 'CH']
  );
  db.run(
    `INSERT INTO environmental_rules (topic, rule, authority, legal_basis, threshold, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ['VBBo', 'Richtwert Kupfer im Boden', 'BAFU', 'VBBo Anhang 1', '40 mg/kg (Richtwert)', 'Haeufig ueberschritten in Rebbergen und Hopfengaerten', 'CH']
  );

  // db_metadata for freshness
  db.run(
    `INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)`,
    ['last_ingest', '2026-04-01']
  );
  db.run(
    `INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)`,
    ['build_date', '2026-04-01']
  );

  // FTS5 search index entries
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction)
     VALUES (?, ?, ?, ?)`,
    ['Grundwasserschutzzone S1', 'Fassungsbereich. Kein Zugang, keine Bauten, keine Duengung, keine PSM.', 'Gewaesserschutz', 'CH']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction)
     VALUES (?, ?, ?, ?)`,
    ['Schleppschlauch-Pflicht', 'Pflicht ab 2024 fuer Betriebe >3 ha in Talzone. Reduktion Ammoniakemissionen.', 'Ammoniak', 'CH']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction)
     VALUES (?, ?, ?, ?)`,
    ['Extensiv genutzte Wiese QII', 'Mind. 6 Indikatorpflanzen pro Areal. Beitrag CHF 2800/ha. BFF-Typ.', 'BFF', 'CH']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction)
     VALUES (?, ?, ?, ?)`,
    ['Pufferstreifen Gewaesser PSM', 'Kein Einsatz von Pflanzenschutzmitteln innerhalb 6m entlang Oberflaechengewaessern.', 'Pufferstreifen', 'CH']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction)
     VALUES (?, ?, ?, ?)`,
    ['UVP Stallbau Schwellenwert', 'UVP-Pflicht fuer Stallbauten ab 150 GVE. Kantonal abweichend.', 'UVP', 'CH']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction)
     VALUES (?, ?, ?, ?)`,
    ['Absenkpfad Stickstoff 2030', 'Reduktion N-Verluste um 20% gegenueber 2014-2016. Pa.Iv. 19.475.', 'Naehrstoffe', 'CH']
  );
  db.run(
    `INSERT INTO search_index (title, body, topic, jurisdiction)
     VALUES (?, ?, ?, ?)`,
    ['VBBo Richtwert Cadmium', 'Richtwert Cadmium im Boden 0.8 mg/kg. Bei Ueberschreitung Massnahmenplan.', 'VBBo', 'CH']
  );

  return db;
}
