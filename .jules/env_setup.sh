#!/bin/bash
# Jules environment setup
# Docs: https://jules.google/docs/environment/

set -euo pipefail

echo "Setting up storagemaxxing environment..."

echo "--- Diagnostic Information ---"
echo "User: $(whoami)"
echo "Git Commit: $(git rev-parse --short HEAD) ($(git log -1 --format=%cI))"
echo "------------------------------"

# Install mise if missing
if ! command -v mise &> /dev/null; then
    echo "Installing mise..."
    MISE_VERSION="v2025.1.0"
    curl -L "https://github.com/jdx/mise/releases/download/${MISE_VERSION}/mise-${MISE_VERSION}-linux-x64" > ~/.local/bin/mise
    chmod +x ~/.local/bin/mise
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "Installing tools with mise..."
mise trust
mise install
eval "$(mise activate bash)"
eval "$(mise env bash)"

if ! grep -q "mise activate bash" ~/.bashrc; then
    echo 'eval "$(mise activate bash)"' >> ~/.bashrc
fi

if command -v bun &> /dev/null; then
    echo "Bun version: $(bun --version)"
else
    echo "Error: Bun not found after mise install"
    exit 1
fi

if command -v bd &> /dev/null; then
    echo "Beads version: $(bd version)"
else
    echo "Error: Beads (bd) not found after mise install"
    exit 1
fi

echo "Installing dependencies..."
bun install --frozen-lockfile

echo "Environment ready"
