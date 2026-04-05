/**
 * Switzerland Environmental Compliance MCP — Data Ingestion Script
 *
 * Populates the database with Swiss environmental compliance data from:
 * - BAFU — Gewaesserschutzgesetz (GSchG), Gewaesserschutzverordnung (GSchV)
 * - BAFU — Luftreinhalte-Verordnung (LRV), Ammoniakemissionen
 * - BLW — Direktzahlungsverordnung (DZV), OELN, BFF-Typen
 * - Agroscope — Agrammon-Emissionsfaktoren
 * - Parlament — Pa.Iv. 19.475 Absenkpfad Naehrstoffverluste
 * - BAFU — VBBo (Verordnung ueber Belastungen des Bodens)
 *
 * Usage: npm run ingest
 */

import { createDatabase } from '../src/db.js';
import { mkdirSync, writeFileSync } from 'fs';

mkdirSync('data', { recursive: true });
const db = createDatabase('data/database.db');

const now = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// 1. Grundwasserschutzzonen — GSchG Art. 20, GSchV Anhang 4
// ---------------------------------------------------------------------------

interface WaterProtectionZone {
  zone_type: string;
  name: string;
  restrictions: string;
  description: string;
  legal_basis: string;
}

const waterProtectionZones: WaterProtectionZone[] = [
  {
    zone_type: 'S1',
    name: 'Fassungsbereich',
    restrictions: 'Kein Zugang fuer Unbefugte. Keine Bauten, keine Anlagen, keine Bewirtschaftung. Kein Duenger, kein Pflanzenschutzmittel. Nur Grundwasserentnahme gestattet.',
    description: 'Unmittelbarer Bereich um die Grundwasserfassung (Brunnen, Quelle). Strengste Schutzzone. Typisch 10-15m Radius um die Fassung.',
    legal_basis: 'GSchG Art. 20, GSchV Anhang 4 Ziff. 12',
  },
  {
    zone_type: 'S2',
    name: 'Engere Schutzzone',
    restrictions: 'Kein Duenger (weder Hofdunger noch Mineraldunger). Keine Pflanzenschutzmittel. Keine Grabungen unter die Humusschicht. Keine Lagerung wassergefaehrdender Stoffe. Keine Tierhaltungsanlagen. Nur extensive Bewirtschaftung (Wiese).',
    description: 'Engere Umgebung der Fassung. Soll verhindern, dass Keime und abbaubare Verunreinigungen die Fassung erreichen. Typisch 100-200m, Mindestaufenthaltszeit Grundwasser 10 Tage.',
    legal_basis: 'GSchG Art. 20, GSchV Anhang 4 Ziff. 222',
  },
  {
    zone_type: 'S3',
    name: 'Weitere Schutzzone',
    restrictions: 'Eingeschraenkte Duengung und PSM-Anwendung gemaess kantonalen Auflagen. Keine neuen Tierhaltungsanlagen ohne Bewilligung. Keine Deponien. Keine Versickerungsanlagen fuer verschmutztes Abwasser. Baubewilligungen mit Auflagen.',
    description: 'Aeusserer Schutzbereich. Soll verhindern, dass nicht abbaubare Verunreinigungen (z.B. Kohlenwasserstoffe) die Fassung erreichen. Umfasst typisch das gesamte Einzugsgebiet.',
    legal_basis: 'GSchG Art. 20, GSchV Anhang 4 Ziff. 232',
  },
  {
    zone_type: 'Sm',
    name: 'Quellenbereich (Quellschutzzone)',
    restrictions: 'Analog S1/S2 je nach kantonaler Festlegung. Keine Eingriffe in den Untergrund. Keine Entwaldung. Drainagen verboten.',
    description: 'Schutzzone um Quellfassungen. Quellenspezifische Abgrenzung nach hydrogeologischem Gutachten. Besonders relevant im Berggebiet und Jura.',
    legal_basis: 'GSchG Art. 20, GSchV Anhang 4 Ziff. 123',
  },
  {
    zone_type: 'Zu',
    name: 'Zustroembereich',
    restrictions: 'In bestimmten Zustraembereichen (Art. 62a GSchG): Pestizidverbote oder -einschraenkungen, Nitratreduktionsprogramme mit Beitraegen, verschaerfte Duengungsauflagen. Kantonale Festlegung.',
    description: 'Gesamtes Einzugsgebiet einer Grundwasserfassung ausserhalb der Schutzzonen. Massnahmen bei erhoehten Nitrat- oder PSM-Konzentrationen. Art. 62a GSchG ermoeglicht Abgeltungen fuer Bewirtschaftungseinschraenkungen.',
    legal_basis: 'GSchG Art. 29 / Art. 62a, GSchV Art. 29',
  },
];

const insertWaterZone = db.instance.prepare(
  `INSERT OR REPLACE INTO water_protection_zones (zone_type, name, restrictions, description, legal_basis, jurisdiction, language)
   VALUES (?, ?, ?, ?, ?, 'CH', 'DE')`
);

for (const z of waterProtectionZones) {
  insertWaterZone.run(z.zone_type, z.name, z.restrictions, z.description, z.legal_basis);
}

console.log(`Inserted ${waterProtectionZones.length} water protection zones`);

// ---------------------------------------------------------------------------
// 2. Pufferstreifen — OELN (DZV), ChemRRV, SPe-Auflagen
// ---------------------------------------------------------------------------

interface BufferZone {
  type: string;
  distance_m: number;
  requirement: string;
  source_law: string;
  notes: string;
}

