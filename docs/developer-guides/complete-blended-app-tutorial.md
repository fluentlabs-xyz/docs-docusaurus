---
title: Complete Blended App Tutorial
sidebar_position: 6
---

Complete Blended App Tutorial
---

This tutorial walks you through building a complete blended application on Fluent, combining Rust WASM contracts with Solidity contracts. You'll build a simple but functional token exchange system.

:::prerequisite

Before starting, ensure you have:
- [gblend installed](../gblend/installation.md)
- [Basic Rust knowledge](./smart-contracts/rust.mdx)
- [Basic Solidity knowledge](./smart-contracts/solidity.mdx)
- [Development environment setup](./building-a-blended-app/README.md)

:::

## Project Overview

We'll build a **Hybrid Token Exchange** that:
- Uses Rust for complex mathematical calculations
- Uses Solidity for token management
- Demonstrates cross-contract communication
- Includes comprehensive testing

## Step 1: Project Setup

```bash
# Create new project
gblend init hybrid-exchange
cd hybrid-exchange

# Clean default files
rm src/BlendedCounter.sol
rm script/BlendedCounter.s.sol
rm test/BlendedCounter.t.sol

# Rename Rust contract
mv src/power-calculator src/exchange-engine
```

## Step 2: Rust Exchange Engine

Create `src/exchange-engine/src/lib.rs`:

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]
extern crate alloc;

use alloc::string::String;
use fluentbase_sdk::{
    basic_entrypoint, derive::{router, Contract}, SharedAPI,
    U256, Address, address
};

#[derive(Contract)]
struct ExchangeEngine<SDK> {
    sdk: SDK,
}

