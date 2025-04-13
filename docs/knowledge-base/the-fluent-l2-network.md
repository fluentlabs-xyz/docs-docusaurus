---
title: The Fluent L2 Network
sidebar_position: 3
---

# The Fluent L2 Network

The Fluent L2 is a zk-rollup to run Wasm, EVM and SVM apps in one place. It supports blended execution of different VM targets on a shared state execution environment for real-time composability between apps from different ecosystems. The network is both EVM and SVM-compatible, maintaining ABI encodings for all contracts, and introducing no additional overhead for deploying apps in Solidity, Vyper, or Solana Rust.

Ultimately, all VMs on Fluent are simulated at the execution layer and compiled down to the Fluent rWasm VM for execution. Each VM is represented by a core Wasm-based system contract (the VM’s "compatibility contract") which defines its EE standards and provides an API to access these functions. While Fluent will initially support Wasm, EVM, and SVM-based contracts, its design is extensible, enabling support for additional VM integrations.

## App Deployment Models

The Fluent L2 will support two types of apps: shared and dedicated.

1. **Shared Apps:** These are smart contract apps that share state on Fluent’s execution environment. Note that all shared apps on the Fluent L2 compose in real-time, even across different VM targets and programming languages (e.g. Rust and Solidity).\

2. **Dedicated Apps:** These apps are customizable, independent state machines that can leverage Fluent for proof aggregation and verification. Developers can customize sovereign app runtimes, modular layers (e.g. DA, sequencing) and more.
