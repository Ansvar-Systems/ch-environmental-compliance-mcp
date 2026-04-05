import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'Gewaesserschutzgesetz (GSchG) / Gewaesserschutzverordnung (GSchV)',
      authority: 'BAFU (Bundesamt fuer Umwelt)',
      official_url: 'https://www.bafu.admin.ch/bafu/de/home/themen/wasser/fachinformationen/gewaesserschutz.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'periodic (amendments as enacted)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Grundwasserschutzzonen S1-S3/Sm/Zu, Pufferstreifen, Gewaesserraum',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Luftreinhalte-Verordnung (LRV) / Ammoniak-Emissionsfaktoren',
      authority: 'BAFU / Agroscope',
      official_url: 'https://www.bafu.admin.ch/bafu/de/home/themen/luft/fachinformationen/luftschadstoffquellen/emissionen-der-landwirtschaft.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'periodic (Agrammon model updates)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Ammoniakemissionen nach Ausbringtechnik, Lagerung, Tierkategorie',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Direktzahlungsverordnung (DZV) — BFF-Typen und OELN',
      authority: 'BLW (Bundesamt fuer Landwirtschaft)',
      official_url: 'https://www.blw.admin.ch/blw/de/home/instrumente/direktzahlungen/biodiversitaetsbeitraege.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'annual (with DZV revisions)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'BFF-Typen QI/QII, Beitraege, Mindestanteil, botanische Kriterien',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Pa.Iv. 19.475 — Absenkpfad Naehrstoffverluste',
      authority: 'Parlament / BLW',
      official_url: 'https://www.blw.admin.ch/blw/de/home/nachhaltige-produktion/umwelt/naehrstoffe.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'annual targets through 2030',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'N- und P-Verlust-Reduktionsziele, jaehrliche Absenkpfade',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'VBBo — Verordnung ueber Belastungen des Bodens',
      authority: 'BAFU',
      official_url: 'https://www.bafu.admin.ch/bafu/de/home/themen/boden/fachinformationen/bodenschutz.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'periodic',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Schwermetall-Richtwerte (Cd, Cu, Zn, Pb), Massnahmen bei Ueberschreitung',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta(),
  };
}
