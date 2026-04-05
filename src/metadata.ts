export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'Diese Daten dienen ausschliesslich der Information und stellen keine rechtliche oder umweltfachliche ' +
  'Beratung dar. Vor Massnahmen im Gewaesserschutz, bei Ammoniakemissionen oder Biodiversitaetsfoerderflaechen ' +
  'ist stets die zustaendige kantonale Fachstelle oder das BAFU zu konsultieren. Die Daten basieren auf dem ' +
  'Gewaesserschutzgesetz (GSchG, SR 814.20), der Gewaesserschutzverordnung (GSchV, SR 814.201), der ' +
  'Luftreinhalte-Verordnung (LRV, SR 814.318.142.1), der Direktzahlungsverordnung (DZV, SR 910.13) sowie ' +
  'Publikationen von BAFU, BLW und Agroscope. Kantonale Abweichungen und betriebsspezifische Auflagen sind ' +
  'eigenstaendig zu pruefen. / ' +
  'This data is provided for informational purposes only and does not constitute legal or environmental ' +
  'compliance advice. Always consult the relevant cantonal authority or BAFU before taking action. Data sourced ' +
  'from GSchG, LRV, DZV, BAFU, BLW, and Agroscope publications.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://www.bafu.admin.ch/bafu/de/home/themen/wasser/fachinformationen/gewaesserschutz.html',
    copyright: 'Data: BAFU, BLW, Agroscope — used under public-sector information principles. Server: Apache-2.0 Ansvar Systems.',
    server: 'ch-environmental-compliance-mcp',
    version: '0.1.0',
    ...overrides,
  };
}
