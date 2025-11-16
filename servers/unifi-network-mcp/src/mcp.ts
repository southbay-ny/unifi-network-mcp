import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  loadTargets,
  HttpClient,
  TargetConfig,
  listSites,
  getSysinfo,
  getDevices,
  getClients,
  getAlarms
} from './index.js';

let targets: TargetConfig[];
let targetIndex: Map<string, TargetConfig>;
let httpClients: Map<string, HttpClient>;

const server = new Server({
  name: 'unifi-network-mcp',
  version: '0.1.0'
}, {
  capabilities: {
    tools: {}
  }
});

function getContext(targetId: string) {
  const target = targetIndex.get(targetId);
  if (!target) throw new Error(`Unknown target '${targetId}'`);
  let client = httpClients.get(targetId);
  if (!client) {
    client = new HttpClient(target);
    httpClients.set(targetId, client);
  }
  return { target, client };
}

function createSuccess(tool: string, targetId: string, payload: Record<string, unknown>) {
  const data = {
    tool,
    targetId,
    ...payload
  };
  const text = JSON.stringify(data, null, 2);
  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: data
  };
}

function createError(tool: string, targetId: string, err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const payload = {
    tool,
    targetId,
    error: message
  };
  return {
    content: [{ type: 'text' as const, text: `Error: ${message}` }],
    structuredContent: payload,
    isError: true
  };
}

// Tool input schemas and types
const listTargetsInputSchema = z.object({});
type ListTargetsInput = z.infer<typeof listTargetsInputSchema>;

const listSitesInputSchema = z.object({
  targetId: z.string().optional(),
  raw: z.boolean().optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  filter: z.string().optional()
});
type ListSitesInput = z.infer<typeof listSitesInputSchema>;

const getSysinfoInputSchema = z.object({
  targetId: z.string().optional(),
  site: z.string().optional(),
  raw: z.boolean().optional()
});
type GetSysinfoInput = z.infer<typeof getSysinfoInputSchema>;

const getDevicesInputSchema = z.object({
  targetId: z.string().optional(),
  site: z.string().optional(),
  raw: z.boolean().optional(),
  macs: z.array(z.string()).optional()
});
type GetDevicesInput = z.infer<typeof getDevicesInputSchema>;

const getClientsInputSchema = z.object({
  targetId: z.string().optional(),
  site: z.string().optional(),
  raw: z.boolean().optional(),
  activeOnly: z.boolean().optional()
});
type GetClientsInput = z.infer<typeof getClientsInputSchema>;

const getAlarmsInputSchema = z.object({
  targetId: z.string().optional(),
  site: z.string().optional(),
  raw: z.boolean().optional(),
  archived: z.boolean().optional()
});
type GetAlarmsInput = z.infer<typeof getAlarmsInputSchema>;

// Tool result union type
type ToolResult = { content: Array<{ type: 'text'; text: string }>; structuredContent: Record<string, unknown> } | { content: Array<{ type: 'text'; text: string }>; structuredContent: Record<string, unknown>; isError: true };

async function handleTool<T>(
  tool: string,
  targetId: string,
  fn: () => Promise<T>
): Promise<ToolResult> {
  try {
    const result = await fn();
    const payload = typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : { result };
    return createSuccess(tool, targetId, payload);
  } catch (err) {
    return createError(tool, targetId, err);
  }
}

// Define tool schemas with JSON Schema conversion
const tools = [
  {
    name: 'list_targets',
    description: 'List configured UniFi controller targets (ids and metadata, no secrets)',
    inputSchema: zodToJsonSchema(listTargetsInputSchema)
  },
  {
    name: 'list_sites',
    description: 'List all sites available on a UniFi controller target',
    inputSchema: zodToJsonSchema(listSitesInputSchema)
  },
  {
    name: 'get_sysinfo',
    description: 'Retrieve UniFi controller and site sysinfo',
    inputSchema: zodToJsonSchema(getSysinfoInputSchema)
  },
  {
    name: 'get_devices',
    description: 'Retrieve UniFi devices (switches, APs, gateways) for a site',
    inputSchema: zodToJsonSchema(getDevicesInputSchema)
  },
  {
    name: 'get_clients',
    description: 'Retrieve active or known clients for a UniFi site',
    inputSchema: zodToJsonSchema(getClientsInputSchema)
  },
  {
    name: 'get_alarms',
    description: 'Retrieve UniFi alarms for a site',
    inputSchema: zodToJsonSchema(getAlarmsInputSchema)
  }
];

// Register tools list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  // list_targets takes no arguments
  if (name === 'list_targets') {
    return createSuccess('list_targets', 'global', {
      targets: targets.map(({ id, base_url, controller_type, default_site }) => ({
        id,
        base_url,
        controller_type,
        default_site
      }))
    });
  }

  if (!args) {
    throw new Error(`Tool '${name}' requires arguments`);
  }
  const a = args as any;

  // If only one target is configured and targetId is missing or empty,
  // default to that single target to reduce friction in Codex.
  const targetId: string | undefined = (a.targetId as string | undefined) ||
    (targets.length === 1 ? targets[0].id : undefined);

  switch (name) {
    case 'list_sites':
      if (!targetId) throw new Error("Tool 'list_sites' requires a targetId");
      return handleTool('list_sites', targetId, async () => {
        const { target, client } = getContext(targetId);
        const result = await listSites(target, client, (a.raw as boolean) ?? false, {
          offset: a.offset as number | undefined,
          limit: a.limit as number | undefined,
          filter: a.filter as string | undefined
        });
        return createSuccess('list_sites', targetId, { result });
      });
    
    case 'get_sysinfo':
      if (!targetId) throw new Error("Tool 'get_sysinfo' requires a targetId");
      return handleTool('get_sysinfo', targetId, async () => {
        const { target, client } = getContext(targetId);
        const result = await getSysinfo(target, client, a.site as string, (a.raw as boolean) ?? false);
        return createSuccess('get_sysinfo', targetId, { result });
      });
    
    case 'get_devices':
      if (!targetId) throw new Error("Tool 'get_devices' requires a targetId");
      return handleTool('get_devices', targetId, async () => {
        const { target, client } = getContext(targetId);
        const result = await getDevices(target, client, {
          site: a.site as string,
          raw: (a.raw as boolean) ?? false,
          macs: a.macs as string[]
        });
        return createSuccess('get_devices', targetId, { result });
      });
    
    case 'get_clients':
      if (!targetId) throw new Error("Tool 'get_clients' requires a targetId");
      return handleTool('get_clients', targetId, async () => {
        const { target, client } = getContext(targetId);
        const result = await getClients(target, client, {
          site: a.site as string,
          raw: (a.raw as boolean) ?? false,
          active_only: (a.activeOnly as boolean) ?? false
        });
        return createSuccess('get_clients', targetId, { result });
      });
    
    case 'get_alarms':
      if (!targetId) throw new Error("Tool 'get_alarms' requires a targetId");
      return handleTool('get_alarms', targetId, async () => {
        const { target, client } = getContext(targetId);
        const result = await getAlarms(target, client, {
          site: a.site as string,
          raw: (a.raw as boolean) ?? false,
          archived: (a.archived as boolean) ?? false
        });
        return createSuccess('get_alarms', targetId, { result });
      });
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  // Initialize targets after environment is set up
  targets = loadTargets();
  targetIndex = new Map<string, TargetConfig>(targets.map(t => [t.id, t]));
  httpClients = new Map<string, HttpClient>();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Keep the process alive to handle incoming MCP messages
  process.stdin.resume();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
