---
title: Client Generation
sidebar_position: 5
---
Client Generation
---

The client generation system creates type-safe client code for interacting with Fluentbase smart contracts. It automatically generates client structs and methods from trait definitions, handling parameter encoding, contract calls, and result decoding. This enables seamless interaction with deployed contracts while maintaining type safety and consistency with the contract interface.

:::prerequisite
This documentation assumes you've already built contracts using the [Router System](./router.md). Clients are generated from trait definitions that match your contract's router interface.
:::

:::summary

Client generation bridges the gap between contract interfaces and contract usage. When you have a contract deployed on the network, you need a way to call its methods from other contracts or external applications. The client system:

1. **Takes a trait definition** that matches your contract's interface
2. **Generates a client struct** with methods for each trait method
3. **Handles all encoding/decoding** automatically
4. **Provides type-safe contract calls** with proper parameter validation
5. **Manages gas, value, and addressing** transparently

:::

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

    #[function_id("transferFrom(address,address,uint256)")]
    fn transfer_from(&mut self, from: Address, to: Address, amount: U256) -> bool;
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

## Generated Client Methods

For each trait method, the client generates a corresponding method. All generated client methods follow a consistent signature pattern:

1. **Contract Address** (`Address`): The target contract to call
2. **ETH Value** (`U256`): How much ETH to send with the call (usually `U256::zero()` for view methods)
3. **Gas Limit** (`u64`): Maximum gas to use for the call
4. **Original Parameters**: The actual function parameters from your trait definition

This pattern ensures that every client call includes the necessary metadata for contract interaction while maintaining the original function signature for the actual parameters.

For the example above:

```rust
impl<SDK: SharedAPI> TokenInterfaceClient<SDK> {
    // For view methods (using &self)
    pub fn balance_of(
        &self,
        contract_address: Address,  // Target contract
        value: U256,               // ETH to send (usually zero for view methods)
        gas_limit: u64,            // Gas limit for the call
        owner: Address,            // Original method parameter
    ) -> U256 {                    // Original return type
        // Generated implementation:
        // 1. Encode parameters using the codec system
        // 2. Make contract call with proper selector
        // 3. Decode return value
        // 4. Return typed result
    }

    // For state-changing methods (using &mut self)
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

The client system handles complex types automatically when they implement the `Codec` trait (see [Codec documentation](./codec.md)):

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
            vec![U256::from(1000000)], // Values
        );

        proposal_id
    }
}
```

### Batch Operations

Create wrapper methods for common patterns:

```rust
impl<SDK: SharedAPI> TokenInterfaceClient<SDK> {
    // Custom convenience method
    pub fn safe_transfer_with_allowance_check(
        &mut self,
        token: Address,
        from: Address,
        to: Address,
        amount: U256,
        gas_limit: u64,
    ) -> Result<bool, String> {
        // Check allowance first
        let allowance = self.allowance(
            token,
            U256::zero(),
            gas_limit,
            from,
            self.sdk.context().contract_address(),
        );

        if allowance < amount {
            return Err("Insufficient allowance".to_string());
        }

        // Perform transfer
        let success = self.transfer_from(
            token,
            U256::zero(),
            gas_limit,
            from,
            to,
            amount,
        );

        Ok(success)
    }
}
```

### Multi-Contract Interactions

Combine multiple clients for complex DeFi operations:

```rust
#[client(mode = "solidity")]
trait UniswapV2Router {
    #[function_id("swapExactTokensForTokens(uint256,uint256,address[],address,uint256)")]
    fn swap_exact_tokens_for_tokens(
        &mut self,
        amount_in: U256,
        amount_out_min: U256,
        path: Vec<Address>,
        to: Address,
        deadline: U256,
    ) -> Vec<U256>;
}

impl<SDK: SharedAPI> DeFiAggregator<SDK> {
    pub fn execute_swap(
        &mut self,
        router: Address,
        token_in: Address,
        token_out: Address,
        amount: U256,
    ) -> bool {
        let mut token_client = TokenInterfaceClient::new(self.sdk.clone());
        let mut router_client = UniswapV2RouterClient::new(self.sdk.clone());

        // Approve router to spend tokens
        let approved = token_client.approve(
            token_in,
            U256::zero(),
            50000,
            router,
            amount,
        );

        if !approved {
            return false;
        }

        // Execute swap
        let path = vec![token_in, token_out];
        let amounts = router_client.swap_exact_tokens_for_tokens(
            router,
            U256::zero(),
            200000,  // Higher gas for complex operation
            amount,
            U256::one(), // Minimum output
            path,
            self.sdk.context().contract_address(),
            U256::from(u64::MAX), // Deadline
        );

        !amounts.is_empty()
    }
}
```

