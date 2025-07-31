---
title: Router
sidebar_position: 2
---
Dispatch Methods with the Router
---

The router macro provides a robust method dispatch system for Fluentbase smart contracts. It automatically transforms function calls with Solidity-compatible selectors into appropriate Rust function calls, handling parameter decoding and result encoding.

:::tip
The router macro serves as the foundation for building interoperable smart contracts and ultimately blended applications, that can be called from EVM-compatible environments. It works hand-in-hand with the [client generation system](./client.md) to enable cross-contract interactions.
:::

## Overview

The router system works by generating a `main()` method that:

1. Reads the first 4 bytes of input data as a function selector
2. Matches the selector against available methods
3. Decodes parameters based on the method signature
4. Calls the appropriate method with decoded parameters
5. Encodes the return value and writes it to output

This enables seamless interoperability between Rust contracts and EVM-compatible environments like Solidity.

## Usage Patterns

### 1. Trait Implementation (Recommended)

The preferred approach is to define a trait interface and implement it with the router macro:

```rust
#![cfg_attr(target_arch = "wasm32", no_std, no_main)]
extern crate alloc;
extern crate fluentbase_sdk;

use alloc::string::String;
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, Contract},
    SharedAPI, Address, U256,
};

#[derive(Contract)]
struct TokenContract<SDK> {
    sdk: SDK,
}

// Define the contract interface
pub trait ERC20Interface {
    fn total_supply(&self) -> U256;
    fn balance_of(&self, owner: Address) -> U256;
    fn transfer(&mut self, to: Address, amount: U256) -> bool;
    fn approve(&mut self, spender: Address, amount: U256) -> bool;
}

// Implement the interface with automatic routing
#[router(mode = "solidity")]
impl<SDK: SharedAPI> ERC20Interface for TokenContract<SDK> {
    fn total_supply(&self) -> U256 {
        // Implementation here
        U256::from(1000000)
    }

    fn balance_of(&self, owner: Address) -> U256 {
        // Implementation here  
        U256::from(100)
    }

    fn transfer(&mut self, to: Address, amount: U256) -> bool {
        // Implementation here
        true
    }

    fn approve(&mut self, spender: Address, amount: U256) -> bool {
        // Implementation here
        true
    }
}

impl<SDK: SharedAPI> TokenContract<SDK> {
    pub fn deploy(&self) {
        // Deployment logic here
    }
}

basic_entrypoint!(TokenContract);
```

### 2. Direct Implementation

For simpler contracts, you can implement methods directly on your struct:

```rust
#![cfg_attr(target_arch = "wasm32", no_std, no_main)]
extern crate alloc;
extern crate fluentbase_sdk;

use alloc::string::String;
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, Contract},
    SharedAPI, U256,
};

#[derive(Contract)]
struct SimpleStorage<SDK> {
    sdk: SDK,
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> SimpleStorage<SDK> {
    // Only public methods are included in routing
    pub fn store(&mut self, value: U256) {
        // Store implementation
    }

    pub fn retrieve(&self) -> U256 {
        // Retrieve implementation
        U256::from(42)
    }

    // Private methods are excluded from routing
    fn internal_helper(&self) {
        // This won't be accessible via function selectors
    }

    // Special method - always excluded from routing
    pub fn deploy(&self) {
        // Deployment logic
    }
}

basic_entrypoint!(SimpleStorage);
```

## Function Selectors

Function selectors are 4-byte identifiers that uniquely identify functions in smart contracts. They are typically the first 4 bytes of the keccak256 hash of the function signature (function name and parameter types), but can also be customized to use different values. Function selectors are used in Ethereum and other EVM-compatible blockchains to determine which function to call when a transaction is sent to a contract.

### Automatic Selector Generation

By default, function selectors are calculated from the method signature using keccak256:

```rust
// Selector calculated from "transfer(address,uint256)" -> 0xa9059cbb
fn transfer(&mut self, to: Address, amount: U256) -> bool {
    // Implementation
}
```

### Custom Selector Specification

You can override the default selector using the `#[function_id]` attribute:

```rust
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    // Specify using Solidity signature
    #[function_id("greeting(string)")]
    pub fn greeting(&self, message: String) -> String {
        message
    }

    // Specify using direct hex value
    #[function_id("0xe8927fbc")]
    pub fn custom_method(&self, value: U256) -> bool {
        !value.is_zero()
    }

    // Specify using raw bytes
    #[function_id([169, 5, 156, 187])]
    pub fn another_method(&self) -> U256 {
        U256::from(123)
    }
}
```

