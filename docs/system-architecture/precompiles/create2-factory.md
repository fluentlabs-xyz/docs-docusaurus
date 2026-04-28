---
title: CREATE2 Factory
sidebar_position: 6
---

A deterministic deployment proxy installed at the same address Fluent shares with most EVM-compatible chains. A deployer broadcasts a single transaction with init bytecode and a 32-byte salt; the factory deploys the contract via `CREATE2` and returns its address. Used for cross-chain address parity — identical bytecode plus identical salt yields the same address on any chain that has this factory at the same location.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_CREATE2_FACTORY` | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |
| `PRECOMPILE_CREATE2_FACTORY_DEPLOYER` | `0x3fab184622dc19b6109349b94811493bf2a45362` |

## Provenance

This is [Arachnid's deterministic deployment proxy](https://github.com/Arachnid/deterministic-deployment-proxy). Fluent embeds it at genesis using the same bytecode and the same address as Ethereum mainnet, so addresses derived against this factory match on all chains that include it. The factory has no Rust contract crate — the artifacts are checked-in Yul source plus the compiled binary at `contracts/create2-factory/`.

## Calling convention

The factory is a Yul-level contract with no Solidity ABI. Calldata format:

```text
| 32 bytes salt | N bytes init code |
```

The factory hashes the calldata, runs `CREATE2(value=msg.value, salt, init_code)`, and returns the deployed address. Reverts if `CREATE2` fails.

## Storage representation

The factory is an EVM contract — its on-chain state is `Bytecode::OwnableAccount(owner = PRECOMPILE_EVM_RUNTIME, metadata = EthereumMetadata payload)`. The payload wraps the 73-byte Yul-compiled bytecode. Calls to the factory dispatch through the EVM runtime like any other Solidity contract — see [EVM Runtime](./evm-runtime.md).

## Source

`fluentbase/contracts/create2-factory/` — `deterministic-deployment-proxy.bin` (binary), `deterministic-deployment-proxy.yul` (source).
