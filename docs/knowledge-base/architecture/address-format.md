---
title: Address Format
sidebar_position: 5
---
Address Format
---

Address format is used to compute paths inside the tree,
making interoperability between different EEs almost impossible without additional pre-compiled contracts and/or adapters.

| Chain | Address Format                           | Curve     | Size     |
|-------|------------------------------------------|-----------|----------|
| EVM   | `keccak256(uncompressed(G^x)[1:])[12..]` | secp256k1 | 160 bits |
| SVM   | `G^SHA512(x)[..32]`                      | ed25519   | 256 bits |
| FVM   | `SHA256(uncompressed(G^x))`              | secp256k1 | 256 bits |

*Table 1. Different blockchains use different address schemes and elliptic curves.*

Mapping addresses is not a viable solution,
as there is no straightforward way to prove the mapping due to different curves and Solana's use of hashed private keys.
This would introduce additional challenges and might require developing our versions of Ethereum and Solana wallets,
which is unlikely.

Our account/state system leverages a Sparse Merkle Binary Trie (SMBT) powered by the Poseidon hashing function.
This implementation utilizes 254-bit elliptic curve points
to compute paths within the trie by hashing addresses with Poseidon.

Let’s examine how trie keys are calculated for Ethereum and Solana blockchains:

- For an Ethereum address, it pads to 20 bytes with zeros to achieve a 32-byte size, then splits into two elements to calculate the binary path.
- For a Solana address, it calculates the path using a 32-byte address, which is longer than the Ethereum’s 20-byte address.

The current function cannot handle Ethereum and Solana addresses simultaneously
because they occupy different trie spaces due to Ethereum's 20-byte padding.
This issue also affects Fuel address formats and other blockchain systems, such as Polkadot,
which employs the Ristretto curve.
Consequently,
native interoperability across these platforms is not feasible
without altering blockchain address formats and cryptographic methods.

## Solution

### Fully Isolated EE

For **Fully Isolated Execution Environments (EE)**, address projection (also known as account emulation) is employed.
In this model,
an account is stored within a special EE smart contract (or executor) responsible for managing all balance operations.
This setup ensures that all balances of the isolated EE coexist in the same account space
and can interact with external EEs only through specific system calls.

### Partially Compatible EE

For **Partially Compatible Execution Environments (EE)**,
the same address format and derivation standards as used by Ethereum must be followed.
The address derivation is as follows:

- **`CREATE` (contract deployment)**: `h(address || nonce)`
- **`CREATE2`**: `h(deployer, salt, init_code_hash)`
