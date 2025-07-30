---
title: Glossary
sidebar_position: 6
---

# Glossary

## The Fluent VM

Fluent's rWasm (reduced WebAssembly) virtual machine (VM) is a versatile VM that simulates the execution environment (EE) of multiple distinct VMs including Wasm, the EVM, the SVM, and more.

This allows for atomically composable apps using distinct programming language(s) and standards on a shared state execution environment. Each supported EE compiles to rWasm for execution, which employs a fully compatible Wasm binary representation optimized for zero-knowledge (zk) operations.

## The Fluent L2

The Fluent L2 is an Ethereum-centric zk-rollup for Wasm, EVM, and SVM based apps. It supports real-time composability between apps targeting different VMs, and "blended" apps composed of smart contracts mixed and matched between them. Interaction between the different types of contracts on the L2 happens under the hood and is both atomic and happens in real-time.

## The Fluentbase Framework

The Fluentbase framework is used to deploy smart contracts on Fluent as well as blockchains and verifiable compute environments that compile to rWasm. The framework’s execution layer supports arbitrary compute and the emulation of multiple VM targets.

Fluentbase is optimized for proving efficiency and integrates with modular components (sequencers, DA layers, etc.) for the deployment of customizable blended execution networks.

## Virtual Machine (VM)

A virtual machine (VM) in the context of blockchains is a sandbox environment that executes smart contracts. Examples include the Ethereum Virtual Machine (EVM) and the Solana Virtual Machine (SVM).

## Execution Environment (EE)

The execution environment (EE) refers to the entire system where blockchain transactions are processed. It encompasses the state transition function (STF) of a protocol, which includes the virtual machine (VM) and additional protocol-specific checks and balances necessary for the network’s operation.

These checks may involve gas calculations, nonce verification, and balance updates to ensure the proper execution of transactions.

## Blended Execution Network

A blended execution network supports real-time composability between apps targeting different VMs on a shared execution layer. It enables applications written for different VMs to interact seamlessly within the same state machine.

This allows developers to leverage the best features and tools from various VMs without fragmenting user experience. In a blended execution environment, smart contracts from different VMs share state; interoperability between these contracts is atomic and synchronous, providing a unified platform for diverse smart contract applications.

## Zk-Rollup

Zk-rollups are blockchain-based execution environments that post compressed data to the same onchain data availability network as the one responsible for verifying its cryptographic proofs. Proofs are examined and validated by a "verifier," which cryptographically ensures the integrity of all transactions.

## Wasm

Wasm (WebAssembly) is a low-level, portable binary format and compilation target for high-level programming languages. General-purpose programming languages, such as Rust, TypeScript, and C++ compile to Wasm.

It is efficient, secure, and flexible, enabling high-performance web applications like 3D graphics, video editing, gaming, and more. In the blockchain context, networks like Cosmos, Near, Polkadot, and Tezos leverage Wasm for execution.
