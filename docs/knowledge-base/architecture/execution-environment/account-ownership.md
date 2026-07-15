---
title: Account Ownership
sidebar_position: 1
---
Account Ownership
---

Fluent extends the original EVM account structure to support **account ownership**.
Account ownership is a special modification of an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) account. Instead of delegating an account to a contract, you assign it an **owner**.

At first glance the idea looks similar, but it enables managing **metadata storage** directly within the account.
This metadata can store arbitrary data as linear storage and is used by both the EVM and SVM runtimes to keep track of information such as bytecode, code hashes, and other account metadata.

Ownable accounts begin with a special `0xEF44` prefix and follow the structure below:

```rust
/// Ownable account bytecode representation
///
/// Format:
/// `0xEF44` (MAGIC) + `0x00` (VERSION) + 20 bytes of owner address + metadata.
pub struct OwnableAccountBytecode {
    /// The owner of this account.
    pub owner_address: Address,
    /// Account version.
    pub version: u8,
    /// Extra bytes stored by the runtime.
    pub metadata: Bytes,
}
```

The concept is simple but unlocks powerful new features for **EVM extensibility**.

## Account Delegation

This mechanism is similar to EIP-7702, but with one key difference:
**ownership cannot be revoked** by the runtime, since the metadata structure is strictly bound to runtime logic.

Once a smart contract is deployed, its ownership is permanently assigned—every contract has an owner.

The runtime resolution logic is straightforward:

```rust
pub fn resolve_precompiled_runtime_from_input(input: &[u8]) -> Address {
    if input.len() > WASM_MAGIC_BYTES.len()
        && input[..WASM_MAGIC_BYTES.len()] == WASM_MAGIC_BYTES
    {
        PRECOMPILE_WASM_RUNTIME
    } else if input.len() > SVM_ELF_MAGIC_BYTES.len()
        && input[..SVM_ELF_MAGIC_BYTES.len()] == SVM_ELF_MAGIC_BYTES
    {
        PRECOMPILE_SVM_RUNTIME
    } else if input.len() > ERC20_MAGIC_BYTES.len()
        && input[..ERC20_MAGIC_BYTES.len()] == ERC20_MAGIC_BYTES
    {
        PRECOMPILE_ERC20_RUNTIME
    } else {
        PRECOMPILE_EVM_RUNTIME
    }
}
```

Currently, Fluent supports the following runtime formats:

1. **WASM** — for compiling Wasm into rWasm.
2. **SVM** — rPBF (ELF) binaries for running Solana applications.
3. **ERC20** — a specialized runtime for fast ERC20 token transfers.
4. **EVM** — for running EVM applications.

## Account Derivation

Ownable accounts can also **derive new accounts** within the same runtime.
This process is similar to `CREATE2`, but it differs in two key ways:

* It does **not** use bytecode as input (the runtime is fixed).
* It allows runtimes themselves to spawn new accounts.

This mechanism resembles **Program Derived Addresses (PDA)** in Solana, where subaccounts can be deterministically created.

To avoid collisions with the `CREATE2` scheme, Fluent uses a **custom hashing function** for deriving ownable accounts:

```
0x44 || account_owner || salt
```
