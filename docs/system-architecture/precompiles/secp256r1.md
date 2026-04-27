---
title: secp256r1 (P-256) Signature Verification
sidebar_position: 8
---

A signature verification precompile for the NIST P-256 curve (secp256r1). Tracked as [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) on the EIP track and [RIP-7212](https://github.com/ethereum/RIPs/blob/master/RIPS/rip-7212.md) on the rollup track. Same curve used by WebAuthn, FIDO2, and most non-Ethereum chains for ECDSA — distinct from secp256k1, which underlies Ethereum's `ecrecover`.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_EIP7951` | `0x0000000000000000000000000000000000000100` |

## Calling convention

Input: 160 bytes total, big-endian.

```text
| msgHash (32) | r (32) | s (32) | pubKeyX (32) | pubKeyY (32) |
```

Output:
- Valid signature: 1 byte `0x01`.
- Invalid signature or malformed input: empty bytes.

## Gas

Flat cost per call: `P256VERIFY_BASE_GAS_FEE = 3,450 gas`.

## Source

`fluentbase/contracts/eip7951/`
