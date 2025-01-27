---
title: Build with the Fluentbase SDK
sidebar_position: 2
---

# Build with the Fluentbase SDK

---
Deploy on the Fluent Public Devnet
---

> ⚠️ **Caution**  
>
> The Fluentbase SDK is in experimental development and is still a work in progress.
>
> All bindings, methods, and naming conventions within the codebase are not standardized and may change significantly. Additionally, the codebase has not been audited or fully tested, which could lead to potential vulnerabilities or crashes.

## Modules

1. ### `bin`

A [crate](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/bin) with a binary application that is used for translating Wasm apps to the Fluent rWasm VM. It’s required only for creating system precompile contracts where direct translation from Wasm to rWasm is needed.

2. ### `crates`

Contains all [Fluentbase modules](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates).

<table><thead><tr><th width="227">Crates</th><th>Explanation</th></tr></thead><tbody><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/codec"><code>codec</code></a></h4></td><td><p>A crate with a custom ABI codec for encoding/decoding input messages. </p><p></p><p>This codec is optimized for random reads that are used to extract only required information from passed system context. </p><p></p><p>It’s very similar to Solidity ABI encoding, but uses a more Wasm friendly binary encoding and alignment. </p></td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/contracts"><code>contracts</code></a></h4></td><td>A crate with all system precompiled contracts that brings support of different execution environment (EE) compatibility, including the EVM, SVM, Wasm and all corresponding system contracts like blake2, sha256, etc. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/core"><code>core</code></a> </h4></td><td>Core of EE runtimes with EVM, SVM, and Wasm support including deployment logic, AOT translation and contract execution. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/evm"><code>evm (outdated)</code></a></h4></td><td>Contains EVM AOT compiler.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/genesis"><code>genesis</code></a></h4></td><td>A program for creating genesis files for the Fluent L2 network with precompiled system and compatibility contracts. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/poseidon"><code>poseidon</code></a> </h4></td><td>Library for poseidon hashing. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/revm"><code>revm (migrating)</code></a></h4></td><td>The fork of revm crate, but optimized and adapted for Fluentbase SDK methods and which maps the original revm’s database objects into Fluentbase’s structures. It’s needed to execute EVM transactions inside reth. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/runtime"><code>runtime</code></a></h4></td><td> A basic execution runtime of rWasm that enables Fluentbase’s host functions. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/sdk"><code>sdk</code></a></h4></td><td>A basic repository for developers where they can explore all required types and methods to develop their applications. It also includes macroses, definition of entrypoint, allocator, etc. </td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/types"><code>types</code></a></h4></td><td>Contains basic primitive types for all crates.</td></tr><tr><td><h4><a href="https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/zktrie"><code>zktrie</code></a></h4></td><td>Implementation of the zktrie (sparse merkle binary trie).</td></tr></tbody></table>

3. ### `e2e` (partially outdated)

A [set of e2e tests](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/e2e) for testing EVM transition and other Wasm features.

***

## Supported Languages&#x20;

The Fluentbase SDK currently supports writing smart contracts in:

* Rust&#x20;
* Solidity&#x20;
* Vyper

***

## Example Code

Fluentbase can be used to develop different types of applications; in most cases, the same interface is utilized. Here is one simple application that can be developed using Fluentbase.

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]
extern crate fluentbase_sdk;

use fluentbase_sdk::{basic_entrypoint, SharedAPI};

#[derive(Default)]
struct GREETING;

impl GREETING {
    fn deploy<SDK: SharedAPI>(&self) {
        // any custom deployment logic here
    }
    fn main<SDK: SharedAPI>(&self) {
        // b"Hello, world": "b" here tells the compiler that the string should be treated as a byte sequence. 
        // This is called a byte string literal.
        const HELLO: &[u8] = b"Hello, world";
        SDK::write(HELLO.as_ptr(), HELLO.len() as u32);
    }
}
basic_entrypoint!(GREETING);
```

***

## Fluentbase Operation

Fluentbase operates using Fluent's rWasm VM (reduced WebAssembly). This VM employs a 100% compatible Wasm binary representation optimized for zk operations. The instruction set is reduced, and sections are embedded inside the binary to simplify the proving process.

### Limitations and Future Enhancements

As of now, Fluentbase does not support floating-point operations. However, this feature is on the roadmap for future enhancements.
