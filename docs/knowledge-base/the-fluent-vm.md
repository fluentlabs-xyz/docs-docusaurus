---
title: The Fluent VM
sidebar_position: 2
---

# The Fluent VM

The Fluent VM is a minimally modified version of the WebAssembly (Wasm) binary instruction format designed for verifiable applications. It is a reduced version of Wasm, called rWasm, which maintains compatibility with the original Wasm instruction set yet is optimized for zero-knowledge (zk) operations. Sections of the instruction set are embedded inside the binary, enhancing the efficiency and ease of verification of Wasm programs in a zk-rollup.

rWasm features support for multiple VM targets at the execution layer. Its account and state structure are managed by specialized system contracts that represent each supported VM. Ultimately, these VMs are simulated and compile down to rWasm for execution. The design is extensible in that support for additional VMs can be added over time. It also ensures atomic and synchronous composability between smart contracts pertaining to the different VMs it supports.&#x20;

### The Compatibility Contracts

The Fluent VM houses verified libraries, or system contracts, known as the compatibility contracts. These Wasm-based contracts define each supported VM’s EE standards and provides an API to access these functions. They effectively act as middleware allowing contracts from each supported VM to make calls and retrieve information from one another.

The compatibility contracts are similar to Near’s Aurora implementation (but optimized for zk-operations), which simulates EVM transactions and blocks. For zk proving, the compatibility contracts are supported by an additional library, the Journaled ZK Trie (JZKT) which, found in memory/storage, makes proving the Fluent STF across standards more efficient.&#x20;

The JZKT is the same as a standard zk trie with one major difference, that it is reversible. This ensures atomicity of transactions across different standards. If an operation fails as part of a multi operation transaction, all previous transactions will revert as well. Additionally, by housing this process in a unified library, the surface area of each standard is wrapped into one larger circuit, making it easier to prove.