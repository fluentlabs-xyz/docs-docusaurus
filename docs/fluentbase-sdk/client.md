---
title: Client Generation
sidebar_position: 5
---
Client Generation
---

The client generation system creates type-safe client code for interacting with Fluentbase smart contracts. It automatically generates client structs and methods from trait definitions, handling parameter encoding, contract calls, and result decoding. This enables seamless interaction with deployed contracts while maintaining type safety and consistency with the contract interface.

## Overview

Client generation bridges the gap between contract interfaces and contract usage. When you have a contract deployed on the network, you need a way to call its methods from other contracts or external applications. The client system:

1. **Takes a trait definition** that matches your contract's interface
2. **Generates a client struct** with methods for each trait method
3. **Handles all encoding/decoding** automatically
4. **Provides type-safe contract calls** with proper parameter validation
5. **Manages gas, value, and addressing** transparently

## Basic Usage

### Defining a Client Interface

Start by defining a trait that matches your target contract's interface:

```rust
use fluentbase_sdk::{
    derive::client,
    Address, SharedAPI, U256,
};

#[client(mode = "solidity")]
trait TokenInterface {
    #[function_id("balanceOf(address)")]
    fn balance_of(&self, owner: Address) -> U256;

    #[function_id("transfer(address,uint256)")]
    fn transfer(&mut self, to: Address, amount: U256) -> bool;

    #[function_id("approve(address,uint256)")]
    fn approve(&mut self, spender: Address, amount: U256) -> bool;

    #[function_id("allowance(address,address)")]
    fn allowance(&self, owner: Address, spender: Address) -> U256;
}
```

### Using the Generated Client

The macro generates a client struct named `{TraitName}Client`:

```rust
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, Contract},
    Address, SharedAPI, U256,
};

#[derive(Contract)]
struct DeFiContract<SDK> {
    sdk: SDK,
}

impl<SDK: SharedAPI> DeFiContract<SDK> {
    pub fn deploy(&self) {
        // Deployment logic
    }

    pub fn swap_tokens(&mut self, token_a: Address, token_b: Address, amount: U256) -> bool {
        // Create a client for token interactions
        let mut token_client = TokenInterfaceClient::new(self.sdk.clone());

        // Check balance of token A
        let user = self.sdk.context().contract_caller();
        let balance = token_client.balance_of(
            token_a,           // Contract address to call
            U256::zero(),      // No ETH to send with call
            50000,             // Gas limit
            user               // Function parameter: owner address
        );

        if balance < amount {
            return false;
        }

        // Approve this contract to spend tokens
        let approval_success = token_client.approve(
            token_a,           // Contract address
            U256::zero(),      // No ETH to send
            50000,             // Gas limit
            self.sdk.context().contract_address(), // Spender (this contract)
            amount             // Amount to approve
        );

        if !approval_success {
            return false;
        }

        // Transfer tokens from user to this contract
        let transfer_success = token_client.transfer_from(
            token_a,           // Contract address
            U256::zero(),      // No ETH to send
            50000,             // Gas limit
            user,              // From address
            self.sdk.context().contract_address(), // To address (this contract)
            amount             // Amount to transfer
        );

        transfer_success
    }
}

basic_entrypoint!(DeFiContract);
```

## Generated Client Structure

### Method Signature Pattern

For each trait method, the client generates a method with this signature pattern:

```rust
// Original trait method:
fn method_name(&self, param1: Type1, param2: Type2) -> ReturnType;

// Generated client method:
fn method_name(
    &mut self,
    contract_address: Address,  // Target contract
    value: U256,               // Native tokens to send  
    gas_limit: u64,            // Maximum gas for call
    param1: Type1,             // Original parameters
    param2: Type2,
) -> ReturnType;
```

### Example Generated Code