### Selector Validation

Enable validation to ensure your selectors match the expected function signature:

```rust
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    // Validation enabled - will check that the selector matches transfer(address,uint256)
    #[function_id("transfer(address,uint256)", validate(true))]
    pub fn transfer(&mut self, to: Address, amount: U256) -> bool {
        true
    }

    // Uses selector as-is without verification
    #[function_id("0xdeadbeef", validate(false))]
    pub fn custom_selector(&self) -> String {
        "custom".to_string()
    }
}
```

**When to use validation:**
- During development to catch type mismatches
- When maintaining compatibility with existing contracts
- During refactoring to prevent accidental selector changes

## Encoding Modes

The router supports two encoding modes for parameter and return value handling:

### Solidity Mode (Default)

Full EVM compatibility using standard Solidity ABI encoding:

```rust
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    // Uses Solidity ABI encoding - compatible with EVM contracts
    pub fn standard_method(&self, addr: Address, amount: U256) -> bool {
        // Implementation
        true
    }
}
```

**Characteristics:**
- Big-endian byte order
- 32-byte alignment
- Compatible with `web3.js`, `ethers.js`, and other EVM tools
- Larger payload size

This mode uses the same encoding as described in the [Codec System documentation](./codec.md#solidity-mode-default).

### Fluent Mode

Optimized encoding for WASM environments:

```rust
#[router(mode = "fluent")]
impl<SDK: SharedAPI> MyContract<SDK> {
    // Uses optimized Fluent encoding - smaller payloads
    pub fn optimized_method(&self, data: Vec<u8>) -> String {
        // Implementation
        String::from_utf8(data).unwrap_or_default()
    }
}
```

**Characteristics:**
- Little-endian byte order
- 4-byte alignment
- Smaller payload size
- Optimized for WASM execution
- Not directly compatible with standard EVM tools

## Special Methods

### Deploy Method

The `deploy` method is automatically excluded from routing and serves as the contract initialization function:

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn deploy(&self) {
        // Called once during contract deployment
        // Initialize contract state here
        // Set up initial storage values
        // Emit deployment events
    }
}
```

**Key points:**
- Always excluded from function selector routing
- Called automatically during contract deployment
- Should contain initialization logic
- Can be `pub` or private - visibility doesn't matter for routing exclusion

### Fallback Method

Handle unmatched function selectors with a fallback method:

```rust
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn standard_method(&self) -> U256 {
        U256::from(1)
    }

    // Handles any selector that doesn't match other methods
    fn fallback(&self) {
        // Log unknown function call
        // Return default values
        // Or implement proxy logic
    }
}
```

**Behavior:**
- Called for any unrecognized function selector
- Must have signature `fn fallback(&self)` with no parameters or return value
- If no fallback is defined, unmatched selectors cause a panic
- Useful for implementing proxy contracts or logging

## Advanced Examples

### Multi-Function Contract with Events

```rust
#![cfg_attr(target_arch = "wasm32", no_std, no_main)]
extern crate alloc;
extern crate fluentbase_sdk;

use alloc::string::String;
use alloy_sol_types::{sol, SolEvent};
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, Contract},
    emit_event, Address, SharedAPI, U256,
};

sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

#[derive(Contract)]
struct TokenContract<SDK> {
    sdk: SDK,
}

pub trait ERC20Events {
    fn transfer(&mut self, to: Address, amount: U256) -> bool;
    fn approve(&mut self, spender: Address, amount: U256) -> bool;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> ERC20Events for TokenContract<SDK> {
    fn transfer(&mut self, to: Address, amount: U256) -> bool {
        let from = self.sdk.msg_sender();
        
        // Emit event
        emit_event(&mut self.sdk, Transfer { from, to, value: amount });
        
        true
    }

    fn approve(&mut self, spender: Address, amount: U256) -> bool {
        let owner = self.sdk.msg_sender();
        
        // Emit event
        emit_event(&mut self.sdk, Approval { owner, spender, value: amount });
        
        true
    }
}

basic_entrypoint!(TokenContract);
```

### Contract with Error Handling and Fallback

```rust
#![cfg_attr(target_arch = "wasm32", no_std, no_main)]
extern crate alloc;
extern crate fluentbase_sdk;

use alloc::string::String;
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, Contract},
    SharedAPI, U256,
};

