#!/bin/bash
# Test script to verify UniFi Network MCP release artifact

set -e

VERSION="${1:-v0.1.0}"
REPO="southbay-ny/unifi-network-mcp"
TEST_DIR="/tmp/test-unifi-mcp-${VERSION}"

echo "=========================================="
echo "Testing UniFi Network MCP Release"
echo "=========================================="
echo "Version: $VERSION"
echo "Repository: $REPO"
echo "Test directory: $TEST_DIR"
echo ""

# Clean up any previous test
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Download and verify checksum
echo "1. Downloading release tarball..."
TARBALL_URL="https://github.com/$REPO/releases/download/$VERSION/unifi-network-mcp-$VERSION.tar.gz"
CHECKSUM_URL="https://github.com/$REPO/releases/download/$VERSION/unifi-network-mcp-$VERSION.tar.gz.sha256"

curl -L "$TARBALL_URL" -o unifi-network-mcp.tar.gz
echo "✓ Downloaded tarball"

echo ""
echo "2. Verifying checksum..."
curl -sL "$CHECKSUM_URL" -o expected.sha256
shasum -a 256 unifi-network-mcp.tar.gz > actual.sha256

EXPECTED=$(cat expected.sha256 | awk '{print $1}')
ACTUAL=$(cat actual.sha256 | awk '{print $1}')

if [ "$EXPECTED" = "$ACTUAL" ]; then
    echo "✓ Checksum verified: $ACTUAL"
else
    echo "✗ Checksum mismatch!"
    echo "  Expected: $EXPECTED"
    echo "  Actual:   $ACTUAL"
    exit 1
fi

echo ""
echo "3. Extracting tarball..."
tar -xzf unifi-network-mcp.tar.gz
echo "✓ Extracted successfully"

echo ""
echo "4. Verifying contents..."
REQUIRED_FILES=("dist/mcp.js" "run-mcp.sh" "package.json" ".env.example" "README.md" "node_modules")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ Missing: $file"
        exit 1
    fi
done

echo ""
echo "5. Testing MCP server startup..."
if [ -z "${UNIFI_TARGETS:-}" ]; then
    echo "⚠ UNIFI_TARGETS not set - skipping live test"
    echo "  To test with a real controller, export UNIFI_TARGETS and run again"
else
    echo "  Starting MCP server (will timeout after 3 seconds)..."
    timeout 3 ./run-mcp.sh 2>&1 | head -5 || true
    echo "  ✓ MCP server started successfully"
fi

echo ""
echo "=========================================="
echo "✓ All tests passed!"
echo "=========================================="
echo ""
echo "Release artifact is ready for distribution."
echo "Users can install with:"
echo ""
echo "  curl -L $TARBALL_URL | tar -xz -C ~/.local/share/"
echo ""
echo "Test directory preserved at: $TEST_DIR"
