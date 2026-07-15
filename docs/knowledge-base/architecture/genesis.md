---
title: Genesis
sidebar_position: 6
---
Genesis
---

The Genesis block, numbered 0, serves as the initial block in the blockchain. It defines fundamental blockchain
parameters, the genesis hash, and stores the initial blockchain state, including system contracts.

## Fluent Precompiled Contracts

Fluent provides the following genesis contracts:

- **EVM**: `0x0000000000000000000000000000000000005210`
- **WASM**: `0x0000000000000000000000000000000000005220`
- **SVM**: `0x0000000000000000000000000000000000005230`

### EVM

EVM precompiled contract is responsible for managing EVM deployment and execution.
It embeds EVM virtual machine with ISA.

The contract defines two methods:

- `deploy` - for deploying EVM smart contract using EVM constructor (aka init code)
- `main` - for executing already deployed EVM contract

Keccak256 compatible code hash is stored inside special constant storage slot
calculated using function `keccak256("_evm_bytecode_hash")`.
The EVM bytecode is stored in the special preimage storage that uses CREATE2 for storing custom immutable data.

- EVM_BYTECODE_HASH_SLOT: `0xfd8a2cf66e0f80fe20ebc0e96c0e08e69c883c792a0409d4f4f92413fb66e980`

### WASM

> The contract is disabled for now, WASM support is achieved natively

### SVM

> TBD

## EVM-compatible Precompiled Contracts

EVM precompiled contracts are fully compatible with the original EVM contracts
and are maintained with the following addresses:

- **SECP256K1_ECRECOVER** (`0x0000000000000000000000000000000000000001`): Used for recovering the public key from a
  given signature.
- **SHA256** (`0x0000000000000000000000000000000000000002`): Computes the SHA-256 hash of the input data.
- **RIPEMD160** (`0x0000000000000000000000000000000000000003`): Computes the RIPEMD-160 hash of the input data.
- **IDENTITY** (`0x0000000000000000000000000000000000000004`): Returns the input as the output without any
  modifications.
- **MODEXP** (`0x0000000000000000000000000000000000000005`): Performs modular exponentiation.
- **BN128_ADD** (`0x0000000000000000000000000000000000000006`): Adds two points on the BN128 elliptic curve.
- **BN128_MUL** (`0x0000000000000000000000000000000000000007`): Multiplies a point on the BN128 elliptic curve by a
  scalar.
- **BN128_PAIR** (`0x0000000000000000000000000000000000000008`): Performs a pairing check on the BN128 elliptic curve.
- **BLAKE2** (`0x0000000000000000000000000000000000000009`): Computes the BLAKE2 cryptographic hash of the input data.
- **KZG_POINT_EVALUATION** (`0x000000000000000000000000000000000000000a`): Evaluates a KZG commitment at a given point.
- **BLS12_381_G1_ADD** (`0x000000000000000000000000000000000000000b`): Adds two points in the G1 group on the BLS12-381
  elliptic curve.
- **BLS12_381_G1_MUL** (`0x000000000000000000000000000000000000000c`): Multiplies a point in the G1 group on the
  BLS12-381 elliptic curve by a scalar.
- **BLS12_381_G1_MSM** (`0x000000000000000000000000000000000000000d`): Performs a multi-scalar multiplication in the G1
  group on the BLS12-381 elliptic curve.
- **BLS12_381_G2_ADD** (`0x000000000000000000000000000000000000000e`): Adds two points in the G2 group on the BLS12-381
  elliptic curve.
- **BLS12_381_G2_MUL** (`0x000000000000000000000000000000000000000f`): Multiplies a point in the G2 group on the
  BLS12-381 elliptic curve by a scalar.
- **BLS12_381_G2_MSM** (`0x0000000000000000000000000000000000000010`): Performs a multi-scalar multiplication in the G2
  group on the BLS12-381 elliptic curve.
- **BLS12_381_PAIRING** (`0x0000000000000000000000000000000000000011`): Performs a pairing check on the BLS12-381
  elliptic curve.
- **BLS12_381_MAP_FP_TO_G1** (`0x0000000000000000000000000000000000000012`): Maps an element of the base field to a
  point in the G1 group on the BLS12-381 elliptic curve.
- **BLS12_381_MAP_FP2_TO_G2** (`0x0000000000000000000000000000000000000013`): Maps an element of the quadratic extension
  field to a point in the G2 group on the BLS12-381 elliptic curve.
- **SECP256R1_VERIFY** (`0x0000000000000000000000000000000000000100`): Verifies an ECDSA signature on the SECP256R1
  elliptic curve.
  