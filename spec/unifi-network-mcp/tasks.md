# Implementation Tasks: UniFi Controller MCP Server

- [x] 1. Scaffold MCP server (TypeScript, Node.js)
  - Initialize project: package.json, tsconfig.json, eslint.
  - Add deps: axios (HTTP), tough-cookie + axios-cookiejar-support (sessions), bottleneck (rate limit), zod (schemas), node-cache (TTL), winston/pino (logging), dotenv.
  - Create src/index.ts (MCP entry), src/config.ts, src/types.ts, src/logger.ts.
  - Reference: [Req 2, 11, 13]

- [x] 2. Implement configuration loader
  - Load `UNIFI_TARGETS` JSON env (array of targets) with validation via zod.
  - Shape: { id, base_url, controller_type: 'unifi_os'|'classic', default_site, auth: {username,password}|{apiKey}, verify_ssl, ca_bundle_path?, timeout_ms?, rate_limit_per_sec? }.
  - Reference: [Req 2, 11]

- [x] 3. Build HttpClient with TLS, timeouts, and rate limiting
  - Axios instance per-target; support `verify_ssl` and custom CA; apply timeout.
  - Integrate Bottleneck per-target for token bucket.
  - Attach request/response interceptors for redaction and `X-CSRF-Token` injection.
  - Reference: [Req 10, 11, 12, 13]

- [x] 4. Implement SessionManager
  - Login flows: classic `POST /api/login`, UniFi OS `POST /api/auth/login`.
  - Store cookie jar, optionally CSRF token; re-auth on 401/expiry.
  - Thread-safe access; backoff on repeated failures.
  - Reference: [Req 3, 4, 16]

- [x] 5. Implement Router
  - Classic: `/api/s/{site}/{path}`; UniFi OS: `/proxy/network/api/s/{site}/{path}`.
  - Handle `/api/self`, `/api/users/self`, `/status` variations.
  - Reference: [Req 5]

- [x] 6. Define normalized schemas (zod)
  - Site, Device, Client, Event, Alarm, Health, Sysinfo.
  - Result envelope: { data, truncated?, raw? }.
  - Reference: [Req 9]

- [x] 7. Implement tool: listSites
  - Calls `/api/self/sites` or `/api/stat/sites` and normalizes sites.
  - Reference: [Req 6.1]

- [x] 8. Implement tool: getHealth
  - `GET stat/health`; cache TTL default 5s.
  - Reference: [Req 6.2, 15]

- [x] 9. Implement tool: getSysinfo
  - `GET stat/sysinfo`; merge `/status` when available; cache TTL default 5s.
  - Reference: [Req 6.5, 15]

- [x] 10. Implement tool: getDevices
  - `GET stat/device`; on classic support POST filter by `{macs}`; fallback to `stat/device-basic` when needed.
  - Reference: [Req 6.3]

- [x] 11. Implement tool: getClients
  - When `active_only=true` use `stat/sta`; otherwise combine with `rest/user`.
  - Reference: [Req 6.3]

- [x] 12. Implement tool: getEvents
  - `GET stat/event` with `start`, `end`, `limit`; surface `truncated` via `meta.count`.
  - Reference: [Req 6.4, 7]

- [x] 13. Implement tool: getAlarms
  - `GET stat/alarm` and optionally `rest/alarm`; support `archived` filter.
  - Reference: [Req 6.4]

- [x] 14. Implement tool: postReport
  - `POST stat/report/{interval}.{type}` with attributes[], optional macs[].
  - Reference: [Req 6.6]

- [x] 15. Error Normalizer
  - Wrap HTTP status + `meta.rc`/`meta.msg`; codes: unauthorized, forbidden, not_found, timeout, tls_error, controller_error, network_error.
  - Reference: [Req 10]

- [ ] 16. Logging & Redaction
  - Central logger; redact Authorization, cookies, CSRF token, passwords.
  - Reference: [Req 12]

- [ ] 17. Caching layer
  - Node-cache with per-tool TTL; config defaults; disable per-call when `raw=true` or `noCache=true`.
  - Reference: [Req 15]

- [ ] 18. Unit tests
  - Router pathing (classic vs UniFi OS), SessionManager reauth, Error Normalizer, cache, rate limit.
  - Reference: [Req 17]

- [ ] 19. Contract tests with fixtures
  - Normalize devices/clients/events/alarms from captured JSON.
  - Reference: [Req 17]

- [ ] 20. Integration tests (optional)
  - Gated by env; run against test controller with self-signed cert and both controller types; verify TLS off handling.
  - Reference: [Req 11, 17]

- [ ] 21. Connectivity checks tool
  - Implement a simple `pingTarget(target_id)` that logs in and calls `/api/self` or `/status`.
  - Reference: [Req 16]

- [ ] 22. Documentation
  - README: configuration, examples for each tool, expected response shapes, security notes.
  - Reference: [Req 18]
