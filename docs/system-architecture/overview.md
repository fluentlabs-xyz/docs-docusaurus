---
title: Architecture Overview
sidebar_position: 1
---

Fluent is an Ethereum-aligned L2 that runs EVM, Wasm, and (soon) SVM contracts on a single shared state machine. This section skips the pitch for blended execution — [Blended 101](../knowledge-base/blended-101.md) covers that — and describes what the system actually looks like once a transaction lands on a node: who runs the code, where state lives, how privileged operations are gated, and how effects get committed.

## Three layers

A Fluent node has three cooperating layers, and most of the interesting engineering lives at their boundaries.

![Three cooperating layers of a Fluent node: Node/Consensus Shell, Execution Coordination, and Runtime Execution, with call/commit flow up and exec/interruption flow down.](/img/system-architecture/three-layers.svg)

**Node and consensus shell.** A modified [Reth](https://github.com/paradigmxyz/reth) stack handles networking, the mempool, block and transaction pipelines, and every JSON-RPC endpoint a wallet or indexer would expect. To an external client, a Fluent node looks like an Ethereum execution client — for most RPC calls, it behaves like one.

**Execution coordination.** REVM plus its host handlers. This layer owns frame lifecycle (how a call's context is set up, nested, and torn down), the journal that records tentative state changes, and the syscall boundary where the runtime asks the host for things it cannot do itself. Every consensus-critical commit path lives here.

**Runtime execution.** Contract code runs under Fluent's rWasm-centered executor in one of two modes: **contract mode** for untrusted user code (isolated, strict bounds, strict fuel), and **system mode** for the protocol's own delegated runtimes — EVM, Wasm, SVM, Universal Token. Both compile to the same substrate. The difference is how tightly bounded each mode is, and how deeply it hooks into the host.

## Why execution and commit are split

Running code and committing its effects are deliberately separate steps. A runtime executes until it needs something it cannot do — touch shared state, read another account, spawn a nested call — and then it yields. The host takes over, validates the request, performs the operation, and hands control back with a result.

That split is why one chain can safely host multiple execution environments. The environments never mutate state directly; they speak to the host over a fixed protocol. The host is the only place consensus rules are enforced, and every runtime is an isolated consumer of that service.

:::info
The yield-and-resume mechanism is called the **interruption protocol**. Every privileged operation on Fluent flows through it. Details in [Interruption and Syscalls](./interruption-and-syscalls.md).
:::

## What rWasm brings to the picture

rWasm — reduced WebAssembly — is Fluent's execution substrate. It's a Wasm-derived bytecode optimized for zero-knowledge proving, with deterministic semantics and engine-metered fuel. Wasm contracts map to it directly. EVM bytecode runs under a delegated EVM runtime that itself runs on rWasm. SVM ELF payloads go through their own delegated runtime. Everything converges on one proving surface.

Day to day, app developers don't see this. You write Solidity or Rust, you deploy, and the runtime router picks the right execution path based on your init code. rWasm becomes visible at the edges: when a Solidity contract calls a Rust contract atomically, when you query raw account data for a proof, or when you notice that gas accounting has a second unit called fuel sitting underneath it.

## What this section covers

- [Execution Model](./execution-model.md) — normal call lifecycle, contract vs system modes, and the structured envelopes system runtimes use to hand state changes to the host.
- [Runtime Routing and Ownable Accounts](./runtime-routing-and-ownable-accounts.md) — how one state machine hosts many execution environments without duplicating runtime logic per account.
- [Interruption and Syscalls](./interruption-and-syscalls.md) — the `exec` / `resume` handshake and the two syscall surfaces on top of it.
- [Gas and Fuel](./gas-and-fuel.md) — why Fluent has two metering units and how they settle against each other.
- [State and RPC Compatibility](./state-and-rpc-compatibility.md) — shared state, ownable-account wrapping, and the two RPC views the node exposes.
- [Runtime Upgrade](./runtime-upgrade.md) — how privileged runtime bytecode is replaced, and what stops anyone else from doing it.
- [Security Invariants](./security-invariants.md) — the consensus-critical boundaries that hold the system together.
- [Rollup Architecture](./rollup-architecture.md) — how Fluent batches, commits, and settles to Ethereum.
