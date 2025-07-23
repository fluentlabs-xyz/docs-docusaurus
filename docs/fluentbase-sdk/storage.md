---
title: Storage
sidebar_position: 2
---
Solidity Compatible Storage
---

The Fluentbase storage system implements Solidity-compatible storage in Rust contracts, following [Solidity's storage layout specification](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html). It provides significant code size reduction through direct storage access for primitive types while maintaining full compatibility with EVM storage patterns.

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
    Address, SharedAPI, U256, I256,
};

solidity_storage! {
    Address Owner;           // Slot 0
    bool Paused;            // Slot 1  
    U256 TotalSupply;       // Slot 2
    I256 Price;             // Slot 3
    u64 Timestamp;          // Slot 4
    [u8; 32] Hash;          // Slot 5
    FixedBytes<20> Data;    // Slot 6
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
    // Single-level mapping
    mapping(Address => U256) Balance;                    // Slot 0
    mapping(Address => Bytes) UserData;                  // Slot 1
    
    // Nested mapping  
    mapping(Address => mapping(Address => U256)) Allowance;  // Slot 2
    
    // Complex nested mapping
    mapping(U256 => mapping(Address => mapping(bool => U256))) ComplexMap;  // Slot 3
}

// Usage example with helper methods
impl Balance {
    pub fn add<SDK: SharedAPI>(
        sdk: &mut SDK,
        address: Address,
        amount: U256,
    ) -> Result<(), &'static str> {
        let current_balance = Self::get(sdk, address);
        let new_balance = current_balance.checked_add(amount)
            .ok_or("overflow")?;
        Self::set(sdk, address, new_balance);
        Ok(())
    }

    pub fn subtract<SDK: SharedAPI>(
        sdk: &mut SDK,
        address: Address,
        amount: U256,
    ) -> Result<(), &'static str> {
        let current_balance = Self::get(sdk, address);
        if current_balance < amount {
            return Err("insufficient balance");
        }
        Self::set(sdk, address, current_balance - amount);
        Ok(())
    }

    pub fn transfer<SDK: SharedAPI>(
        sdk: &mut SDK,
        from: Address,
        to: Address,
        amount: U256,
    ) -> Result<(), &'static str> {
        Self::subtract(sdk, from, amount)?;
        Self::add(sdk, to, amount)?;
        Ok(())
    }
}

impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn transfer(&mut self, to: Address, amount: U256) -> bool {
        let from = self.sdk.context().contract_caller();
        
        match Balance::transfer(&mut self.sdk, from, to, amount) {
            Ok(()) => true,
            Err(_) => false,
        }
    }
}
```

**Storage key calculation:**

- **Single mapping**: `key = keccak256(abi.encodePacked(key, slot))`
- **Nested mapping**: `key = keccak256(abi.encodePacked(key2, keccak256(abi.encodePacked(key1, slot))))`

### 3. Arrays

Arrays store elements with indices calculated from the base slot:

```rust
use fluentbase_sdk::{
    derive::solidity_storage,
    Address, SharedAPI, U256,
};

solidity_storage! {
    U256[] Values;                      // Slot 0
    Address[] Users;                    // Slot 1
    Address[][][] NestedArray;          // Slot 2
}

// Array usage with helper methods  
impl Values {
    pub fn push<SDK: SharedAPI>(sdk: &mut SDK, value: U256) {
        // In a real implementation, you'd track the length
        let length = U256::from(0); // Get actual length from somewhere
        Self::set(sdk, length, value);
    }

    pub fn get_length<SDK: SharedAPI>(sdk: &SDK) -> U256 {
        // Implementation would read length from storage
        U256::from(0)
    }
}

impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn add_value(&mut self, value: U256) {
        Values::push(&mut self.sdk, value);
    }

    pub fn get_value(&self, index: U256) -> U256 {
        Values::get(&self.sdk, index)
    }

    pub fn set_nested_value(&mut self, i: U256, j: U256, k: U256, address: Address) {
        NestedArray::set(&mut self.sdk, i, j, k, address);
    }
}
```

**Storage key calculation:** `key = keccak256(slot) + index`

### 4. Custom Types

Custom types that implement the `Codec` trait can be stored using the storage system:

```rust
use fluentbase_sdk::{
    derive::solidity_storage,
    codec::Codec,
    Address, SharedAPI, U256, Bytes,
};

#[derive(Codec, Debug, Default, Clone, PartialEq)]
pub struct UserProfile {
    pub username: Bytes,
    pub reputation: U256,
    pub is_verified: bool,
    pub join_date: u64,
}

#[derive(Codec, Debug, Default, Clone, PartialEq)]  
pub struct ContractConfig {
    pub admin: Address,
    pub fee_rate: U256,
    pub is_paused: bool,
}

