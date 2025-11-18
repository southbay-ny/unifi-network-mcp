Here is a summary and structured documentation of the UniFi Control Plane API page in a format suitable for input into another LLM:

***

**UniFi Control Plane API – Key Concepts & Endpoints**

***

**Overview**

- Each UniFi Application has its own local API endpoints with analytics and control functions specific to the application. For unified insights across all sites, use the UniFi Site Manager API.

***

**Authentication**

- Use an API Key for authenticating requests. Keys are generated in the Integrations section of the UniFi application.

***

**Filtering (for GET/DELETE Endpoints)**

- Filter endpoints via the `filter` query parameter.
- Syntax:
  - **Property Expressions**: `property.function(args)`
    - Example: `id.eq(123)` — id equals 123
  - **Compound Expressions**: `and(expression1, expression2)`, `or(expression1, expression2)`
    - Example: `and(name.isNull(), createdAt.gt(2025-01-01))`
  - **Negation**: `not(expression)`
    - Example: `not(name.like('guest*'))`

- **Supported Types**:
  - STRING: `'value'`
  - NUMBER: `123`, `123.321`
  - TIMESTAMP: `2025-01-29`, `2025-01-29T12:39:11Z`
  - BOOLEAN: `true`, `false`
  - UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

- **Functions**:
  - `isNull`, `isNotNull`, `eq`, `ne`, `gt`, `ge`, `lt`, `le`, `like`, `in`, `notIn`
  - Example for pattern matching: `name.like('guest*')` (matches guest1, guest100, etc.)

***

**Error Format**

```json
{
  "statusCode": 400,
  "statusName": "UNAUTHORIZED",
  "message": "Missing credentials",
  "timestamp": "2024-11-27T08:13:46.966Z",
  "requestPath": "/integration/v1/sites/123",
  "requestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

***

**Endpoints and Operations**

### Application Info
- **GET /v1/info**  
Returns application version, e.g. `{ "applicationVersion": "9.1.0" }`

### Sites
- **GET /v1/sites**
  - Params: `offset`, `limit`, `filter`
  - Response: paginated list including count and totalCount

### UniFi Devices
- **POST /v1/sites/{siteId}/devices/{deviceId}/interfaces/ports/{portIdx}/actions**
  - Action on device port (e.g., `POWER_CYCLE`)
  - Request: `{ "action": "POWER_CYCLE" }`

- **POST /v1/sites/{siteId}/devices/{deviceId}/actions**
  - Action on device (e.g., `RESTART`)
  - Request: `{ "action": "RESTART" }`

- **GET /v1/sites/{siteId}/devices**
  - List all adopted devices (supporting pagination)

- **GET /v1/sites/{siteId}/devices/{deviceId}**
  - Get detailed info for a device

- **GET /v1/sites/{siteId}/devices/{deviceId}/statistics/latest**
  - Real-time stats (uptime, CPU/memory, network rates)

### Clients
- **POST /v1/sites/{siteId}/clients/{clientId}/actions**
  - Actions: AUTHORIZE_GUEST_ACCESS, UNAUTHORIZE_GUEST_ACCESS
  - Example payload:
    ```json
    {
      "action": "AUTHORIZE_GUEST_ACCESS",
      "timeLimitMinutes": 1,
      "dataUsageLimitMBytes": 1,
      "rxRateLimitKbps": 2,
      "txRateLimitKbps": 2
    }
    ```

- **GET /v1/sites/{siteId}/clients**
  - List connected clients

- **GET /v1/sites/{siteId}/clients/{clientId}**
  - Get client details

### Hotspot Vouchers
- **GET /v1/sites/{siteId}/hotspot/vouchers**
  - List vouchers (supports filtering, pagination)

- **POST /v1/sites/{siteId}/hotspot/vouchers**
  - Generate voucher(s)
  - Request fields: `count`, `name`, `authorizedGuestLimit`, `timeLimitMinutes`, `dataUsageLimitMBytes`, `rxRateLimitKbps`, `txRateLimitKbps`

- **DELETE /v1/sites/{siteId}/hotspot/vouchers**
  - Remove vouchers (by filter)

- **GET /v1/sites/{siteId}/hotspot/vouchers/{voucherId}**
  - Get voucher details

- **DELETE /v1/sites/{siteId}/hotspot/vouchers/{voucherId}**
  - Remove a specific voucher

***

**General Notes**

- All relevant endpoints support pagination and/or filtering for querying lists.
- Actions require specific path parameters and, where relevant, JSON request bodies.
- Error responses include a unique requestId for troubleshooting.

***

Copy-paste the above into any LLM for understanding or documentation use. If you need code examples or additional formatting, specify the endpoint or feature.

[1](https://<unifi_host>/unifi-api/network)