const bufferZones: BufferZone[] = [
  {
    type: 'Gewaesser — ungeduengt',
    distance_m: 6,
    requirement: 'Entlang aller oberirdischen Gewaesser (Baeche, Fluesse, Seen): 6m Pufferstreifen ohne Duengung (weder Hofdunger noch Mineraldunger).',
    source_law: 'DZV Anhang 1 Ziff. 9.7 (OELN)',
    notes: 'Gemessen ab Boeschungsoberkante. Gilt fuer alle Direktzahlungsempfaenger.',
  },
  {
    type: 'Gewaesser — unbehandelt',
    distance_m: 6,
    requirement: 'Entlang aller oberirdischen Gewaesser: 6m Pufferstreifen ohne Pflanzenschutzmittel-Anwendung.',
    source_law: 'DZV Anhang 1 Ziff. 9.6 (OELN)',
    notes: 'Gemessen ab Boeschungsoberkante. Zusaetzliche 6m SPe-Reduktionszone bei vielen PSM.',
  },
  {
    type: 'Hecken und Feldgehoelze',
    distance_m: 3,
    requirement: 'Entlang Hecken, Feld- und Ufergehoelzen: 3m Pufferstreifen ohne Duenger und Pflanzenschutzmittel.',
    source_law: 'DZV Anhang 1 Ziff. 9.7 (OELN)',
    notes: 'Gemessen ab Stockausschlag. BFF-Anrechnung moeglich.',
  },
  {
    type: 'Nachbarflaechen',
    distance_m: 0.5,
    requirement: 'Mindestens 50 cm Abstand zu Nachbarflaechen bei Duenger- und PSM-Ausbringung.',
    source_law: 'ChemRRV Anhang 2.5',
    notes: 'Bei Geblaesespritze im Rebbau/Obstbau groesserer Abstand noetig. Kantonale Regelungen koennen strenger sein.',
  },
  {
    type: 'SPe 3 — 20m Reduktion',
    distance_m: 20,
    requirement: '20m Pufferstreifen zu Oberflaechengewaessern fuer PSM mit SPe 3-Auflage (20m). Keine PSM-Anwendung in diesem Streifen.',
    source_law: 'ChemRRV Anhang 2.5 / PSM-Zulassung BLW',
    notes: 'Spezifische Auflage je PSM-Produkt. Reduktion moeglich mit Abdriftminderungstechnik (50%/75%/90%).',
  },
  {
    type: 'SPe 3 — 50m Reduktion',
    distance_m: 50,
    requirement: '50m Pufferstreifen zu Oberflaechengewaessern fuer PSM mit SPe 3-Auflage (50m). Keine PSM-Anwendung in diesem Streifen.',
    source_law: 'ChemRRV Anhang 2.5 / PSM-Zulassung BLW',
    notes: 'Nur bei bestimmten Herbiziden und Insektiziden mit hoher Gewaessertoxizitaet. Reduktion moeglich mit anerkannter Technik.',
  },
  {
    type: 'SPe 3 — 100m Reduktion',
    distance_m: 100,
    requirement: '100m Pufferstreifen zu Oberflaechengewaessern fuer PSM mit SPe 3-Auflage (100m). Keine PSM-Anwendung in diesem Streifen.',
    source_law: 'ChemRRV Anhang 2.5 / PSM-Zulassung BLW',
    notes: 'Strengste SPe-Auflage. Gilt fuer einzelne hochgiftige Wirkstoffe. Reduktion moeglich auf 50m mit 90%-Abdriftminderung.',
  },
  {
    type: 'Grundwasserschutzzone S2',
    distance_m: 0,
    requirement: 'In der Schutzzone S2 ist jegliche Duengung und PSM-Anwendung verboten. Nur extensive Wiesennutzung erlaubt.',
    source_law: 'GSchV Anhang 4 Ziff. 222',
    notes: 'Kein fixer Abstand — Verbot gilt fuer die gesamte S2-Flaeche.',
  },
  {
    type: 'Biotope / Naturschutzgebiete',
    distance_m: 6,
    requirement: '6m Pufferstreifen ohne Duenger und PSM rund um Biotope von nationaler und regionaler Bedeutung.',
    source_law: 'DZV Anhang 1 Ziff. 9.7 (OELN) / NHG',
    notes: 'Kantone koennen groessere Abstande festlegen. Gilt fuer Moore, Trockenwiesen, Auengebiete.',
  },
];

const insertBuffer = db.instance.prepare(
  `INSERT OR REPLACE INTO buffer_zones (type, distance_m, requirement, source_law, notes, jurisdiction, language)
   VALUES (?, ?, ?, ?, ?, 'CH', 'DE')`
);

for (const b of bufferZones) {
  insertBuffer.run(b.type, b.distance_m, b.requirement, b.source_law, b.notes);
}

console.log(`Inserted ${bufferZones.length} buffer zone rules`);

// ---------------------------------------------------------------------------
// 3. Ammoniakemissionen — LRV, Agrammon, Agroscope
// ---------------------------------------------------------------------------

interface AmmoniaRule {
  technique: string;
  emission_factor: number | null;
  requirement: string;
  legal_basis: string;
  effective_date: string | null;
  notes: string;
}

