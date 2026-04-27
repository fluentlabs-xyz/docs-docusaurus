---
title: Precompiles
sidebar_position: 0
---

Fluent installs a fixed set of system precompiles at genesis. Each entry below is a callable address with a specific role: dispatching execution to a delegated runtime, verifying a cryptographic primitive, gating a privileged operation, or providing a standard EVM service. The constants come from `fluentbase/crates/types/src/genesis.rs`; the contract code that backs each address lives in `fluentbase/contracts/<dir>/`.

User contracts on Fluent — Solidity, Rust/Wasm, Universal Token — route their execution into one of the delegated runtime dispatchers below. Solidity and Universal Token contracts are stored as **ownable accounts** (`0xEF44` magic prefix) that hold a pointer to the dispatcher plus runtime metadata; Wasm contracts are stored as compiled rWasm directly (`0xEF52` magic prefix) after the executor's deploy-time rewrite. The dispatcher's address holds the runtime bytecode either way. See [Runtime Routing and Ownable Accounts](../runtime-routing-and-ownable-accounts.md) for the full mechanism.

Addresses are identical across testnet, mainnet, and devnet. Authority addresses default to the values shown below at genesis, but live networks rotate them — treat the defaults as starting points, not current values.

:::tip
On-chain state for any precompile address can be inspected on [Fluentscan](https://fluentscan.xyz). The protocol source-of-truth for these constants is `fluentbase/crates/types/src/genesis.rs`.
:::

## Delegated runtime dispatchers

Calls to these addresses are not handled by deployed bytecode at the address itself. They are dispatchers: the executor loads the runtime's code, runs it, and the call's storage domain stays at the caller's account. See [Runtime Routing and Ownable Accounts](../runtime-routing-and-ownable-accounts.md) for the mechanism.

| Address | Constant | Status |
|---|---|---|
| `0x0000000000000000000000000000000000520001` | `PRECOMPILE_EVM_RUNTIME` | Active — see [EVM Runtime](./evm-runtime.md) |
| `0x0000000000000000000000000000000000520003` | `PRECOMPILE_SVM_RUNTIME` | Reserved — feature-gated, not currently active in mainnet build |
| `0x0000000000000000000000000000000000520008` | `PRECOMPILE_UNIVERSAL_TOKEN_RUNTIME` | Active — see [Universal Token Runtime](./universal-token-runtime.md) |
| `0x0000000000000000000000000000000000520009` | `PRECOMPILE_WASM_RUNTIME` | Active — see [WASM Runtime](./wasm-runtime.md) |

## Verifier precompiles

Reserved addresses for cryptographic verification primitives that have not yet been activated. Each address has stub bytecode installed at genesis but a call returns an unreachable-code error today. Documentation will follow activation.

| Address | Constant | Status |
|---|---|---|
| `0x0000000000000000000000000000000000520005` | `PRECOMPILE_WEBAUTHN_VERIFIER` | Reserved — not yet active. Documentation will follow activation. |
| `0x0000000000000000000000000000000000520006` | `PRECOMPILE_OAUTH2_VERIFIER` | Reserved — not yet active. |
| `0x0000000000000000000000000000000000520007` | `PRECOMPILE_NITRO_VERIFIER` | Reserved — not yet active. Note: Nitro attestation is already used internally by the rollup preconfirmation flow — see [Rollup Architecture](../rollup-architecture.md). The verifier precompile address itself is not yet callable. |

## System contracts

Privileged contracts that gate runtime upgrades, fee withdrawal, deterministic deployment, and cross-domain settlement. Each has a Solidity-style ABI and an authority owner.

| Address | Constant | Purpose |
|---|---|---|
| `0x0000000000000000000000000000000000520010` | `PRECOMPILE_RUNTIME_UPGRADE` | Replaces the bytecode of a delegated runtime — see [Runtime Upgrade Precompile](./runtime-upgrade.md) |
| `0x0000000000000000000000000000000000520fee` | `PRECOMPILE_FEE_MANAGER` | Withdraws accumulated protocol fees — see [Fee Manager](./fee-manager.md) |
| `0x9CAcf613fC29015893728563f423fD26dCdB8Ddc` | `PRECOMPILE_ROLLUP_BRIDGE` | Cross-chain settlement — see [Bridge Architecture](../bridge.md) |
| `0x4e59b44847b379578588920cA78FbF26c0B4956C` | `PRECOMPILE_CREATE2_FACTORY` | Deterministic deployment proxy — see [CREATE2 Factory](./create2-factory.md) |

## EIP-deployed system contracts

EIP-track precompiles deployed at protocol-specified addresses. Implementations live in `fluentbase/contracts/` like the rest, but their addresses are dictated by the EIP, not by Fluent's `0x520xxx` reservation range.

| Address | Constant | Purpose |
|---|---|---|
| `0x0000F90827F1C53a10cb7A02335B175320002935` | `PRECOMPILE_EIP2935` | Historical block-hash ring buffer (Prague) — see [EIP-2935 Block Hash Service](./eip2935.md) |
| `0x0000000000000000000000000000000000000100` | `PRECOMPILE_EIP7951` | secp256r1 (P-256) signature verification — see [secp256r1 Signature Verification](./secp256r1.md) |

## Standard EVM precompiles

Fluent ships every standard Ethereum precompile from `0x01` to `0x11` — ecrecover, sha256, ripemd160, identity, modular exponentiation, BN254 curve operations, BLAKE2 compression, KZG point evaluation, and the BLS12-381 family. See [Standard EVM Precompiles](./standard-evm-precompiles.md) for the full list and any Fluent-specific notes.

## Authority addresses

Two privileged keys exist at genesis. Both default to the same address; both are intended to be rotated immediately on a live chain (typically to a multisig). The defaults are documented for reference, not as current operational values.

| Constant | Default address | Purpose |
|---|---|---|
| `DEFAULT_UPDATE_GENESIS_AUTH` | `0xa7bf6a9168fe8a111307b7c94b8883fe02b30934` | Initial owner of `PRECOMPILE_RUNTIME_UPGRADE`. Rotated on live networks. |
| `DEFAULT_FEE_MANAGER_AUTH` | `0xa7bf6a9168fe8a111307b7c94b8883fe02b30934` | Initial owner of `PRECOMPILE_FEE_MANAGER`. Rotated on live networks. |