```rust
// From this trait:
#[client(mode = "solidity")]
trait ERC20 {
    fn balance_of(&self, owner: Address) -> U256;
    fn transfer(&mut self, to: Address, amount: U256) -> bool;
}

// The macro generates (conceptually):
pub struct ERC20Client<SDK> {
    sdk: SDK,
}

impl<SDK: SharedAPI> ERC20Client<SDK> {
    pub fn new(sdk: SDK) -> Self {
        Self { sdk }
    }

    pub fn balance_of(
        &mut self,
        contract_address: Address,
        value: U256,
        gas_limit: u64,
        owner: Address,
    ) -> U256 {
        // 1. Encode parameters using the codec system
        // 2. Make contract call with proper selector
        // 3. Decode return value
        // 4. Return typed result
    }

    pub fn transfer(
        &mut self,
        contract_address: Address,
        value: U256,
        gas_limit: u64,
        to: Address,
        amount: U256,
    ) -> bool {
        // Similar encoding, calling, and decoding process
    }
}
```

## Advanced Usage Patterns

### Complex Data Types

The client system handles complex types automatically when they implement the `Codec` trait:

```rust
use fluentbase_sdk::codec::Codec;

#[derive(Codec, Debug, Clone, PartialEq)]
pub struct VotingConfig {
    pub threshold: U256,
    pub voting_period: u64,
    pub required_quorum: U256,
}

#[derive(Codec, Debug, Clone, PartialEq)]
pub struct Proposal {
    pub id: U256,
    pub title: String,
    pub description: String,
    pub targets: Vec<Address>,
    pub values: Vec<U256>,
}

#[client(mode = "solidity")]
trait GovernanceInterface {
    #[function_id("getConfig()")]
    fn get_config(&self) -> VotingConfig;

    #[function_id("propose(string,string,address[],uint256[])")]
    fn propose(
        &mut self,
        title: String,
        description: String,
        targets: Vec<Address>,
        values: Vec<U256>,
    ) -> U256; // Returns proposal ID

    #[function_id("getProposal(uint256)")]
    fn get_proposal(&self, proposal_id: U256) -> Proposal;

    #[function_id("vote(uint256,bool)")]
    fn vote(&mut self, proposal_id: U256, support: bool) -> bool;
}

// Usage in a contract
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn create_proposal(&mut self, gov_contract: Address) -> U256 {
        let mut gov_client = GovernanceInterfaceClient::new(self.sdk.clone());

        // Get current governance configuration
        let config = gov_client.get_config(
            gov_contract,
            U256::zero(),
            100000,
        );

        println!("Governance threshold: {}", config.threshold);

        // Create a new proposal
        let proposal_id = gov_client.propose(
            gov_contract,
            U256::zero(),
            150000,                    // Higher gas for complex operation
            "Increase Treasury".to_string(),
            "Proposal to increase treasury allocation by 10%".to_string(),
            vec![Address::ZERO],       // Target contracts
            vec![U256::from(1000)],    // Values to send
        );

        proposal_id
    }
}
```

### Error Handling and Robustness

Build robust client interactions with proper error handling:

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn safe_token_interaction(&mut self, token: Address, amount: U256) -> bool {
        let mut client = TokenInterfaceClient::new(self.sdk.clone());
        let user = self.sdk.context().contract_caller();

        // Check balance first
        let balance = client.balance_of(token, U256::zero(), 50000, user);
        if balance < amount {
            // Insufficient balance
            return false;
        }

        // Check allowance
        let allowance = client.allowance(
            token, 
            U256::zero(), 
            50000, 
            user, 
            self.sdk.context().contract_address()
        );
        
        if allowance < amount {
            // Need approval first - this would typically be done by the user
            return false;
        }

        // Proceed with transfer
        client.transfer_from(
            token,
            U256::zero(),
            100000,  // Higher gas limit for safety
            user,
            self.sdk.context().contract_address(),
            amount,
        )
    }

    pub fn batch_token_operations(&mut self, operations: Vec<(Address, U256)>) -> Vec<bool> {
        let mut client = TokenInterfaceClient::new(self.sdk.clone());
        let mut results = Vec::new();

        for (token, amount) in operations {
            let success = self.safe_token_interaction(token, amount);
            results.push(success);
            
            // Early exit on failure if needed
            if !success {
                break;
            }
        }

        results
    }
}
```

### Cross-Contract Orchestration

Use clients to orchestrate complex interactions across multiple contracts:

```rust
#[client(mode = "solidity")]
trait LendingInterface {
    fn deposit(&mut self, asset: Address, amount: U256) -> bool;
    fn borrow(&mut self, asset: Address, amount: U256) -> bool;
    fn get_user_data(&self, user: Address) -> (U256, U256, U256); // (supplied, borrowed, health_factor)
}