#[derive(Contract)]
struct RobustContract<SDK> {
    sdk: SDK,
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> RobustContract<SDK> {
    pub fn safe_divide(&self, numerator: U256, denominator: U256) -> U256 {
        if denominator.is_zero() {
            // Return zero on division by zero
            U256::zero()
        } else {
            numerator / denominator
        }
    }

    pub fn require_positive(&self, value: U256) -> bool {
        if value.is_zero() {
            panic!("Value must be positive");
        }
        true
    }

    pub fn safe_operation(&self, operation: String) -> String {
        if operation == "allowed" {
            "Success".to_string()
        } else {
            panic!("Operation failed as requested");
        }
    }

    // Handle unknown function calls
    fn fallback(&self) {
        // Log the unknown call attempt
        // In a real implementation, you might want to:
        // - Log the selector that was called
        // - Return an error code
        // - Implement proxy logic to another contract
    }

    pub fn deploy(&self) {
        // Deployment initialization
    }
}

basic_entrypoint!(RobustContract);
```

## Error Handling and Debugging

### Common Compilation Errors

**Function Selector Collisions:**
```rust
// This will cause a compile-time error
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn method_a(&self) -> U256 { U256::from(1) }
    
    #[function_id("methodA()")]  // Same selector as method_a
    pub fn method_b(&self) -> U256 { U256::from(2) }
}
```

**Solution:** Use unique function signatures or custom selectors.

**No Public Methods:**
```rust
// This will cause a compile-time error in direct implementations
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyContract<SDK> {
    fn private_method(&self) -> U256 { U256::from(1) }  // Not public!
}
```

**Solution:** Mark methods as `pub` or use trait implementations.

### Best Practices

1. **Use Trait Implementations:** They provide better organization and interface clarity
2. **Enable Validation During Development:** Catch selector mismatches early
3. **Handle Edge Cases:** Use Option/Result types for fallible operations
4. **Implement Fallback Handlers:** Provide graceful handling of unknown calls
5. **Test Selector Generation:** Verify your selectors match expected values
6. **Use Meaningful Names:** Function names should reflect their Solidity equivalents
7. **Document Custom Selectors:** Explain why custom selectors are used

### Testing Router Functions

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use fluentbase_sdk_testing::HostTestingContext;
    use alloy_sol_types::{SolCall, sol};

    #[test]
    fn test_transfer_selector() {
        // Define the Solidity function for selector calculation
        sol!(function transfer(address to, uint256 amount) returns (bool));
        
        // Generate the call data
        let call_data = transferCall {
            to: Address::ZERO,
            amount: U256::from(100),
        }.abi_encode();

        // Test the contract
        let sdk = HostTestingContext::default().with_input(call_data);
        let mut contract = TokenContract::new(sdk.clone());
        contract.deploy();
        contract.main();

        // Verify the output
        let output = sdk.take_output();
        // Assert expected behavior
    }
}
```

## Integration with Other SDK Features

The router system integrates seamlessly with other Fluentbase SDK features:

- **[Storage System](./storage.md):** Use `solidity_storage!` for persistent state
- **Events:** Emit events using `sol!` macro and `emit_log`
- **[Client Generation](./client.md):** Generate clients using the `client` macro
- **Cross-Contract Calls:** Call other contracts using generated clients

This makes the router the central dispatch mechanism in a comprehensive smart contract development framework.

### See Also

- **[Overview](./build-w-fluentbase-sdk.md):** Return to the main SDK documentation
- **[Codec System](./codec.md):** Understand how parameters are encoded/decoded
- **[Storage Patterns](./storage.md):** Learn about state management

## Performance Considerations

- **Solidity Mode:** Larger payloads but full EVM compatibility
- **Fluent Mode:** Smaller payloads and faster processing but limited compatibility
- **Function Count:** Large numbers of functions increase dispatch time linearly
- **Parameter Complexity:** Complex types require more encoding/decoding overhead
- **Validation:** Minimal runtime impact, mostly compile-time checking

The router system provides an efficient and type-safe way to build interoperable smart contracts that can seamlessly interact with EVM-compatible environments while maintaining the performance benefits of Rust and WASM execution.