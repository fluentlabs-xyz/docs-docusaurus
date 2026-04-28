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

Init code with no recognised magic prefix routes to this runtime — it is the default class. The dispatch rule lives in [Runtime Routing and Ownable Accounts](../runtime-routing-and-ownable-accounts.md). Direct calls to the runtime address are rejected by the executor's `is_delegated_runtime_address` check.

## Behavior

The runtime exposes two entry points used by REVM:

- `deploy_entry` runs at account creation. It runs the init code under the EVM interpreter, validates the deployed bytecode against EIP-3541 (no `0xEF` prefix) and EIP-170 (≤ 24 KB), charges `CODEDEPOSIT` per output byte, and writes the resulting deployed bytecode as `EthereumMetadata::Analyzed` into the account's ownable-account metadata.
- `main_entry` runs on every subsequent call. It reads the metadata, decodes it as `EthereumMetadata`, runs the EVM interpreter against the call input, syncs gas and fuel via `FUEL_DENOM_RATE = 20` at every interruption boundary, and returns the EVM-shaped result.

Nested calls and host operations (storage reads, balance queries, log emission) flow through the [interruption protocol](../interruption-and-syscalls.md) like any other system runtime. EVM bytecode is never the executing rWasm bytecode — it is always carried as metadata under the ownable-account wrapper.

## Storage representation

Solidity contracts deploy as `Bytecode::OwnableAccount(owner = PRECOMPILE_EVM_RUNTIME, metadata = serialized EthereumMetadata)`. The wrapper layout is `0xEF44 || 0x00 || owner_address (20 bytes) || metadata (N bytes)`. The metadata payload begins with a 32-byte version header — `ETHEREUM_METADATA_VERSION_ANALYZED` signals an analyzed bytecode payload (bincode-encoded `(hash, len, padded_bytecode, jump_table)`); other values are treated as a legacy code hash followed by raw bytecode.

## Errors

- `CreateContractStartingWithEF` — deployed bytecode begins with `0xEF` (EIP-3541 violation).
- `CreateContractSizeLimit` — deployed bytecode exceeds 24 KB (EIP-170 violation).
- `OutOfFuel` — `CODEDEPOSIT` charge fails or call-level fuel exhaustion.
- Mapped EVM instruction results — standard EVM revert/halt classes propagated from the interpreter.

## Source

`fluentbase/contracts/evm/`
