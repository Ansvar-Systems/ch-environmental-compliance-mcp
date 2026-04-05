import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { createDatabase, type Database } from './db.js';
import { handleAbout } from './tools/about.js';
import { handleListSources } from './tools/list-sources.js';
import { handleCheckFreshness } from './tools/check-freshness.js';
import { handleSearchEnvironmentalRules } from './tools/search-environmental-rules.js';
import { handleGetWaterProtectionZones } from './tools/get-water-protection-zones.js';
import { handleGetBufferZoneRules } from './tools/get-buffer-zone-rules.js';
import { handleGetAmmoniaRules } from './tools/get-ammonia-rules.js';
import { handleGetBffRequirements } from './tools/get-bff-requirements.js';
import { handleGetNutrientLossLimits } from './tools/get-nutrient-loss-limits.js';
import { handleGetEipRequirements } from './tools/get-eip-requirements.js';
import { handleCheckEnvironmentalCompliance } from './tools/check-environmental-compliance.js';

const SERVER_NAME = 'ch-environmental-compliance-mcp';
const SERVER_VERSION = '0.1.0';
const PORT = parseInt(process.env.PORT ?? '3000', 10);

const SearchArgsSchema = z.object({
  query: z.string(),
  topic: z.string().optional(),
  jurisdiction: z.string().optional(),
  limit: z.number().optional(),
});

const WaterProtectionArgsSchema = z.object({
  zone_type: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const BufferZoneArgsSchema = z.object({
  zone_type: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const AmmoniaArgsSchema = z.object({
  technique: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const BffArgsSchema = z.object({
  bff_type: z.string().optional(),
  quality_level: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const NutrientLossArgsSchema = z.object({
  nutrient: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const EipArgsSchema = z.object({
  project_type: z.string().optional(),
  jurisdiction: z.string().optional(),
});

const ComplianceArgsSchema = z.object({
  facility_type: z.string(),
  animal_count: z.number().optional(),
  area_ha: z.number().optional(),
  jurisdiction: z.string().optional(),
});

const TOOLS = [
  {
    name: 'about',
    description: 'Get server metadata: name, version, coverage, data sources, and links.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'list_sources',
    description: 'List all data sources with authority, URL, license, and freshness info.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'check_data_freshness',
    description: 'Check when data was last ingested, staleness status, and how to trigger a refresh.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_environmental_rules',
    description: 'Search Swiss environmental compliance rules across all topics: Gewaesserschutz, Ammoniak, BFF, Pufferstreifen, VBBo, UVP.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Free-text search query (German or English)' },
        topic: { type: 'string', description: 'Filter by topic (e.g. Gewaesserschutz, Ammoniak, BFF, UVP, VBBo)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
        limit: { type: 'number', description: 'Max results (default: 20, max: 50)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_water_protection_zones',
    description: 'Get Grundwasserschutzzonen (S1, S2, S3, Sm, Zu) with restrictions and legal basis. Based on GSchG/GSchV.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        zone_type: { type: 'string', description: 'Zone type: S1, S2, S3, Sm, Zu (omit for all zones)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'get_buffer_zone_rules',
    description: 'Get Pufferstreifen distances and requirements along water bodies, hedges, and boundaries. Based on OELN/ChemRRV.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        zone_type: { type: 'string', description: 'Buffer type filter (e.g. Gewaesser, Hecke, Nachbar, SPe)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'get_ammonia_rules',
    description: 'Get Ammoniakemissionen rules: emission factors by technique, Schleppschlauch-Pflicht, Agrammon parameters. Based on LRV.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        technique: { type: 'string', description: 'Application technique filter (e.g. Schleppschlauch, Prallteller, Injektion)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'get_bff_requirements',
    description: 'Get BFF types, QI/QII payment rates, minimum area requirements, and botanical criteria. Based on DZV.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        bff_type: { type: 'string', description: 'BFF type filter (e.g. extensiv-wiese, buntbrache, hecke)' },
        quality_level: { type: 'string', description: 'Quality level: QI or QII' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'get_nutrient_loss_limits',
    description: 'Get Pa.Iv. 19.475 nutrient loss reduction targets for N and P through 2030.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        nutrient: { type: 'string', description: 'Nutrient filter: N or P' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'get_eip_requirements',
    description: 'Get UVP thresholds for agricultural buildings and VBBo Richtwerte for soil contamination.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        project_type: { type: 'string', description: 'Project type filter (e.g. Stallbau, Biogasanlage)' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
    },
  },
  {
    name: 'check_environmental_compliance',
    description: 'Check which environmental rules apply to a given agricultural operation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        facility_type: { type: 'string', description: 'Type of operation (e.g. Milchwirtschaft, Schweinehaltung, Ackerbau)' },
        animal_count: { type: 'number', description: 'Number of animals (GVE) — used for ammonia and UVP thresholds' },
        area_ha: { type: 'number', description: 'Farm area in hectares — used for BFF minimum calculations' },
        jurisdiction: { type: 'string', description: 'ISO 3166-1 alpha-2 code (default: CH)' },
      },
      required: ['facility_type'],
    },
  },
];

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

function registerTools(server: Server, db: Database): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      switch (name) {
        case 'about':
          return textResult(handleAbout());
        case 'list_sources':
          return textResult(handleListSources(db));
        case 'check_data_freshness':
          return textResult(handleCheckFreshness(db));
        case 'search_environmental_rules':
          return textResult(handleSearchEnvironmentalRules(db, SearchArgsSchema.parse(args)));
        case 'get_water_protection_zones':
          return textResult(handleGetWaterProtectionZones(db, WaterProtectionArgsSchema.parse(args)));
        case 'get_buffer_zone_rules':
          return textResult(handleGetBufferZoneRules(db, BufferZoneArgsSchema.parse(args)));
        case 'get_ammonia_rules':
          return textResult(handleGetAmmoniaRules(db, AmmoniaArgsSchema.parse(args)));
        case 'get_bff_requirements':
          return textResult(handleGetBffRequirements(db, BffArgsSchema.parse(args)));
        case 'get_nutrient_loss_limits':
          return textResult(handleGetNutrientLossLimits(db, NutrientLossArgsSchema.parse(args)));
        case 'get_eip_requirements':
          return textResult(handleGetEipRequirements(db, EipArgsSchema.parse(args)));
        case 'check_environmental_compliance':
          return textResult(handleCheckEnvironmentalCompliance(db, ComplianceArgsSchema.parse(args)));
        default:
          return errorResult(`Unknown tool: ${name}`);
      }
    } catch (err) {
      return errorResult(err instanceof Error ? err.message : String(err));
    }
  });
}

const db = createDatabase();
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: Server }>();

function createMcpServer(): Server {
  const mcpServer = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
  );
  registerTools(mcpServer, db);
  return mcpServer;
}

async function handleMCPRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    await session.transport.handleRequest(req, res);
    return;
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid or missing session ID' }));
    return;
  }

  const mcpServer = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await mcpServer.connect(transport);

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
    mcpServer.close().catch(() => {});
  };

  await transport.handleRequest(req, res);

  if (transport.sessionId) {
    sessions.set(transport.sessionId, { transport, server: mcpServer });
  }
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', server: SERVER_NAME, version: SERVER_VERSION }));
    return;
  }

  if (url.pathname === '/mcp' || url.pathname === '/') {
    try {
      await handleMCPRequest(req, res);
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
      }
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(PORT, () => {
  console.log(`${SERVER_NAME} v${SERVER_VERSION} listening on port ${PORT}`);
});
