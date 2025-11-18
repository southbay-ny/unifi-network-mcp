# UniFi Network MCP (read-only)

Read-only data retriever for the UniFi **Network** application (UniFi OS and classic). Provides TypeScript library functions, a CLI, and an MCP server for LLM clients.

## Features
- Multiple controller targets with independent auth, TLS, timeouts, rate limits.
- Auth flows: UniFi OS via `POST /api/auth/login` and classic via `POST /api/login`.
- Routing: UniFi OS under `/proxy/network/api/...`, classic under `/api/...`.
- Network Integration API (API key) support:
  - `GET /integration/v1/info` → `get_sysinfo`
  - `GET /integration/v1/sites` → `list_sites`
  - `GET /integration/v1/sites/{siteId}/devices` → `get_devices`
  - `GET /integration/v1/sites/{siteId}/clients` → `get_clients`
  - `GET|POST /integration/v1/sites/{siteId}/hotspot/vouchers` (future)
- Legacy controller API (session/cookie) support:
  - alarms (`rest/alarm`), sysinfo (`stat/sysinfo` + `/status`)
  - Additional endpoints (health, events, reports) are being deprecated from the MCP because they are **not** exposed by the UniFi Network Integration API and return HTTP 401 for API-key targets.
- Read-only only. No mutations.

> **Scope note:** When connecting with an API key generated from the UniFi Network Integrations UI, only the Integration API endpoints listed above are guaranteed to work on UniFi Dream Machine / UniFi OS controllers. Endpoints such as `stat/health`, `stat/event`, and `stat/report` require username/password authentication and are not available to Integration API keys.

## Configure
Set `UNIFI_TARGETS` in your environment (preferred) or in a private `.env` file that you source before running the MCP. JSON shape:

```
[
  {
    "id": "home",
    "base_url": "https://<unifi_host>",
    "controller_type": "unifi_os",
    "default_site": "default",
    "auth": { "apiKey": "${UNIFI_API_KEY}", "headerName": "X-API-KEY" },
    "verify_ssl": false,
    "timeout_ms": 20000,
    "rate_limit_per_sec": 5
  }
]
```

Example `personal-access-tokens.env` snippet:

```
export UNIFI_TARGETS='[
  {
    "id": "home",
    "base_url": "https://<unifi_host>",
    "controller_type": "unifi_os",
    "default_site": "default",
    "auth": { "apiKey": "REDACTED", "headerName": "X-API-KEY" },
    "verify_ssl": false,
    "timeout_ms": 20000,
    "rate_limit_per_sec": 5
  }
]'
```

> The legacy `~/.config/unifi-controller-mcp/unifi-targets.json` file is no longer read by `run-mcp.sh`; use environment variables instead.

Note: For self-signed certs, set `verify_ssl=false`. Never commit secrets.

## Install & Build

```
npm install
npm run build
```

## Run CLI (list sites)

```
# ensure .env has UNIFI_TARGETS, then:
npm run start

# or dev mode with ts-node
yarn dev # or npm run dev
```

Expected output per target:

```
{
  "target": "udm-se",
  "sites": [{"id":"...","name":"default","desc":"Default"}]
}
```

## Library usage

```
import { loadTargets, HttpClient, listSites } from 'unifi-network-mcp';
const targets = loadTargets();
const http = new HttpClient(targets[0]);
const res = await listSites(targets[0], http);
console.log(res.data);
```

## Next
- Add MCP server adapter using `@modelcontextprotocol/sdk`, exposing the read-only tools as MCP tools.
- Add tests and fixtures.

## Environment verification

Use the bundled script to confirm your `UNIFI_TARGETS` configuration and credentials:

```
npm run test:env
```

It prints each target, ensures TLS behavior matches your flags, and issues a `listSites` call to verify the controller accepts the provided login/API key. Failures will surface the HTTP status or parsing error so you can tune the env vars before running the MCP server.