const ammoniaRules: AmmoniaRule[] = [
  {
    technique: 'Prallteller (Breitverteiler)',
    emission_factor: 100,
    requirement: 'Referenztechnik. Ab 2024 auf offener Ackerflaeche nicht mehr zulaessig (Schleppschlauch-Pflicht). Auf Gruenland weiterhin erlaubt, aber emissionsarm empfohlen.',
    legal_basis: 'LRV Anhang 2 Ziff. 5',
    effective_date: null,
    notes: 'Emissionsfaktor 100% = Referenzwert. Reale NH3-Verluste bei Guelleausbringung ca. 15-25% des ausgebrachten NH4-N je nach Witterung.',
  },
  {
    technique: 'Schleppschlauch',
    emission_factor: 50,
    requirement: 'Obligatorisch ab 1. Januar 2024 auf offener Ackerflaeche (LRV-Revision). Auf Gruenland empfohlen. Reduktion der Ammoniakemissionen um ca. 50% gegenueber Prallteller.',
    legal_basis: 'LRV Anhang 2 Ziff. 5 (Revision 2022)',
    effective_date: '2024-01-01',
    notes: 'Schleppschlauch legt Guelle in Streifen auf den Boden. Weniger Oberflaechenkontakt = weniger NH3-Verlust. Kosten ca. 3-5 CHF/m3 Guelle Mehrkosten.',
  },
  {
    technique: 'Schleppschuh',
    emission_factor: 40,
    requirement: 'Empfohlene emissionsarme Technik. Reduktion ca. 60% gegenueber Prallteller. Guelle wird zwischen Pflanzenreihen am Boden abgelegt.',
    legal_basis: 'LRV Anhang 2 Ziff. 5',
    effective_date: null,
    notes: 'Besonders geeignet fuer Gruenland. Kosteneffizient ab ca. 200 ha Ausbringflaeche (Gemeinschaft/Lohnunternehmer).',
  },
  {
    technique: 'Guelledrill / Injektion',
    emission_factor: 10,
    requirement: 'Beste verfuegbare Technik (BVT). Reduktion ca. 90% gegenueber Prallteller. Guelle wird direkt in den Boden eingebracht.',
    legal_basis: 'LRV Anhang 2 Ziff. 5',
    effective_date: null,
    notes: 'Nur auf Ackerflaeche praktikabel (nicht auf Gruenland). Hohe Zugkraftanforderung. Hoehere Kosten, aber beste Emissionsminderung und Duengerwirkung.',
  },
  {
    technique: 'Guellegrube — offen',
    emission_factor: 100,
    requirement: 'Referenz-Lagertechnik. Abdeckungspflicht fuer neue Guellgruben (LRV). Bestehende offene Gruben: kantonale Sanierungsfristen.',
    legal_basis: 'LRV Anhang 2 Ziff. 5',
    effective_date: null,
    notes: 'NH3-Verluste bei offener Lagerung ca. 5-10% des Gesamt-N im Jahr. Schwimmschicht reduziert Emissionen teilweise.',
  },
  {
    technique: 'Guellegrube — abgedeckt (fest)',
    emission_factor: 20,
    requirement: 'Feste Abdeckung (Betondeckel, Zeltdach) reduziert Emissionen um ca. 80%. Fuer Neuanlagen obligatorisch.',
    legal_basis: 'LRV Anhang 2 Ziff. 5',
    effective_date: null,
    notes: 'Investitionskosten ca. 80-150 CHF/m2. Strukturverbesserungsbeitraege moeglich (SVV). Gleichzeitig Geruchsreduktion.',
  },
  {
    technique: 'Guellegrube — Schwimmfolie',
    emission_factor: 30,
    requirement: 'Schwimmende Abdeckung (Folie, LECA-Kugeln, Stroh) als Nachruestung fuer bestehende offene Gruben. Reduktion ca. 70%.',
    legal_basis: 'LRV Anhang 2 Ziff. 5',
    effective_date: null,
    notes: 'Kostenguenstige Nachruestung ca. 15-30 CHF/m2. Wartung erforderlich (Folienintegritaet pruefen). Stroh/LECA weniger effektiv als Folie.',
  },
  {
    technique: 'Laufhof / Laufstall',
    emission_factor: null,
    requirement: 'Emissionsarme Stallboeden (Gummilaufflaechen, haeufige Entmistung, V-Rinnen, Quergefaelle). Agrammon-Modell berechnet stallspezifische Emissionen.',
    legal_basis: 'LRV Anhang 2 Ziff. 5 / Agrammon',
    effective_date: null,
    notes: 'NH3-Emissionen stark abhaengig von Stalltyp, Entmistungshaeufigkeit und Lueftung. Agrammon-Eingabe beruecksichtigt individuelle Betriebsdaten. Neue Staelle: Emissionsarme Bauweise empfohlen.',
  },
  {
    technique: 'Fuetterung — N-reduziert',
    emission_factor: null,
    requirement: 'Phasengerechte Fuetterung und N-angepasste Rationen reduzieren NH3 um 10-20%. Ressourceneffizienzbeitrag moeglich (DZV).',
    legal_basis: 'DZV Art. 82 / LRV',
    effective_date: null,
    notes: 'N-reduzierte Fuetterung bei Schweinen: NPr-Futter senkt N-Ausscheidung um 15-20%. Bei Milchkuehen: Harnstoffgehalt in Milch als Indikator.',
  },
  {
    technique: 'Weidegang',
    emission_factor: null,
    requirement: 'NH3-Emissionen bei Weidehaltung deutlich tiefer als bei Stallhaltung (Harn und Kot nicht konzentriert). Agrammon verrechnet Weideanteil.',
    legal_basis: 'Agrammon-Modell',
    effective_date: null,
    notes: 'RAUS-Betriebe profitieren von tieferen berechneten NH3-Emissionen. Vollweide (z.B. saisonale Abkalbung) hat tiefste Stallemissionen.',
  },
];

const insertAmmonia = db.instance.prepare(
  `INSERT OR REPLACE INTO ammonia_rules (technique, emission_factor, requirement, legal_basis, effective_date, notes, jurisdiction, language)
   VALUES (?, ?, ?, ?, ?, ?, 'CH', 'DE')`
);

for (const a of ammoniaRules) {
  insertAmmonia.run(a.technique, a.emission_factor, a.requirement, a.legal_basis, a.effective_date, a.notes);
}

console.log(`Inserted ${ammoniaRules.length} ammonia rules`);

// ---------------------------------------------------------------------------
// 4. Biodiversitaetsfoerderflaechen (BFF) — DZV, OELN
// ---------------------------------------------------------------------------

interface BffType {
  id: string;
  name: string;
  quality_level: string;
  payment_chf_ha: number;
  min_area_pct: number;
  botanical_criteria: string;
  notes: string;
}

