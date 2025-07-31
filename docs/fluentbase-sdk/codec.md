---
title: Codec
sidebar_position: 4
---
Codec (Advanced)
---

The Fluentbase codec system handles encoding and decoding of smart contract data automatically.

:::tip Expand your knowledge, but generally abstracted away

**In normal usage, developers don't interact with the codec directly** - it's used internally by the router, storage, and client systems to handle parameter passing, storage serialization, and contract interactions.

When you don't require advanced codec usage, you can skim this page and move on to the next one.

:::

## Overview

The codec system works behind the scenes to provide:

- **Automatic parameter encoding/decoding** in router methods
- **Efficient storage serialization** for complex types
- **Cross-contract call handling** in client-generated code
- **EVM compatibility** when using Solidity mode

:::warning You only need to understand the codec system if you're:

- Building advanced framework features
- Creating custom storage optimizations  
- Debugging encoding issues
- Working on cross-VM interoperability

:::

For most smart contract development, the codec "just works" through the higher-level macros.

## How Codec Works Behind the Scenes

### 1. Router Integration (Automatic)

When you use the `#[router]` macro, codec handling is completely automatic:

```rust
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    // The router automatically:
    // 1. Decodes input parameters from bytes
    // 2. Calls your method with typed parameters  
    // 3. Encodes return values back to bytes
    pub fn transfer(&mut self, to: Address, amount: U256) -> bool {
        // You work with typed values - no codec code needed!
        true
    }
}
```

**What happens internally:**

- Router generates `TransferCall` and `TransferReturn` structs
- Input bytes are automatically decoded to `(Address, U256)`
- Your return `bool` is automatically encoded for output
- Function selectors are calculated and matched

### 2. Storage Integration (Automatic)

The storage system automatically chooses the best encoding strategy:

```rust
solidity_storage! {
    // DirectStorage - no encoding needed
    Address Owner;           // Stored directly in 32-byte slot
    U256 Balance;           // Stored directly in 32-byte slot
    
    // Codec encoding - handled automatically
    Vec<Address> Users;     // Automatically serialized
    MyStruct Config;        // Automatically serialized  
}

// Usage is the same regardless of encoding method
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn add_user(&mut self, user: Address) {
        let mut users = Users::get(&self.sdk);  // Auto-decoded
        users.push(user);
        Users::set(&mut self.sdk, users);       // Auto-encoded
    }
}
```

**What happens internally:**

- Simple types (≤32 bytes) use `DirectStorage` - no encoding
- Complex types use `StorageValueSolidity` - automatic codec serialization
- You don't need to think about which method is used

### 3. Client Integration (Automatic)

Generated clients handle all encoding/decoding automatically:

```rust
#[client(mode = "solidity")]
trait TokenInterface {
    fn balance_of(&self, owner: Address) -> U256;
    fn transfer(&mut self, to: Address, amount: U256) -> bool;
}

// Using the generated client - no codec knowledge required
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn check_balance(&self, token: Address, user: Address) -> U256 {
        let mut client = TokenInterfaceClient::new(self.sdk.clone());
        
        // Client automatically:
        // 1. Encodes parameters (owner: Address) -> bytes
        // 2. Makes the contract call  
        // 3. Decodes response bytes -> U256
        client.balance_of(token, U256::zero(), 50000, user)
    }
}
```

## When You Need Custom Types

The only time you might interact with codec directly is when defining custom types for storage or parameters:

```rust
use fluentbase_sdk::codec::Codec;

// Add #[derive(Codec)] for custom types
#[derive(Codec, Debug, Clone, PartialEq)]
struct UserProfile {
    pub username: String,
    pub reputation: U256,
    pub is_verified: bool,
}

// Then use normally - codec handles serialization automatically
solidity_storage! {
    mapping(Address => UserProfile) Profiles;  // Auto-encoded/decoded
}

#[router(mode = "solidity")]  
impl<SDK: SharedAPI> MyTrait for MyContract<SDK> {
    fn update_profile(&mut self, profile: UserProfile) -> bool {
        // Router auto-decodes UserProfile from input
        // Router auto-encodes bool to output
        true
    }
}
```

## Advanced: Understanding Encoding Modes

For framework developers and advanced users, the codec supports two encoding modes:

### Solidity Mode (Default)

- **When used**: `#[router(mode = "solidity")]`, `#[client(mode = "solidity")]`
- **Characteristics**: EVM-compatible, 32-byte alignment, big-endian
- **Best for**: Interoperability with Solidity contracts and EVM tools

### Fluent Mode (Optimized)  