#[client(mode = "solidity")]
trait DEXInterface {
    fn swap(&mut self, token_in: Address, token_out: Address, amount_in: U256) -> U256;
    fn get_price(&self, token_a: Address, token_b: Address) -> U256;
}

impl<SDK: SharedAPI> DeFiAggregator<SDK> {
    pub fn leveraged_trade(
        &mut self,
        lending_pool: Address,
        dex: Address,
        collateral_token: Address,
        trade_token: Address,
        initial_amount: U256,
        leverage: U256,
    ) -> bool {
        let mut lending_client = LendingInterfaceClient::new(self.sdk.clone());
        let mut dex_client = DEXInterfaceClient::new(self.sdk.clone());
        let mut token_client = TokenInterfaceClient::new(self.sdk.clone());

        // Step 1: Deposit collateral
        let deposit_success = lending_client.deposit(
            lending_pool,
            U256::zero(),
            200000,
            collateral_token,
            initial_amount,
        );

        if !deposit_success {
            return false;
        }

        // Step 2: Borrow additional funds
        let borrow_amount = initial_amount * (leverage - U256::from(1));
        let borrow_success = lending_client.borrow(
            lending_pool,
            U256::zero(),
            200000,
            collateral_token,
            borrow_amount,
        );

        if !borrow_success {
            return false;
        }

        // Step 3: Swap borrowed funds for trade token
        let total_amount = initial_amount + borrow_amount;
        let received_amount = dex_client.swap(
            dex,
            U256::zero(),
            300000,
            collateral_token,
            trade_token,
            total_amount,
        );

        // Step 4: Check if trade was profitable
        let current_price = dex_client.get_price(dex, U256::zero(), 50000, trade_token, collateral_token);
        let trade_value = received_amount * current_price / U256::from(1e18);

        trade_value > total_amount
    }
}
```

## Encoding Modes

### Solidity Mode (Default)

Best for interacting with EVM-compatible contracts:

```rust
#[client(mode = "solidity")]
trait EthereumContract {
    // Uses Solidity ABI encoding
    // Compatible with web3.js, ethers.js
    // Works with all EVM chains
    fn standard_method(&self, param: U256) -> bool;
}
```

### Fluent Mode (Optimized)

Best for pure Fluentbase contract interactions:

```rust
#[client(mode = "fluent")]  
trait FluentContract {
    // Uses compact encoding
    // Smaller payloads, faster processing
    // Only works with other Fluent contracts
    fn optimized_method(&self, param: U256) -> bool;
}
```

### Mode Compatibility

Ensure your client mode matches the target contract's router mode:

```rust
// Contract side
#[router(mode = "solidity")]
impl<SDK: SharedAPI> MyTrait for MyContract<SDK> {
    fn my_method(&self, param: U256) -> bool { true }
}

// Client side - must match!
#[client(mode = "solidity")]
trait MyTrait {
    fn my_method(&self, param: U256) -> bool;
}
```

## Integration with Solidity Contracts

### Two-Step vs One-Step Approach

There are two ways to work with Solidity interfaces in Fluentbase:

#### Two-Step Approach: `derive_solidity_trait!` + `#[client]`

```rust
// Step 1: Generate a trait from Solidity interface
derive_solidity_trait!(
    interface IERC20 {
        function totalSupply() external view returns (uint256);
        function balanceOf(address account) external view returns (uint256);
        function transfer(address to, uint256 amount) external returns (bool);
    }
);

// Step 2: Generate client from the trait
#[client(mode = "solidity")]
trait IERC20 {
    fn total_supply(&self) -> U256;
    fn balance_of(&self, account: Address) -> U256;
    fn transfer(&mut self, to: Address, amount: U256) -> bool;
}

// Usage: Now you have both the trait (for implementing) and client (for calling)
#[router(mode = "solidity")]
impl<SDK: SharedAPI> IERC20 for MyToken<SDK> {
    fn total_supply(&self) -> U256 {
        // Implement the contract side
        U256::from(1000000)
    }
    // ... other implementations
}

// And separately use the client
let mut client = IERC20Client::new(sdk);
let balance = client.balance_of(token_address, U256::zero(), 50000, user_address);
```

