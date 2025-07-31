---
title: Build with the Fluentbase SDK
sidebar_position: 1
---
Build with the Fluentbase SDK
---

:::warning

The Fluentbase SDK is in experimental development and is still a work in progress.

All bindings, methods, and naming conventions within the codebase are not standardized and may change significantly. Additionally, the codebase has not been audited or fully tested, which could lead to potential vulnerabilities or crashes.

:::

## Architecture Overview

Fluentbase operates using Fluent's **rWasm VM** (reduced WebAssembly), which employs a 100% compatible WebAssembly binary representation optimized for zero-knowledge operations. The instruction set is reduced, and sections are embedded inside the binary to simplify the proving process.

The SDK provides a unified development environment that bridges multiple execution environments, enabling developers to write smart contracts that can interact seamlessly across different virtual machines.

:::info Supported Languages

The Fluentbase SDK currently supports writing [smart contracts](../developer-guides/smart-contracts/README.md) in:

* **[Rust](../developer-guides/smart-contracts/rust.md)** - Full featured support with derive macros and storage optimization
* **[Solidity](../developer-guides/smart-contracts/solidity.md)** - EVM-compatible contracts with seamless interoperability
* **[Vyper](../developer-guides/smart-contracts/vyper.md)** - Alternative Python-like syntax for EVM contracts

:::

Future iterations will introduce more language support.

### Supported Types

Fluentbase supports automatic conversion between Solidity and Rust types. For a complete mapping reference, see the [Type Conversion Guide](https://github.com/fluentlabs-xyz/fluentbase/blob/v0.3.6-dev/crates/sdk-derive/docs/type_conversion.md).

## Modules

The Fluentbase framework consists of several core modules that work together to provide a complete development framework:

### 1. `bin`

A [crate](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/bin) with a binary application that is used for translating Wasm apps to the Fluent rWasm VM. It's required only for creating system precompile contracts where direct translation from Wasm to rWasm is needed.

### 2. `crates`

Contains all [Fluentbase modules](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates) that form the core SDK functionality:

<table><tbody><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/build"><code>build</code></a></h4></td><td>Build system utilities for compiling Fluent smart contracts. Provides tools for converting Rust code to WASM and then to rWasm format, with support for Docker-based reproducible builds and artifact generation (ABI, metadata, Solidity interfaces).</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/codec"><code>codec</code></a></h4></td><td>A lightweight, no-std compatible codec library optimized for random reads. While similar to Solidity ABI encoding, it introduces optimizations for efficient data access and nested structures. Supports two encoding modes: CompactABI (little-endian, 4-byte alignment) and SolidityABI (big-endian, 32-byte alignment for Ethereum compatibility).</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/codec-derive"><code>codec-derive</code></a></h4></td><td>Derive macro for automatic codec implementation. Generates encoding and decoding methods for custom structs, supporting both Solidity and Compact ABI modes with configurable byte order and alignment.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/contracts"><code>contracts</code></a></h4></td><td>Build infrastructure for system precompiled contracts. Manages compilation and bundling of all system contracts including EVM, SVM, and Wasm compatibility layers, as well as cryptographic precompiles.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/erc20"><code>erc20</code></a></h4></td><td>ERC20 token implementation library with support for standard token operations, storage management, and optional features like minting and pausing. Used as a base for token contracts in the Fluent ecosystem.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/evm"><code>evm</code></a></h4></td><td>EVM compatibility layer providing Ethereum Virtual Machine functionality within the Fluent ecosystem. Includes utilities for EVM bytecode handling and execution.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/genesis"><code>genesis</code></a></h4></td><td>Genesis file generation for the Fluent L2 network. Creates reth/geth compatible genesis files with precompiled system contracts and compatibility layers embedded as rWasm bytecode.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/runtime"><code>runtime</code></a></h4></td><td>Basic execution runtime for rWasm that provides Fluentbase's host functions. Includes cryptographic primitives, storage access, and system call implementations for smart contract execution.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/sdk"><code>sdk</code></a></h4></td><td>Core SDK for developers building on Fluent. Provides all essential types, traits, and methods for smart contract development, including entrypoint definitions, memory allocation, and system interfaces.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/sdk-derive"><code>sdk-derive</code></a></h4></td><td>Procedural macros for the Fluentbase SDK. Generates boilerplate for router dispatch, storage management, client interfaces, and contract traits, significantly reducing code complexity for developers.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/shared"><code>shared</code></a></h4></td><td>Shared utilities and common functionality used across multiple crates in the Fluentbase ecosystem. Provides consistent interfaces and helper functions.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/testing"><code>testing</code></a></h4></td><td>Testing framework for Fluentbase smart contracts. Provides mock environments, test contexts, and utilities for unit and integration testing of contracts without deployment.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/types"><code>types</code></a></h4></td><td>Fundamental primitive types for the entire Fluentbase ecosystem. Includes address types, numeric types, context structures, and core interfaces used throughout all crates.</td></tr></tbody></table>

### 3. `e2e` (partially outdated)

A [set of e2e tests](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/e2e) for testing EVM transition and other Wasm features.

## Contract Development Patterns

Fluentbase provides several development patterns depending on your use case and complexity requirements:

### 1. Simple Contracts

For basic contracts that don't require complex routing or storage:

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]
extern crate fluentbase_sdk;

use fluentbase_sdk::{basic_entrypoint, derive::Contract, SharedAPI};

#[derive(Contract)]
struct GREETING<SDK> {
    sdk: SDK,
}

