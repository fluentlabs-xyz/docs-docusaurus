---
title: Standard EVM Precompiles
sidebar_position: 9
---

Fluent ships every standard Ethereum precompile at addresses `0x01` through `0x11`. Each precompile is implemented as a system contract under `fluentbase/contracts/` that wraps the corresponding `revm_precompile` function — semantics are byte-for-byte identical to mainnet Ethereum, with one minor implementation note in BN254.

| Address | Constant | EIP / Specification | Source |
|---|---|---|---|
| `0x...0001` | `PRECOMPILE_SECP256K1_RECOVER` | Frontier ecrecover | `contracts/ecrecover/` |
| `0x...0002` | `PRECOMPILE_SHA256` | Frontier SHA-256 | `contracts/sha256/` |
| `0x...0003` | `PRECOMPILE_RIPEMD160` | Frontier RIPEMD-160 | `contracts/ripemd160/` |
| `0x...0004` | `PRECOMPILE_IDENTITY` | Frontier identity / data copy | `contracts/identity/` |
| `0x...0005` | `PRECOMPILE_BIG_MODEXP` | EIP-198 modular exponentiation (Berlin schedule) | `contracts/modexp/` |
| `0x...0006` | `PRECOMPILE_BN256_ADD` | EIP-196 BN254 G1 add | `contracts/bn256/` |
| `0x...0007` | `PRECOMPILE_BN256_MUL` | EIP-196 BN254 G1 scalar multiplication | `contracts/bn256/` |
| `0x...0008` | `PRECOMPILE_BN256_PAIR` | EIP-197 BN254 pairing check | `contracts/bn256/` |
| `0x...0009` | `PRECOMPILE_BLAKE2F` | EIP-152 BLAKE2 F compression | `contracts/blake2f/` |
| `0x...000a` | `PRECOMPILE_KZG_POINT_EVALUATION` | EIP-4844 KZG point evaluation | `contracts/kzg/` |
| `0x...000b` | `PRECOMPILE_BLS12_381_G1_ADD` | EIP-2537 BLS12-381 G1 add | `contracts/bls12381/` |
| `0x...000c` | `PRECOMPILE_BLS12_381_G1_MSM` | EIP-2537 BLS12-381 G1 multi-scalar mul | `contracts/bls12381/` |
| `0x...000d` | `PRECOMPILE_BLS12_381_G2_ADD` | EIP-2537 BLS12-381 G2 add | `contracts/bls12381/` |
| `0x...000e` | `PRECOMPILE_BLS12_381_G2_MSM` | EIP-2537 BLS12-381 G2 multi-scalar mul | `contracts/bls12381/` |
| `0x...000f` | `PRECOMPILE_BLS12_381_PAIRING` | EIP-2537 BLS12-381 pairing | `contracts/bls12381/` |
| `0x...0010` | `PRECOMPILE_BLS12_381_MAP_G1` | EIP-2537 map FP → G1 | `contracts/bls12381/` |
| `0x...0011` | `PRECOMPILE_BLS12_381_MAP_G2` | EIP-2537 map FP² → G2 | `contracts/bls12381/` |

The address column shows the canonical last-byte form. Full addresses follow `Address::with_last_byte` — e.g. `PRECOMPILE_SHA256` is `0x0000000000000000000000000000000000000002`.

## Notes on implementation

- **BN254 (BN256) endianness**: the implementation converts between Ethereum's big-endian inputs and SP1's little-endian internal representation at the boundary (`bn256/src/lib.rs` — `point_be_to_le` / `point_le_to_be`). The external interface remains EIP-196/197 compliant; the conversion is invisible to callers.
- **One contract crate, several addresses**: the BN254 family shares one `bn256` contract crate dispatched by caller address; the BLS12-381 family shares one `bls12381` crate the same way. The genesis build installs the same compiled rWasm at every address in each family.

## Source

Each row's `Source` column points to the contract crate. Implementations delegate to `revm_precompile` for the underlying math, so any divergence from mainnet semantics would be visible in the wrapper code.