**Use this approach when:**

- You need both contract implementation AND client usage
- You want to implement a Solidity interface in Rust
- You need fine control over trait generation

#### One-Step Approach: `derive_solidity_client!` (Recommended)

```rust
// Generate client directly - simpler for most use cases
derive_solidity_client!(
    interface IERC20 {
        function totalSupply() external view returns (uint256);
        function balanceOf(address account) external view returns (uint256);
        function transfer(address to, uint256 amount) external returns (bool);
    }
);

// Usage: Just use the client directly
let mut client = IERC20Client::new(sdk);
let balance = client.balance_of(token_address, U256::zero(), 50000, user_address);
```

**Use this approach when:**

- You only need to CALL existing contracts (most common)
- You want the simplest setup
- You're building clients for external contracts

### From Solidity Interface Files

Both approaches support loading from files:

```rust
// Two-step approach from file
derive_solidity_trait!("abi/IERC20.sol");
#[client(mode = "solidity")]
trait IERC20 {
    // Methods are generated from the .sol file
}

// One-step approach from file (recommended for clients only)
derive_solidity_client!("abi/IERC20.sol");

// Or define inline with either approach
derive_solidity_client!(
    interface IERC20 {
        function totalSupply() external view returns (uint256);
        function balanceOf(address account) external view returns (uint256);
        function transfer(address to, uint256 amount) external returns (bool);
        function approve(address spender, uint256 amount) external returns (bool);
        function allowance(address owner, address spender) external view returns (uint256);
    }
);

// Use the generated client
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn interact_with_erc20(&mut self, token: Address) {
        let mut client = IERC20Client::new(self.sdk.clone());
        
        let total_supply = client.total_supply(token, U256::zero(), 50000);
        println!("Token total supply: {}", total_supply);
    }
}
```

### Which Approach to Choose?

| Scenario | Recommended Approach | Reason |
|----------|---------------------|---------|
| Calling external contracts | `derive_solidity_client!` | Simpler, one-step process |
| Implementing Solidity interfaces | `derive_solidity_trait!` + `#[router]` | Need the trait for implementation |
| Both implementing AND calling | `derive_solidity_trait!` + `#[client]` | Get both trait and client |
| Pure Rust contracts | Manual `#[client]` trait | More control over interface design |

### Complex Solidity Types

Handle structs and arrays from Solidity:

```rust
derive_solidity_client!(
    interface IComplexContract {
        struct UserInfo {
            uint256 balance;
            uint256 debt;
            bool isActive;
            address[] approvedTokens;
        }
        
        function getUserInfo(address user) external view returns (UserInfo memory);
        function updateUserInfo(address user, UserInfo calldata info) external returns (bool);
        function batchGetUsers(address[] calldata users) external view returns (UserInfo[] memory);
    }
);

// The generated client handles complex types automatically
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn analyze_users(&self, contract: Address, users: Vec<Address>) {
        let mut client = IComplexContractClient::new(self.sdk.clone());
        
        // Get batch user information
        let user_infos = client.batch_get_users(
            contract,
            U256::zero(),
            500000,  // Higher gas for complex operation
            users,
        );
        
        for info in user_infos {
            println!("User balance: {}, debt: {}, active: {}", 
                info.balance, info.debt, info.isActive);
        }
    }
}
```

## Testing and Development