const bffTypes: BffType[] = [
  // QI types
  {
    id: 'extensiv-wiese-qi',
    name: 'Extensiv genutzte Wiese',
    quality_level: 'QI',
    payment_chf_ha: 450,
    min_area_pct: 7,
    botanical_criteria: 'Keine Duengung. Erste Mahd ab 15. Juni (Talzone). Keine Herbizide.',
    notes: 'Haeufigster BFF-Typ. Mindestens 7% der LN als BFF (inkl. alle BFF-Typen). Talzone: 450 CHF/ha, Huegelzone/BZ: hoeher.',
  },
  {
    id: 'wenig-intensiv-wiese-qi',
    name: 'Wenig intensiv genutzte Wiese',
    quality_level: 'QI',
    payment_chf_ha: 300,
    min_area_pct: 0,
    botanical_criteria: 'Maessige Duengung erlaubt (max. 1 Duengergabe Hofdunger). Erste Mahd ab 15. Juni.',
    notes: 'Uebergangsstufe zwischen intensiv und extensiv. Geringerer Beitrag als extensiv.',
  },
  {
    id: 'streuflaeche-qi',
    name: 'Streuflaeche',
    quality_level: 'QI',
    payment_chf_ha: 450,
    min_area_pct: 0,
    botanical_criteria: 'Keine Duengung. Mahd ab 1. September. Streue muss abgefuehrt werden.',
    notes: 'Typisch in Riedgebieten, Flachmooren. Wichtig fuer Amphibien und seltene Pflanzen.',
  },
  {
    id: 'hecke-qi',
    name: 'Hecke, Feld- und Ufergehoelz',
    quality_level: 'QI',
    payment_chf_ha: 1700,
    min_area_pct: 0,
    botanical_criteria: 'Mindestens 5 einheimische Straucharten. Mindestbreite 2m. Pflege: sektionsweise alle 5-8 Jahre auf den Stock setzen.',
    notes: 'Mit Krautsaum (3m) beidseitig. Wichtiger Lebensraum fuer Voegel und Kleinsaeuger. Vernetzungselement.',
  },
  {
    id: 'buntbrache-qi',
    name: 'Buntbrache',
    quality_level: 'QI',
    payment_chf_ha: 3800,
    min_area_pct: 0,
    botanical_criteria: 'Einsaat empfohlener Saatmischung (ca. 30 Arten). Mindeststandzeit 2 Jahre. Keine Duengung, keine PSM. Mindestgroesse 5 Aren.',
    notes: 'Hoechster Beitrag aller BFF-Typen auf Ackerflaeche. Anrechenbar an 3.5% BFF auf Ackerflaeche. Wichtig fuer Feldlerche, Feldhase.',
  },
  {
    id: 'rotationsbrache-qi',
    name: 'Rotationsbrache',
    quality_level: 'QI',
    payment_chf_ha: 3300,
    min_area_pct: 0,
    botanical_criteria: 'Einsaat empfohlener Mischung. Standzeit 1-3 Jahre (kuerzere Rotation als Buntbrache). Keine Duengung, keine PSM.',
    notes: 'Flexibler als Buntbrache. Anrechenbar an 3.5% BFF auf Ackerflaeche.',
  },
  {
    id: 'saum-ackerflaeche-qi',
    name: 'Saum auf Ackerflaeche',
    quality_level: 'QI',
    payment_chf_ha: 3300,
    min_area_pct: 0,
    botanical_criteria: 'Streifen entlang Feldraendern (3-12m breit). Einsaat empfohlener Mischung. Keine Duengung, keine PSM. Mindeststandzeit 2 Jahre.',
    notes: 'Ergaenzt Bunt-/Rotationsbrache. Strukturelement am Feldrand.',
  },
  {
    id: 'nuetzlingsstreifen-qi',
    name: 'Nuetzlingsstreifen',
    quality_level: 'QI',
    payment_chf_ha: 3300,
    min_area_pct: 0,
    botanical_criteria: 'Streifen in oder am Rand von Ackerkulturen (3-5m breit). Empfohlene Mischung mit Blutenpflanzen. Keine PSM, keine Duengung. Jaehrliche Neuansaat moeglich.',
    notes: 'Foerdert Nuetzlinge (Schwebfliegen, Marienkaefer, Schlupfwespen). Seit 2023 als BFF-Typ anerkannt.',
  },
  {
    id: 'bluehstreifen-qi',
    name: 'Bluehstreifen fuer Bestaeubende und andere Nuetzlinge',
    quality_level: 'QI',
    payment_chf_ha: 3300,
    min_area_pct: 0,
    botanical_criteria: 'Empfohlene Bluehstreifenmischung. 3-12m breit. Keine PSM, keine Duengung. Mindeststandzeit 100 Tage.',
    notes: 'Neuer BFF-Typ (DZV-Revision). Foerdert Wildbienen und andere Bestaeubende.',
  },
  {
    id: 'hochstamm-feldobst-qi',
    name: 'Hochstamm-Feldobstbaeume',
    quality_level: 'QI',
    payment_chf_ha: 0,
    min_area_pct: 0,
    botanical_criteria: 'Stammhoehe mindestens 1.6m (Steinobst) bzw. 1.2m (Kernobst). Einzelbaum-Beitrag. Mindestabstand 10m. Schnitt alle 5 Jahre.',
    notes: 'Beitrag pro Baum (15 CHF/Baum QI). Wichtig fuer Steinkauz, Gartenrotschwanz. Max. 100 Baeume pro ha anrechenbar.',
  },

  // QII types — Qualitaetsstufe II (botanische Qualitaet + Vernetzung)
  {
    id: 'extensiv-wiese-qii',
    name: 'Extensiv genutzte Wiese',
    quality_level: 'QII',
    payment_chf_ha: 1520,
    min_area_pct: 0,
    botanical_criteria: 'Mindestens 6 von ca. 30 regionsspezifischen Indikatorpflanzen nachgewiesen. Kontrolle durch kantonale Fachstelle oder delegierte Organisation. Indikatorpflanzen z.B.: Margerite, Salbei, Esparsette, Wiesenflockenblume, Knolliger Hahnenfuss, Aufrechte Trespe.',
    notes: 'QII-Beitrag: 1520 CHF/ha total (= QI 450 + QII-Zuschlag 1070). Hoechster Flaechenanteil der QII-Flaechen.',
  },
  {
    id: 'wenig-intensiv-wiese-qii',
    name: 'Wenig intensiv genutzte Wiese',
    quality_level: 'QII',
    payment_chf_ha: 1020,
    min_area_pct: 0,
    botanical_criteria: 'Mindestens 6 Indikatorpflanzen (analog extensiv, aber angepasste Artenliste fuer Fettwiesen).',
    notes: 'QII-Beitrag: 1020 CHF/ha total (= QI 300 + QII-Zuschlag 720).',
  },
  {
    id: 'streuflaeche-qii',
    name: 'Streuflaeche',
    quality_level: 'QII',
    payment_chf_ha: 1370,
    min_area_pct: 0,
    botanical_criteria: 'Mindestens 6 Indikatorpflanzen (spezifische Riedarten: Seggen, Wollgras, Mehlprimel, Sumpfdotterblume).',
    notes: 'QII-Beitrag: 1370 CHF/ha total (= QI 450 + QII-Zuschlag 920). Hochwertige Flachmoore.',
  },
  {
    id: 'hecke-qii',
    name: 'Hecke, Feld- und Ufergehoelz',
    quality_level: 'QII',
    payment_chf_ha: 2050,
    min_area_pct: 0,
    botanical_criteria: 'Mindestens 5 Straucharten, davon min. 3 dornentragend. Totholzanteil. Gepflegter Krautsaum mit Indikatorarten.',
    notes: 'QII-Beitrag: 2050 CHF/ha total (= QI 1700 + QII-Zuschlag 350). Dornenstraeucher wichtig fuer Neuntoeter.',
  },
  {
    id: 'hochstamm-feldobst-qii',
    name: 'Hochstamm-Feldobstbaeume',
    quality_level: 'QII',
    payment_chf_ha: 0,
    min_area_pct: 0,
    botanical_criteria: 'Mindestens 10 Hochstammbaeume pro ha, mindestens 2 Sorten. Unternutzung als QII-Wiese oder -Weide.',
    notes: 'Beitrag pro Baum (30 CHF/Baum QII). Vernetzung: Obstgarten im Vernetzungsperimeter.',
  },
  {
    id: 'vernetzung',
    name: 'Vernetzungsbeitrag',
    quality_level: 'QI',
    payment_chf_ha: 1000,
    min_area_pct: 0,
    botanical_criteria: 'BFF-Flaeche liegt in einem kantonalen Vernetzungsprojekt. Lage, Typ und Pflege gemaess Vernetzungskonzept. Zielarten definiert.',
    notes: 'Zusaetzlich zu QI/QII-Beitraegen. Kantonale Vernetzungsprojekte mit Leitarten (z.B. Feldlerche, Neuntoeter). Max. 1000 CHF/ha.',
  },

  // BFF minimum requirements
  {
    id: 'bff-minimum-ln',
    name: 'Mindestanteil BFF auf LN',
    quality_level: 'QI',
    payment_chf_ha: 0,
    min_area_pct: 7,
    botanical_criteria: 'Mindestens 7% der landwirtschaftlichen Nutzflaeche (LN) als BFF (alle BFF-Typen zusammen).',
    notes: 'OELN-Pflicht. Gilt fuer alle Betriebe mit Direktzahlungen. Spezialkulturen: 3.5% auf offener Ackerflaeche.',
  },
  {
    id: 'bff-minimum-acker',
    name: 'Mindestanteil BFF auf Ackerflaeche',
    quality_level: 'QI',
    payment_chf_ha: 0,
    min_area_pct: 3.5,
    botanical_criteria: 'Ab 2024: Mindestens 3.5% der offenen Ackerflaeche als BFF (Buntbrache, Rotationsbrache, Saum, Nuetzlingsstreifen, Bluehstreifen).',
    notes: 'Neue Anforderung ab 2024 (Pa.Iv. 19.475). Vorher nur 7% auf gesamter LN. Ackerflaechen-BFF haben hohe oekologische Wirkung.',
  },
];

