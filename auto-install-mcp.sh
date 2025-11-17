#!/bin/bash
# Auto-installing wrapper for UniFi Network MCP
# Downloads and caches the MCP on first run, then executes it
# Similar to npx or uv behavior

set -euo pipefail

REPO="southbay-ny/unifi-network-mcp"
INSTALL_DIR="${UNIFI_MCP_CACHE_DIR:-$HOME/.cache/unifi-network-mcp}"
VERSION="${UNIFI_MCP_VERSION:-latest}"
LOCK_FILE="$INSTALL_DIR/.version"

# Function to get the actual version tag for "latest"
get_latest_version() {
    curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
}

# Function to download and install
install_mcp() {
    local version=$1
    echo "Installing UniFi Network MCP $version..." >&2
    
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    # Clean up any partial installs
    rm -rf dist node_modules run-mcp.sh package.json .env.example README.md
    
    # Download tarball
    local download_url="https://github.com/$REPO/releases/download/$version/unifi-network-mcp-$version.tar.gz"
    echo "Downloading from $download_url..." >&2
    
    if ! curl -fsSL "$download_url" | tar -xz; then
        echo "ERROR: Failed to download or extract MCP" >&2
        exit 1
    fi
    
    # Record installed version
    echo "$version" > "$LOCK_FILE"
    echo "✓ Installed UniFi Network MCP $version to $INSTALL_DIR" >&2
}

# Check if we need to install or update
if [ "$VERSION" = "latest" ]; then
    ACTUAL_VERSION=$(get_latest_version)
else
    ACTUAL_VERSION=$VERSION
fi

NEEDS_INSTALL=false

if [ ! -f "$INSTALL_DIR/run-mcp.sh" ]; then
    echo "UniFi Network MCP not found in cache" >&2
    NEEDS_INSTALL=true
elif [ ! -f "$LOCK_FILE" ]; then
    echo "Version lock file missing, reinstalling" >&2
    NEEDS_INSTALL=true
elif [ "$VERSION" != "latest" ] && [ "$(cat "$LOCK_FILE")" != "$ACTUAL_VERSION" ]; then
    echo "Requested version $ACTUAL_VERSION differs from cached $(cat "$LOCK_FILE")" >&2
    NEEDS_INSTALL=true
fi

if [ "$NEEDS_INSTALL" = true ]; then
    install_mcp "$ACTUAL_VERSION"
else
    echo "Using cached UniFi Network MCP $(cat "$LOCK_FILE") from $INSTALL_DIR" >&2
fi

# Execute the MCP server
cd "$INSTALL_DIR"
exec ./run-mcp.sh "$@"