### Testing Client Interactions

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use fluentbase_sdk_testing::HostTestingContext;

    #[test]
    fn test_client_interaction() {
        // Set up test environment
        let sdk = HostTestingContext::default();
        let mut client = TokenInterfaceClient::new(sdk.clone());
        
        let token_address = Address::from([1; 20]);
        let user_address = Address::from([2; 20]);
        
        // Test balance query
        let balance = client.balance_of(
            token_address,
            U256::zero(),
            50000,
            user_address,
        );
        
        // In a real test, you'd have a mock contract responding
        // assert_eq!(balance, expected_balance);
    }

    #[test]
    fn test_complex_workflow() {
        let sdk = HostTestingContext::default();
        let mut defi_contract = DeFiContract::new(sdk.clone());
        
        let token_a = Address::from([1; 20]);
        let token_b = Address::from([2; 20]);
        let amount = U256::from(1000);
        
        let success = defi_contract.swap_tokens(token_a, token_b, amount);
        
        // Test the complete workflow
        assert!(success || !success); // Would have proper assertions in real test
    }
}
```

### Debugging Client Calls

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn debug_client_call(&mut self, token: Address) {
        let mut client = TokenInterfaceClient::new(self.sdk.clone());
        
        // The client handles all encoding internally, but you can
        // add logging or debugging around the calls
        println!("About to call balanceOf on token: {:?}", token);
        
        let balance = client.balance_of(
            token,
            U256::zero(),
            50000,
            self.sdk.context().contract_caller(),
        );
        
        println!("Received balance: {}", balance);
        
        // If a call fails, the client will panic by default
        // In production, you might want to handle this more gracefully
    }
}
```

## Best Practices

### 1. Interface Design

```rust
// Good: Clear, focused interface
#[client(mode = "solidity")]
trait TokenManager {
    fn get_balance(&self, token: Address, user: Address) -> U256;
    fn transfer_tokens(&mut self, token: Address, to: Address, amount: U256) -> bool;
}

// Avoid: Too many unrelated methods in one trait
#[client(mode = "solidity")]
trait EverythingInterface {
    // Don't put unrelated functionality together
}
```

### 2. Gas Management

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn gas_efficient_calls(&mut self, token: Address) {
        let mut client = TokenInterfaceClient::new(self.sdk.clone());
        
        // Use appropriate gas limits
        let balance = client.balance_of(
            token, 
            U256::zero(), 
            30000,  // Simple read operation
            self.sdk.context().contract_caller()
        );
        
        let success = client.transfer(
            token,
            U256::zero(),
            100000,  // More complex state-changing operation
            Address::ZERO,
            U256::from(100),
        );
    }
}
```

### 3. Error Handling Strategy

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    pub fn robust_interaction(&mut self, token: Address) -> Result<bool, &'static str> {
        let mut client = TokenInterfaceClient::new(self.sdk.clone());
        
        // Pre-flight checks
        let balance = client.balance_of(
            token, 
            U256::zero(), 
            50000, 
            self.sdk.context().contract_caller()
        );
        
        if balance.is_zero() {
            return Err("Insufficient balance");
        }
        
        // Main operation
        let success = client.transfer(
            token,
            U256::zero(),
            100000,
            Address::ZERO,
            balance / U256::from(2),
        );
        
        if success {
            Ok(true)
        } else {
            Err("Transfer failed")
        }
    }
}
```

### 4. Client Reuse

```rust
impl<SDK: SharedAPI> MyContract<SDK> {
    // Store client as a field for reuse
    pub fn multiple_operations(&mut self, token: Address) {
        let mut client = TokenInterfaceClient::new(self.sdk.clone());
        
        // Reuse the same client for multiple calls
        let balance = client.balance_of(token, U256::zero(), 50000, Address::ZERO);
        let allowance = client.allowance(token, U256::zero(), 50000, Address::ZERO, Address::ZERO);
        
        // More efficient than creating new clients each time
    }
}
```

## Summary

The client generation system provides:

- **Type-safe contract interactions** with automatic encoding/decoding
- **Seamless integration** with the router and storage systems  
- **Support for complex data types** through the codec system
- **Multiple encoding modes** for different compatibility requirements
- **Direct Solidity integration** for easy migration and interoperability

Use clients to build sophisticated DeFi protocols, governance systems, and multi-contract applications while maintaining type safety and code clarity.