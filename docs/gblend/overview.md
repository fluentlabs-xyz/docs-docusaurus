---
title: GBlend Overview
sidebar_position: 3
---

GBlend Overview
---

**gblend** is a specialized Foundry forge wrapper designed for hybrid Solidity and WebAssembly (WASM) smart contract development on Fluent Network. It seamlessly integrates Rust-based WASM contracts with traditional Solidity development workflows.

## Key Features

- **Rust to WASM Compilation** - Compile Rust smart contracts to WebAssembly
- **Hybrid Development** - Seamlessly work with both Solidity and WASM contracts
- **Reproducible Builds** - Docker-based compilation ensures consistent WASM builds
- **Full Verification Support** - Verify both Solidity and WASM contracts on-chain
- **Foundry Compatible** - Maintains full compatibility with existing Foundry projects

## Prerequisites

### Required Dependencies

1. **Docker** - Required for reproducible WASM builds

   ```bash
   # macOS
   brew install --cask docker
   
   # Linux
   sudo apt-get install docker.io
   
   # Verify installation
   docker --version
   ```

### Important Migration Note

If you have an older version of gblend installed via Cargo, you must uninstall it first:

```bash
# Remove old Cargo-installed version
cargo uninstall gblend
```

The new version is distributed via a shell installer script, not through Cargo.

## Installation

### Quick Install (Recommended)

```bash
# Install gblendup installer
curl -sSL https://raw.githubusercontent.com/fluentlabs-xyz/gblend/refs/tags/latest/gblendup/install | bash

# Restart terminal or source your shell configuration
source ~/.bashrc  # or ~/.zshrc

# Install gblend
gblendup

# Verify installation
gblend --version
```

## Updating gblend

To update gblend to the latest version:

```bash
# Simply run gblendup again
gblendup
```

## Getting Started

### 1. Create a New Project

```bash
# Create a hybrid Solidity + WASM project
gblend init my-project

# Navigate to project
cd my-project
```

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

> **Note**: First build may take longer as Docker downloads the container image.

### 4. Run Tests

```bash
# Run all tests
gblend test

# Run specific test with gas reporting
gblend test --match-test testIncrementByPowerOfTwo --gas-report
```

## Working with WASM Contracts

### Naming Convention

WASM contract artifacts follow a specific naming pattern:

- **Package name**: Convert from `snake-case` to `PascalCase`
- **Extension**: Add `.wasm` suffix

Example: `power-calculator` → `PowerCalculator.wasm`

### Building WASM Contracts

When you run `gblend build`, the tool:

1. Compiles Rust contracts inside a Docker container
2. Generates Solidity interfaces in `out/PowerCalculator.wasm/interface.sol`
3. Creates deployment artifacts in `out/PowerCalculator.wasm/foundry.json`

### Using WASM in Solidity

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

### Verify WASM Contract

```bash
gblend verify-contract <address> PowerCalculator.wasm \
    --wasm \
    --verifier blockscout \
    --verifier-url https://testnet.fluentscan.xyz/api/
```

### Verify Solidity Contract

```bash
gblend verify-contract <address> BlendedCounter \
    --verifier blockscout \
    --verifier-url https://testnet.fluentscan.xyz/api/ \
    --constructor-args <args>
```

## Configuration

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

## FAQ

### Build fails with Docker error

**Problem**: `gblend build` fails with Docker-related errors.

**Solution**: Ensure Docker is installed and running:

```bash
# Check Docker status
docker info

# Start Docker daemon (Linux)
sudo systemctl start docker

# On macOS, start Docker Desktop application
```

### Error: "command not found: gblend"

**Problem**: gblend command is not recognized after installation.
**Solution**:

1. Restart your terminal or run source ~/.bashrc (or ~/.zshrc)
2. Check installation path: which gblend
3. Verify PATH includes gblend location

### WASM contract verification fails

**Problem**: Verification fails with "contract not found" error.

**Solution**: Ensure correct naming convention:

- Use PascalCase with `.wasm` extension
- Example: `my-contract` → `MyContract.wasm`

### Cannot import WASM interface in Solidity

**Problem**: Import statement fails for WASM interface.

**Solution**:

1. Build the project first: `gblend build`
2. Check that interface exists: `ls out/PowerCalculator.wasm/interface.sol`
3. Use correct import path relative to your Solidity file

### First build takes too long

**Problem**: Initial build is slow.

**Solution**: This is expected behavior. The first build downloads the Docker container image for reproducible WASM compilation. Subsequent builds will be faster.

### WASM contract deployment fails

**Problem**: Contract creation returns address(0).

**Solution**:

1. Check WASM bytecode was generated: `ls out/PowerCalculator.wasm/`
2. Ensure sufficient gas for deployment
3. Verify network RPC URL is correct

## Best Practices

1. **Always use Docker** for WASM builds to ensure reproducibility
2. **Follow naming conventions** for WASM contracts (PascalCase.wasm)
3. **Test locally** before deployment
4. **Verify contracts** immediately after deployment

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

## Resources

- [Fluent Network Documentation](https://docs.fluent.xyz)
- [Foundry Book](https://book.getfoundry.sh)
- [gblend Repository](https://github.com/fluentlabs-xyz/gblend)
- [Example Projects](https://github.com/fluentlabs-xyz/examples)
