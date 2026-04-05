# Switzerland Environmental Compliance MCP

[![CI](https://github.com/ansvar-systems/ch-environmental-compliance-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/ansvar-systems/ch-environmental-compliance-mcp/actions/workflows/ci.yml)
[![GHCR](https://github.com/ansvar-systems/ch-environmental-compliance-mcp/actions/workflows/ghcr-build.yml/badge.svg)](https://github.com/ansvar-systems/ch-environmental-compliance-mcp/actions/workflows/ghcr-build.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Swiss environmental compliance data for agriculture via the [Model Context Protocol](https://modelcontextprotocol.io). Water protection zones, buffer strips, ammonia emissions, biodiversity areas, nutrient loss targets, EIA thresholds, and soil contamination limits -- all from your AI assistant.

Part of [Ansvar Open Agriculture](https://ansvar.eu/open-agriculture).

## Why This Exists

Swiss farms must comply with federal environmental regulations across several domains: Gewaesserschutz (GSchG/GSchV), ammonia emissions (LRV), Biodiversitaetsfoerderflaechen (DZV), the Pa.Iv. 19.475 nutrient loss reduction pathway, and UVP/VBBo for building permits and soil protection. These rules are published by BAFU, BLW, and Agroscope but scattered across ordinances, fact sheets, and cantonal guidance. This MCP server brings them together in a structured, searchable format.

## Quick Start

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ch-environmental-compliance": {
      "command": "npx",
      "args": ["-y", "@ansvar/ch-environmental-compliance-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add ch-environmental-compliance npx @ansvar/ch-environmental-compliance-mcp
```

### Streamable HTTP (remote)

```
https://mcp.ansvar.eu/ch-environmental-compliance/mcp
```

### Docker (self-hosted)

```bash
docker run -p 3000:3000 ghcr.io/ansvar-systems/ch-environmental-compliance-mcp:latest
```

### npm (stdio)

```bash
npx @ansvar/ch-environmental-compliance-mcp
```

## Example Queries

Ask your AI assistant:

- "Welche Grundwasserschutzzonen gibt es und was ist dort verboten?"
- "Wie breit muessen Pufferstreifen an Gewaessern sein?"
- "Ab wann gilt die Schleppschlauch-Pflicht fuer Guellausbringung?"
- "Welche BFF-Typen erhalten QII-Beitraege?"
- "Was sind die Naehrstoffverlust-Reduktionsziele fuer 2027?"
- "Check compliance for a 60-head dairy farm on 35 hectares"

## Stats

| Metric | Value |
|--------|-------|
| Tools | 11 (3 meta + 8 domain) |
| Jurisdiction | CH |
| Data sources | BAFU (GSchG/GSchV, LRV, VBBo), BLW (DZV, OELN), Agroscope (Agrammon), Parlament (Pa.Iv. 19.475) |
| License (data) | Swiss Federal Administration -- free reuse |
| License (code) | Apache-2.0 |
| Transport | stdio + Streamable HTTP |

## Tools

| Tool | Description |
|------|-------------|
| `about` | Server metadata and links |
| `list_sources` | Data sources with freshness info |
| `check_data_freshness` | Staleness status and refresh command |
| `search_environmental_rules` | FTS5 search across all environmental compliance topics |
| `get_water_protection_zones` | Grundwasserschutzzonen S1-S3/Sm/Zu with restrictions |
| `get_buffer_zone_rules` | Pufferstreifen distances and requirements |
| `get_ammonia_rules` | Ammoniakemissionen by technique (LRV) |
| `get_bff_requirements` | BFF types, QI/QII payment rates, botanical criteria |
| `get_nutrient_loss_limits` | Pa.Iv. 19.475 N/P reduction targets through 2030 |
| `get_eip_requirements` | UVP thresholds and VBBo soil contamination limits |
| `check_environmental_compliance` | Applicable rules for a given agricultural operation |

See [TOOLS.md](TOOLS.md) for full parameter documentation.

## Security Scanning

This repository runs security checks on every push:

- **CodeQL** -- static analysis for JavaScript/TypeScript
- **Gitleaks** -- secret detection across full history
- **Dependency review** -- via Dependabot

See [SECURITY.md](SECURITY.md) for reporting policy.

## Disclaimer

This data is for reference only. **Always consult the relevant cantonal authority or BAFU before taking action.** This tool is not legal or environmental compliance advice. See [DISCLAIMER.md](DISCLAIMER.md).

## Contributing

Issues and pull requests welcome. For security vulnerabilities, email security@ansvar.eu (do not open a public issue).

## License

Apache-2.0. Data sourced from Swiss Federal Administration publications under free-reuse principles.