const insertBff = db.instance.prepare(
  `INSERT OR REPLACE INTO bff_types (id, name, quality_level, payment_chf_ha, min_area_pct, botanical_criteria, notes, jurisdiction, language)
   VALUES (?, ?, ?, ?, ?, ?, ?, 'CH', 'DE')`
);

for (const b of bffTypes) {
  insertBff.run(b.id, b.name, b.quality_level, b.payment_chf_ha, b.min_area_pct, b.botanical_criteria, b.notes);
}

console.log(`Inserted ${bffTypes.length} BFF types`);

// ---------------------------------------------------------------------------
// 5. Naehrstoffverlust-Absenkpfad — Pa.Iv. 19.475, LwG Art. 6a
// ---------------------------------------------------------------------------

interface NutrientLossLimit {
  nutrient: string;
  year: number;
  limit_pct: number;
  target: string;
  legal_basis: string;
  notes: string;
}

const nutrientLossLimits: NutrientLossLimit[] = [
  // Stickstoff (N)
  {
    nutrient: 'N',
    year: 2023,
    limit_pct: 0,
    target: 'Referenzjahr (Durchschnitt 2014-2016)',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Basiswert: Durchschnitt der Stickstoffverluste 2014-2016.',
  },
  {
    nutrient: 'N',
    year: 2025,
    limit_pct: 10,
    target: '-10% Stickstoffverluste gegenueber Referenz',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Zwischenziel. Verschaerfte Suisse-Bilanz: Toleranzgrenze N sinkt auf 105% (vorher 110%).',
  },
  {
    nutrient: 'N',
    year: 2027,
    limit_pct: 15,
    target: '-15% Stickstoffverluste gegenueber Referenz',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Zwischenziel. Bei Nichterreichen: Verschaerfung der Massnahmen durch Bundesrat.',
  },
  {
    nutrient: 'N',
    year: 2030,
    limit_pct: 20,
    target: '-20% Stickstoffverluste gegenueber Referenz',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Endziel. Massnahmen: emissionsarme Ausbringung, N-angepasste Fuetterung, optimierte Hofdungerlagerung, reduzierte Mineraldungermengen.',
  },
  // Phosphor (P)
  {
    nutrient: 'P',
    year: 2023,
    limit_pct: 0,
    target: 'Referenzjahr (Durchschnitt 2014-2016)',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Basiswert: Durchschnitt der Phosphorverluste 2014-2016.',
  },
  {
    nutrient: 'P',
    year: 2025,
    limit_pct: 10,
    target: '-10% Phosphorverluste gegenueber Referenz',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Zwischenziel. Suisse-Bilanz P-Toleranz bleibt bei 100% (war bereits strenger als N).',
  },
  {
    nutrient: 'P',
    year: 2027,
    limit_pct: 15,
    target: '-15% Phosphorverluste gegenueber Referenz',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Zwischenziel. Erosionsschutz und Pufferstreifen als Hauptmassnahmen.',
  },
  {
    nutrient: 'P',
    year: 2030,
    limit_pct: 20,
    target: '-20% Phosphorverluste gegenueber Referenz',
    legal_basis: 'LwG Art. 6a (Pa.Iv. 19.475)',
    notes: 'Endziel. Massnahmen: Bodenschutz, Pufferstreifen, Abflussverhinderung, P-effiziente Fuetterung.',
  },
];

