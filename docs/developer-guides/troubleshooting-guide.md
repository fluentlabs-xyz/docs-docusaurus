---
title: Troubleshooting Guide
sidebar_position: 5
---

Troubleshooting Guide
---

This guide helps you resolve common issues when developing on Fluent. Whether you're encountering build errors, deployment problems, or runtime issues, you'll find solutions and workarounds here.

:::prerequisite

Before troubleshooting, ensure you have:
- [gblend installed](../gblend/installation.md)
- [Proper development environment setup](./building-a-blended-app/README.md)
- [Basic understanding of Rust and Solidity](./smart-contracts/README.md)

:::

## Table of Contents

- [Build Issues](#build-issues)
- [Deployment Problems](#deployment-problems)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Common Gotchas](#common-gotchas)
- [Getting Help](#getting-help)

## Build Issues

### Rust Contract Compilation Errors

#### 1. "no_std" Environment Issues

**Problem**: Compilation fails with standard library errors.

```bash
error[E0433]: failed to resolve: could not find `std` in the list of imported crates
```

**Solution**: Ensure your contract has the proper `no_std` configuration:

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]
extern crate alloc;

use alloc::string::String;
use fluentbase_sdk::{basic_entrypoint, derive::Contract, SharedAPI};
```

**Common Fixes**:
- Add `#![cfg_attr(target_arch = "wasm32", no_std)]` at the top
- Replace `std::` imports with `alloc::` or `core::`
- Use `fluentbase_sdk` types instead of standard library types

#### 2. Fluentbase SDK Version Mismatch

**Problem**: Compilation fails with SDK compatibility errors.

```bash
error[E0277]: the trait bound `fluentbase_sdk::SharedAPI` is not implemented
```

**Solution**: Update your `Cargo.toml` dependencies:

```toml
[dependencies]
fluentbase-sdk = "0.4.3-dev"  # Use the latest compatible version
```

**Update Command**:
```bash
cd src/your-rust-contract
cargo update -p fluentbase-sdk
cargo clean
cargo build
```

#### 3. WASM Target Not Installed

**Problem**: Can't compile to WASM target.

```bash
error: target wasm32-unknown-unknown not found
```

**Solution**: Install the WASM target:

```bash
rustup target add wasm32-unknown-unknown
```

**Verify Installation**:
```bash
rustup target list --installed | grep wasm32
```

### Solidity Compilation Issues

#### 1. Solidity Version Compatibility

**Problem**: Compilation fails with version-specific syntax.

```bash
Error: ParserError: Source file requires different compiler version
```

**Solution**: Check your `foundry.toml` configuration:

```toml
[profile.default]
solc_version = "0.8.19"  # Use compatible version
```

**Common Versions for Fluent**:
- Solidity: `0.8.19` or later
- Foundry: Latest stable version

#### 2. Import Path Issues

**Problem**: Can't resolve import paths.

```bash
Error: Source file not found: @openzeppelin/contracts/...
```

**Solution**: Install dependencies and check paths:

```bash
# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts

# Update remappings in foundry.toml
remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/contracts/"
]
```

## Deployment Problems

### Contract Deployment Failures

#### 1. Insufficient Gas

**Problem**: Transaction fails due to gas limit.

```bash
Error: gas required exceeds allowance
```

**Solution**: Increase gas limit and check gas estimation:

```bash
# Estimate gas usage
gblend estimate-gas --contract YourContract

# Deploy with higher gas limit
gblend create --gas-limit 5000000
```

**Gas Optimization Tips**:
- Use batch operations when possible
- Optimize storage layout
- Avoid unbounded loops

#### 2. Network Configuration Issues

**Problem**: Wrong network or RPC endpoint.

**Solution**: Verify network settings:

```bash
# Check current network
gblend config --list

# Set correct network
gblend config --network fluent-testnet

# Verify RPC endpoint
gblend config --rpc-url $RPC_URL
```

#### 3. Contract Verification Failures

**Problem**: Contract verification fails on explorer.

```bash
Error: Contract verification failed
```

**Solution**: Ensure proper verification:

```bash
# Verify Solidity contract
gblend verify-contract <address> YourContract \
    --verifier blockscout \
    --verifier-url https://testnet.fluentscan.xyz/api/ \
    --constructor-args <args>

# Verify WASM contract
gblend verify-contract <address> YourContract.wasm \
    --wasm \
    --verifier blockscout \
    --verifier-url https://testnet.fluentscan.xyz/api/
```

**Verification Checklist**:
- Contract bytecode matches deployed version
- Constructor arguments are correct
- Source code is properly formatted
- All dependencies are available

### WASM-Specific Deployment Issues

#### 1. WASM Binary Too Large

**Problem**: Contract exceeds size limits.

```bash
Error: WASM binary exceeds maximum size
```

**Solution**: Optimize your WASM contract:

```rust
// Use efficient data structures
use alloc::vec::Vec;

// Avoid unnecessary allocations
let mut result = Vec::with_capacity(expected_size);

// Use references when possible
fn process_data(&self, data: &[U256]) -> U256 {
    // Process without cloning
}
```

**Size Optimization Tips**:
- Remove unused dependencies
- Use `no_std` compatible crates
- Minimize string allocations
- Optimize storage patterns

<!-- #### 2. WASM Interface Generation Issues

**Problem**: Solidity interface not generated correctly.

**Solution**: Check your Rust contract structure:

```rust
#[derive(Contract)]
struct YourContract<SDK> {
    sdk: SDK,
}

pub trait YourAPI {
    #[function_id("functionName(uint256)")]
    fn function_name(&self, param: U256) -> U256;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> YourAPI for YourContract<SDK> {
    // Implementation
}

basic_entrypoint!(YourContract);
``` -->

## Runtime Errors

### Contract Execution Failures

#### 1. Function Selector Mismatch

**Problem**: Function call fails with selector error.

```bash
Error: Function selector not found
```

**Solution**: Verify function signatures match:

```rust
// Rust function
#[function_id("calculate(uint256,uint256)")]
fn calculate(&self, a: U256, b: U256) -> U256 {
    a + b
}
```

```solidity
// Solidity interface must match exactly
interface YourInterface {
    function calculate(uint256 a, uint256 b) external view returns (uint256);
}
```

#### 2. Type Conversion Errors

**Problem**: Data type mismatches between Rust and Solidity.

**Solution**: Use proper type mappings:

```rust
use fluentbase_sdk::{U256, Address, Bytes, B256};

// Correct type usage
fn process_data(&self, amount: U256, addr: Address) -> Bytes {
    // U256 for uint256
    // Address for address
    // Bytes for bytes
}
```

**Type Mapping Reference**:
- `uint256` → `U256`
- `address` → `Address`
- `bytes` → `Bytes`
- `bytes32` → `B256`
- `bool` → `bool`
- `string` → `String`

### Storage Access Issues

#### 1. Storage Slot Conflicts

**Problem**: Data corruption due to storage conflicts.

**Solution**: Use the `solidity_storage!` macro for proper storage management:

```rust
use fluentbase_sdk::derive::solidity_storage;

// Define storage layout using the macro
solidity_storage! {
    Address Owner;               // Slot 0
    bool Paused;                 // Slot 1  
    U256 TotalSupply;            // Slot 2
    mapping(Address => U256) Balance;  // Slot 3
}

fn get_owner(&self) -> Address {
    Owner::get(&self.sdk)
}

fn set_owner(&mut self, new_owner: Address) {
    Owner::set(&mut self.sdk, new_owner);
}
```

#### 2. Storage Type Mismatches

**Problem**: Reading wrong data type from storage.

**Solution**: Use the generated storage methods for type safety:

```rust
// Store and retrieve with same type using generated methods
fn set_balance(&mut self, user: Address, amount: U256) {
    Balance::set(&mut self.sdk, user, amount);
}

fn get_balance(&self, user: Address) -> U256 {
    Balance::get(&self.sdk, user)
}

// The macro ensures type safety - this won't compile if types don't match
```

## Performance Issues

### High Gas Consumption

#### 1. Inefficient Storage Operations

**Problem**: Excessive gas usage for storage operations.

**Solution**: Use the `solidity_storage!` macro for optimized storage access:

```rust
use fluentbase_sdk::derive::solidity_storage;

solidity_storage! {
    mapping(Address => U256) Balances;
    U256 TotalSupply;
}

// Batch storage operations using generated methods
fn batch_update(&mut self, updates: Vec<(Address, U256)>) {
    for (user, amount) in updates {
        Balances::set(&mut self.sdk, user, amount);
    }
}

// Use efficient data structures
fn efficient_loop(&self, limit: U256) -> U256 {
    let max_limit = U256::from(1000);
    let actual_limit = if limit > max_limit { max_limit } else { limit };
    
    let mut result = U256::zero();
    for i in 0..actual_limit.as_u32() {
        result += U256::from(i);
    }
    result
}
```

#### 2. Unbounded Operations

**Problem**: Functions that can consume unlimited gas.

**Solution**: Implement bounds and limits:

```rust
fn safe_operation(&self, items: Vec<U256>) -> Vec<U256> {
    let max_items = 100;
    let actual_items = if items.len() > max_items {
        &items[..max_items]
    } else {
        &items
    };
    
    actual_items.iter().map(|&x| x * U256::from(2)).collect()
}
```

### Memory Management Issues

#### 1. Excessive Allocations

**Problem**: High memory usage and gas costs.

**Solution**: Minimize allocations:

```rust
// Pre-allocate when possible
fn efficient_string(&self) -> String {
    let mut result = String::with_capacity(100);
    result.push_str("Hello");
    result.push_str(" World");
    result
}

// Use references to avoid cloning
fn process_array(&self, data: &[U256]) -> U256 {
    data.iter().sum()
}
```

## Common Gotchas

### 1. Function Visibility Issues

**Problem**: Functions not accessible from Solidity.

**Solution**: Ensure proper visibility and routing:

```rust
pub trait YourAPI {
    #[function_id("publicFunction()")]
    fn public_function(&self) -> String;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> YourAPI for YourContract<SDK> {
    // Must be public
    pub fn public_function(&self) -> String {
        "Hello".to_string()
    }
}
```

### 2. Missing Entry Point

**Problem**: Contract doesn't respond to calls.

**Solution**: Include the entry point macro:

```rust
// Always include this at the end
basic_entrypoint!(YourContract);
```

### 3. Incorrect Function IDs

**Problem**: Function calls don't match expected signatures.

**Solution**: Use exact Solidity function signatures:

```rust
// Correct function ID format
#[function_id("transfer(address,uint256)")]
fn transfer(&mut self, to: Address, amount: U256) -> bool {
    // Implementation
}
```

**Common Function ID Patterns**:
- `"functionName()"` - No parameters
- `"functionName(uint256)"` - Single parameter
- `"functionName(address,uint256)"` - Multiple parameters
- `"functionName(uint256[])"` - Array parameter

### 4. Storage Initialization

**Problem**: Uninitialized storage causing unexpected behavior.

**Solution**: Initialize storage properly using the `solidity_storage!` macro:

```rust
use fluentbase_sdk::derive::solidity_storage;

solidity_storage! {
    U256 InitialState;    // Slot 0
    bool Paused;          // Slot 1
    Address Owner;        // Slot 2
}

impl<SDK: SharedAPI> YourContract<SDK> {
    fn deploy(&mut self) {
        // Initialize storage values using generated methods
        InitialState::set(&mut self.sdk, U256::from(1));
        Paused::set(&mut self.sdk, false);
        Owner::set(&mut self.sdk, self.sdk.context().contract_caller());
    }
}
```

## Getting Help

### When to Seek Help

- **Build errors** that persist after trying solutions above
- **Runtime errors** that aren't covered in this guide
- **Performance issues** that affect production
- **Security concerns** about your implementation

### Where to Get Help

1. **Documentation**: Check existing guides first
2. **GitHub Issues**: Search for similar problems
3. **Discord Community**: Join the [Fluent Discord](https://discord.com/invite/fluentxyz) and get support in the #devs-forum channel
4. **Example Projects**: Review [GitHub examples](https://github.com/fluentlabs-xyz/examples)

### How to Ask for Help

When seeking help, provide:

1. **Clear description** of the problem
2. **Error messages** and stack traces
3. **Relevant code snippets**
4. **Steps to reproduce**
5. **What you've already tried**
6. **Environment details** (OS, versions, etc.)


---

**Still stuck?** Don't hesitate to reach out to the Fluent community.