## Encoding Modes

### Solidity Mode (Default)

Full EVM compatibility with standard ABI encoding, matching the encoding used in [router Solidity mode](./router.md#solidity-mode-default):

```rust
#[client(mode = "solidity")]
trait StandardInterface {
    // Compatible with web3.js, ethers.js, and Solidity contracts
}
```

### Fluent Mode

Optimized for WASM environments:

```rust
#[client(mode = "fluent")]
trait OptimizedInterface {
    // Smaller payloads, faster processing
    // Not compatible with standard EVM tools
}
```

:::best-practice

1. **Match Interface Exactly**: Ensure your trait matches the target contract's interface precisely
2. **Use Appropriate Gas Limits**: Different operations require different amounts of gas
3. **Handle Failures**: Always check return values for state-changing operations
4. **Reuse Clients**: Create once and reuse for multiple calls to the same contract type
5. **Type Safety**: Leverage Rust's type system - incorrect parameters won't compile
6. **Documentation**: Document expected behavior and gas requirements

:::

### Error Handling

Implement proper error handling for production code:

```rust
enum SwapError {
    InsufficientBalance,
    ApprovalFailed,
    SwapFailed,
}

impl<SDK: SharedAPI> SafeDeFi<SDK> {
    pub fn safe_swap(&mut self, params: SwapParams) -> Result<U256, SwapError> {
        let client = TokenInterfaceClient::new(self.sdk.clone());

        // Check balance
        let balance = client.balance_of(/* params */);
        if balance < params.amount {
            return Err(SwapError::InsufficientBalance);
        }

        // Continue with swap...
        Ok(U256::zero())
    }
}
```

### Gas Optimization

Batch multiple reads when possible:

```rust
impl<SDK: SharedAPI> PortfolioManager<SDK> {
    pub fn get_portfolio_value(&self, tokens: Vec<Address>, user: Address) -> U256 {
        let client = TokenInterfaceClient::new(self.sdk.clone());
        let mut total = U256::zero();

        for token in tokens {
            let balance = client.balance_of(
                token,
                U256::zero(),
                30000,  // Lower gas for view function
                user,
            );
            total += balance;
        }

        total
    }
}
```

### Client Reuse

Store clients as fields for contracts that frequently interact with the same protocols:

```rust
#[derive(Contract)]
struct YieldOptimizer<SDK> {
    sdk: SDK,
    // Can't store clients as fields due to SDK ownership
    // Instead, create helper methods
}

impl<SDK: SharedAPI> YieldOptimizer<SDK> {
    fn token_client(&self) -> TokenInterfaceClient<SDK> {
        TokenInterfaceClient::new(self.sdk.clone())
    }

    pub fn compound_rewards(&mut self, token: Address, amount: U256) -> bool {
        // Reuse the same client instance within the method
        let mut client = self.token_client();
        
        let balance = client.balance_of(token, U256::zero(), 30000, self.sdk.context().contract_address());
        
        if balance >= amount {
            client.transfer(token, U256::zero(), 50000, Address::ZERO, amount)
        } else {
            false
        }
    }
}
```

## Testing Clients

Test client interactions using the testing framework:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use fluentbase_sdk_testing::HostTestingContext;

    #[test]
    fn test_client_interaction() {
        let sdk = HostTestingContext::default();
        let client = TokenInterfaceClient::new(sdk.clone());

        // Mock the token contract behavior
        // Test client calls
        // Verify results
    }
}
```

:::summary

The client generation system provides:

- **Type-safe contract interactions** with automatic encoding/decoding
- **Seamless integration** with the router and storage systems  
- **Support for complex data types** through the codec system
- **Multiple encoding modes** for different compatibility requirements
- **Direct Solidity integration** for easy migration and interoperability

Use clients to build sophisticated DeFi protocols, governance systems, and multi-contract applications while maintaining type safety and code clarity.

:::

### See Also

- **[Router System](./router.md)**: Understand how to build contracts that clients can interact with
- **[Storage System](./storage.md)**: Learn about accessing storage from client calls
- **[Codec System](./codec.md)**: Deep dive into encoding/decoding mechanisms
- **[Overview](./build-w-fluentbase-sdk.md)**: Return to the main SDK documentation