impl<SDK: SharedAPI> GREETING<SDK> {
    fn deploy(&mut self) {
        // any custom deployment logic here
    }
    fn main(&mut self) {
        // write "Hello, World" message into output
        self.sdk.write("Hello, World".as_bytes());
    }
}

basic_entrypoint!(GREETING);
```

### 2. Router-Based Contracts

For contracts that need to handle multiple function calls with automatic parameter decoding:

```rust
#![cfg_attr(target_arch = "wasm32", no_std, no_main)]
extern crate alloc;
extern crate fluentbase_sdk;

use alloc::string::String;
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, Contract},
    SharedAPI,
};

#[derive(Contract)]
struct App<SDK> {
    sdk: SDK,
}

pub trait RouterAPI {
    fn greeting(&self, message: String) -> String;
    fn custom_greeting(&self, message: String) -> String;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> RouterAPI for App<SDK> {
    #[function_id("greeting(string)")]
    fn greeting(&self, message: String) -> String {
        message
    }

    #[function_id("customGreeting(string)")]
    fn custom_greeting(&self, message: String) -> String {
        message
    }
}

impl<SDK: SharedAPI> App<SDK> {
    pub fn deploy(&self) {
        // any custom deployment logic here
    }
}

basic_entrypoint!(App);
```

### 3. Storage-Enabled Contracts

For contracts that need persistent state management with Solidity-compatible storage:

```rust
#![cfg_attr(target_arch = "wasm32", no_std, no_main)]
extern crate alloc;
extern crate fluentbase_sdk;

use alloc::vec::Vec;
use alloy_sol_types::{sol, SolEvent};
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, solidity_storage},
    Address, Bytes, ContextReader, SharedAPI, B256, U256,
};

pub trait ERC20API {
    fn symbol(&self) -> Bytes;
    fn name(&self) -> Bytes;
    fn decimals(&self) -> U256;
    fn total_supply(&self) -> U256;
    fn balance_of(&self, address: Address) -> U256;
    fn transfer(&mut self, to: Address, value: U256) -> U256;
    fn allowance(&self, owner: Address, spender: Address) -> U256;
    fn approve(&mut self, spender: Address, value: U256) -> U256;
    fn transfer_from(&mut self, from: Address, to: Address, value: U256) -> U256;
}

// Define events for contract interactions
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// Solidity-compatible storage layout
solidity_storage! {
    mapping(Address => U256) Balance;
    mapping(Address => mapping(Address => U256)) Allowances;
}

#[derive(Contract)]
struct ERC20<SDK> {
    sdk: SDK,
    name: &'static str,
    symbol: &'static str,
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> ERC20API for ERC20<SDK> {
    fn symbol(&self) -> Bytes {
        self.symbol.as_bytes().to_vec().into()
    }

    fn name(&self) -> Bytes {
        self.name.as_bytes().to_vec().into()
    }

    fn decimals(&self) -> U256 {
        U256::from(18)
    }

    fn total_supply(&self) -> U256 {
        U256::from(1_000_000u64 * 10u64.pow(18))
    }

    fn balance_of(&self, address: Address) -> U256 {
        Balance::get(&self.sdk, address)
    }

    fn transfer(&mut self, to: Address, value: U256) -> U256 {
        let from = self.sdk.msg_sender();
        let from_balance = Balance::get(&self.sdk, from);
        assert!(from_balance >= value, "insufficient balance");
        
        Balance::set(&mut self.sdk, from, from_balance - value);
        Balance::set(&mut self.sdk, to, Balance::get(&self.sdk, to) + value);
        
        Transfer { from, to, value }.emit(&mut self.sdk);
        U256::from(1) // Return true as U256
    }

    // Additional methods implementation...
}

basic_entrypoint!(ERC20);
```

## Development Workflow

1. **Setup**: Use the Fluent scaffold CLI tool (`gblend`) to create new projects
2. **Development**: Write contracts using the patterns above
3. **Testing**: Use the built-in testing framework with `HostTestingContext`
4. **Building**: Compile to WASM using `gblend build rust -r`
5. **Deployment**: Deploy the resulting WASM binary to the Fluent network

## Current Features and Limitations

### Features

- Full EVM compatibility through ABI encoding
- Solidity-compatible storage layout
- Automatic function routing and parameter decoding
- Event emission and logging
- Cross-contract calls
- Comprehensive testing framework

### Limitations

- No floating-point operations support (planned for future releases)
- `no_std` environment requires careful crate selection
- Limited to WASM-compatible libraries

## Next Steps

This overview provides the foundation for building with the Fluentbase SDK. For detailed information on specific features:

- **[Router System](./router.md)**: Learn about automatic method dispatch and function selectors
- **[Storage Management](./storage.md)**: Understand Solidity-compatible storage patterns
- **[Codec System](./codec.md)**: Explore encoding/decoding for complex data types
- **[Client Generation](./client.md)**: Build contract interaction clients

Each of these topics is covered in dedicated documentation sections with comprehensive examples and best practices.

### Related Resources

- **Source Code**: [GitHub Repository](https://github.com/fluentlabs-xyz/fluentbase)
- **Type Conversions**: [Solidity to Rust Type Mapping](https://github.com/fluentlabs-xyz/fluentbase/blob/v0.3.6-dev/crates/sdk-derive/docs/type_conversion.md)
- **Examples**: [Contract Examples Directory](https://github.com/fluentlabs-xyz/examples)