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

Fluentbase operates using Fluent's **rWasm VM** (reduced WebAssembly), which employs a 100% compatible Wasm binary representation optimized for zero-knowledge operations. The instruction set is reduced, and sections are embedded inside the binary to simplify the proving process.

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

<table><tbody><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/codec"><code>codec</code></a></h4></td><td><p>A crate with a custom ABI codec for encoding/decoding input messages. </p><p></p><p>This codec is optimized for random reads that are used to extract only required information from passed system context. </p><p></p><p>It's very similar to Solidity ABI encoding, but uses a more Wasm friendly binary encoding and alignment. </p></td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/contracts"><code>contracts</code></a></h4></td><td>A crate with all system precompiled contracts that brings support of different execution environment (EE) compatibility, including the EVM, SVM, Wasm and all corresponding system contracts like blake2, sha256, etc. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/core"><code>core</code></a> </h4></td><td>Core of EE runtimes with EVM, SVM, and Wasm support including deployment logic, AOT translation and contract execution. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/evm"><code>evm (outdated)</code></a></h4></td><td>Contains EVM AOT compiler.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/genesis"><code>genesis</code></a></h4></td><td>A program for creating genesis files for the Fluent L2 network with precompiled system and compatibility contracts. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/poseidon"><code>poseidon</code></a> </h4></td><td>Library for poseidon hashing. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/revm"><code>revm (migrating)</code></a></h4></td><td>The fork of revm crate, but optimized and adapted for Fluentbase SDK methods and which maps the original revm's database objects into Fluentbase's structures. It's needed to execute EVM transactions inside reth. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/runtime"><code>runtime</code></a></h4></td><td> A basic execution runtime of rWasm that enables Fluentbase's host functions. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/sdk"><code>sdk</code></a></h4></td><td>A basic repository for developers where they can explore all required types and methods to develop their applications. It also includes macros, definition of entrypoint, allocator, etc. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/sdk-derive"><code>sdk-derive</code></a></h4></td><td>Procedural macros for code generation including router dispatch, storage management, and client generation for seamless contract interaction.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/types"><code>types</code></a></h4></td><td>Contains basic primitive types for all crates.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/zktrie"><code>zktrie</code></a></h4></td><td>Implementation of the zktrie (sparse merkle binary trie).</td></tr></tbody></table>

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
    // Simple values
    Address Owner;                                   // Slot 0
    bool Paused;                                     // Slot 1
    U256 TotalSupply;                               // Slot 2
    
    // Mappings
    mapping(Address => U256) Balance;               // Slot 3
    mapping(Address => mapping(Address => U256)) Allowance;  // Slot 4
}

#[derive(Contract)]
struct ERC20<SDK> {
    sdk: SDK,
}

// Helper function for event emission
fn emit_event<SDK: SharedAPI, T: SolEvent>(sdk: &mut SDK, event: T) {
    let data = event.encode_data();
    let topics: Vec<B256> = event
        .encode_topics()
        .iter()
        .map(|v| B256::from(v.0))
        .collect();
    sdk.emit_log(&topics, &data);
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> ERC20API for ERC20<SDK> {
    fn symbol(&self) -> Bytes {
        "FLU".as_bytes().to_vec().into()
    }

    fn name(&self) -> Bytes {
        "FluentToken".as_bytes().to_vec().into()
    }

    fn decimals(&self) -> U256 {
        U256::from(18)
    }

    fn total_supply(&self) -> U256 {
        TotalSupply::get(&self.sdk)
    }

    fn balance_of(&self, address: Address) -> U256 {
        Balance::get(&self.sdk, address)
    }

    fn transfer(&mut self, to: Address, value: U256) -> U256 {
        let from = self.sdk.context().contract_caller();
        
        // Update balances
        Balance::subtract(&mut self.sdk, from, value)
            .unwrap_or_else(|err| panic!("Transfer failed: {}", err));
        Balance::add(&mut self.sdk, to, value)
            .unwrap_or_else(|err| panic!("Transfer failed: {}", err));

        // Emit event
        emit_event(&mut self.sdk, Transfer { from, to, value });
        U256::from(1)
    }

    fn allowance(&self, owner: Address, spender: Address) -> U256 {
        Allowance::get(&self.sdk, owner, spender)
    }

    fn approve(&mut self, spender: Address, value: U256) -> U256 {
        let owner = self.sdk.context().contract_caller();
        Allowance::set(&mut self.sdk, owner, spender, value);
        emit_event(&mut self.sdk, Approval { owner, spender, value });
        U256::from(1)
    }

    fn transfer_from(&mut self, from: Address, to: Address, value: U256) -> U256 {
        let spender = self.sdk.context().contract_caller();

        let current_allowance = Allowance::get(&self.sdk, from, spender);
        if current_allowance < value {
            panic!("insufficient allowance");
        }

        // Update allowance and balances
        Allowance::subtract(&mut self.sdk, from, spender, value)
            .unwrap_or_else(|err| panic!("Allowance update failed: {}", err));
        Balance::subtract(&mut self.sdk, from, value)
            .unwrap_or_else(|err| panic!("Balance update failed: {}", err));
        Balance::add(&mut self.sdk, to, value)
            .unwrap_or_else(|err| panic!("Balance update failed: {}", err));

        emit_event(&mut self.sdk, Transfer { from, to, value });
        U256::from(1)
    }
}

impl<SDK: SharedAPI> ERC20<SDK> {
    pub fn deploy(&mut self) {
        let owner_address = self.sdk.context().contract_caller();
        let initial_supply = U256::from_str_radix("1000000000000000000000000", 10).unwrap();
        
        // Set initial state
        Owner::set(&mut self.sdk, owner_address);
        TotalSupply::set(&mut self.sdk, initial_supply);
        Balance::set(&mut self.sdk, owner_address, initial_supply);
    }
}

basic_entrypoint!(ERC20);
```

## Key SDK Features

### Derive Macros

The SDK provides powerful derive macros that generate boilerplate code automatically:

- **`#[derive(Contract)]`**: Enables contract functionality for your struct
- **`#[router(mode = "solidity")]`**: Generates automatic method dispatch with Solidity-compatible function selectors
- **`solidity_storage!`**: Creates Solidity-compatible storage layout with optimized access patterns
- **`#[function_id("signature")]`**: Defines explicit function selectors for method routing

### Storage System

Fluentbase provides two storage access patterns:

- **Direct Storage**: For primitive types ≤ 32 bytes (integers, booleans, addresses)
- **Codec Storage**: For complex types requiring serialization (structs, vectors, maps)

The storage system automatically follows Solidity's storage layout specification, ensuring compatibility with EVM contracts.

### Event System

Contracts can emit events using the standard Solidity event format:

```rust
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
}

emit_event(&mut self.sdk, Transfer { from, to, value });
```

### Cross-VM Interoperability

Contracts can seamlessly interact with:

- Solidity contracts deployed on the same network
- Other Rust contracts using the same SDK
- System precompiles for cryptographic operations

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

- **Router System**: Learn about automatic method dispatch and function selectors
- **Storage Management**: Understand Solidity-compatible storage patterns
- **Codec System**: Explore encoding/decoding for complex data types
- **Client Generation**: Build contract interaction clients

Each of these topics is covered in dedicated documentation sections with comprehensive examples and best practices.