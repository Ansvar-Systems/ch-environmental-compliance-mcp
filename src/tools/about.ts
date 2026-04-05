import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Switzerland Environmental Compliance MCP',
    description:
      'Swiss environmental compliance data for agriculture: Gewaesserschutz (GSchG), Grundwasserschutzzonen, ' +
      'Pufferstreifen, Ammoniakemissionen (LRV, Agrammon), Biodiversitaetsfoerderflaechen (BFF), ' +
      'Naehrstoffverlust-Absenkpfad (Pa.Iv. 19.475), UVP-Schwellenwerte, and Bodenbelastung (VBBo). ' +
      'Covers federal regulations and cantonal implementation for Swiss agricultural operations.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'BAFU — Gewaesserschutz, Luftreinhaltung, Biodiversitaet',
      'BLW — OELN-Auflagen, BFF-Typen, DZV',
      'Agroscope — Agrammon Ammoniakemissionsfaktoren',
      'Kantonale Umweltaemter — Grundwasserschutzzonen',
    ],
    tools_count: 11,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/ansvar-systems/ch-environmental-compliance-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
