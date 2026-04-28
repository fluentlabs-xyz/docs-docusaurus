---
title: Glossary
sidebar_position: 11
---

# Glossary

## The Fluent VM

Fluent's rWasm (reduced WebAssembly) virtual machine (VM) is a versatile VM that simulates the execution environment (EE) of multiple distinct VMs including Wasm, the EVM, the SVM, and more.

This allows for atomically composable apps using distinct programming language(s) and standards on a shared state execution environment. Each supported EE compiles to rWasm for execution, which employs a fully compatible Wasm binary representation optimized for zero-knowledge (zk) operations.

## rWasm

rWasm (reduced WebAssembly) is Fluent's execution substrate. It is a simplified, deterministic subset of the Wasm binary format, designed so every program running on Fluent — from ordinary smart contracts to the runtimes that execute other VMs on top of it — can be proven under zero-knowledge without the full complexity of standard Wasm.

Where standard Wasm is optimized for fast execution in browsers and servers, rWasm is optimized for verifiability. Memory semantics are stricter, trap behaviour is deterministic, and engine-metered fuel replaces ad-hoc gas accounting. EVM bytecode runs under rWasm through a delegated runtime; native Wasm contracts map to it directly; future VM integrations follow the same pattern.

For most developers rWasm is invisible — you write Solidity or Rust, deploy, and the runtime router picks the right execution path. It becomes visible at the edges: when querying raw account data for a proof, when reasoning about fuel versus gas, or when auditing the boundary between runtime and host. See [Architecture Overview](system-architecture/overview.md).

## The Fluent L2

The Fluent L2 is an Ethereum-centric zk-rollup for Wasm, EVM, and SVM based apps. It supports real-time composability between apps targeting different VMs, and "blended" apps composed of smart contracts mixed and matched between them. Interaction between the different types of contracts on the L2 happens under the hood and is both atomic and happens in real-time.

## The Fluentbase Framework

The Fluentbase framework is used to deploy smart contracts on Fluent as well as blockchains and verifiable compute environments that compile to rWasm. The framework's execution layer supports arbitrary compute and the emulation of multiple VM targets.

Fluentbase is optimized for proving efficiency and integrates with modular components (sequencers, DA layers, etc.) for the deployment of customizable blended execution networks.

## Ownable Account

An ownable account is how Fluent attaches execution logic to an account without storing runtime bytecode inside every account that uses it. Most contracts on Fluent (Solidity, Universal Token) live in an account whose code field is a small wrapper carrying a magic header (`0xEF44`), an `owner_address` pointing to a delegated runtime, and runtime-specific metadata. When the account is called, REVM loads the executable code from the owner, not from the account itself — while keeping the original account as the storage target. Wasm contracts are stored differently: their compiled rWasm sits at the account directly (magic prefix `0xEF52`) without the wrapper indirection.

This separation — account identity is local, execution logic is delegated — is what lets one state machine host EVM, Wasm, and SVM contracts together. A Solidity contract and a Rust contract end up as two ownable accounts pointing at two different delegated runtimes. They share the state trie, can call each other atomically, and the host mediates every privileged operation between them with the same rules.

Ownership is set at deployment time based on the init code's magic prefix, and it cannot change afterwards — the account's execution class is part of its identity. See [Runtime Routing and Ownable Accounts](system-architecture/runtime-routing-and-ownable-accounts.md).

## Delegated Runtime

A delegated runtime is the execution code that an ownable account points at. Each supported VM family has its own: the delegated EVM runtime executes EVM bytecode, the delegated Wasm runtime executes Wasm, the Universal Token runtime implements a shared token surface, and future runtimes (like SVM) plug in the same way.

Delegated runtimes are protocol-owned: their bytecode lives at fixed system addresses, is installed and replaced through a governed upgrade path, and is shared by every account that opts into its execution class. A bug fix or behaviour change in the delegated EVM runtime affects every EVM contract on Fluent at once — which is why runtime upgrades are treated as fork-critical change management.

Delegated runtime addresses are not callable directly as normal contracts; the router blocks that path to keep user flows going through ownable-account semantics. See [Runtime Routing and Ownable Accounts](system-architecture/runtime-routing-and-ownable-accounts.md).

## Interruption Protocol

