---
title: Codec
sidebar_position: 4
---

Codec
---

The Fluentbase codec system manages encoding and decoding of smart contract data.

:::tip How to Use the Codec
The Fluentbase SDK largely automates serialization. Your primary interaction with the codec is through the `#[derive(Codec)]` macro. Applying this to custom structs automatically integrates them into the SDK.
:::

## Overview

The codec system is designed for flexibility and performance:

* **`no_std` Compatible**: Suitable for constrained environments without the standard library.
* **Multiple Encoding Modes**: Supports both EVM-compatible (`SolidityABI`) and WASM-optimized (`CompactABI`) formats.
* **Automatic Implementation**: Automatically implements serialization logic with `#[derive(Codec)]`.
* **Rich Type Support**: Handles primitives, collections (`Vec`, `HashMap`), tuples, and nested structs.
* **Partial Decoding**: Allows accessing specific parts of serialized data without fully decoding the entire stream, enhancing efficiency.

## Enabling Custom Types with `#[derive(Codec)]`

To integrate custom structs with Fluentbase serialization, derive the `Codec` trait:

```rust
use fluentbase_sdk::Codec;

// Adding `#[derive(Codec)]` makes this struct usable
// in function parameters, return values, and storage.
#[derive(Codec, Debug, Default, Clone, PartialEq)]
pub struct UserProfile {
    pub name: String,
    pub level: u64,
    pub is_active: bool,
}
```

Deriving `Codec` generates implementations of the core `Encoder` trait, making your structs recognizable across Fluentbase SDK components such as `#[router]` and `solidity_storage!` macros.

## Automatic Argument Encoding and Decoding

With SDK macros (`#[router]`, `#[client]`, `solidity_storage!`, etc), encoding and decoding of arguments and return values occur transparently. Once you've added `#[derive(Codec)]` to your custom types, you can work with function arguments and returns as regular Rust types, without explicit encoding or decoding logic.

### Example of Manual Encoding and Decoding

Here's an explicit example of how encoding and decoding works under the hood:

```rust
use fluentbase_sdk::codec::SolidityABI;
use bytes::BytesMut;

let data = UserProfile {
    name: "Alice".into(),
    level: 42,
    is_active: true,
};

let mut buf = BytesMut::new();
SolidityABI::encode(&data, &mut buf, 0).unwrap();

let decoded: UserProfile = SolidityABI::decode(&buf, 0).unwrap();
assert_eq!(data, decoded);
```

## Encoding Modes

The codec provides multiple encoding strategies ("modes") tailored to specific use cases. SDK macros (`#[router]`, `#[client]`) automatically select the appropriate mode based on their configuration.

### SolidityABI (Default for EVM)

Primary mode for compatibility with EVM, Solidity, Ethereum wallets, and tools like Ethers.js.

* **Byte Order**: Big-endian
* **Alignment**: 32-byte word alignment
* **Dynamic Types**: Uses offsets for types like `String`, `Bytes`, and `Vec<T>`

### CompactABI ("Fluent" Mode)

WASM-optimized format for performance and smaller payloads within Fluentbase.

* **Byte Order**: Little-endian
* **Alignment**: 4-byte alignment
* **Dynamic Types**: Compact headers for dynamic types

### SolidityPackedABI

Mimics Solidity's `abi.encodePacked` for tightly packed data.

* **Purpose**: Typically used for creating unique hashes
* **Rules**:

  * Sequential encoding without padding
  * Supports only static-sized types

## Troubleshooting

### Common Issues

**"Type doesn't implement Codec"**

Ensure the macro is derived on custom types:

```rust
#[derive(Codec, Debug, Clone, PartialEq)]
struct MyType {
    field: U256,
}
```

**Mode mismatch between router and client**

Ensure matching modes:

```rust
#[router(mode = "solidity")]
#[client(mode = "solidity")]
```

**Large struct encoding failures**

For large types, consider splitting them into smaller structs:

```rust
// Too large
#[derive(Codec)]
struct LargeType { /* too many fields */ }

// Better approach
#[derive(Codec)]
struct Part1 { /* fewer fields */ }

#[derive(Codec)]
struct Part2 { /* fewer fields */ }
```

## Important Notes

### Determinism

Encoded binaries are non-deterministic; intended only for parameter passing. Encoding order of non-primitive fields affects data layout, but decoding remains consistent.

### Order Sensitivity

The sequence of encoding operations matters, especially for non-primitive types, influencing the final binary layout.

### Automation with SDK Macros

The `#[router]` and `#[client]` macros automate codec interactions by generating helper structs for each function (`...Call`, `...Return`), responsible for:

* Calculating the 4-byte function selector
* Encoding arguments into a byte payload
* Decoding payloads into Rust types

This automation connects high-level Rust code seamlessly to low-level serialization processes.

## Summary

**For most smart contract development:**

* Derive `Codec` on custom types.
* Choose `mode = "solidity"` for EVM compatibility.
* Choose `mode = "fluent"` for optimized Rust communication (non-EVM).
* Let router, storage, and client macros manage encoding.

## See Also

* [Router System](./router.md): Parameter handling with codec
* [Storage System](./storage.md): Codec's role in storage
* [Client Generation](./client.md): Codec for cross-contract calls
* [SDK Overview](./build-w-fluentbase-sdk.md): Main SDK documentation
* [Codec Implementation](https://github.com/fluentlabs-xyz/fluentbase/tree/devel/crates/codec): Technical details
