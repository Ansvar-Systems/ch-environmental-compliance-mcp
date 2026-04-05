# Tools Reference

## Meta Tools

### `about`

Get server metadata: name, version, coverage, data sources, and links.

**Parameters:** None

**Returns:** Server name, version, jurisdiction list, data source names, tool count, homepage/repository links.

---

### `list_sources`

List all data sources with authority, URL, license, and freshness info.

**Parameters:** None

**Returns:** Array of data sources, each with `name`, `authority`, `official_url`, `retrieval_method`, `update_frequency`, `license`, `coverage`, `last_retrieved`.

---

### `check_data_freshness`

Check when data was last ingested, staleness status, and how to trigger a refresh.

**Parameters:** None

**Returns:** `status` (fresh/stale/unknown), `last_ingest`, `days_since_ingest`, `staleness_threshold_days`, `refresh_command`.

---

## Domain Tools

### `search_environmental_rules`

Search Swiss environmental compliance rules across all topics: Gewaesserschutz, Ammoniak, BFF, Pufferstreifen, VBBo, UVP. Use for broad queries.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Free-text search query (German or English) |
| `topic` | string | No | Filter by topic (e.g. Gewaesserschutz, Ammoniak, BFF, UVP, VBBo) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |
| `limit` | number | No | Max results (default: 20, max: 50) |

**Example:** `{ "query": "Schleppschlauch Ammoniak" }`

---

### `get_water_protection_zones`

Get Grundwasserschutzzonen (S1, S2, S3, Sm, Zu) with restrictions and legal basis. Based on GSchG/GSchV.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zone_type` | string | No | Zone type: S1, S2, S3, Sm, Zu (omit for all zones) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Example:** `{ "zone_type": "S2" }`

---

### `get_buffer_zone_rules`

Get Pufferstreifen (buffer zone) distances and requirements along water bodies, hedges, and field boundaries. Based on OELN/ChemRRV.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `zone_type` | string | No | Buffer type filter (e.g. Gewaesser, Hecke, Nachbar, SPe) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Example:** `{ "zone_type": "Gewaesser" }`

---

### `get_ammonia_rules`

Get Ammoniakemissionen rules: emission factors by technique, Schleppschlauch-Pflicht, Agrammon model parameters. Based on LRV.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `technique` | string | No | Application technique filter (e.g. Schleppschlauch, Prallteller, Injektion) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Example:** `{ "technique": "Schleppschlauch" }`

---

### `get_bff_requirements`

Get Biodiversitaetsfoerderflaechen (BFF) types, QI/QII payment rates, minimum area requirements, and botanical criteria. Based on DZV.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bff_type` | string | No | BFF type filter (e.g. extensiv-wiese, buntbrache, hecke) |
| `quality_level` | string | No | Quality level: QI or QII |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Example:** `{ "quality_level": "QII" }`

---

### `get_nutrient_loss_limits`

Get Pa.Iv. 19.475 nutrient loss reduction targets (Absenkpfad) for N and P through 2030. Yearly milestones and Suisse-Bilanz tolerance changes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nutrient` | string | No | Nutrient filter: N (Stickstoff) or P (Phosphor) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Example:** `{ "nutrient": "N" }`

---

### `get_eip_requirements`

Get UVP (Umweltvertraeglichkeitspruefung) thresholds for agricultural buildings and VBBo Richtwerte for soil contamination.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_type` | string | No | Project type filter (e.g. Stallbau, Biogasanlage, Schweinehaltung) |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Example:** `{ "project_type": "Stallbau" }`

---

### `check_environmental_compliance`

Check which environmental rules apply to a given agricultural operation: water protection, buffer zones, ammonia, BFF, UVP, nutrient loss limits.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `facility_type` | string | Yes | Type of operation (e.g. Milchwirtschaft, Schweinehaltung, Ackerbau, Gemuese) |
| `animal_count` | number | No | Number of animals (GVE) -- used for ammonia and UVP thresholds |
| `area_ha` | number | No | Farm area in hectares -- used for BFF minimum calculations |
| `jurisdiction` | string | No | ISO 3166-1 alpha-2 code (default: CH) |

**Example:** `{ "facility_type": "Milchwirtschaft", "animal_count": 60, "area_ha": 35 }`
