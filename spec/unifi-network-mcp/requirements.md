# Feature: UniFi Network MCP Server

## Introduction
A Model Context Protocol (MCP) server that connects to one or more UniFi Network/UniFi OS controllers to retrieve metrics, inventory, logs/events, and general deployment information across sites. It supports multiple controller targets, credentials or tokens, robust authentication/session handling, and read-only data retrieval via well-known UniFi Network API endpoints.

## Requirements
1. User Story: As a platform engineer, I want a unified MCP server that can query multiple UniFi controllers for inventory, metrics, events, and deployment info, so that I can integrate this data into automations, monitoring, and troubleshooting workflows.
2. The system shall support configuring multiple controller targets with attributes: `id`, `base_url`, `controller_type` (unifi_os|classic), `default_site`, `auth` (username/password or API key/token), `verify_ssl`, `timeout`, `rate_limit_per_sec`.
3. The system shall authenticate for UniFi OS controllers via `POST /api/auth/login` with JSON body `{username,password}` and maintain the session cookie; for classic controllers via `POST /api/login`.
4. The system shall include the `X-CSRF-Token` header where required by UniFi OS for state-changing endpoints and some GETs; token value obtained from login response/cookie when available.
5. The system shall route UniFi OS Network Application requests through `/proxy/network/api/...` (e.g., `/proxy/network/api/s/{site}/stat/device`), and classic controllers through `/api/...` (e.g., `/api/s/{site}/stat/device`).
6. The system shall provide read-only tools for:
   1. Sites: list all sites on a controller (`/integration/v1/sites` for API key targets, legacy `/api/self/sites` otherwise).
   2. Inventory: get devices via `/integration/v1/sites/{siteId}/devices` (API key) or `stat/device` (legacy) and clients via `/integration/v1/sites/{siteId}/clients` (API key) or `rest/user` + `stat/sta` (legacy).
   3. Logs: get alarms (`stat/alarm`, `rest/alarm`, with archived filter).
   4. Deployment info: get controller/system info via `/integration/v1/info` or legacy `stat/sysinfo` + `/status` when available.
7. The system shall support pagination/limits and time filtering where available (e.g., events, sessions) and surface truncation indications (e.g., `meta.count`).
8. The system shall expose a capability to select `site` per call overriding the controller default.
9. The system shall normalize responses to stable schemas and surface raw payloads when requested (pass-through mode).
10. The system shall clearly return errors with HTTP status, controller `meta.rc`/`meta.msg` when present, and a normalized error message.
11. The system shall support TLS options: `verify_ssl` toggle (default true) and optional `ca_bundle_path`. Self-signed controllers must be supported.
12. The system shall never log secrets and shall redact tokens/passwords in logs and error messages.
13. The system shall support per-controller rate limiting and request timeouts with safe defaults.
14. The system shall be read-only; mutation endpoints (cmd/rest PUT/POST/DELETE) are explicitly out of scope.
15. The system shall provide lightweight caching (configurable TTL) for high-frequency, low-volatility endpoints (e.g., `stat/health`, `stat/sysinfo`).
16. The system shall include basic connectivity checks for each target (login + `self` or `status`).
17. The system shall include automated tests covering: auth/session, UniFi OS vs classic routing, endpoints above (happy-path), errors (401/403/5xx), and SSL verification toggles.
18. The system shall document configuration and example tool invocations with expected response shapes.

## Edge Cases and Constraints
1. Sites with large histories (events/alarms) impose limits (e.g., ~3000 items); the system shall document and implement paging/`since` parameters where supported.
2. Controllers may return truncated results with `meta.count`; the system shall surface this to the caller.
3. UniFi OS requires path prefix `/proxy/network` whereas classic controllers do not; the system shall abstract this from callers via target configuration.
4. Self-signed certificates are common; the system shall allow disabling verification and/or specifying a CA bundle while warning in logs when verification is disabled.
5. Some endpoints differ on UDM/UniFi OS (e.g., `api/users/self`, `api/system/reboot`); read-only scope avoids device control.
6. Multiple sites per controller; calls must accept `site` and default to controller’s `default_site` if omitted.

## Security and Privacy
1. Credentials and tokens shall be supplied via environment variables or secure configuration; no secrets in source control.
2. Secrets shall never be logged; request/response logging must redact `Authorization`, cookies, CSRF tokens, passwords.
3. TLS verification is on by default; disabling shall be explicit and logged as a warning.

## Success Criteria
1. Given two configured controller targets (UniFi OS and classic), listing sites returns both sets successfully.
2. Fetching inventory returns devices and clients for a given site with stable schema and raw payload pass-through on demand.
3. Fetching events and alarms supports time range and pagination with truncation surfaced when applicable.
4. Health and sysinfo endpoints return current status and controller version/uptime.
5. All calls succeed with self-signed certs when verification is disabled.

## References (non-official and community sources)
- UniFi Controller API (community doc, reverse-engineered):
  "These are REST calls... All commands are presumed to be prefixed with api/s/{site} ... UDM Pros use api/auth/login and /proxy/network/api/s/{site}/..."
  https://ubntwiki.com/products/software/unifi-controller/api
- Art of WiFi API client (endpoints coverage and UniFi OS notes):
  https://github.com/Art-of-WiFi/UniFi-API-client
- UniFi API browser (browse data collections):
  https://github.com/Art-of-WiFi/UniFi-API-browser
- Unpoller Go client (inventory/metrics examples):
  https://pkg.go.dev/github.com/unpoller/unifi
- Official UniFi API (general getting started/aggregation APIs; UniFi OS app-specific docs in developer portal):
  https://help.ui.com/hc/en-us/articles/30076656117655-Getting-Started-with-the-Official-UniFi-API
