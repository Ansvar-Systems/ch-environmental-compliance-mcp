# Changelog

## [0.1.0] - 2026-04-05

### Added

- Initial release with 11 MCP tools (3 meta + 8 domain)
- SQLite + FTS5 database with schema for water protection zones, buffer zones, ammonia rules, BFF types, nutrient loss limits, environmental rules (UVP + VBBo)
- Compliance checker that evaluates applicable rules for a given agricultural operation
- Dual transport: stdio (npm) and Streamable HTTP (Docker)
- Jurisdiction validation (CH supported)
- Data freshness monitoring with 90-day staleness threshold
- Docker image with non-root user, health check
- CI/CD: TypeScript build, lint, test, CodeQL, Gitleaks, GHCR image build, npm publish
- Bilingual DE/EN disclaimer covering GSchG, LRV, DZV, VBBo, UVPV
