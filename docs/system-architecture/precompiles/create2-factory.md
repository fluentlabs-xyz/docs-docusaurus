---
title: CREATE2 Factory
sidebar_position: 6
---

A deterministic deployment proxy installed at the same address Fluent shares with most EVM-compatible chains. A deployer broadcasts a single transaction with init bytecode and a 32-byte salt; the factory deploys the contract via `CREATE2` and returns its address. Used for cross-chain address parity — identical bytecode plus identical salt yields the same address on any chain that has this factory at the same location.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_CREATE2_FACTORY` | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |

## Provenance

This is [Arachnid's deterministic deployment proxy](https://github.com/Arachnid/deterministic-deployment-proxy). Fluent embeds it at genesis using the same bytecode and the same address as Ethereum mainnet, so addresses derived against this factory match on all chains that include it.

## Calling convention

The factory is a Yul-level contract with no Solidity ABI. Calldata format:

```text
| 32 bytes salt | N bytes init code |
```

The factory hashes the calldata, runs `CREATE2(value=msg.value, salt, init_code)`, and returns the deployed address. Reverts if `CREATE2` fails.

## Source

`fluentbase/contracts/create2-factory/` — `deterministic-deployment-proxy.bin` (binary), `deterministic-deployment-proxy.yul` (source).