solidity_storage! {
    // Store custom structs
    ContractConfig Config;                           // Slot 0
    
    // Map addresses to custom structs
    mapping(Address => UserProfile) Profiles;        // Slot 1
    
    // Array of custom structs
    UserProfile[] AllProfiles;                       // Slot 2
}

impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn deploy(&mut self) {
        let config = ContractConfig {
            admin: self.sdk.context().contract_caller(),
            fee_rate: U256::from(100), // 1%
            is_paused: false,
        };
        Config::set(&mut self.sdk, config);
    }

    pub fn create_profile(&mut self, username: Bytes) {
        let user = self.sdk.context().contract_caller();
        let profile = UserProfile {
            username,
            reputation: U256::from(0),
            is_verified: false,
            join_date: 1234567890, // Get actual timestamp
        };
        
        Profiles::set(&mut self.sdk, user, profile);
    }

    pub fn get_profile(&self, user: Address) -> UserProfile {
        Profiles::get(&self.sdk, user)
    }

    pub fn update_config(&mut self, new_fee_rate: U256) {
        let mut config = Config::get(&self.sdk);
        let caller = self.sdk.context().contract_caller();
        
        if caller == config.admin {
            config.fee_rate = new_fee_rate;
            Config::set(&mut self.sdk, config);
        }
    }
}
```

## Storage Optimization

### Direct Storage vs Codec Storage

The macro automatically selects the most efficient storage method based on type size:

#### Direct Storage (Optimized)
Used for types ≤ 32 bytes that can be stored directly in a single storage slot:

```rust
solidity_storage! {
    // These use DirectStorage (optimized)
    Address Owner;              // 20 bytes
    bool Active;                // 1 byte  
    u64 Timestamp;              // 8 bytes
    U256 Amount;                // 32 bytes
    FixedBytes<32> Hash;        // 32 bytes
    [u8; 20] Data;              // 20 bytes
}
```

**Benefits:**

- No encoding/decoding overhead
- Direct memory access
- Smaller compiled binary size
- Faster execution

#### Codec Storage (Full-featured)
Used for complex types requiring serialization:

```rust
solidity_storage! {
    // These use StorageValueSolidity (full codec)
    Bytes DynamicData;          // Variable length
    String Name;                // Variable length
    Vec<U256> Numbers;          // Dynamic array
    MyStruct CustomData;        // Complex struct
}
```

**Features:**

- Supports complex nested structures
- Handles dynamic types (Vec, String, etc.)
- Cross-contract compatibility
- Full Solidity ABI compliance

## Complete ERC20 Example

Here's a full ERC20 implementation showcasing the storage system:

```rust
#![cfg_attr(target_arch = "wasm32", no_std, no_main)]
extern crate alloc;
extern crate fluentbase_sdk;

use alloc::{string::String, vec::Vec};
use alloy_sol_types::{sol, SolEvent};
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, solidity_storage, Contract},
    Address, Bytes, ContextReader, SharedAPI, B256, U256,
};

// Storage layout
solidity_storage! {
    Address Owner;                                    // Slot 0
    bool Paused;                                      // Slot 1
    U256 TotalSupply;                                // Slot 2
    
    // Token balances
    mapping(Address => U256) Balance;                 // Slot 3
    
    // Allowances: owner -> spender -> amount
    mapping(Address => mapping(Address => U256)) Allowance;  // Slot 4
}

// Events
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// Contract interface
pub trait ERC20Interface {
    fn name(&self) -> Bytes;
    fn symbol(&self) -> Bytes;
    fn decimals(&self) -> U256;
    fn total_supply(&self) -> U256;
    fn balance_of(&self, account: Address) -> U256;
    fn transfer(&mut self, to: Address, amount: U256) -> bool;
    fn allowance(&self, owner: Address, spender: Address) -> U256;
    fn approve(&mut self, spender: Address, amount: U256) -> bool;
    fn transfer_from(&mut self, from: Address, to: Address, amount: U256) -> bool;
}

#[derive(Contract)]
struct Token<SDK> {
    sdk: SDK,
}

// Helper methods for storage
impl Balance {
    pub fn safe_add<SDK: SharedAPI>(
        sdk: &mut SDK,
        account: Address,
        amount: U256,
    ) -> Result<(), &'static str> {
        let current = Self::get(sdk, account);
        let new_balance = current.checked_add(amount).ok_or("overflow")?;
        Self::set(sdk, account, new_balance);
        Ok(())
    }

    pub fn safe_subtract<SDK: SharedAPI>(
        sdk: &mut SDK,
        account: Address,
        amount: U256,
    ) -> Result<(), &'static str> {
        let current = Self::get(sdk, account);
        if current < amount {
            return Err("insufficient balance");
        }
        Self::set(sdk, account, current - amount);
        Ok(())
    }
}

