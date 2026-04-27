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

Init code starting with `WASM_MAGIC_BYTES = 0x0061736d` (the standard Wasm 4-byte preamble) routes to this runtime. The dispatcher logic lives in `resolve_precompiled_runtime_from_input` in `fluentbase/crates/types/src/genesis.rs`.

## Behavior

`deploy_entry` compiles the input Wasm to rWasm via `RwasmModule::compile`, validates the result against `RWASM_MAX_CODE_SIZE`, and returns the compiled module plus any constructor parameters. Compilation is metered:

```text
WASM_COMPILATION_OVERHEAD_FUEL_PER_BYTE = 50 * FUEL_DENOM_RATE = 1000 fuel/byte = 50 gas/byte
```

A 100 KB Wasm payload pays roughly 5,000,000 gas just to compile. Estimate deploy cost accordingly.

After compilation, the executor installs the rWasm bytes at the deployed address (replacing the temporary ownable wrapper). The account's code field then starts with the rWasm magic prefix `0xEF52`, and subsequent calls execute the rWasm directly at that address — `main_entry` on this dispatcher returns `UnreachableCodeReached` and is never hit on a properly deployed contract. See the wrapper-rewrite path in [Runtime Routing and Ownable Accounts](../runtime-routing-and-ownable-accounts.md).

## Source

`fluentbase/contracts/wasm/`