const insertNutrientLoss = db.instance.prepare(
  `INSERT OR REPLACE INTO nutrient_loss_limits (nutrient, year, limit_pct, target, legal_basis, notes, jurisdiction, language)
   VALUES (?, ?, ?, ?, ?, ?, 'CH', 'DE')`
);

for (const l of nutrientLossLimits) {
  insertNutrientLoss.run(l.nutrient, l.year, l.limit_pct, l.target, l.legal_basis, l.notes);
}

console.log(`Inserted ${nutrientLossLimits.length} nutrient loss limits`);

// ---------------------------------------------------------------------------
// 6. Environmental Rules — UVP, VBBo, general rules
// ---------------------------------------------------------------------------

interface EnvironmentalRule {
  topic: string;
  rule: string;
  authority: string;
  legal_basis: string;
  threshold: string | null;
  notes: string;
}

const environmentalRules: EnvironmentalRule[] = [
  // UVP — Umweltvertraeglichkeitspruefung
  {
    topic: 'UVP',
    rule: 'UVP-Pflicht Schweinehaltung',
    authority: 'Kanton (Bau- und Umweltamt)',
    legal_basis: 'UVPV Anhang Ziff. 80.4',
    threshold: 'Ab 500 Mastschweinplaetze oder 150 Zuchtsauenplaetze',
    notes: 'Schwellenwerte kantonal leicht abweichend. UVP-Bericht durch anerkanntes Buero. Kosten ca. 20,000-50,000 CHF.',
  },
  {
    topic: 'UVP',
    rule: 'UVP-Pflicht Gefluegelhaltung',
    authority: 'Kanton (Bau- und Umweltamt)',
    legal_basis: 'UVPV Anhang Ziff. 80.4',
    threshold: 'Ab 10,000 Legehennenplaetze oder 20,000 Mastpouletplaetze',
    notes: 'Grosse Gefluegelbetriebe. Emissionen (NH3, Staub, Geruch) im Fokus.',
  },
  {
    topic: 'UVP',
    rule: 'UVP-Pflicht Rindviehhaltung',
    authority: 'Kanton (Bau- und Umweltamt)',
    legal_basis: 'UVPV Anhang Ziff. 80.4',
    threshold: 'Ab ca. 150-200 GVE Rindvieh (kantonal unterschiedlich)',
    notes: 'Kantonale Schwellenwerte variieren stark. Einige Kantone: UVP ab 150 GVE, andere ab 200 GVE.',
  },
  {
    topic: 'UVP',
    rule: 'UVP-Pflicht Biogasanlage',
    authority: 'Kanton (Bau- und Umweltamt)',
    legal_basis: 'UVPV Anhang Ziff. 21',
    threshold: 'Ab 5,000 t Jahreskapazitaet Substrat',
    notes: 'Landwirtschaftliche Biogasanlagen. Co-Substrate (Abfaelle) erhoehen UVP-Wahrscheinlichkeit.',
  },
  {
    topic: 'UVP',
    rule: 'UVP-Pflicht Gewaesserverbauung und Melioration',
    authority: 'Kanton (Tiefbauamt / Umweltamt)',
    legal_basis: 'UVPV Anhang Ziff. 30.2 / 80.3',
    threshold: 'Gueterzusammenlegungen ab 400 ha, groessere Gewaesserverbauungen',
    notes: 'Meliorationen und Gueterzusammenlegungen. Auch Drainageprojekte ab gewisser Groesse.',
  },

  // VBBo — Schwermetall-Richtwerte
  {
    topic: 'VBBo',
    rule: 'Richtwert Cadmium (Cd) im Boden',
    authority: 'BAFU / kantonale Fachstelle Bodenschutz',
    legal_basis: 'VBBo Art. 8 / Anhang 1',
    threshold: 'Richtwert 0.8 mg Cd/kg TS',
    notes: 'Bei Ueberschreitung: Nutzungseinschraenkungen fuer Nahrungsmittelpflanzen. Sanierungswert: 2 mg/kg. Quellen: Mineraldunger (Phosphatduenger), Klaerschlamm (seit 2006 verboten).',
  },
  {
    topic: 'VBBo',
    rule: 'Richtwert Kupfer (Cu) im Boden',
    authority: 'BAFU / kantonale Fachstelle Bodenschutz',
    legal_basis: 'VBBo Art. 8 / Anhang 1',
    threshold: 'Richtwert 40 mg Cu/kg TS',
    notes: 'Bei Ueberschreitung: Einschraenkung Hofdungerausbringung. Sanierungswert: 150 mg/kg. Quellen: Kupferspritzmittel (Rebbau, Obstbau), Schweineguelle.',
  },
  {
    topic: 'VBBo',
    rule: 'Richtwert Zink (Zn) im Boden',
    authority: 'BAFU / kantonale Fachstelle Bodenschutz',
    legal_basis: 'VBBo Art. 8 / Anhang 1',
    threshold: 'Richtwert 150 mg Zn/kg TS',
    notes: 'Bei Ueberschreitung: Duengungs-Einschraenkungen. Sanierungswert: 300 mg/kg. Quellen: Schweineguelle (Zink als Futterzusatz), Klaerschlamm.',
  },
  {
    topic: 'VBBo',
    rule: 'Richtwert Blei (Pb) im Boden',
    authority: 'BAFU / kantonale Fachstelle Bodenschutz',
    legal_basis: 'VBBo Art. 8 / Anhang 1',
    threshold: 'Richtwert 50 mg Pb/kg TS',
    notes: 'Bei Ueberschreitung: Nutzungseinschraenkungen fuer Gemuese. Sanierungswert: 200 mg/kg. Quellen: historisch (verbleites Benzin), Altlasten.',
  },
  {
    topic: 'VBBo',
    rule: 'Massnahmen bei Ueberschreitung Richtwerte',
    authority: 'Kantonale Fachstelle Bodenschutz',
    legal_basis: 'VBBo Art. 9-10',
    threshold: null,
    notes: 'Stufenmodell: (1) Richtwert ueberschritten = vertiefte Abklaerung, (2) Pruefwert ueberschritten = Gefaehrdungsabschaetzung, (3) Sanierungswert ueberschritten = Nutzungseinschraenkung/Sanierung. Bodenanalyse alle 10-15 Jahre empfohlen.',
  },

  // Gewaesserraum
  {
    topic: 'Gewaesserschutz',
    rule: 'Gewaesserraum — Mindestbreite',
    authority: 'Kanton (Tiefbauamt / Umweltamt)',
    legal_basis: 'GSchG Art. 36a / GSchV Art. 41a-41c',
    threshold: null,
    notes: 'Kantone legen Gewaesserraum fest: Mindestbreite 11m bei Fliessgewaessern, mehr bei groesseren Gewaessern. Im Gewaesserraum: keine Bauten, keine Duengung, extensive Bewirtschaftung. Entschaedigung moeglich.',
  },
  {
    topic: 'Gewaesserschutz',
    rule: 'Hofdungerannahmevertrag',
    authority: 'Kanton (Amt fuer Landwirtschaft)',
    legal_basis: 'DZV Art. 24 / GSchG',
    threshold: null,
    notes: 'Pflicht bei Hofdungerabgabe und -aufnahme zwischen Betrieben. Vertrag muss Menge, Naehrstoffgehalt und Abgabe-/Annahmezeitpunkt enthalten. Kantonale Meldepflicht (HODUFLU-System).',
  },
  {
    topic: 'Gewaesserschutz',
    rule: 'Lagerkapazitaet Hofdunger',
    authority: 'BAFU / Kanton',
    legal_basis: 'GSchV Anhang 2 Ziff. 23',
    threshold: 'Mindestens 5 Monate Lagerkapazitaet (Talzone), 6 Monate (Bergzone)',
    notes: 'Ausreichende Lagerkapazitaet verhindert Ausbringung bei unguenstigen Bedingungen (Frost, Naesse, Sommer). Einige Kantone verlangen mehr (z.B. LU: 6 Monate Talzone).',
  },
  {
    topic: 'Gewaesserschutz',
    rule: 'Ausbringverbot Hofdunger',
    authority: 'Kanton',
    legal_basis: 'ChemRRV Anhang 2.6 Ziff. 3.2.1',
    threshold: null,
    notes: 'Kein Hofdunger auf wassergesaettigte, gefrorene, schneebedeckte oder ausgetrocknete Boeden. Sommersperrfrist: einige Kantone verbieten Ausbringung im Sommer bei hohen Temperaturen.',
  },

  // Allgemeine Umweltregeln
  {
    topic: 'Erosionsschutz',
    rule: 'Angemessener Bodenschutz (OELN)',
    authority: 'BLW / Kanton',
    legal_basis: 'DZV Anhang 1 Ziff. 5 (OELN)',
    threshold: null,
    notes: 'OELN-Anforderung: Erosionsschutzmassnahmen auf erosionsgefaehrdeten Flaechen (>2t/ha/Jahr Bodenabtrag). Massnahmen: Mulchsaat, Begruenung, Untersaat, Hangquerbearbeitung, Pufferstreifen.',
  },
  {
    topic: 'PSM-Gewaesserschutz',
    rule: 'Aktionsplan Pflanzenschutzmittel — 50% Risikoreduktion',
    authority: 'BLW / BAFU',
    legal_basis: 'Aktionsplan PSM (Bundesrat 2017)',
    threshold: '50% Risikoreduktion fuer Oberflaechengewaesser und Grundwasser bis 2027',
    notes: 'Massnahmen: PSM-freie Pufferstreifen, Abdriftminderungstechnik, Reduktion besonders gewaessertoxischer Wirkstoffe, Foerderung biologischer Alternativen.',
  },
];

