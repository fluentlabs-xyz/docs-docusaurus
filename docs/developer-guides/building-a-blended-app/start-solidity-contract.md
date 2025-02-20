---
title: Step 2 - Start Solidity Contract
sidebar_position: 3
---

# Step 2: Start Solidity Contract

<!-- ### 2.1 Create Your Project Directory

```bash
mkdir typescript-wasm-project
cd typescript-wasm-project
npm init -y

``` -->

<!-- ### 2.2 Install Dependencies

```bash
npm install --save-dev typescript ts-node hardhat hardhat-deploy ethers dotenv @nomicfoundation/hardhat-toolbox @typechain/ethers-v6 @typechain/hardhat @types/node
pnpm install
npx hardhat
# Follow the prompts to create a basic Hardhat project.
```

### 2.3 Configure TypeScript and Hardhat -->

<!-- #### **2.3.1 Update Hardhat Configuration**

`hardhat.config.ts`

```typescript
import { HardhatUserConfig } from "hardhat/types";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks/greeting"

require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: "dev",
  networks: {
    dev: {
      url: "https://rpc.dev.gblend.xyz/",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId : 20993,
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};

export default config;
``` -->

<!-- #### **2.3.2 Update `package.json`**

`package.json`

```json
{
  "name": "blendedapp",
  "version": "1.0.0",
  "description": "Blended Hello, World",
  "main": "index.js",
  "scripts": {
    "compile": "npx hardhat compile",
    "deploy": "npx hardhat deploy"
  }
  ,
  "devDependencies": {
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@nomicfoundation/hardhat-verify": "^2.0.0",
    "@openzeppelin/contracts": "^5.0.2",
    "@typechain/ethers-v6": "^0.5.0",
    "@typechain/hardhat": "^9.0.0",
    "@types/node": "^20.12.12",
    "dotenv": "^16.4.5",
    "hardhat": "^2.22.4",
    "hardhat-deploy": "^0.12.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  },
  "dependencies": {
    "ethers": "^6.12.2",
    "fs": "^0.0.1-security"
  }
}
``` -->

<!-- ### 2.4 Set Up Environment Variables

1. Create a `.env` file:

```vbnet
DEPLOYER_PRIVATE_KEY=your-private-key-here
``` -->

<!-- 2. Replace `your-private-key-here` with your actual private key.

### 2.5 Write the Solidity Contracts

> ℹ️ **Note**  
>
> In this section, we'll create two Solidity smart contracts:   
>* `IFluentGreeting` 
>* `GreetingWithWorld` 
>
>The interface contract allows the Solidity contract to call the Rust function, demonstrating interoperability between Solidity and Rust within a single execution environment. 
The final contract
>* `GreetingWithWorld`  
>
>provides a composable solution that combines the outputs of both the Rust and Solidity contracts.

* Create a `contracts` directory and add the following: -->

<!-- #### 2.5.1 Define the Interface -->

<!-- <details> -->

<!-- <summary>Detailed Code Explanation</summary> -->

<!-- ## **Interface Definition**:&#x20; -->

<!-- The `IFluentGreeting` interface declares a single function `greeting()` that is external and viewable, meaning it does not modify the state of the blockchain and returns a string. This function will be implemented by another contract and is used to interact with the Rust smart contract. -->

<!-- ## Interaction with Rust Code: -->

<!-- The `greeting` function defined in this interface matches the Rust function that returns a greeting message. The Solidity interface allows the Solidity contract to call the Rust smart contract's function. -->

<!-- The functions defined in the Solidity interface match the Rust functions that return a certain value type. The Solidity interface allows the Solidity contract to call the Rust smart contract's function. -->

<!-- </details> -->

# Step 2: Start Solidity Contract

### 2.1 Solidity Contract with Interface 

Solidity interfaces are useful for calling external contracts that might 
have different compiler versions. 

For example: new protocols might use more recent Solidity compiler versions for contracts while wanting to use [WETH9.sol](https://etherscan.io/address/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2#code). This can be done using an ERC-20 interface such as [IERC20.sol](https://github.com/openzeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol) to avoid Solidity compiler errors from using incompatible Solidity compiler versions. 

In this context, a Solidity interface is used to call an external Rust contract based on its method name and types. 

`contracts/FluentSdkRustTypesTest.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IFluentRust {
    // Make sure type interfaces are defined here or else there will be a compiler error.
    function rustString() external view returns (string memory);
    function rustUint256() external view returns (uint256);    
    // function rustInt256() external view returns (int256);
    function rustAddress() external view returns (address);
    function rustBytes() external view returns (bytes memory);
    function rustBytes32() external view returns (bytes32);
    function rustBool() external view returns (bool);
}

contract FluentSdkRustTypesTest {
    
    IFluentRust public fluentRust;

    constructor(address FluentRustAddress) {
        fluentRust = IFluentRust(FluentRustAddress);
    }

    function getRustString() external view returns (string memory) {
        string memory rustString = fluentRust.rustString();
        return string(abi.encodePacked(rustString, " World"));
    }

    function getRustUint256() external view returns (uint256) {
        uint256 rustUint256 = fluentRust.rustUint256();
        return rustUint256;
    }

    // function getRustInt256() external view returns (int256) {
    //     int256 rustInt256 = fluentRust.rustInt256();
    //     return rustInt256;
    // }

    function getRustAddress() external view returns (address) {
        address rustAddress = fluentRust.rustAddress();
        return rustAddress;
    }

    function getRustBytes() external view returns (bytes memory) {
        bytes memory rustBytes = fluentRust.rustBytes();
        return rustBytes;
    }

    function getRustBytes32() external view returns (bytes32) {
        bytes32 rustBytes32 = fluentRust.rustBytes32();
        return rustBytes32;
    }

    function getRustBool() external view returns (bool) {
        bool rustBool = fluentRust.rustBool();
        return rustBool;
    }

}
```

<details>

<summary>Detailed Code Explanation</summary>

**Import Statement**: Imports the `IFluentGreeting` interface defined earlier.

**Contract Definition**: Defines a contract `GreetingWithWorld`.

**State Variable**: Declares a state variable `fluentGreetingContract` of type `IFluentGreeting`. This variable will hold the address of the deployed Rust smart contract.

**Constructor**:

* Takes an address `_fluentGreetingContractAddress` as a parameter.
* Initializes the `fluentGreetingContract` with the provided address.

* **Function `getGreeting`**:
  * Calls the `greeting` function of the `fluentGreetingContract` to get the greeting message from the Rust contract.
  * Concatenates the greeting message with ", World" using `abi.encodePacked` and returns the resulting string.

## Interaction with Rust Code:

* The `GreetingWithWorld` contract interacts with the Rust smart contract by calling the `greeting` function via the `IFluentGreeting` interface.
* When `getGreeting` is called, it fetches the greeting message ("Hello") from the Rust contract, concatenates it with ", World", and returns the complete greeting ("Hello, World").

## How Solidity and Rust Interact:

1. **Rust Smart Contract Deployment**: The Rust smart contract is compiled to Wasm and deployed to the blockchain. It contains a function that returns the greeting "Hello".
2. **Solidity Interface (`IFluentGreeting`)**: The Solidity interface declares a `greeting` function that matches the function in the Rust contract.
3. **Solidity Implementation (`GreetingWithWorld`)**:
   * The `GreetingWithWorld` contract uses the `IFluentGreeting` interface to interact with the Rust contract.
   * It initializes with the address of the deployed Rust contract.
   * It calls the `greeting` function of the Rust contract to fetch the greeting message.
   * It concatenates the Rust greeting with ", World" and returns the result.

</details>
