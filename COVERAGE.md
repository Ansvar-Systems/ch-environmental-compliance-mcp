# Coverage

## What Is Included

- **Water protection zones** (Grundwasserschutzzonen): S1, S2, S3, Sm, Zu with restrictions and legal basis from GSchG/GSchV
- **Buffer zones** (Pufferstreifen): distances and requirements along water bodies, hedges, field boundaries from OELN/ChemRRV
- **Ammonia emission rules**: emission factors by application technique, Schleppschlauch-Pflicht, Agrammon parameters from LRV
- **Biodiversity areas** (BFF): types, QI/QII payment rates, minimum area requirements, botanical criteria from DZV
- **Nutrient loss limits**: Pa.Iv. 19.475 Absenkpfad for N and P through 2030, yearly milestones, Suisse-Bilanz tolerances
- **Environmental impact assessment** (UVP): thresholds for agricultural buildings from UVPV
- **Soil contamination** (VBBo): Richtwerte for heavy metals (Cd, Cu, Zn, Pb) and remediation triggers

## Data Counts

| Table | Records |
|-------|---------|
| Water protection zones | 5 |
| Buffer zones | 9 |
| Ammonia rules | 10 |
| BFF types | 18 |
| Nutrient loss limits | 8 |
| Environmental rules (UVP + VBBo) | 16 |
| FTS5 search entries | 66 |

## Jurisdictions

| Code | Country | Status |
|------|---------|--------|
| CH | Switzerland | Supported |

## What Is NOT Included

- **Cantonal implementation details** -- federal rules only; cantonal ordinances and derogations vary by canton
- **Real-time cantonal zone maps** -- Grundwasserschutzzonen are mapped by cantons; this server lists the zone types and restrictions, not spatial data
- **Pesticide product approvals** -- covered by the Swiss Plant Protection Products Register (BLW), not this server
- **Animal welfare regulations** (TSchG/TSchV) -- separate legal domain
- **Agricultural direct payment calculations** -- DZV BFF payment rates are included, but full Suisse-Bilanz calculations require farm-specific inputs
- **Cross-compliance details** (OELN full checklist) -- only environmental compliance topics are covered
- **EU regulation cross-references** -- Swiss environmental law is federal, not EU-harmonised for agriculture

## Known Gaps

1. BFF botanical quality criteria are summarised; full species lists per BFF type are not included
2. Agrammon emission factor detail depends on model version at time of ingestion
3. VBBo Richtwerte cover the most common heavy metals; trace organics are not included
4. Pa.Iv. 19.475 targets may be revised by Parliament before 2030 -- check BLW publications

## Data Freshness

Run `check_data_freshness` to see when data was last updated. The ingestion pipeline runs monthly; manual triggers available via `gh workflow run ingest.yml`.
