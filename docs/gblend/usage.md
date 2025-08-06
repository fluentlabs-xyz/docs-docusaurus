---
title: Using gblend
sidebar_position: 1
---

Using `gblend`
---

`gblend` is a [Foundry Forge](https://github.com/fluentlabs-xyz/gblend) wrapper optimized for Fluent Network and WASM smart contract development.

The CLI usage is nearly identical to standard Forge, with a few Fluent-specific extensions. For example, to verify WASM contracts, you must pass the `--wasm` flag.

:::tip[Differences from Standard Forge]

- **WASM Support**: Native support for WASM contract compilation and deployment
- **Enhanced Verification**: `--wasm` flag for verifying WASM contracts
- **Custom REVM**: Support for the fluentbase REVM implementation.

:::

## Basic Commands

### Project Management

```bash
# Create a new project using Fluent examples
gblend init my-project

# Create project with specific template
gblend init my-project --template <template-name>

# Build your contracts
# For reproducibility, builds are run inside a Docker container.  
# The first build may take longer as the container image needs to be downloaded.
gblend build

# Clean build artifacts
gblend clean
```

When creating a new project without using any specific template, the CLI tool will scaffold the [counter + powercalculator](https://github.com/fluentlabs-xyz/examples/tree/main/counter) example. This is an extension to the default Forge counter example when using `forge init`, adding blended execution.

### Testing

```bash
# Run tests
gblend test

# Run specific test
gblend test --match-test testMyFunction

# Run tests with gas reporting
gblend test --gas-report
```

### Deployment

```bash
# Deploy a contract

# Deploy a WASM contract with verification
# contract name - rust package name in pascal case with .wasm suffix
gblend create PowerCalculator.wasm \        
    --rpc-url <rpc-url> \       
    --private-key <key> \        
    --broadcast \        
    --verify \       
    --wasm \
    --verifier blockscout \      
    --verifier-url <verifier-url>

# Deploy a Solidity contract
# NOTE: constructor args should be the last argument if used
gblend create src/BlendedCounter.sol:BlendedCounter \
    --rpc-url <rpc-url> \
    --private-key <key> \
    --broadcast \
    --constructor-args <args>

# Deploy using a script
gblend script script/BlendedCounter.s.sol:Deploy \
    --rpc-url <rpc-url> \
    --private-key <key> \
    --broadcast
```

### Verification

```bash
# Verify a regular Solidity contract
gblend verify-contract <address> BlendedCounter \
    --verifier blockscout \
    --verifier-url <verifier-url>

gblend verify-contract <address> PowerCalculator.wasm \
    --wasm \
    --verifier blockscout \
    --verifier-url <verifier-url> \
    --constructor-args <args>

```

## Configuration

`gblend` uses the same configuration system as Foundry forge. Create (it should already be there if you used `gblend` or regular `forge` to create your project) or update a `foundry.toml` file in your project root:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
fluent = <rpc-url>

```
