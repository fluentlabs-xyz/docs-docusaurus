---
title: Storage
sidebar_position: 3
---
Solidity Compatible Storage
---

The Fluentbase storage system implements Solidity-compatible storage in Rust contracts, following [Solidity's storage layout specification](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html). It provides significant code size reduction through direct storage access for primitive types while maintaining full compatibility with EVM storage patterns.

:::prerequisite
This documentation assumes familiarity with the [Router System](./router.md) for building contracts. Storage is typically used within router-enabled contracts to manage persistent state.
:::

## Overview

The `solidity_storage!` macro automatically generates type-safe storage access methods that:

1. Calculate storage keys using the same hashing as Solidity
2. Optimize storage access for primitive types ≤ 32 bytes
3. Handle complex types through encoding/decoding
4. Provide a familiar API similar to Solidity storage

This ensures that Rust contracts can seamlessly interact with Solidity contracts and maintain storage compatibility across different execution environments.

## Storage Types and Layout

### 1. Simple Values (Primitive Types)

Simple values are stored directly in their assigned slot:

```rust
use fluentbase_sdk::{
    derive::solidity_storage,
    Address, SharedAPI, U256, I256, FixedBytes,
};

solidity_storage! {
    Address Owner;               // Slot 0
    bool Paused;                 // Slot 1  
    U256 TotalSupply;            // Slot 2
    I256 Price;                  // Slot 3
    u64 Timestamp;               // Slot 4
    [u8; 32] Hash;               // Slot 5
    FixedBytes<20> Data;         // Slot 6
}

// Usage example
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn deploy(&mut self) {
        // Set initial values
        Owner::set(&mut self.sdk, self.sdk.context().contract_caller());
        Paused::set(&mut self.sdk, false);
        TotalSupply::set(&mut self.sdk, U256::from(1000000));
    }

    pub fn transfer_ownership(&mut self, new_owner: Address) {
        let current_owner = Owner::get(&self.sdk);
        if current_owner == self.sdk.context().contract_caller() {
            Owner::set(&mut self.sdk, new_owner);
        }
    }
}
```

**Storage key calculation:** `key = slot_number`

### 2. Mappings

Mappings store key-value pairs with keys calculated using Solidity's keccak256 hashing:

```rust
use fluentbase_sdk::{
    derive::solidity_storage,
    Address, SharedAPI, U256, Bytes,
};

solidity_storage! {
    // Simple mapping
    mapping(Address => U256) Balance;                   
    
    // Nested mapping
    mapping(Address => mapping(Address => U256)) Allowance;

    // Mapping to complex type
    mapping(U256 => Bytes) Metadata;                      
}

impl<SDK: SharedAPI> TokenContract<SDK> {
    pub fn transfer(&mut self, to: Address, amount: U256) -> bool {
        let from = self.sdk.context().contract_caller();
        
        let from_balance = Balance::get(&self.sdk, from);
        if from_balance < amount {
            return false;
        }
        
        // Update balances
        Balance::set(&mut self.sdk, from, from_balance - amount);
        Balance::set(&mut self.sdk, to, Balance::get(&self.sdk, to) + amount);
        
        true
    }
    
    pub fn approve(&mut self, spender: Address, amount: U256) {
        let owner = self.sdk.context().contract_caller();
        Allowance::set(&mut self.sdk, owner, spender, amount);
    }
}
```

**Storage key calculation:**

- Simple mapping: `key = keccak256(h(k) . p)` where `h(k)` is the padded key and `p` is the slot
- Nested mapping: `key = keccak256(h(k2) . keccak256(h(k1) . p))`

### 3. Dynamic Arrays

Arrays with dynamic size are supported with element access by index:

```rust
solidity_storage! {
    U256[] Values;             
    Address[][][] NestedArr;   
}

impl<SDK: SharedAPI> ArrayContract<SDK> {
    pub fn add_value(&mut self, value: U256) {
        // In real implementation, you'd track the array length separately
        let index = U256::from(0); // For example
        Values::set(&mut self.sdk, index, value);
    }
    
    pub fn get_value(&self, index: U256) -> U256 {
        Values::get(&self.sdk, index)
    }
    
    pub fn set_nested(&mut self, i: U256, j: U256, k: U256, addr: Address) {
        NestedArr::set(&mut self.sdk, i, j, k, addr);
    }
}
```

**Storage key calculation:** Element at index `i` is at `keccak256(slot) + i`

### 4. Complex Types (Structs)

Custom types that implement the `Codec` trait can be stored. See the [Codec documentation](./codec.md) for details on making types codec-compatible:

```rust
use fluentbase_sdk::{codec::Codec, derive::solidity_storage};

#[derive(Codec, Debug, Default, Clone, PartialEq)]
pub struct UserProfile {
    pub username: Bytes,
    pub reputation: U256,
    pub is_verified: bool,
    pub metadata: Bytes,
}

solidity_storage! {
    UserProfile CurrentUser;                    
    mapping(Address => UserProfile) Profiles;   
}

impl<SDK: SharedAPI> ProfileContract<SDK> {
    pub fn update_profile(&mut self, profile: UserProfile) {
        let user = self.sdk.context().contract_caller();
        Profiles::set(&mut self.sdk, user, profile);
    }
    
    pub fn get_profile(&self, user: Address) -> UserProfile {
        Profiles::get(&self.sdk, user)
    }
}
```

## Storage Optimization

The macro automatically selects the most efficient storage method:

### Direct Storage`

Used for types ≤ 32 bytes:

- All integer types (u8, u16, u32, u64, u128, U256, I256)
- Boolean values
- Addresses
- Fixed-size byte arrays up to 32 bytes
- `FixedBytes<N>` where N ≤ 32

**Benefits:**

- No encoding/decoding overhead
- Minimal gas consumption
- Reduced contract size

### StorageValueSolidity

Used for complex types:

- Structs (with `#[derive(Codec)]`)
- Dynamic arrays `(Vec<T>, Bytes)`
- Strings
- Large fixed arrays (> 32 bytes)

**Features:**

- Automatic serialization/deserialization
- Support for nested structures
- Compatibility with Solidity ABI encoding

## Generated API

For each storage variable, the macro generates:

```rust
// For simple value: Address Owner;
pub struct Owner {}
impl Owner {
    const SLOT: U256 = U256::from_limbs([0u64, 0u64, 0u64, 0u64]);
    
    fn get<SDK: SharedAPI>(sdk: &SDK) -> Address {
        // Implementation
    }
    
    fn set<SDK: SharedAPI>(sdk: &mut SDK, value: Address) {
        // Implementation
    }
    
    fn key<SDK: SharedAPI>(sdk: &SDK) -> U256 {
        // Returns the storage key
    }
}

// For mapping: mapping(Address => U256) Balance;
pub struct Balance {}
impl Balance {
    const SLOT: U256 = U256::from_limbs([2u64, 0u64, 0u64, 0u64]);
    
    fn get<SDK: SharedAPI>(sdk: &SDK, arg0: Address) -> U256 {
        // Implementation
    }
    
    fn set<SDK: SharedAPI>(sdk: &mut SDK, arg0: Address, value: U256) {
        // Implementation
    }
    
    fn key<SDK: SharedAPI>(sdk: &SDK, arg0: Address) -> U256 {
        // Returns the calculated storage key
    }
}
```

:::best-practice

### 1. Storage Packing

Unlike Solidity, the current implementation doesn't automatically pack multiple values into a single slot. Each variable gets its own slot:

```rust
solidity_storage! {
    u8 Small1;    // Slot 0 (full slot used)
    u8 Small2;    // Slot 1 (full slot used)
    U256 Large;   // Slot 2
}
```

### 2. Initialization

Always initialize storage values in the `deploy` method:

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn deploy(&mut self) {
        Owner::set(&mut self.sdk, self.sdk.context().contract_caller());
        Paused::set(&mut self.sdk, false);
        // Initialize all storage variables
    }
}
```

### 3. Access Patterns

Use the generated methods for all storage access:

```rust
// Good
let balance = Balance::get(&self.sdk, user);

