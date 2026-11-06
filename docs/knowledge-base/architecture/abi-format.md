---
title: ABI
sidebar_position: 3
---
ABI
---

In the realm of EVM applications,
the Solidity ABI has become the predominant encoding format,
effectively establishing itself as a primary standard for on-chain interactions today.
This encoding and decoding schema,
primarily driven by the Solidity language, is widely used across Ethereum and other EVM-compatible platforms.

However, in the Web2 domain,
developers opt for ABI encoding/decoding schemes that best fit their specific needs and tasks.
Notably, Ethereum includes several system precompiles that do not conform to a Solidity-compatible ABI schema.

Blended VM Fluent distinguishes itself by supporting a variety of execution environments, such as EVM and Solana's VM,
using distinct ABI schemes tailored to each environment.
In Solana, for instance, there isn't a standardized ABI format,
granting developers the flexibility to choose any format that suits their requirements.

This flexibility is a hallmark of Fluent, as it does not mandate a single encoding/decoding standard for applications.
Instead, it empowers developers to select the most suitable option.
The Fluentbase SDK accommodates this by implementing the necessary ABI encoding/decoding standards,
allowing developers to freely use any ABI format they prefer.

## Fluentbase Codec

Fluent employs a custom codec for ABI encoding/decoding tailored to various ABIs.
This Codec includes compatibility modes such as Solidity ABI,
and is designed to efficiently encode and decode parameters across different VMs.

Fluent Codec is a lightweight library, compatible with no-std environments, and optimized for random reads.
Although it shares similarities with Solidity ABI encoding,
it incorporates several optimizations and features
to enhance efficient data access and handle nested structures more effectively.

The Codec leverages a header/body encoding mode:

- **Header**: Contains all static information.
- **Body**: Contains all dynamic information.

Key Features:

- **No-std Compatible**: Operates in environments without the standard library.
- **Configurable Byte Order and Alignment**: Allows customization according to requirements.
- **Solidity ABI Compatibility Mode**: Seamlessly integrates with Solidity ABI.
- **Random Access**: Accesses first-level information without requiring full decoding.
- **Support for Nested Structures**: Encodes nested structures recursively.
- **Derive Macro Support**: Facilitates custom type encoding/decoding via derive macros.

## Encoding Modes

The library supports two primary encoding modes:

- **SolidityABI**: Applied for external cross-contract calls to handle input parameters and decode outputs effectively.
- **FluentABI**: Utilized for internal cross-system calls, benefiting from 4-byte stack alignment for efficiency without compromising the developer experience.

### SolidityABI Mode

Parameters:

- Big-endian byte order
- 32-byte alignment (Solidity compatible)
- Dynamic structure encoding:
  - Header
    - offset (u256) - a position in the structure
  - Body
    - length (u256) - a number of elements
    - recursively encoded elements

Usage example:

```rust
use fluentbase_codec::SolidityABI;
SolidityABI::encode(&value, &mut buf, 0)
```

### FluentABI Mode

Parameters:

- Little-endian byte order
- 4-byte alignment
- Dynamic structure encoding:
  - Header
    - length (u32) - a total number of elements in the dynamic data
    - offset (u32) - a position in the buffer
    - size (u32) - a total number of encoded elements bytes
  - Body
    - recursively encoded elements

Usage example:

```rust
use fluentbase_codec::FluentABI;
FluentABI::encode(&value, &mut buf, 0)
```

## Type System

### Primitive Types

Primitive types are encoded directly without any additional metadata,
offering zero-cost encoding when their alignment matches the stack size.

TODO: add all types

- Integer types: `u8`, `i8`, `u16`, `i16`, `u32`, `i32`, `u64`, `i64`
- Static arrays: `[T; N]`

### Non-Primitive Types

These types require additional metadata for encoding:

- `Vec<T>`: Dynamic array of encodable elements
- `HashMap<K,V>`: Hash map with encodable keys and values
- `HashSet<T>`: Hash set with encodable elements

For dynamic types, the codec stores metadata that enables partial reading. For example:

- Vectors store offset and length information
- HashMaps store separate metadata for keys and values, allowing independent access

## Important Notes

### Determinism

The encoded binary is not deterministic and should only be used for parameter passing. 
The encoding order of non-primitive fields affects the data layout after the header,
though decoding will produce the same result regardless of encoding order.

### Order Sensitivity

The order of encoding operations is significant, especially for non-primitive types,
as it affects the final binary layout.
For non-ordered set/map data structures, ordering by key is applied.

## Usage Examples

### Basic Structure

```rust
use fluentbase_codec::{Codec, FluentABI};
use bytes::BytesMut;

#[derive(Codec)]
struct Point {
    x: u32,
    y: u32,
}

// Encoding
let point = Point { x: 10, y: 20 };
let mut buf = BytesMut::new();
FluentABI::encode(&point, &mut buf, 0).unwrap();

// Decoding
let decoded: Point = FluentABI::decode(&buf, 0).unwrap();
```

### Dynamic Array Example

```rust
// Vector encoding with metadata
let numbers = vec![1, 2, 3];

// FluentABI encoding (with full metadata)
let mut fluent_buf = BytesMut::new();
FluentABI::encode(&numbers, &mut fluent_buf, 0).unwrap();
// Format: [length:3][offset:12][size:12][1][2][3]

// SolidityABI encoding
let mut solidity_buf = BytesMut::new();
SolidityABI::encode(&numbers, &mut solidity_buf, 0).unwrap();
// Format: [offset:32][length:3][1][2][3]
```