pub trait ExchangeAPI {
    fn calculate_exchange_rate(&self, input_amount: U256, input_decimals: U256, output_decimals: U256) -> U256;
    fn calculate_slippage(&self, amount: U256, slippage_bps: U256) -> U256;
    fn validate_trade(&self, user: Address, amount: U256, min_output: U256) -> bool;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> ExchangeAPI for ExchangeEngine<SDK> {
    
    #[function_id("calculateExchangeRate(uint256,uint256,uint256)")]
    fn calculate_exchange_rate(&self, input_amount: U256, input_decimals: U256, output_decimals: U256) -> U256 {
        // Calculate exchange rate with precision
        let precision = U256::from(10).pow(U256::from(18));
        let rate = input_amount * precision / (U256::from(10).pow(input_decimals));
        rate * (U256::from(10).pow(output_decimals)) / precision
    }

    #[function_id("calculateSlippage(uint256,uint256)")]
    fn calculate_slippage(&self, amount: U256, slippage_bps: U256) -> U256 {
        // Calculate minimum output with slippage (basis points)
        let slippage_factor = U256::from(10000) - slippage_bps;
        amount * slippage_factor / U256::from(10000)
    }

    #[function_id("validateTrade(address,uint256,uint256)")]
    fn validate_trade(&self, user: Address, amount: U256, min_output: U256) -> bool {
        // Basic validation logic
        !user.is_zero() && !amount.is_zero() && !min_output.is_zero()
    }
}

impl<SDK: SharedAPI> ExchangeEngine<SDK> {
    fn deploy(&mut self) {
        // Initialize exchange parameters
        self.sdk.set_storage(U256::from(0), U256::from(1); // Active
        self.sdk.set_storage(U256::from(1), U256::from(300); // Default slippage 3%
    }
}

basic_entrypoint!(ExchangeEngine);
```

## Step 3: Solidity Token Contract

Create `src/HybridToken.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HybridToken is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

## Step 4: Solidity Exchange Contract

Create `src/HybridExchange.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./HybridToken.sol";
import "./IExchangeEngine.sol";

contract HybridExchange {
    HybridToken public tokenA;
    HybridToken public tokenB;
    address public exchangeEngine;
    
    mapping(address => uint256) public userBalances;
    
    event TradeExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    
    constructor(
        address _tokenA,
        address _tokenB,
        address _exchangeEngine
    ) {
        tokenA = HybridToken(_tokenA);
        tokenB = HybridToken(_tokenB);
        exchangeEngine = _exchangeEngine;
    }
    
    function executeTrade(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 slippageBps
    ) external {
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), "Invalid token");
        
        // Transfer tokens from user
        HybridToken(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Calculate exchange rate using Rust engine
        IExchangeEngine engine = IExchangeEngine(exchangeEngine);
        uint256 exchangeRate = engine.calculateExchangeRate(
            amountIn,
            HybridToken(tokenIn).decimals(),
            HybridToken(tokenIn == address(tokenA) ? address(tokenB) : address(tokenA)).decimals()
        );
        
        // Calculate output with slippage protection
        uint256 amountOut = engine.calculateSlippage(exchangeRate, slippageBps);
        require(amountOut >= minAmountOut, "Insufficient output amount");
        
        // Validate trade
        require(engine.validateTrade(msg.sender, amountIn, minAmountOut), "Trade validation failed");
        
        // Execute the trade
        address tokenOut = tokenIn == address(tokenA) ? address(tokenB) : address(tokenA);
        HybridToken(tokenOut).transfer(msg.sender, amountOut);
        
        emit TradeExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
}
```

## Step 5: Interface Contract

Create `src/IExchangeEngine.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IExchangeEngine {
    function calculateExchangeRate(
        uint256 inputAmount,
        uint256 inputDecimals,
        uint256 outputDecimals
    ) external view returns (uint256);
    
    function calculateSlippage(
        uint256 amount,
        uint256 slippageBps
    ) external view returns (uint256);
    
    function validateTrade(
        address user,
        uint256 amount,
        uint256 minOutput
    ) external view returns (bool);
}
```

## Step 6: Build and Deploy

```bash
# Build the project
gblend build

# Deploy contracts (you'll need testnet ETH)
gblend script Deploy --rpc-url https://rpc.dev.gblend.xyz --broadcast

# Verify contracts
gblend verify --contract HybridToken
gblend verify --wasm --contract ExchangeEngine
gblend verify --contract HybridExchange
```

## Step 7: Testing

Create comprehensive tests in `test/HybridExchange.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/HybridToken.sol";
import "../src/HybridExchange.sol";
import "../src/IExchangeEngine.sol";

contract HybridExchangeTest is Test {
    HybridToken public tokenA;
    HybridToken public tokenB;
    HybridExchange public exchange;
    address public exchangeEngine;
    
    address public user = address(0x1);
    address public owner = address(0x2);
    
    function setUp() public {
        // Deploy tokens
        tokenA = new HybridToken("Token A", "TKA", 18, 1000000 * 10**18);
        tokenB = new HybridToken("Token B", "TKB", 6, 1000000 * 10**6);
        
        // Deploy exchange engine (WASM)
        // This would be deployed separately
        
        // Deploy exchange
        exchange = new HybridExchange(
            address(tokenA),
            address(tokenB),
            exchangeEngine
        );
        
        // Setup user with tokens
        tokenA.transfer(user, 1000 * 10**18);
        tokenB.transfer(user, 1000 * 10**6);
        
        vm.startPrank(user);
        tokenA.approve(address(exchange), type(uint256).max);
        tokenB.approve(address(exchange), type(uint256).max);
        vm.stopPrank();
    }
    
    function testBasicTrade() public {
        vm.startPrank(user);
        
        uint256 amountIn = 100 * 10**18; // 100 TKA
        uint256 minAmountOut = 95 * 10**6; // 95 TKB
        
        exchange.executeTrade(
            address(tokenA),
            amountIn,
            minAmountOut,
            500 // 5% slippage
        );
        
        vm.stopPrank();
    }
    
    function testInsufficientOutput() public {
        vm.startPrank(user);
        
        uint256 amountIn = 100 * 10**18;
        uint256 minAmountOut = 200 * 10**6; // Unrealistic expectation
        
        vm.expectRevert("Insufficient output amount");
        exchange.executeTrade(
            address(tokenA),
            amountIn,
            minAmountOut,
            100 // 1% slippage
        );
        
        vm.stopPrank();
    }
}
```

## Step 8: Frontend Integration

Create a simple frontend to interact with your contracts:

```javascript
// Example using ethers.js
import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider('https://rpc.dev.gblend.xyz');
const signer = provider.getSigner();

const exchangeContract = new ethers.Contract(
    exchangeAddress,
    exchangeABI,
    signer
);

async function executeTrade(tokenIn, amountIn, minAmountOut, slippageBps) {
    try {
        const tx = await exchangeContract.executeTrade(
            tokenIn,
            amountIn,
            minAmountOut,
            slippageBps
        );
        await tx.wait();
        console.log('Trade executed successfully!');
    } catch (error) {
        console.error('Trade failed:', error);
    }
}
```

## Next Steps

1. **Extend Functionality**: Add liquidity pools, order books, or advanced trading features
2. **Optimize Performance**: Implement caching and batch operations
3. **Add Monitoring**: Include events and analytics
4. **Security Audit**: Review for potential vulnerabilities
5. **Documentation**: Create user guides and API documentation

## Common Issues & Solutions

- **WASM Size**: Optimize by removing unused dependencies
- **Gas Costs**: Use batch operations and efficient storage patterns
- **Type Mismatches**: Ensure exact function signature matching
- **Deployment Failures**: Check network configuration and gas limits

This tutorial provides a solid foundation for building complex blended applications on Fluent. The patterns demonstrated here can be applied to DeFi protocols, gaming applications, and other innovative use cases.
