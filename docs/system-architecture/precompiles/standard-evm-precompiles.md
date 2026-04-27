---
title: Standard EVM Precompiles
sidebar_position: 9
---

Fluent ships every standard Ethereum precompile at addresses `0x01` through `0x11`. Each is implemented as a system contract that wraps the corresponding `revm_precompile` function — semantics are byte-for-byte identical to mainnet Ethereum, with one minor implementation note in BN254.

| Address | Description |
|---|---|
| `0x0000000000000000000000000000000000000001` | `ecrecover` — secp256k1 signature recovery (Frontier) |
| `0x0000000000000000000000000000000000000002` | SHA-256 hash (Frontier) |
| `0x0000000000000000000000000000000000000003` | RIPEMD-160 hash (Frontier) |
| `0x0000000000000000000000000000000000000004` | Identity / data copy (Frontier) |
| `0x0000000000000000000000000000000000000005` | Modular exponentiation — EIP-198 (Berlin gas schedule) |
| `0x0000000000000000000000000000000000000006` | BN254 G1 addition — EIP-196 |
| `0x0000000000000000000000000000000000000007` | BN254 G1 scalar multiplication — EIP-196 |
| `0x0000000000000000000000000000000000000008` | BN254 pairing check — EIP-197 |
| `0x0000000000000000000000000000000000000009` | BLAKE2 F compression — EIP-152 |
| `0x000000000000000000000000000000000000000a` | KZG point evaluation — EIP-4844 |
| `0x000000000000000000000000000000000000000b` | BLS12-381 G1 addition — EIP-2537 |
| `0x000000000000000000000000000000000000000c` | BLS12-381 G1 multi-scalar multiplication — EIP-2537 |
| `0x000000000000000000000000000000000000000d` | BLS12-381 G2 addition — EIP-2537 |
| `0x000000000000000000000000000000000000000e` | BLS12-381 G2 multi-scalar multiplication — EIP-2537 |
| `0x000000000000000000000000000000000000000f` | BLS12-381 pairing — EIP-2537 |
| `0x0000000000000000000000000000000000000010` | BLS12-381 map FP → G1 — EIP-2537 |
| `0x0000000000000000000000000000000000000011` | BLS12-381 map FP² → G2 — EIP-2537 |

Implementations live under `fluentbase/contracts/<name>/`, where `<name>` matches the precompile: `ecrecover`, `sha256`, `ripemd160`, `identity`, `modexp`, `bn256`, `blake2f`, `kzg`, `bls12381`. Address constants are defined in `fluentbase/crates/types/src/genesis.rs` as `PRECOMPILE_<NAME>` via `Address::with_last_byte(0xNN)`.

## Notes on implementation

- **BN254 (BN256) endianness**: the implementation converts between Ethereum's big-endian inputs and SP1's little-endian internal representation at the boundary (`bn256/src/lib.rs` — `point_be_to_le` / `point_le_to_be`). The external interface remains EIP-196/197 compliant; the conversion is invisible to callers.
- **One contract crate, several addresses**: the BN254 family shares one `bn256` contract crate dispatched by caller address; the BLS12-381 family shares one `bls12381` crate the same way. The genesis build installs the same compiled rWasm at every address in each family.

## Source

Implementations delegate to `revm_precompile` for the underlying math, so any divergence from mainnet semantics would be visible in the wrapper code.
