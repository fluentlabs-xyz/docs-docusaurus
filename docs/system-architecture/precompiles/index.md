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

| Address | Description |
|---|---|
| `0x0000000000000000000000000000000000520001` | EVM runtime — see [EVM Runtime](./evm-runtime.md) |
| `0x0000000000000000000000000000000000520003` | SVM runtime — reserved, feature-gated, not currently active in mainnet build |
| `0x0000000000000000000000000000000000520008` | Universal Token runtime — see [Universal Token Runtime](./universal-token-runtime.md) |
| `0x0000000000000000000000000000000000520009` | WASM runtime — see [WASM Runtime](./wasm-runtime.md) |

## Verifier precompiles

Reserved addresses for cryptographic verification primitives that have not yet been activated. Each address has stub bytecode installed at genesis but a call returns an unreachable-code error today. Documentation will follow activation.

| Address | Description |
|---|---|
| `0x0000000000000000000000000000000000520005` | WebAuthn verifier — reserved, not yet active |
| `0x0000000000000000000000000000000000520006` | OAuth2 verifier — reserved, not yet active |
| `0x0000000000000000000000000000000000520007` | Nitro verifier — reserved, not yet active |

## System contracts

Privileged contracts that gate runtime upgrades, fee withdrawal, deterministic deployment, and cross-domain settlement. Each has a Solidity-style ABI and an authority owner.

| Address | Description |
|---|---|
| `0x0000000000000000000000000000000000520010` | Runtime upgrade — replaces the bytecode of a delegated runtime. See [Runtime Upgrade Precompile](./runtime-upgrade.md) |
| `0x0000000000000000000000000000000000520fee` | Fee manager — withdraws accumulated protocol fees. See [Fee Manager](./fee-manager.md) |
| `0x9CAcf613fC29015893728563f423fD26dCdB8Ddc` | Rollup bridge — cross-chain settlement. See [Bridge Architecture](../bridge.md) |
| `0x4e59b44847b379578588920cA78FbF26c0B4956C` | CREATE2 factory — deterministic deployment proxy. See [CREATE2 Factory](./create2-factory.md) |

## EIP-deployed system contracts

EIP-track precompiles deployed at protocol-specified addresses. Implementations live in `fluentbase/contracts/` like the rest, but their addresses are dictated by the EIP, not by Fluent's `0x520xxx` reservation range.

| Address | Description |
|---|---|
| `0x0000F90827F1C53a10cb7A02335B175320002935` | EIP-2935 — historical block-hash ring buffer (Prague). See [EIP-2935 Block Hash Service](./eip2935.md) |
| `0x0000000000000000000000000000000000000100` | EIP-7951 — secp256r1 (P-256) signature verification. See [secp256r1 Signature Verification](./secp256r1.md) |

## Standard EVM precompiles

Fluent ships every standard Ethereum precompile from `0x01` to `0x11` — ecrecover, sha256, ripemd160, identity, modular exponentiation, BN254 curve operations, BLAKE2 compression, KZG point evaluation, and the BLS12-381 family. See [Standard EVM Precompiles](./standard-evm-precompiles.md) for the full list and any Fluent-specific notes.

## Authority addresses

Two privileged keys exist at genesis. Both default to `0xa7bf6a9168fe8a111307b7c94b8883fe02b30934` and are intended to be rotated immediately on a live chain (typically to a multisig). The defaults are documented for reference, not as current operational values.

- **Runtime upgrade owner** (constant `DEFAULT_UPDATE_GENESIS_AUTH`) — initial caller permitted to invoke `upgradeTo` on the [Runtime Upgrade Precompile](./runtime-upgrade.md).
- **Fee manager owner** (constant `DEFAULT_FEE_MANAGER_AUTH`) — initial caller permitted to invoke `withdraw` on the [Fee Manager](./fee-manager.md).

Both contracts read their stored owner first and only fall back to the default when the slot is zero. The constants live in `fluentbase/crates/types/src/genesis.rs`.

## Bytecode model

Every account on Fluent stores its code as one of four `Bytecode` variants. Knowing which variant a contract uses determines whether metadata syscalls work, whether REVM dispatches through an owner address, and what the leading bytes of `account.code` look like.

| Variant | Magic prefix | Used by |
|---|---|---|
| `LegacyAnalyzed` | (no Fluent magic) | Plain analyzed EVM bytecode (legacy chain accounts). |
| `Eip7702` | `0xEF01` | EIP-7702 account-code delegation (EOAs that delegate to a contract). |
| `OwnableAccount` | `0xEF44` | Solidity contracts (owner = EVM Runtime), Universal Token contracts (owner = UT Runtime), and the EVM-style system precompiles. |
| `Rwasm` | `0xEF52` | Wasm contracts (after the deploy-time wrapper rewrite), and system contracts pre-deployed at genesis as raw rWasm (Runtime Upgrade, Fee Manager, EIP-2935, secp256r1, etc.). |

`OwnableAccount` carries `owner_address` plus runtime-specific `metadata` bytes; the runtime is dispatched through on every call. `Rwasm` accounts execute their bytes directly with no owner-address indirection.

## Magic bytes reference

| Constant | Value | Module |
|---|---|---|
| `WASM_MAGIC_BYTES` | `0x0061736d` (standard `\0asm`) | `crates/types/src/lib.rs` |
| `UNIVERSAL_TOKEN_MAGIC_BYTES` | `0x45524320` (`"ERC "`) | `crates/types/src/lib.rs` |
| `RWASM_MAGIC_BYTES` | `0xef52` | `revm-bytecode/.../rwasm.rs` |
| `OWNABLE_ACCOUNT_MAGIC_BYTES` | `0xef44` | `revm-bytecode/.../ownable_account.rs` |
| `EIP7702_MAGIC_BYTES` | `0xef01` | `revm-bytecode/.../eip7702.rs` |
