---
title: State and RPC Compatibility
sidebar_position: 7
---

Fluent's state model is deliberately Ethereum-shaped on the outside: one trie, account addresses, balances, nonces, code hashes. But some contracts are stored in the runtime-managed **ownable-account wrapper** (see [Runtime Routing](./runtime-routing-and-ownable-accounts.md)), so what a wallet or indexer reads from a Fluent node isn't always the bytes sitting in storage. The wrapper carries execution metadata that would confuse Ethereum tooling, so the node exposes two RPC views — one normalized for compatibility, one raw for infrastructure.

This page covers the shared-state model and the RPC split on top of it.

## One shared state, many runtimes

Every contract — EVM, Wasm, Universal Token, future runtimes like SVM — lives in the same account/state trie. No per-runtime storage silo, no bridge between VM environments, no separate address space. A Solidity contract and a Rust contract are two accounts in the same trie, and a call from one to the other is an ordinary in-transaction call, not a message passed across a boundary.

That's the structural property that makes cross-runtime composability synchronous instead of asynchronous. Two contracts in different runtime families can call each other in a single transaction because the state they read and write is the same state. The host mediates every operation between them with the same rules, regardless of which runtime owns which account.

The cost is that some accounts carry more than plain EVM bytecode in their code field. They carry a wrapper describing which runtime should execute them and what metadata that runtime needs. The RPC story starts there.

## The ownable-account wrapper, briefly

The full mechanics live in [Runtime Routing and Ownable Accounts](./runtime-routing-and-ownable-accounts.md). For RPC purposes what matters: the *code* field of an ownable account is not the contract's executable bytecode. It's a wrapper carrying a magic header, the delegated runtime address (`owner_address`), and runtime metadata. The executable bytecode lives at the delegated runtime's address, and the wrapper tells the node where to find it.

An Ethereum-compatible client that reads this field expecting plain EVM bytecode gets confused: the wrapper isn't valid EVM code, the code hash doesn't match any EVM interpreter's expectations, bytecode-based identity checks fail. So the RPC layer has to make a choice.

## Two views: compatibility and raw

Fluent exposes every account-and-code RPC method in two forms:

- **Compatibility view** — normalized for Ethereum tooling. For ownable accounts, the node extracts the EVM-facing bytecode from the underlying delegated runtime and returns it; code hashes are adjusted to match the extracted bytecode.
- **Raw view** — exactly what is stored. For ownable accounts, the node returns the wrapper bytes as-is, with the original code hash. No normalization.

| Compatibility method | Raw method | Purpose |
|---|---|---|
| `eth_getCode` | `eth_getRawCode` | contract code bytes |
| `eth_getAccount` | `eth_getRawAccount` | account fields (balance, nonce, code hash) |
| `eth_getAccountInfo` | `eth_getRawAccountInfo` | combined account info + code payload |

For accounts that aren't ownable — EOAs, plain contracts without a wrapper — both views return the same bytes.

## When to use which

**Compatibility methods** are the right choice for anything built on standard Ethereum assumptions: wallets, app SDKs, Etherscan-style explorers, bytecode-matching verification, generic `eth_*` consumers. These expect account fields shaped like EVM, and the compatibility view gives them exactly that.

**Raw methods** are for infrastructure that needs the bytes that actually live in storage. Typical cases:

- building or validating account and state proofs against the real trie,
- cross-checking state-root or witness pipelines,
- indexers that must preserve canonical stored bytes,
- debugging divergence between what a client sees and what is persisted,
- fork or fork-db tooling where cache keys or bytecode identity must match storage exactly.

If you're writing a Fluent-aware explorer or a proving pipeline, you want raw. Otherwise, stick to compatibility and treat the extraction as invisible.

## Difference from upstream Reth

Fluent's node is based on a modified Reth, but upstream Reth doesn't know about ownable-account wrapping. Its `eth_getCode` returns whatever bytes are stored at the account's code field, period. On Fluent that behavior would leak the wrapper to every Ethereum client, which is exactly what the compatibility view is there to prevent.

The fork carries the wrapped-account normalization logic. Default methods lean compatibility-first so downstream Ethereum tooling keeps working; raw methods are the explicit opt-in when you need storage-level truth.

## Why the split exists

Both views are necessary. Compatibility-only would leave proof systems and indexers with no way to address the bytes that actually live on-chain — every query would go through a normalization layer they can't invert. Raw-only would force every wallet and SDK to handle Fluent accounts specifically, breaking the "point your tool at the RPC" promise.

Default methods compatibility-first, raw methods explicit. Ethereum tooling sees an Ethereum-shaped chain; Fluent-aware infrastructure sees everything as it is.
