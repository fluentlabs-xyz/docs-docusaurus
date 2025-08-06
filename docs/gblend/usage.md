---
title: Using gblend
sidebar_position: 2
---

Using `gblend`
---

`gblend` is a specialized Foundry forge wrapper designed for hybrid Solidity and WebAssembly (WASM) smart contract development on Fluent Network. It seamlessly integrates Rust-based WASM contracts with traditional Solidity development workflows.

The CLI usage is nearly identical to standard Forge, with a few Fluent-specific extensions. For example, to verify WASM contracts, you must pass the `--wasm` flag.

:::tip[Differences from Standard Forge]

- **WASM Support**: Native support for WASM contract compilation and deployment
- **Enhanced Verification**: `--wasm` flag for verifying WASM contracts
- **Custom REVM**: Support for the fluentbase REVM implementation.

:::

## Getting Started

### 1. Create a New Project

```bash
# Create a hybrid Solidity + WASM project
gblend init my-project

# Navigate to project
cd my-project
```

When creating a new project without using any specific template, the CLI tool will scaffold the [counter + powercalculator](https://github.com/fluentlabs-xyz/examples/tree/main/counter) example. This is an extension to the default Forge counter example when using `forge init`, adding blended execution.

### 2. Project Structure

```
my-project/
├── src/
│   ├── BlendedCounter.sol        # Solidity contract
│   └── power-calculator/          # Rust/WASM module
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── test/                          # Forge tests
├── script/                        # Deployment scripts
└── foundry.toml                   # Configuration
```

### 3. Build Contracts

```bash
# Build all contracts (Solidity + WASM)
gblend build
```

**Note**: First build may take longer as Docker downloads the container image.

The build command will create build artifacts in the `/out` directory or otherwise specified in `foundry.toml`.

These build artificats can be neatly removed from the project by running the clean command:

```bash
# Clean build artifacts
gblend clean
```

### 4. Run Tests

```bash
# Run all tests
gblend test

# Run specific test with gas reporting
gblend test --match-test testIncrementByPowerOfTwo --gas-report
```

## Configuration

`gblend` uses the same configuration foundations as Foundry forge. Create (it should already be there if you used `gblend` or regular `forge` to create your project) or update a `foundry.toml` file in your project root:

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
fluent_testnet = "https://rpc.testnet.fluent.xyz"
```

### Rust Configuration (Cargo.toml)

```toml
[package]
name = "power-calculator"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
fluentbase-sdk = { git = "https://github.com/fluentlabs-xyz/fluentbase", tag = "v0.4.0-dev" }

```

## Working with WASM Contracts

When building Fluentbase contracts in Rust by using the [Fluentbase SDK](../fluentbase-sdk/build-w-fluentbase-sdk.md), the contracts will be compiled to WASM executables.

:::info[Naming Convention]

WASM contract artifacts follow a specific naming pattern:

- **Package name**: Convert from `snake-case` to `PascalCase`
- **Extension**: Add `.wasm` suffix

Example: `power-calculator` → `PowerCalculator.wasm`

:::

### Building WASM Contracts

When you run `gblend build`, the tool:

1. Compiles Rust contracts inside a Docker container
2. Generates Solidity interfaces in `out/PowerCalculator.wasm/interface.sol`
3. Creates deployment artifacts in `out/PowerCalculator.wasm/foundry.json`

### Using WASM in Solidity

Fluentbase SDK is designed to make it easy for developers to develop blended applications that have seamless cross-VM composability.

Developers can call Fluentbase WASM contracts from Solidity:

```solidity
// Import the generated interface
import "../out/PowerCalculator.wasm/interface.sol";

contract BlendedCounter {
    IPowerCalculator public immutable powerCalculator;
    
    constructor(address _powerCalculator) {
        powerCalculator = IPowerCalculator(_powerCalculator);
    }
    
    function useWasmContract() public {
        uint256 result = powerCalculator.power(2, 8);
    }
}
```

To learn more about how the calls dispatched to Wasm contracts works, check out the [Router macro](../fluentbase-sdk/router.md) in Fluentbase SDK

:::tip[Router Macro]

The router macro provides a robust method dispatch system for Fluentbase smart contracts. It automatically transforms function calls with Solidity-compatible selectors into appropriate Rust function calls, handling parameter decoding and result encoding.

:::

## Deployment

### Deploy WASM Contract

```bash
gblend create PowerCalculator.wasm \
    --rpc-url https://rpc.testnet.fluent.xyz \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --wasm \
    --verifier blockscout \
    --verifier-url https://testnet.fluentscan.xyz/api/
```

### Deploy Solidity Contract

```bash
gblend create src/BlendedCounter.sol:BlendedCounter \
    --rpc-url https://rpc.testnet.fluent.xyz \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --constructor-args <powerCalculatorAddress>
```

### Deploy Using Script

```bash
gblend script script/BlendedCounter.s.sol:Deploy \
    --rpc-url https://rpc.testnet.fluent.xyz \
    --private-key $PRIVATE_KEY \
    --broadcast
```

## Verification

Fluent Network uses Blockscout as [its block explorer](https://testnet.fluentscan.xyz) and functionality has been built in to not only verify Solidity contracts, but also Fluentbase Wasm contracts.

### Verify WASM Contract

```bash
gblend verify-contract <address> PowerCalculator.wasm \
    --wasm \
    --verifier blockscout \
    --verifier-url https://testnet.fluentscan.xyz/api/
```

Pay attention to add the `--wasm` flag when verifying WASM contracts!

### Verify Solidity Contract

```bash
gblend verify-contract <address> BlendedCounter \
    --verifier blockscout \
    --verifier-url https://testnet.fluentscan.xyz/api/ \
    --constructor-args <args>
```

## Testing WASM Contracts

### In Forge Tests

```solidity
contract BlendedCounterTest is Test {
    address public powerCalculator;
    
    function setUp() public {
        // Deploy WASM contract in tests
        powerCalculator = vm.deployCode(
            "out/PowerCalculator.wasm/foundry.json"
        );
    }
    
    function testWasmIntegration() public {
        IPowerCalculator calc = IPowerCalculator(powerCalculator);
        assertEq(calc.power(2, 3), 8);
    }
}
```

## Best Practices for Building

:::best-practice[Become a gblend chef]

1. **Always use Docker** for WASM builds to ensure reproducibility
2. **Follow naming conventions** for WASM contracts (PascalCase.wasm)
3. **Test locally** before deployment
4. **Verify contracts** immediately after deployment

:::

## Advanced Usage

### Custom Templates

```bash
# Create a new project with a custom template for example if you want to add a specific WASM contract into existing gblend project
cd src
gblend init -t fluentlabs-xyz/power-calculator power-calculator
```

### Multi-Contract Deployment

```solidity
// script/Deploy.s.sol
contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        
        // Deploy WASM contract
        bytes memory wasmBytecode = vm.getCode(
            "out/PowerCalculator.wasm/foundry.json"
        );
        
        address powerCalculator;
        assembly {
            powerCalculator := create(
                0,
                add(wasmBytecode, 0x20),
                mload(wasmBytecode)
            )
        }
        
        require(powerCalculator != address(0), "WASM deployment failed");
        
        // Deploy Solidity contract with WASM dependency
        BlendedCounter counter = new BlendedCounter(powerCalculator);
        
        vm.stopBroadcast();
    }
}
```

## Ready to Build?

Now that you've mastered the basics of gblend, it's time to put your skills to work!

**🎯 Explore Real Examples**: Dive into our [example projects](https://github.com/fluentlabs-xyz/examples) to see gblend in action. These working implementations showcase best practices and provide ready-to-use templates for your own blended applications.

**🚀 Start Building**: Ready to create something amazing? Follow our comprehensive [developer guides](../developer-guides/building-a-blended-app/README.md) to build your first blended application from scratch.

Whether you're looking for inspiration or ready to code, we've got you covered. Choose your path and start building the future of blended applications!