- **When used**: `#[router(mode = "fluent")]`, `#[client(mode = "fluent")]`
- **Characteristics**: WASM-optimized, 4-byte alignment, little-endian, smaller payloads
- **Best for**: Pure Rust contract interactions, performance optimization

```rust
// EVM compatibility (default)
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    // Works with web3.js, ethers.js, Solidity contracts
}

// WASM optimization 
#[router(mode = "fluent")]
impl<SDK: SharedAPI> MyContract<SDK> {
    // Smaller payloads, faster processing
}
```

## Advanced: Direct Codec Usage (Rare)

**Most developers will never need this section.** These examples are for framework developers or those building custom SDK features.

### Manual Encoding/Decoding

```rust
use fluentbase_sdk::codec::{encoder::SolidityABI, encoder::CompactABI, bytes::BytesMut, Codec};

// Only needed for advanced framework development
fn custom_serialization_example() {
    #[derive(Codec, Debug, PartialEq)]
    struct CustomData {
        value: U256,
        flag: bool,
    }

    let data = CustomData {
        value: U256::from(42),
        flag: true,
    };

    // Manual encoding (normally done automatically)
    let mut buf = BytesMut::new();
    SolidityABI::encode(&data, &mut buf, 0).unwrap();
    
    // Manual decoding (normally done automatically)
    let decoded: CustomData = SolidityABI::decode(&buf, 0).unwrap();
    assert_eq!(data, decoded);
}
```

### Performance Analysis

```rust
// For performance-critical applications
fn encoding_comparison() {
    let data = vec![1u32, 2, 3, 4, 5];
    
    // Solidity mode: EVM compatible but larger
    let mut solidity_buf = BytesMut::new();
    SolidityABI::encode(&data, &mut solidity_buf, 0).unwrap();
    
    // Fluent mode: Smaller and faster
    let mut fluent_buf = BytesMut::new();
    CompactABI::encode(&data, &mut fluent_buf, 0).unwrap();
    
    println!("Solidity: {} bytes", solidity_buf.len());
    println!("Fluent: {} bytes", fluent_buf.len());
}
```

## Codec Implementation Details

Based on the codec README, here are the technical details for advanced users:

### Type System

#### Primitive Types (Zero-cost encoding)

- Integer types: `u8`, `i8`, `u16`, `i16`, `u32`, `i32`, `u64`, `i64`
- Boolean type: `bool`
- Unit type: `()`
- Static arrays: `[T; N]`
- Tuples: `(T,)`, `(T1, T2)`, etc.
- Option type: `Option<T>`
- Large integers: `U128`, `U256`, `I128`, `I256`

#### Non-Primitive Types (Require metadata)

- `Vec<T>`: Dynamic array with offset and length information
- `HashMap<K,V>`: Separate metadata for keys and values
- `HashSet<T>`: Hash set with metadata
- `String` and `Bytes`: Dynamic byte sequences

### Encoding Format

**CompactABI Mode:**

```
Header:
  - length (u32): number of elements
  - offset (u32): position in the buffer
  - size (u32): total number of encoded bytes
Body:
  - encoded elements
```

**SolidityABI Mode:**

```
Header:
  - offset (u32): position in the structure
Body:
  - length (u32): number of elements
  - encoded elements
```

## Troubleshooting

### Common Issues

1. **"Type doesn't implement Codec"**

   ```rust
   // Add the derive macro to custom types
   #[derive(Codec, Debug, Clone, PartialEq)]
   struct MyType {
       field: U256,
   }
   ```

2. **Mode mismatch between router and client**

   ```rust
   // Make sure modes match
   #[router(mode = "solidity")]     // Contract side
   
   #[client(mode = "solidity")]     // Client side
   ```

3. **Large struct encoding failures**

   ```rust
   // For very large types, consider breaking them down
   #[derive(Codec)]
   struct LargeType {
       // Too many fields might cause issues
   }
   
   // Better: Split into smaller types
   #[derive(Codec)]
   struct Part1 { /* fewer fields */ }
   
   #[derive(Codec)]
   struct Part2 { /* fewer fields */ }
   ```

## Important Notes

### Determinism

The encoded binary is not deterministic and should only be used for parameter passing. The encoding order of non-primitive fields affects the data layout after the header, though decoding will produce the same result regardless of encoding order.

### Order Sensitivity

The order of encoding operations is significant, especially for non-primitive types, as it affects the final binary layout.

## Summary

**For 99% of smart contract development:**

- Use `#[derive(Codec)]` on custom types
- Choose `mode = "solidity"` for EVM compatibility  
- Choose `mode = "fluent"` for pure Rust optimization
- Let the router, storage, and client systems handle encoding automatically

**The codec system is designed to be invisible** - it handles the complex work of serialization so you can focus on business logic.