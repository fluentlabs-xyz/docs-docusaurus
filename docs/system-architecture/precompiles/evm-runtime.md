---
title: EVM Runtime
sidebar_position: 1
---

The delegated EVM runtime dispatches calls and creates targeting Solidity-style contracts on Fluent. The address itself holds rWasm bytecode that wraps an EVM interpreter; every Solidity contract on Fluent is an ownable account whose `owner_address` field points here.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_EVM_RUNTIME` | `0x0000000000000000000000000000000000520001` |

## Routing

Init code with no recognised magic prefix routes to this runtime — it is the default class. The dispatch rule lives in [Runtime Routing and Ownable Accounts](../runtime-routing-and-ownable-accounts.md).

## Behavior

The runtime exposes two entry points used by REVM:

- `deploy_entry` runs at account creation. It validates the init bytecode against EIP-3541 (no `0xEF` prefix) and EIP-170 (≤ 24 KB), runs the constructor, and commits the resulting runtime bytecode plus a code hash to account metadata.
- `main_entry` runs on every subsequent call. It loads metadata, runs the EVM interpreter against the call input, syncs gas and fuel via `FUEL_DENOM_RATE = 20` at every interruption boundary, and returns the EVM-shaped result.

Nested calls and host operations (storage reads, balance queries, log emission) flow through the [interruption protocol](../interruption-and-syscalls.md) like any other system runtime.

## Fork

The interpreter targets the **Prague** EVM specification. Fluent's chain config activates Prague at genesis (see `fluentbase/crates/genesis/build.rs` `default_chain_config`).

## Source

`fluentbase/contracts/evm/`
