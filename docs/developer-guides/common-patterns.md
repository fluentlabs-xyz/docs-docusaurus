---
title: Common Patterns & Best Practices
sidebar_position: 4
---

Common Patterns & Best Practices
---

This guide covers common development patterns, best practices, and real-world examples for building on Fluent. Whether you're building simple contracts or complex blended applications, these patterns will help you write more efficient, secure, and maintainable code.

:::prerequisite

Before diving into these patterns, make sure you have:

- Basic understanding of [Rust smart contracts](./smart-contracts/rust.mdx)
- Familiarity with [Solidity development](./smart-contracts/solidity.mdx)
- Experience with [blended applications](./building-a-blended-app/README.md)
- `gblend` tool installed and configured

:::

## Table of Contents

- [Error Handling Patterns](#error-handling-patterns)
- [Gas Optimization](#gas-optimization)
- [Security Best Practices](#security-best-practices)
- [Testing Strategies](#testing-strategies)
- [Debugging Techniques](#debugging-techniques)
- [Performance Optimization](#performance-optimization)
- [Common Anti-Patterns](#common-anti-patterns)

## Error Handling Patterns

### Rust Contract Error Handling

Proper error handling is crucial for robust smart contracts. Here are effective patterns for Rust contracts:

#### 1. Custom Error Types

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]
extern crate alloc;

use alloc::string::String;
use fluentbase_sdk::{
    basic_entrypoint, derive::{router, Contract}, SharedAPI,
    U256, Address, address
};

#[derive(Contract)]
struct ErrorHandlingExample<SDK> {
    sdk: SDK,
}

pub trait ErrorAPI {
    fn safe_divide(&self, numerator: U256, denominator: U256) -> Result<U256, String>;
    fn require_positive(&self, value: U256) -> Result<bool, String>;
    fn validate_address(&self, addr: Address) -> Result<bool, String>;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> ErrorAPI for ErrorHandlingExample<SDK> {
    
    #[function_id("safeDivide(uint256,uint256)")]
    fn safe_divide(&self, numerator: U256, denominator: U256) -> Result<U256, String> {
        if denominator.is_zero() {
            return Err("Division by zero not allowed".to_string());
        }
        Ok(numerator / denominator)
    }

    #[function_id("requirePositive(uint256)")]
    fn require_positive(&self, value: U256) -> Result<bool, String> {
        if value.is_zero() {
            return Err("Value must be greater than zero".to_string());
        }
        Ok(true)
    }

    #[function_id("validateAddress(address)")]
    fn validate_address(&self, addr: Address) -> Result<bool, String> {
        // Check for zero address
        if addr == address!("0000000000000000000000000000000000000000") {
            return Err("Invalid address: zero address not allowed".to_string());
        }
        Ok(true)
    }
}

basic_entrypoint!(ErrorHandlingExample);
```

#### 2. Panic with Descriptive Messages

For critical errors that should halt execution:

```rust
#[function_id("criticalOperation(uint256)")]
fn critical_operation(&self, value: U256) -> U256 {
    if value.is_zero() {
        panic!("Critical operation failed: value cannot be zero");
    }
    
    if value > U256::from(1000) {
        panic!("Critical operation failed: value exceeds maximum limit");
    }
    
    value * U256::from(2)
}
```

### Solidity Error Handling

#### 1. Custom Errors (Gas Efficient)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ErrorHandlingExample {
    // Custom errors are more gas efficient than require statements
    error InsufficientBalance(uint256 available, uint256 required);
    error InvalidAddress(address provided);
    error ValueTooHigh(uint256 value, uint256 max);
    
    mapping(address => uint256) public balances;
    
    function withdraw(uint256 amount) external {
        uint256 balance = balances[msg.sender];
        
        if (balance < amount) {
            revert InsufficientBalance(balance, amount);
        }
        
        if (amount > 1000 ether) {
            revert ValueTooHigh(amount, 1000 ether);
        }
        
        balances[msg.sender] = balance - amount;
        // Transfer logic here
    }
    
    function setBalance(address user, uint256 amount) external {
        if (user == address(0)) {
            revert InvalidAddress(user);
        }
        
        balances[user] = amount;
    }
}
```

#### 2. Require Statements with Custom Messages

```solidity
function transfer(address to, uint256 amount) external {
    require(to != address(0), "Transfer to zero address");
    require(amount > 0, "Amount must be greater than zero");
    require(balances[msg.sender] >= amount, "Insufficient balance");
    
    balances[msg.sender] -= amount;
    balances[to] += amount;
}
```

## Gas Optimization

### Rust Contract Optimization

#### 1. Efficient Storage Patterns

```rust
#[derive(Contract)]
struct OptimizedStorage<SDK> {
    sdk: SDK,
}

pub trait StorageAPI {
    fn set_value(&mut self, key: U256, value: U256);
    fn get_value(&self, key: U256) -> U256;
    fn batch_set(&mut self, keys: Vec<U256>, values: Vec<U256>);
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> StorageAPI for OptimizedStorage<SDK> {
    
    #[function_id("setValue(uint256,uint256)")]
    fn set_value(&mut self, key: U256, value: U256) {
        // Use efficient storage patterns
        self.sdk.set_storage(key, value);
    }

    #[function_id("getValue(uint256)")]
    fn get_value(&self, key: U256) -> U256 {
        self.sdk.get_storage(key)
    }

    #[function_id("batchSet(uint256[],uint256[])")]
    fn batch_set(&mut self, keys: Vec<U256>, values: Vec<U256>) {
        // Batch operations reduce gas costs
        for (key, value) in keys.iter().zip(values.iter()) {
            self.sdk.set_storage(*key, *value);
        }
    }
}

basic_entrypoint!(OptimizedStorage);
```

#### 2. Memory Management

```rust
// Avoid unnecessary allocations
#[function_id("efficientString()")]
fn efficient_string(&self) -> String {
    // Pre-allocate with known size when possible
    let mut result = String::with_capacity(100);
    result.push_str("Hello");
    result.push_str(" World");
    result
}

// Use references when possible
#[function_id("processArray(uint256[])")]
fn process_array(&self, data: &[U256]) -> U256 {
    let mut sum = U256::zero();
    for item in data {
        sum += *item;
    }
    sum
}
```

### Solidity Gas Optimization

#### 1. Storage Layout Optimization

```solidity
contract GasOptimized {
    // Pack related variables together
    struct User {
        uint128 balance;    // 16 bytes
        uint64 lastUpdate;  // 8 bytes
        uint64 userId;      // 8 bytes
        // Total: 32 bytes (one storage slot)
    }
    
    // Use uint256 for single variables to avoid packing overhead
    uint256 public totalSupply;
    
    // Use bytes32 for fixed-size data
    mapping(address => bytes32) public userData;
    
    // Use uint8 for small enums
    enum Status { Pending, Active, Inactive }
    mapping(address => Status) public userStatus;
}
```

#### 2. Function Optimization

```solidity
contract OptimizedFunctions {
    // Use external for functions only called externally
    function externalFunction() external pure returns (uint256) {
        return 42;
    }
    
    // Use public for functions that need internal access
    function publicFunction() public pure returns (uint256) {
        return externalFunction();
    }
    
    // Avoid unnecessary storage reads
    function optimizedRead() external view returns (uint256) {
        // Cache storage reads
        uint256 value = storageValue;
        return value + value; // Use cached value twice
    }
    
    // Use unchecked for arithmetic that can't overflow
    function uncheckedIncrement(uint256 x) external pure returns (uint256) {
        unchecked {
            return x + 1;
        }
    }
}
```

## Security Best Practices

### 1. Access Control

#### Rust Implementation

```rust
#[derive(Contract)]
struct SecureContract<SDK> {
    sdk: SDK,
}

pub trait SecurityAPI {
    fn only_owner_function(&self) -> String;
    fn pausable_function(&self) -> String;
    fn reentrancy_protected(&mut self) -> U256;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> SecurityAPI for SecureContract<SDK> {
    
    #[function_id("onlyOwnerFunction()")]
    fn only_owner_function(&self) -> String {
        // Check if caller is owner
        let caller = self.sdk.get_caller();
        let owner = self.sdk.get_storage(U256::from(0)); // Owner stored at slot 0
        
        if caller != Address::from_slice(&owner.to_be_bytes()) {
            panic!("Only owner can call this function");
        }
        
        "Owner function executed".to_string()
    }

    #[function_id("pausableFunction()")]
    fn pausable_function(&self) -> String {
        // Check if contract is paused
        let paused = self.sdk.get_storage(U256::from(1)); // Paused flag at slot 1
        
        if !paused.is_zero() {
            panic!("Contract is paused");
        }
        
        "Function executed".to_string()
    }

    #[function_id("reentrancyProtected()")]
    fn reentrancy_protected(&mut self) -> U256 {
        // Simple reentrancy protection
        let lock_key = U256::from(2);
        let lock_value = self.sdk.get_storage(lock_key);
        
        if !lock_value.is_zero() {
            panic!("Reentrancy detected");
        }
        
        // Set lock
        self.sdk.set_storage(lock_key, U256::from(1));
        
        // Perform operation
        let result = U256::from(42);
        
        // Clear lock
        self.sdk.set_storage(lock_key, U256::zero());
        
        result
    }
}

basic_entrypoint!(SecureContract);
```

#### Solidity Implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SecureContract is Ownable, Pausable, ReentrancyGuard {
    
    function onlyOwnerFunction() external onlyOwner returns (string memory) {
        return "Owner function executed";
    }
    
    function pausableFunction() external whenNotPaused returns (string memory) {
        return "Function executed";
    }
    
    function reentrancyProtected() external nonReentrant returns (uint256) {
        // Perform operation
        return 42;
    }
}
```

### 2. Input Validation

```rust
#[function_id("validateInputs(uint256,address,bytes)")]
fn validate_inputs(&self, amount: U256, recipient: Address, data: Bytes) -> bool {
    // Validate amount
    if amount.is_zero() {
        panic!("Amount cannot be zero");
    }
    
    if amount > U256::from(1000000) {
        panic!("Amount exceeds maximum limit");
    }
    
    // Validate address
    if recipient == address!("0000000000000000000000000000000000000000") {
        panic!("Invalid recipient address");
    }
    
    // Validate data length
    if data.len() > 1024 {
        panic!("Data too large");
    }
    
    true
}
```

## Testing Strategies

### 1. Unit Testing in Rust

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use fluentbase_sdk::test_utils::MockSDK;

    #[test]
    fn test_safe_divide() {
        let contract = ErrorHandlingExample { sdk: MockSDK::new() };
        
        // Test successful division
        let result = contract.safe_divide(U256::from(10), U256::from(2));
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), U256::from(5));
        
        // Test division by zero
        let result = contract.safe_divide(U256::from(10), U256::zero());
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_address() {
        let contract = ErrorHandlingExample { sdk: MockSDK::new() };
        
        // Test valid address
        let valid_addr = address!("d8da6bf26964af9d7eed9e03e53415d37aa96045");
        let result = contract.validate_address(valid_addr);
        assert!(result.is_ok());
        
        // Test zero address
        let zero_addr = address!("0000000000000000000000000000000000000000");
        let result = contract.validate_address(zero_addr);
        assert!(result.is_err());
    }
}
```

### 2. Integration Testing with Foundry

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/YourContract.sol";

contract YourContractTest is Test {
    YourContract public contract;
    
    function setUp() public {
        contract = new YourContract();
    }
    
    function testBasicFunctionality() public {
        uint256 result = contract.someFunction(42);
        assertEq(result, 84);
    }
    
    function testRevertOnInvalidInput() public {
        vm.expectRevert("Invalid input");
        contract.someFunction(0);
    }
    
    function testGasOptimization() public {
        uint256 gasBefore = gasleft();
        contract.optimizedFunction();
        uint256 gasUsed = gasBefore - gasleft();
        
        // Ensure gas usage is reasonable
        assertLt(gasUsed, 100000);
    }
}
```

## Debugging Techniques

### 1. Logging and Events

#### Rust Logging

```rust
#[function_id("debugFunction(uint256)")]
fn debug_function(&self, input: U256) -> U256 {
    // Log input for debugging
    self.sdk.write(&format!("Debug: Input value is {}", input).as_bytes());
    
    let result = input * U256::from(2);
    
    // Log result
    self.sdk.write(&format!("Debug: Result is {}", result).as_bytes());
    
    result
}
```

#### Solidity Events

```solidity
contract DebuggableContract {
    event DebugLog(string message, uint256 value);
    event FunctionCalled(address caller, uint256 input, uint256 output);
    
    function debugFunction(uint256 input) external returns (uint256) {
        emit DebugLog("Function called with input", input);
        
        uint256 result = input * 2;
        
        emit FunctionCalled(msg.sender, input, result);
        return result;
    }
}
```

### 2. Interactive Debugging

```bash
# Use gblend for debugging
gblend test --verbosity 4

# Debug specific test
gblend test --match-test testFunctionName -vvv

# Run with gas reporting
gblend test --gas-report
```

## Performance Optimization

### 1. Batch Operations

```rust
#[function_id("batchProcess(uint256[])")]
fn batch_process(&self, items: Vec<U256>) -> Vec<U256> {
    let mut results = Vec::with_capacity(items.len());
    
    for item in items {
        // Process each item efficiently
        let processed = item * U256::from(2);
        results.push(processed);
    }
    
    results
}
```

### 2. Caching Strategies

```rust
#[function_id("cachedComputation(uint256)")]
fn cached_computation(&self, input: U256) -> U256 {
    // Check cache first
    let cache_key = input;
    let cached_result = self.sdk.get_storage(cache_key);
    
    if !cached_result.is_zero() {
        return cached_result;
    }
    
    // Perform expensive computation
    let result = expensive_computation(input);
    
    // Cache result (in real implementation, you'd want to limit cache size)
    self.sdk.set_storage(cache_key, result);
    
    result
}

fn expensive_computation(input: U256) -> U256 {
    // Simulate expensive computation
    input * input * input
}
```

## Common Anti-Patterns

### 1. What to Avoid

#### ❌ Unbounded Loops
```rust
// BAD: Unbounded loop can cause gas issues
#[function_id("badLoop()")]
fn bad_loop(&self) -> U256 {
    let mut result = U256::zero();
    for i in 0..10000 { // Could be much larger
        result += U256::from(i);
    }
    result
}
```

#### ❌ Unchecked External Calls
```solidity
// BAD: No error handling for external calls
function badExternalCall(address target) external {
    target.call(""); // No error handling
}
```

#### ❌ Complex Storage Patterns
```solidity
// BAD: Inefficient storage usage
contract BadStorage {
    uint8 public value1; // 1 byte
    uint8 public value2; // 1 byte
    uint8 public value3; // 1 byte
    // Each takes a full storage slot (32 bytes)
}
```

### 2. Better Alternatives

#### ✅ Bounded Operations
```rust
// GOOD: Bounded operations
#[function_id("goodLoop()")]
fn good_loop(&self, limit: U256) -> U256 {
    let max_limit = U256::from(1000);
    let actual_limit = if limit > max_limit { max_limit } else { limit };
    
    let mut result = U256::zero();
    for i in 0..actual_limit.as_u32() {
        result += U256::from(i);
    }
    result
}
```

#### ✅ Safe External Calls
```solidity
// GOOD: Safe external calls
function goodExternalCall(address target) external {
    (bool success, bytes memory data) = target.call("");
    require(success, "External call failed");
}
```

#### ✅ Efficient Storage
```solidity
// GOOD: Efficient storage usage
contract GoodStorage {
    uint8 public value1; // 1 byte
    uint8 public value2; // 1 byte  
    uint8 public value3; // 1 byte
    uint8 public value4; // 1 byte
    // All packed into one storage slot (32 bytes)
}
```

## Next Steps

Now that you understand these patterns and best practices, you can:

1. **Apply these patterns** to your existing contracts
2. **Review your code** for anti-patterns and optimize accordingly
3. **Implement comprehensive testing** using the strategies outlined
4. **Use debugging techniques** to troubleshoot issues
5. **Monitor gas usage** and optimize performance

For more advanced topics, explore:
- [Rust Smart Contracts](./smart-contracts/rust.mdx)
- [Solidity Development](./smart-contracts/solidity.mdx)
- [Building Blended Apps](./building-a-blended-app/README.md)

:::tip[Community Resources]

Join the Fluent community for more tips and best practices:
- [Discord Developer Forum](https://discord.com/invite/fluentxyz)
- [GitHub Discussions](https://github.com/fluentlabs-xyz/docs-docusaurus/discussions)
- [Example Projects](https://github.com/fluentlabs-xyz/examples)

:::
