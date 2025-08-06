---
title: Build with the Fluentbase SDK
sidebar_position: 1
---

Build with the Fluentbase SDK
---

:::warning

The Fluentbase SDK is in experimental development and is still a work in progress.

All bindings, methods, and naming conventions within the codebase are not standardized and may change significantly.
Additionally, the codebase has not been audited or fully tested, which could lead to potential vulnerabilities or
crashes.

:::

## Architecture Overview

Fluentbase operates using Fluent's **rWasm VM** (reduced WebAssembly), which employs a 100% compatible WebAssembly
binary representation optimized for zero-knowledge operations. The instruction set is reduced, and sections are embedded
inside the binary to simplify the proving process.

The SDK provides a unified development environment that bridges multiple execution environments, enabling developers to
write smart contracts that can interact seamlessly across different virtual machines.

:::info Supported Languages

The Fluentbase SDK currently supports writing [smart contracts](../developer-guides/smart-contracts/README.md) in:

* **[Rust](../developer-guides/smart-contracts/rust.md)** - Full featured support with derive macros and storage
  optimization
* **[Solidity](../developer-guides/smart-contracts/solidity.md)** - EVM-compatible contracts with seamless
  interoperability
* **[Vyper](../developer-guides/smart-contracts/vyper.md)** - Alternative Python-like syntax for EVM contracts

:::

Future iterations will introduce more language support.

### Supported Types

