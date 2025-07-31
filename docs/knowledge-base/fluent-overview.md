---
title: Fluent Overview
sidebar_position: 2
---
Fluent Tech Stack Overview
---

Fluent is the first [blended execution](blended-101.md) network. The project encompasses a zero-knowledge virtual machine (zkVM), Layer-2 network, and development framework for building diverse blockchain-based applications on Ethereum.

Fluent's zkVM is written in SP1 as shown in the [rwasm-zkvm repo](https://github.com/fluentlabs-xyz/rwasm-zkvm).

:::tip Fluent’s unique value proposition lies in its ability to:

* simulate the execution environment (EE) of multiple virtual machines (VMs),
* enabling real-time composability of smart contracts pertaining to different VMs (the EVM, the SVM, Wasm, etc.),
* and written in various programming languages (e.g., Solidity, Rust, and more),
* on a shared state execution environment.

:::

Fluent supports atomic composability between apps targeting different VMs, and _blended_ apps composed of smart contracts mixed and matched between them. Interaction between the different types of contracts the network supports happens under the hood and is both atomic and happens in real-time.

:::info

For more details regarding the architecture of the Fluent tech stack from a core engineer and protocol analyst point of view, visit the [tech book](https://book.gblend.xyz).

:::

---

## The Fluent VM

The Fluent VM is a minimally modified version of the WebAssembly (Wasm) binary instruction format designed for verifiable applications. It is a reduced version of Wasm, called rWasm, which maintains compatibility with the original Wasm instruction set yet is optimized for zero-knowledge (zk) operations. Sections of the instruction set are embedded inside the binary, enhancing the efficiency and ease of verification of Wasm programs in a zk-rollup.

rWasm features support for multiple VM targets at the execution layer. Its account and state structure are managed by specialized system contracts that represent each supported VM. Ultimately, these VMs are simulated and compiled down to rWasm for execution. The design is extensible in that support for additional VMs can be added over time. It also ensures atomic and synchronous composability between smart contracts pertaining to the different VMs it supports.

---

## The Fluent L2 Network

The Fluent L2 is a zk-rollup to run Wasm, EVM and SVM apps in one place. It supports blended execution of different VM targets on a shared state execution environment for real-time composability between apps from different ecosystems. The network is both EVM and SVM-compatible, maintaining ABI encodings for all contracts, and introducing no additional overhead for deploying apps in Solidity, Vyper, or Solana Rust.

Ultimately, all VMs on Fluent are simulated at the execution layer and compiled down to the Fluent rWasm VM for execution. Each VM is represented by a core Wasm-based system contract (the VM’s "compatibility contract") which defines its EE standards and provides an API to access these functions. While Fluent will initially support Wasm, EVM, and SVM-based contracts, its design is extensible, enabling support for additional VM integrations.

### App Deployment Models

The Fluent L2 will support two types of apps: shared and dedicated.

1. **Shared Apps:** These are smart contract apps that share state on Fluent’s execution environment. Note that all shared apps on the Fluent L2 compose in real-time, even across different VM targets and programming languages (e.g. Rust and Solidity).
2. **Dedicated Apps:** These apps are customizable, independent state machines that can leverage Fluent for proof aggregation and verification. Developers can customize sovereign app runtimes, modular layers (e.g. DA, sequencing) and more.

---

## The Fluentbase Framework

The [Fluentbase framework](../fluentbase-sdk/build-w-fluentbase-sdk.md) is used to deploy smart contracts on the Fluent L2 as well as blockchains and verifiable compute environments that compile to rWasm. It introduces an SDK and a proving system for the Fluent state transition function (STF). It is the basis for the Fluent L2 and can be used to build:

* **Blended apps:** Smart contracts on the Fluent L2 written in the various programming languages that the network supports.
* **Blended execution networks:** blockchain-based networks (L2s, L3s, etc.) which simulates multiple VM targets on a shared execution layer.
* **Arbitrary compute environments:** off-chain dedicated compute environments with arbitrary logic.

:::tip 

Fluentbase supports integrations to build modular blockchains including DA layers (Celestia, Avail, etc.), shared sequencers (Espresso, Nodekit), and more.

:::