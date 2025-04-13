---
title: The Fluent VM
sidebar_position: 2
---

# The Fluent VM

The Fluent VM is a minimally modified version of the WebAssembly (Wasm) binary instruction format designed for verifiable applications. It is a reduced version of Wasm, called rWasm, which maintains compatibility with the original Wasm instruction set yet is optimized for zero-knowledge (zk) operations. Sections of the instruction set are embedded inside the binary, enhancing the efficiency and ease of verification of Wasm programs in a zk-rollup.

rWasm features support for multiple VM targets at the execution layer. Its account and state structure are managed by specialized system contracts that represent each supported VM. Ultimately, these VMs are simulated and compiled down to rWasm for execution. The design is extensible in that support for additional VMs can be added over time. It also ensures atomic and synchronous composability between smart contracts pertaining to the different VMs it supports.&#x20;
