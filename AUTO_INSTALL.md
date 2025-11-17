# Auto-Installing MCP Wrapper

The `auto-install-mcp.sh` script provides automatic download and caching of the UniFi Network MCP, similar to how `npx` or `uv` work. This eliminates the need for manual installation steps.

## How It Works

1. **First run**: Downloads the latest release from GitHub and caches it in `~/.cache/unifi-network-mcp`
2. **Subsequent runs**: Uses the cached version (instant startup)
3. **Version management**: Can pin to specific versions or always use latest

## Usage

### Basic (always use latest)
```bash
./auto-install-mcp.sh
```

### Pin to specific version
```bash
UNIFI_MCP_VERSION=v0.1.0 ./auto-install-mcp.sh
```

### Custom cache location
```bash
UNIFI_MCP_CACHE_DIR=/custom/path ./auto-install-mcp.sh
```

## Configuration for AI Tools

### Codex
```toml
[mcp_servers.unifi-network-mcp]
    command = "/path/to/auto-install-mcp.sh"
    args = []
    [mcp_servers.unifi-network-mcp.env]
        UNIFI_TARGETS = '[...]'
        # Optional: UNIFI_MCP_VERSION = "v0.1.0"
```

### OpenCode
```json
{
  "mcp": {
    "unifi-network": {
      "type": "local",
      "command": ["/path/to/auto-install-mcp.sh"],
      "environment": {
        "UNIFI_TARGETS": "[...]"
      }
    }
  }
}
```

### Windsurf
- **Command**: `/path/to/auto-install-mcp.sh`
- **Environment**: Add `UNIFI_TARGETS` variable

## Benefits

✅ **Zero manual installation** - Just point to the script, it handles the rest  
✅ **Automatic updates** - Set `UNIFI_MCP_VERSION=latest` to always get newest  
✅ **Version pinning** - Lock to specific version for stability  
✅ **Shared cache** - Multiple tools can use the same cached installation  
✅ **Offline-friendly** - Once cached, works without internet  

## Distribution

Users can download just the wrapper script:

```bash
# Download the auto-installer
curl -o auto-install-mcp.sh https://raw.githubusercontent.com/southbay-ny/unifi-network-mcp/main/auto-install-mcp.sh
chmod +x auto-install-mcp.sh

# Configure and run (downloads MCP automatically on first run)
export UNIFI_TARGETS='[...]'
./auto-install-mcp.sh
```

This is **much simpler** than the manual installation process!

## Cache Management

### View cached version
```bash
cat ~/.cache/unifi-network-mcp/.version
```

### Force reinstall
```bash
rm -rf ~/.cache/unifi-network-mcp
./auto-install-mcp.sh  # Will download fresh
```

### Check cache size
```bash
du -sh ~/.cache/unifi-network-mcp
# ~7.4 MB
```

## Comparison

| Method | Installation Steps | Updates | Disk Usage |
|--------|-------------------|---------|------------|
| **Auto-installer** | 1 (download script) | Automatic | 7.4 MB (cached) |
| Manual tarball | 3 (download, extract, configure) | Manual | 7.4 MB per install |
| From source | 5 (clone, install deps, build, configure) | Manual | ~50 MB (includes dev deps) |

## Advanced: Hosting Your Own Wrapper

You can host the auto-installer on your own infrastructure:

```bash
# On your server
curl -o /usr/local/bin/unifi-mcp https://raw.githubusercontent.com/southbay-ny/unifi-network-mcp/main/auto-install-mcp.sh
chmod +x /usr/local/bin/unifi-mcp

# Users just run
unifi-mcp
```

This makes it as easy as any system command!
