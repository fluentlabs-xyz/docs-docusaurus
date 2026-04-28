---
title: WASM Runtime
sidebar_position: 2
---

The delegated WASM runtime dispatches calls and creates targeting Wasm contracts. Init code starting with the WASM magic preamble is routed here at deploy time.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_WASM_RUNTIME` | `0x0000000000000000000000000000000000520009` |

## Routing

Init code starting with `WASM_MAGIC_BYTES = 0x0061736d` (the standard Wasm 4-byte preamble) routes to this runtime. The dispatcher logic lives in `resolve_precompiled_runtime_from_input` in `fluentbase/crates/types/src/genesis.rs`. Direct calls to the runtime address are rejected.

## Behavior

`deploy_entry` compiles the input Wasm to rWasm via `RwasmModule::compile`, validates the result against `RWASM_MAX_CODE_SIZE = 12 MiB`, and returns the compiled module plus any constructor parameters. Compilation is metered:

```text
WASM_COMPILATION_OVERHEAD_FUEL_PER_BYTE = 50 * FUEL_DENOM_RATE = 1000 fuel/byte = 50 gas/byte
```

A 100 KB Wasm payload pays roughly 5,000,000 gas just to compile. Estimate deploy cost accordingly.

After compilation, the executor installs the rWasm bytes at the deployed address (replacing the temporary ownable wrapper). The account's code field then starts with the rWasm magic prefix `0xEF52`, and subsequent calls execute the rWasm directly at that address — `main_entry` on this dispatcher returns `UnreachableCodeReached` and is never hit on a properly deployed contract. See the wrapper-rewrite path in [Runtime Routing and Ownable Accounts](../runtime-routing-and-ownable-accounts.md).

## Errors

- `MalformedBuiltinParams` — `RwasmModule::compile` rejected the input.
- `CreateContractSizeLimit` — compiled rWasm exceeds `RWASM_MAX_CODE_SIZE`.
- `UnreachableCodeReached` — only path through `main_entry`; should not be reached on a properly deployed contract.

## Metadata syscalls and Wasm contracts

Metadata syscalls operate only on `Bytecode::OwnableAccount`. Because Wasm contracts are stored as `Bytecode::Rwasm` after the deploy rewrite, the syscalls behave as follows when called against a Wasm contract:

- `METADATA_SIZE` returns `size = 0` (graceful, no halt).
- `METADATA_ACCOUNT_OWNER` returns `Address::ZERO` (graceful, no halt).
- `METADATA_WRITE` and `METADATA_COPY` halt with `MalformedBuiltinParams`.

## Source

`fluentbase/contracts/wasm/`
