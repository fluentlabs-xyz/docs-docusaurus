---
title: Step 2 - Start Solidity Contract
sidebar_position: 3
---

Step 2: Start Solidity Contract
---

This guide is based off of the template blended application in this [Github repo](https://github.com/fluentlabs-xyz/blended-template-foundry-cli).

## Solidity Contract with Interface 

Solidity interfaces are useful for calling external contracts that might 
have different compiler versions. 

For example: new protocols might use more recent Solidity compiler versions for contracts while wanting to use [WETH9.sol](https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code). This can be done using an ERC-20 interface such as [IERC20.sol](https://github.com/openzeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol) to avoid Solidity compiler errors from using incompatible Solidity compiler versions. 

In this context, a Solidity interface is used to call an external Rust contract based on its method name and types that were defined in step 1.

### 2.1 Define the Interface

First off, we need to define interface that corresponds to the `RouterAPI` trait that was defined in step 1 in the Rust contract.

For reference:

```rust
pub trait RouterAPI {
    // Make sure type interfaces are defined here or else there will be a compiler error.
    fn rust_string(&self) -> String;
    fn rust_uint256(&self) -> U256;
    fn rust_int256(&self) -> I256;
    fn rust_address(&self) -> Address;
    fn rust_bytes(&self) -> Bytes;
    fn rust_bytes32(&self) -> B256;
    fn rust_bool(&self) -> bool;
}
```

The Soldity interface then becomes:

```solidity
interface IRustEvmTypes {
    // Make sure type interfaces are defined here or else there will be a compiler error.
    function rustString() external view returns (string memory);
    function rustUint256() external view returns (uint256);    
    function rustInt256() external view returns (int256);
    function rustAddress() external view returns (address);
    function rustBytes() external view returns (bytes memory);
    function rustBytes32() external view returns (bytes32);
    function rustBool() external view returns (bool);
}

```

You could then add this interface to the Solidity file with the contract or import it from a separate file but ...

:::tip[gblend is your friend]

While manually defining and adding the imported interface works, `gblend` improves the developer's UX by making it readily available as a build artifact when running `gblend build` on the Rust contract that defines the trait.

So one can just import the interface in a Solidity contract like so:

```solidity
// Import the generated interface
import "../out/IRustEvmTypes.wasm/interface.sol";
```

:::

### 2.2 Write the Solidity Contract

All that you need to do now, is write the Solidity contract which:

- Imports the auto-generated interface from the Rust contract
- Calls each Rust function and returns the results
- Handles different data types (string, uint256, int256, address, bytes, bytes32, bool)
- Shows how Solidity can seamlessly interact with Rust/WASM contracts

Create a new Solidity contract `FluentEvmRustTypes.sol` in the `src/` folder:

```shell
touch src/FluentEvmRustTypes.sol
```

And copy the following contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

// Solidity interface automatically generated with shell command `gblend build`.
import {IRustEvmTypes} from "../out/RustEvmTypes.wasm/interface.sol";

contract FluentEvmRustTypes {
    
    IRustEvmTypes public immutable RUST_EVM_TYPES;

    constructor(address fluentRustAddress) {
        RUST_EVM_TYPES = IRustEvmTypes(fluentRustAddress);
    }

    function getRustUint256() external returns (uint256) {
        uint256 rustUint256 = RUST_EVM_TYPES.rustUint256();
        return rustUint256;
    }

    function getRustInt256() external returns (int256) {
        int256 rustInt256 = RUST_EVM_TYPES.rustInt256();
        return rustInt256;
    }

    function getRustAddress() external returns (address) {
        address rustAddress = RUST_EVM_TYPES.rustAddress();
        return rustAddress;
    }

    function getRustBytes() external returns (bytes memory) {
        bytes memory rustBytes = RUST_EVM_TYPES.rustBytes();
        return rustBytes;
    }

    function getRustBytes32() external returns (bytes32) {
        bytes32 rustBytes32 = RUST_EVM_TYPES.rustBytes32();
        return rustBytes32;
    }   

    function getRustBool() external returns (bool) {
        bool rustBool = RUST_EVM_TYPES.rustBool();
        return rustBool;
    }

    function getRustString() external returns (string memory) {
        string memory rustString = RUST_EVM_TYPES.rustString();
        return string(abi.encodePacked(rustString, " World"));
    }

}
```

### 2.3 Compile the Contract(s)

Next, we can again compile the contracts wit `gblend`, now both the Solidity and Rust contracts:

```bash
gblend build
```

:::best-practice[Best Practice: use gblend to blend]

Technically, for this step you could also use `forge build` to compile the Solidity contracts, as is shown in the [Soldiity dev guide](../smart-contracts/solidity.mdx).

However, this only works because you've already generated the Rust contract build artifacts in step 1. As you are importing the interface from the Rust contract in your Solidity contract, these need to be present beforehand.

Hence it is recommended to always use `gblend` when building blended applications.

:::

## Next Up

In the following step you'll deploy the (compiled) contracts to Fluent Testnet.
