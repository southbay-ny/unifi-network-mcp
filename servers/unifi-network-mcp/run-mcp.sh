#!/bin/bash
# Wrapper script for UniFi MCP server
# Set UNIFI_TARGETS from environment variable or secure source

set -euo pipefail

# Require UNIFI_TARGETS to be set in the environment; do not fall back to config files.
if [ -z "${UNIFI_TARGETS:-}" ]; then
	echo "ERROR: UNIFI_TARGETS is not set" >&2
	echo "Set UNIFI_TARGETS in your environment (e.g., via personal-access-tokens.env) before starting the MCP server." >&2
	exit 1
fi

# Validate that UNIFI_TARGETS is valid JSON (if jq is available)
if command -v jq >/dev/null 2>&1; then
    if ! echo "$UNIFI_TARGETS" | jq empty >/dev/null 2>&1; then
        echo "ERROR: UNIFI_TARGETS is not valid JSON" >&2
        exit 1
    fi
fi

echo "UNIFI_TARGETS configured successfully" >&2

# Build if needed
if [ ! -f "dist/mcp.js" ]; then
    echo "Building MCP server..." >&2
    npm run build >&2
fi

# Run the MCP server directly so stdout is pure JSON RPC
exec node dist/mcp.js
