---
title: Execution Environment
---
Execution Environment
---

The Fluent EE is designed to be universal, supporting various VMs and EEs.
This universality is achieved through the rWasm VM, which executes and simulates different EEs.
By using rWasm, Fluent translates all applications into a single execution language,
enabling different EEs to share the same state trie.
This shared state trie facilitates seamless interoperability among applications.

Given that each EE/VM can introduce unique execution standards, various integration challenges may arise.
Let's explore the most significant ones.

1. **Incompatible Cryptography**: EEs can consume an entire transaction as an input, requiring the use of system bindings to verify signature correctness. Fluent supports pre-compiled contracts for a range of commonly used cryptographic functions (e.g., secp256k1, ed25519, bn254, bls384). Any missing cryptographic functions can be implemented as custom precompiled contracts.

2. **Different Address Format**: Fluent uses an Ethereum-compatible 20-byte address format. If an address uses a different derivation format or has more bytes than a contract can store, there needs to be a way to handle this. Such addresses can be stored as so-called projected addresses, which are calculated using any hashing function.

3. **Varying Gas Calculation Policies**: EEs/VMs may use different gas calculation policies compared to Fluent. To address this, Fluent has two distinct gas calculation policies:

   - *Standard Gas Calculation*: Applies to typical operations, assigning a specific gas cost to each rWasm opcode.
   - *Manual Gas Calculation*: Available exclusively for genesis precompiled smart contracts on Fluent.

   This approach ensures flexibility and maintains the integrity of operations across different environments.

4. **Custom Bytecode Storage**: There is a need to store immutable data like custom bytecode or some EE-specific context information. Fluent provides special metadata accounts that can be used to store immutable data, including custom bytecode or other data.

5. **Variable Storage Size**: Some EEs implement variable storage key/value lengths. For instance, Solana uses 10kB chunks, while Cosmos utilizes variable key/value lengths with certain constraints. Storing these datasets within Ethereum's standard 32-byte storage format may lead to significant performance issues and increased gas consumption. To address this, Fluent offers a metadata API that allows developers to use custom storage solutions for varying data lengths efficiently.