const insertRule = db.instance.prepare(
  `INSERT OR REPLACE INTO environmental_rules (topic, rule, authority, legal_basis, threshold, notes, jurisdiction, language)
   VALUES (?, ?, ?, ?, ?, ?, 'CH', 'DE')`
);

for (const r of environmentalRules) {
  insertRule.run(r.topic, r.rule, r.authority, r.legal_basis, r.threshold, r.notes);
}

console.log(`Inserted ${environmentalRules.length} environmental rules`);

// ---------------------------------------------------------------------------
// 7. FTS5 Search Index — populate from all tables
// ---------------------------------------------------------------------------

db.run('DELETE FROM search_index');

// Water protection zones
const wpzRows = db.all<{ zone_type: string; name: string; restrictions: string; description: string }>(
  'SELECT zone_type, name, restrictions, description FROM water_protection_zones'
);
const insertFts = db.instance.prepare(
  'INSERT INTO search_index (title, body, topic, jurisdiction) VALUES (?, ?, ?, ?)'
);

for (const z of wpzRows) {
  insertFts.run(
    `Grundwasserschutzzone ${z.zone_type} — ${z.name}`,
    `${z.restrictions} ${z.description}`,
    'Gewaesserschutz',
    'CH'
  );
}

// Buffer zones
const bzRows = db.all<{ type: string; distance_m: number; requirement: string; notes: string }>(
  'SELECT type, distance_m, requirement, notes FROM buffer_zones'
);
for (const b of bzRows) {
  insertFts.run(
    `Pufferstreifen ${b.type} (${b.distance_m}m)`,
    `${b.requirement} ${b.notes ?? ''}`,
    'Pufferstreifen',
    'CH'
  );
}

