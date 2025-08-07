---
title: Installation
sidebar_position: 1
---

`gblend` Installation
---

:::prerequisite[Required dependencies]

**Docker** - Required for reproducible WASM builds

```bash
# macOS
brew install --cask docker

# Linux
sudo apt-get install docker.io

# Verify installation
docker --version
```

:::

## Installation

### Quick Install (Recommended)

```bash
# Install gblendup installer
curl -sSL https://raw.githubusercontent.com/fluentlabs-xyz/gblend/refs/tags/latest/gblendup/install | bash

# Restart terminal or source your shell configuration
source ~/.bashrc  # or ~/.zshrc

# Install gblend
gblendup

# Verify installation
gblend --version
```

:::warning[Important Migration Note]

If you have an older version of gblend installed via Cargo, you must uninstall it first:

```bash
# Remove old Cargo-installed version
cargo uninstall gblend
```

The new version is distributed via a shell installer script, not through Cargo.
:::

## Updating gblend

To update gblend to the latest version:

```bash
# Simply run gblendup again
gblendup
```