// Not possible - storage is only accessible through generated methods
let balance = self.balance[user];  // This won't compile
```

:::

## Testing Storage

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use fluentbase_sdk_testing::HostTestingContext;

    #[test]
    fn test_storage_operations() {
        let mut sdk = HostTestingContext::default();
        
        // Test simple value
        let owner = Address::from([1u8; 20]);
        Owner::set(&mut sdk, owner);
        assert_eq!(Owner::get(&sdk), owner);
        
        // Test mapping
        let user = Address::from([2u8; 20]);
        let balance = U256::from_str_radix("1000000000000000000000000", 10).unwrap();
        Balance::set(&mut sdk, user, balance);
        assert_eq!(Balance::get(&sdk, user), balance);
        
        // Test nested mapping
        let spender = Address::from([3u8; 20]);
        let allowance = U256::from(1000);
        Allowance::set(&mut sdk, user, spender, allowance);
        assert_eq!(Allowance::get(&sdk, user, spender), allowance);
    }
}
```

## Integration with Other Features

The storage system integrates seamlessly with:

- **[Router System](./router.md)**: Access storage in routed methods
- **Event System**: Emit events when storage changes
- **[Client System](./client.md)**: Read storage from other contracts

This provides a complete framework for building complex smart contracts with persistent state management.

### See Also

- **[Overview](./build-w-fluentbase-sdk.md)**: Return to the main SDK documentation
- **[Solidity Storage Layout](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html)**: Official Solidity documentation
- **[Type Conversions](https://github.com/fluentlabs-xyz/fluentbase/blob/devel/crates/sdk-derive/docs/type_conversion.md)**: Solidity to Rust type mappings
