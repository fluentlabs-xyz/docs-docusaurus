---
title: State and Storage Model
sidebar_position: 6
---

Fluent architecture keeps one shared state model while supporting heterogeneous execution styles.

## Shared trie/state principle

A major architectural objective is that applications from different runtime families compose over one state surface, not isolated per-VM stores.

This is what enables synchronous composability without external state bridges.

## Account model compatibility

The tech-book presents a simplified account structure aligned with Ethereum-style fields (address, balance, nonce, code hash, code size).

Current Fluent architecture extends account behavior with ownership/routing metadata concepts to support runtime delegation and compatibility mapping where required.

## Metadata and projected representations

To bridge execution-environment differences, Fluent architecture includes metadata-oriented patterns such as:

- projected/compatibility address handling for non-native formats,
- metadata storage for runtime-specific context,
- ownership-linked metadata policies.

This is an architectural response to format mismatches (address widths, bytecode containers, storage conventions).

## Raw vs compatibility views

A recurring design pattern is dual data exposure:

- **compatibility-oriented view** for mainstream EVM-facing tooling,
- **raw/storage-oriented view** for infra, proving, indexing, and forensic correctness.

This split appears in RPC and runtime design because storage-level truth and compatibility-level expectations are not always identical for wrapped/runtime-managed accounts.

## Why the storage model is host-sensitive

Even though runtime executes business logic, storage correctness is constrained by host/governed commit rules and interruption handling.

So storage architecture is not just “a trie schema”; it is an execution + policy + commit contract.

## Practical consequence for builders

Application developers get familiar account interfaces, but protocol/infrastructure developers should remember:

- there are intentional compatibility mappings,
- raw representations can differ,
- proof/indexing systems should choose interfaces based on whether they need compatibility semantics or canonical storage semantics.