// Ammonia rules
const arRows = db.all<{ technique: string; requirement: string; notes: string }>(
  'SELECT technique, requirement, notes FROM ammonia_rules'
);
for (const a of arRows) {
  insertFts.run(
    `Ammoniakemissionen — ${a.technique}`,
    `${a.requirement} ${a.notes ?? ''}`,
    'Ammoniak',
    'CH'
  );
}

// BFF types
const bffRows = db.all<{ name: string; quality_level: string; botanical_criteria: string; notes: string }>(
  'SELECT name, quality_level, botanical_criteria, notes FROM bff_types'
);
for (const b of bffRows) {
  insertFts.run(
    `BFF ${b.quality_level} — ${b.name}`,
    `${b.botanical_criteria} ${b.notes ?? ''}`,
    'BFF',
    'CH'
  );
}

// Nutrient loss limits
const nllRows = db.all<{ nutrient: string; year: number; target: string; notes: string }>(
  'SELECT nutrient, year, target, notes FROM nutrient_loss_limits'
);
for (const l of nllRows) {
  insertFts.run(
    `Absenkpfad ${l.nutrient} ${l.year}`,
    `${l.target} ${l.notes ?? ''}`,
    'Naehrstoffe',
    'CH'
  );
}

// Environmental rules
const erRows = db.all<{ topic: string; rule: string; legal_basis: string; notes: string }>(
  'SELECT topic, rule, legal_basis, notes FROM environmental_rules'
);
for (const r of erRows) {
  insertFts.run(
    r.rule,
    `${r.legal_basis} ${r.notes ?? ''}`,
    r.topic,
    'CH'
  );
}

const ftsCount = db.get<{ count: number }>('SELECT COUNT(*) as count FROM search_index');
console.log(`FTS5 index rebuilt: ${ftsCount?.count ?? 0} entries`);

// ---------------------------------------------------------------------------
// 8. Metadata
// ---------------------------------------------------------------------------

db.run(`INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)`, [now]);
db.run(`INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('build_date', ?)`, [now]);
db.run(`INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('schema_version', '1.0')`, []);

// ---------------------------------------------------------------------------
// 9. Coverage JSON + sources YAML
// ---------------------------------------------------------------------------

const coverage = {
  server: 'ch-environmental-compliance-mcp',
  jurisdiction: 'CH',
  version: '0.1.0',
  last_ingest: now,
  data: {
    water_protection_zones: waterProtectionZones.length,
    buffer_zones: bufferZones.length,
    ammonia_rules: ammoniaRules.length,
    bff_types: bffTypes.length,
    nutrient_loss_limits: nutrientLossLimits.length,
    environmental_rules: environmentalRules.length,
    fts_entries: ftsCount?.count ?? 0,
  },
  tools: 11,
  sources: [
    'BAFU — GSchG/GSchV (Gewaesserschutz)',
    'BAFU — LRV (Luftreinhaltung, Ammoniak)',
    'BLW — DZV (BFF, OELN)',
    'Agroscope — Agrammon (Emissionsfaktoren)',
    'Parlament — Pa.Iv. 19.475 (Absenkpfad)',
    'BAFU — VBBo (Bodenbelastung)',
  ],
};

writeFileSync('data/coverage.json', JSON.stringify(coverage, null, 2) + '\n');

const sourcesYml = `# Data sources for ch-environmental-compliance-mcp
sources:
  - name: Gewaesserschutzgesetz (GSchG) / Gewaesserschutzverordnung (GSchV)
    authority: BAFU (Bundesamt fuer Umwelt)
    url: https://www.bafu.admin.ch/bafu/de/home/themen/wasser/fachinformationen/gewaesserschutz.html
    license: Swiss Federal Administration — free reuse
    update_frequency: periodic (amendments as enacted)
    last_retrieved: "${now}"

  - name: Luftreinhalte-Verordnung (LRV) / Agrammon
    authority: BAFU / Agroscope
    url: https://www.bafu.admin.ch/bafu/de/home/themen/luft/fachinformationen/luftschadstoffquellen/emissionen-der-landwirtschaft.html
    license: Swiss Federal Administration — free reuse
    update_frequency: periodic (Agrammon model updates)
    last_retrieved: "${now}"

  - name: Direktzahlungsverordnung (DZV) — BFF und OELN
    authority: BLW (Bundesamt fuer Landwirtschaft)
    url: https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen/biodiversitaetsbeitraege.html
    license: Swiss Federal Administration — free reuse
    update_frequency: annual (DZV revisions)
    last_retrieved: "${now}"

  - name: Pa.Iv. 19.475 — Absenkpfad Naehrstoffverluste
    authority: Parlament / BLW
    url: https://www.blw.admin.ch/blw/de/home/nachhaltige-produktion/umwelt/naehrstoffe.html
    license: Swiss Federal Administration — free reuse
    update_frequency: annual targets through 2030
    last_retrieved: "${now}"

  - name: VBBo — Verordnung ueber Belastungen des Bodens
    authority: BAFU
    url: https://www.bafu.admin.ch/bafu/de/home/themen/boden/fachinformationen/bodenschutz.html
    license: Swiss Federal Administration — free reuse
    update_frequency: periodic
    last_retrieved: "${now}"
`;

writeFileSync('data/sources.yml', sourcesYml);

console.log('\nIngestion complete:');
console.log(`  Water protection zones: ${waterProtectionZones.length}`);
console.log(`  Buffer zone rules: ${bufferZones.length}`);
console.log(`  Ammonia rules: ${ammoniaRules.length}`);
console.log(`  BFF types: ${bffTypes.length}`);
console.log(`  Nutrient loss limits: ${nutrientLossLimits.length}`);
console.log(`  Environmental rules: ${environmentalRules.length}`);
console.log(`  FTS5 entries: ${ftsCount?.count ?? 0}`);
console.log(`  Coverage: data/coverage.json`);
console.log(`  Sources: data/sources.yml`);

db.close();