impl Allowance {
    pub fn safe_subtract<SDK: SharedAPI>(
        sdk: &mut SDK,
        owner: Address,
        spender: Address,
        amount: U256,
    ) -> Result<(), &'static str> {
        let current = Self::get(sdk, owner, spender);
        if current < amount {
            return Err("insufficient allowance");
        }
        Self::set(sdk, owner, spender, current - amount);
        Ok(())
    }
}

// Event emission helper
fn emit_event<SDK: SharedAPI, T: SolEvent>(sdk: &mut SDK, event: T) {
    let data = event.encode_data();
    let topics: Vec<B256> = event
        .encode_topics()
        .iter()
        .map(|v| B256::from(v.0))
        .collect();
    sdk.emit_log(&topics, &data);
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> ERC20Interface for Token<SDK> {
    fn name(&self) -> Bytes {
        "FluentToken".as_bytes().to_vec().into()
    }

    fn symbol(&self) -> Bytes {
        "FLU".as_bytes().to_vec().into()
    }

    fn decimals(&self) -> U256 {
        U256::from(18)
    }

    fn total_supply(&self) -> U256 {
        TotalSupply::get(&self.sdk)
    }

    fn balance_of(&self, account: Address) -> U256 {
        Balance::get(&self.sdk, account)
    }

    fn transfer(&mut self, to: Address, amount: U256) -> bool {
        let from = self.sdk.context().contract_caller();
        
        // Check if contract is paused
        if Paused::get(&self.sdk) {
            return false;
        }

        // Perform transfer
        match (
            Balance::safe_subtract(&mut self.sdk, from, amount),
            Balance::safe_add(&mut self.sdk, to, amount),
        ) {
            (Ok(()), Ok(())) => {
                emit_event(&mut self.sdk, Transfer { from, to, value: amount });
                true
            }
            _ => false,
        }
    }

    fn allowance(&self, owner: Address, spender: Address) -> U256 {
        Allowance::get(&self.sdk, owner, spender)
    }

    fn approve(&mut self, spender: Address, amount: U256) -> bool {
        let owner = self.sdk.context().contract_caller();
        
        Allowance::set(&mut self.sdk, owner, spender, amount);
        emit_event(&mut self.sdk, Approval { owner, spender, value: amount });
        
        true
    }

    fn transfer_from(&mut self, from: Address, to: Address, amount: U256) -> bool {
        let spender = self.sdk.context().contract_caller();
        
        // Check if contract is paused
        if Paused::get(&self.sdk) {
            return false;
        }

        // Perform transfer with allowance check
        match (
            Allowance::safe_subtract(&mut self.sdk, from, spender, amount),
            Balance::safe_subtract(&mut self.sdk, from, amount),
            Balance::safe_add(&mut self.sdk, to, amount),
        ) {
            (Ok(()), Ok(()), Ok(())) => {
                emit_event(&mut self.sdk, Transfer { from, to, value: amount });
                true
            }
            _ => false,
        }
    }
}

impl<SDK: SharedAPI> Token<SDK> {
    pub fn deploy(&mut self) {
        let deployer = self.sdk.context().contract_caller();
        let initial_supply = U256::from_str_radix("1000000000000000000000000", 10).unwrap(); // 1M tokens
        
        // Initialize contract state
        Owner::set(&mut self.sdk, deployer);
        Paused::set(&mut self.sdk, false);
        TotalSupply::set(&mut self.sdk, initial_supply);
        Balance::set(&mut self.sdk, deployer, initial_supply);

        // Emit initial transfer event
        emit_event(
            &mut self.sdk,
            Transfer {
                from: Address::ZERO,
                to: deployer,
                value: initial_supply,
            },
        );
    }
}

basic_entrypoint!(Token);

#[cfg(test)]
mod tests {
    use super::*;
    use fluentbase_sdk::{ContractContextV1, ContextReader};
    use fluentbase_sdk_testing::HostTestingContext;
    use hex_literal::hex;

    #[test]
    fn test_storage_operations() {
        let owner = Address::from(hex!("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266"));
        let user = Address::from(hex!("70997970C51812dc3A010C7d01b50e0d17dc79C8"));
        
        let mut sdk = HostTestingContext::default()
            .with_contract_context(ContractContextV1 {
                caller: owner,
                ..Default::default()
            });

        // Test deployment
        let mut token = Token::new(sdk.clone());
        token.deploy();

        // Test balance
        let balance = Balance::get(&sdk, owner);
        assert_eq!(balance, U256::from_str_radix("1000000000000000000000000", 10).unwrap());

        // Test transfer
        let transfer_amount = U256::from(1000);
        Balance::safe_subtract(&mut sdk, owner, transfer_amount).unwrap();
        Balance::safe_add(&mut sdk, user, transfer_amount).unwrap();

        assert_eq!(Balance::get(&sdk, user), transfer_amount);
        
        // Test allowance
        let approval_amount = U256::from(500);
        Allowance::set(&mut sdk, owner, user, approval_amount);
        assert_eq!(Allowance::get(&sdk, owner, user), approval_amount);
    }
}
```

## Advanced Usage Patterns

### Storage Key Inspection

Understanding the exact storage keys can be helpful for debugging and integration:

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn debug_storage_keys(&self, user: Address) {
        // Get the actual storage key for Balance[user]
        let balance_key = Balance::key(&self.sdk, user);
        
        // Get keys for nested mapping Allowance[owner][spender]
        let allowance_key = Allowance::key(&self.sdk, user, Address::ZERO);
        
        // Array element key
        let array_key = Values::key(&self.sdk, U256::from(42));
        
        // These keys match exactly what Solidity would generate
    }
}
```

### Migration and Upgrades

The storage system supports contract migrations by maintaining storage layout compatibility:

```rust
// Version 1 storage
solidity_storage! {
    Address Owner;           // Slot 0
    U256 Value;             // Slot 1
}

// Version 2 storage (backwards compatible)
solidity_storage! {
    Address Owner;           // Slot 0 (unchanged)
    U256 Value;             // Slot 1 (unchanged)  
    bool NewFeature;        // Slot 2 (new)
    mapping(Address => U256) NewMapping;  // Slot 3 (new)
}
```

### Performance Optimizations

For high-performance contracts, consider these patterns:

```rust
// Batch operations to minimize storage reads/writes
impl Balance {
    pub fn batch_transfer<SDK: SharedAPI>(
        sdk: &mut SDK,
        transfers: Vec<(Address, Address, U256)>,
    ) -> Result<(), &'static str> {
        // Collect all balance changes first
        let mut balance_changes: std::collections::HashMap<Address, i128> = std::collections::HashMap::new();
        
        for (from, to, amount) in transfers {
            // Validate each transfer
            let from_balance = Self::get(sdk, from);
            if from_balance < amount {
                return Err("insufficient balance");
            }
            
            // Track balance changes
            *balance_changes.entry(from).or_insert(0) -= amount.as_u128() as i128;
            *balance_changes.entry(to).or_insert(0) += amount.as_u128() as i128;
        }
        
        // Apply all changes at once
        for (address, change) in balance_changes {
            let current = Self::get(sdk, address);
            let new_balance = if change >= 0 {
                current + U256::from(change as u128)
            } else {
                current - U256::from((-change) as u128)
            };
            Self::set(sdk, address, new_balance);
        }
        
        Ok(())
    }
}
```

## Best Practices

### 1. Type Safety

```rust
// Use strong types to prevent errors
solidity_storage! {
    mapping(Address => U256) Balance;     // Clear what this stores
    mapping(U256 => Address) IdToOwner;   // ID -> owner mapping
}
```

### 2. Storage Layout Planning

```rust
// Group related storage together for better organization
solidity_storage! {
    // Core contract state (slots 0-2)
    Address Owner;
    bool Paused; 
    U256 TotalSupply;
    
    // User data (slots 3-5)
    mapping(Address => U256) Balance;
    mapping(Address => mapping(Address => U256)) Allowance;
    mapping(Address => bool) Blacklisted;
    
    // Administrative data (slots 6+)
    mapping(Address => bool) Admins;
    U256 LastUpdate;
}
```

### 3. Helper Methods

```rust
// Always add helper methods for complex operations
impl Balance {
    pub fn safe_transfer<SDK: SharedAPI>(
        sdk: &mut SDK,
        from: Address,
        to: Address,
        amount: U256,
    ) -> Result<(), &'static str> {
        Self::safe_subtract(sdk, from, amount)?;
        Self::safe_add(sdk, to, amount)?;
        Ok(())
    }
}
```

### 4. Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_storage_keys_match_solidity() {
        // Verify storage keys match Solidity exactly
        let sdk = HostTestingContext::default();
        let addr = Address::from_str("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266").unwrap();
        
        // This key should match what Solidity generates
        let expected_key = "c50c4d60f8bbb6a70920d195c8852bc6d816d9f7bc643b500261fc4d9a03f08c";
        let actual_key = format!("{:x}", Balance::key(&sdk, addr));
        assert_eq!(actual_key, expected_key);
    }
}
```

The Fluentbase storage system provides a powerful, type-safe, and Solidity-compatible way to manage contract state. By following these patterns and best practices, you can build efficient and maintainable smart contracts that seamlessly integrate with the broader blockchain ecosystem.