Fluentbase supports automatic conversion between Solidity and Rust types. For a complete mapping reference, see
the [Type Conversion Guide](https://github.com/fluentlabs-xyz/fluentbase/blob/devel/crates/sdk-derive/docs/type_conversion.md).

## Modules

The Fluentbase framework consists of several core modules that work together to provide a complete development
framework:

### 1. `crates`

Contains all [Fluentbase modules](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates) that form the core SDK
functionality:

<table><tbody><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/build"><code>build</code></a></h4></td><td>Helper functions and CLI for compiling Fluentbase smart contracts. Supports deterministic Docker builds, custom Rust toolchains, and multiple output formats (WAT, rWASM, ABI, Solidity interface files, and metadata). Powers the build scripts for precompiled contracts.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/codec"><code>codec</code></a></h4></td><td>A lightweight, no-std compatible codec library optimized for random reads. While similar to Solidity ABI encoding, it introduces optimizations for efficient data access and nested structures. Supports two encoding modes: CompactABI (little-endian, 4-byte alignment) and SolidityABI (big-endian, 32-byte alignment for Ethereum compatibility).</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/codec-derive"><code>codec-derive</code></a></h4></td><td>Procedural macros for deriving the Codec trait from the fluentbase-codec crate. Generates efficient encoding and decoding implementations that integrate with both CompactABI and SolidityABI modes.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/contracts"><code>contracts</code></a></h4></td><td>System precompiled contracts bundled with Fluentbase runtimes. Includes EVM and SVM compatibility layers, cryptographic primitives (SHA256, Blake2, etc.), and the reference ERC20 implementation. Compiles each contract to rWASM and embeds binaries for genesis file inclusion.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/erc20"><code>erc20</code></a></h4></td><td>Reference implementation of the ERC20 token standard built using the Fluentbase SDK. Demonstrates recommended project layout and SDK entrypoint macros usage. Implements standard transfer, approve, and transfer_from methods with Fluentbase key-value storage.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/evm"><code>evm</code></a></h4></td><td>Execution engine implementing Ethereum Virtual Machine semantics on top of Fluentbase types. Provides a minimal EVM for compatibility tests and running Solidity contracts compiled to rWASM. Includes opcode interpreter, gas accounting, memory model, and stack implementation matching Ethereum specification.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/genesis"><code>genesis</code></a></h4></td><td>Utilities for creating and manipulating genesis files that bundle Fluentbase precompiled contracts. Produces JSON genesis files compatible with Reth or other clients for starting local development networks with correct rWASM binaries embedded.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/runtime"><code>runtime</code></a></h4></td><td>The execution environment for rWASM contracts. Provides host functions exposed to smart contracts and manages context such as storage, account data, and precompiled contract calls. Executes rWASM bytecode with deterministic gas accounting and supports both EVM and SVM compatibility layers.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/sdk"><code>sdk</code></a></h4></td><td>Main library for developing contracts that run on the Fluentbase runtime. Provides the core SharedAPI trait, entrypoint macros, and a collection of types used by contracts. Includes basic_entrypoint! macro, SharedAPI trait for storage and context access, and re-exports common primitive types.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/sdk-derive"><code>sdk-derive</code></a></h4></td><td>Procedural macros for Fluentbase smart contract development. Generates boilerplate code and provides Solidity compatibility through Contract derivation, router method dispatch, client generation, EVM-compatible storage layout, and Solidity interface conversions.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/svm"><code>svm</code></a></h4></td><td>Implementation of the Solana Virtual Machine adapted for Fluentbase. Provides an alternative execution environment alongside the EVM for running Solana-style programs. Includes instruction processors, loader logic, and account handling compatible with the Solana model.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/svm-shared"><code>svm-shared</code></a></h4></td><td>Common types and utilities used across the Fluentbase SVM crates. Provides shared logic between the SVM runtime and Solana compatibility precompiles, including bincode helpers and test structures to avoid code duplication.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/testing"><code>testing</code></a></h4></td><td>Testing utilities for Fluentbase contracts. Embeds the runtime and provides helpers for executing rWASM modules in unit tests. Includes the include_this_wasm! macro for contracts to include their own WASM binary during tests, and EVM test harness powered by forked revm.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/types"><code>types</code></a></h4></td><td>Primitive types and data structures shared across all Fluentbase crates. Exposes Address and Bytes types along with runtime context objects and helper enums for error handling and contract execution. Most types are no_std friendly and re-export rwasm core primitives.</td></tr></tbody></table>

### 3. `e2e`

A [set of e2e tests](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/e2e) for testing EVM transition and other
Wasm features.

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

Fluent development typically follows this workflow:

1. **Project Setup**
   Begin by initializing a new project using [gblend](https://github.com/fluentlabs-xyz/gblend) — a CLI tool built on top of Foundry and tailored for the Fluent Network. It supports both Solidity and Rust-based contracts.

2. **Contract Development**
   You can extend existing Solidity contracts with additional functionality written in Rust. This enables more expressive and flexible logic than Solidity alone allows. Or create standalone Rust contract.

3. **Testing**
   Write unit tests directly in Rust using `HostTestingContext`. This allows you to validate contract logic before deploying it on-chain. Use [gblend](https://github.com/fluentlabs-xyz/gblend) to test interoperability.

4. **Build**
   Use Gblend to compile your Rust contracts to WASM artifacts compatible with the Fluent runtime.

5. **Deployment**
   Use Gblend to deploy the generated WASM binaries to the Fluent Network. Verification and scripting flows are also supported.

For more detailed instructions, see:

* [Gblend Guide](../gblend/usage.md) — CLI usage and project templates
* [Fluent Development Guide](../developer-guides/building-a-blended-app/quickstart.md) — best practices, patterns, and architecture


## Current Features and Limitations

### Features

* Full EVM compatibility through ABI encoding
* Solidity-compatible storage layout
* Automatic function routing and parameter decoding
* Event emission and logging
* Cross-contract calls
* Comprehensive testing framework

### Limitations

* No floating-point operations support (planned for future releases)
* `no_std` environment requires careful crate selection
* Limited to WASM-compatible libraries

## Next Steps

This overview provides the foundation for building with the Fluentbase SDK. For detailed information on specific
features:

* **[Router System](./router.md)**: Learn about automatic method dispatch and function selectors
* **[Storage Management](./storage.md)**: Understand Solidity-compatible storage patterns
* **[Codec System](./codec.md)**: Explore encoding/decoding for complex data types
* **[Client Generation](./client.md)**: Build contract interaction clients

Each of these topics is covered in dedicated documentation sections with comprehensive examples and best practices.

### Related Resources

* **Source Code**: [GitHub Repository](https://github.com/fluentlabs-xyz/fluentbase)
* **Type Conversions**: [Solidity to Rust Type Mapping](https://github.com/fluentlabs-xyz/fluentbase/blob/v0.3.6-dev/crates/sdk-derive/docs/type_conversion.md)
* **Examples**: [Contract Examples Directory](https://github.com/fluentlabs-xyz/examples)