The interruption protocol is the mechanism through which every privileged operation on Fluent is performed. Runtime code cannot touch shared state directly — when a contract needs to read storage, emit a log, spawn a nested call, or do anything else that affects state outside its own memory, it yields control to the host. The host performs the operation, validates it against protocol rules, and resumes the runtime from the saved execution point.

The handshake has two verbs: `exec` starts or resumes a runtime frame with a fuel budget, and `resume` hands control back after a privileged action. A positive exit code from the runtime is a `call_id` — a handle into a saved resumable context — not a final status. The host uses this protocol to keep consensus-critical rules (ordering, charging, validation) in one place while allowing multiple runtime families to coexist on top.

See [Interruption and Syscalls](system-architecture/interruption-and-syscalls.md) for the full handshake, syscall surfaces, and safety boundaries.

## Fuel

Fuel is Fluent's internal unit of runtime execution accounting. Where gas tracks EVM-visible economics — the same unit wallets quote, explorers display, and transactions pay in ETH — fuel meters the underlying rWasm work: every runtime step, every syscall, every host operation is charged in fuel.

Gas and fuel are linked by a fixed deterministic conversion ratio (`FUEL_DENOM_RATE = 20`: each gas unit buys 20 fuel). At the start of a call the host derives a fuel budget from the remaining gas; when the runtime returns, any consumed or refunded fuel is translated back into gas settlement. Rounding behaviour at the conversion boundary is part of consensus correctness — every node performs it identically.

For most smart contract development, fuel is invisible. It matters if you are writing a gas estimator, building a custom runtime, or auditing privileged charging paths. See [Gas and Fuel](system-architecture/gas-and-fuel.md).

## Virtual Machine (VM)

A virtual machine (VM) in the context of blockchains is a sandbox environment that executes smart contracts. Examples include the Ethereum Virtual Machine (EVM) and the Solana Virtual Machine (SVM).

## Execution Environment (EE)

The execution environment (EE) refers to the entire system where blockchain transactions are processed. It encompasses the state transition function (STF) of a protocol, which includes the virtual machine (VM) and additional protocol-specific checks and balances necessary for the network's operation.

These checks may involve gas calculations, nonce verification, and balance updates to ensure the proper execution of transactions.

## Blended Execution Network

A blended execution network supports real-time composability between apps targeting different VMs on a shared execution layer. It enables applications written for different VMs to interact seamlessly within the same state machine.

This allows developers to leverage the best features and tools from various VMs without fragmenting user experience. In a blended execution environment, smart contracts from different VMs share state; interoperability between these contracts is atomic and synchronous, providing a unified platform for diverse smart contract applications.

## Zk-Rollup

Zk-rollups are blockchain-based execution environments that post compressed data to the same onchain data availability network as the one responsible for verifying its cryptographic proofs. Proofs are examined and validated by a "verifier," which cryptographically ensures the integrity of all transactions.

## Preconfirmation

Preconfirmation is the fast-finality step in Fluent's rollup pipeline. After a sequencer commits a batch and publishes its data to L1, a trusted-execution-environment (TEE) verifier — an AWS Nitro enclave whose signing key is cryptographically bound to a specific enclave image via an SP1-verified attestation — signs the batch root. This signed batch reaches the Preconfirmed state on the rollup contract well before the challenge window elapses, giving users a rapid execution attestation they can trust operationally.

Preconfirmation is not the same as finalization. A preconfirmed batch is still challengeable; if a successful challenge proves it wrong, the batch can be reverted. Finalization happens later — either after a delay window without unresolved challenges, or immediately once all block commitments have been cryptographically proven.

This distinction matters for the bridge: L2 → L1 withdrawals from a preconfirmed-but-not-finalized batch enter an optimistic path guarded by a per-token rate cap. Finalized withdrawals are unrestricted. See [Rollup Architecture](system-architecture/rollup-architecture.md).

## Wasm

Wasm (WebAssembly) is a low-level, portable binary format and compilation target for high-level programming languages. General-purpose programming languages, such as Rust, TypeScript, and C++ compile to Wasm.

It is efficient, secure, and flexible, enabling high-performance web applications like 3D graphics, video editing, gaming, and more. In the blockchain context, networks like Cosmos, Near, Polkadot, and Tezos leverage Wasm for execution.
