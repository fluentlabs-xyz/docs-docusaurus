---
title: Solidity
sidebar_position: 1
---

# Solidity Developer Guide

## Prerequisites

Before getting started, make sure to install the following:

* npm >= 19
* [Fluent build tool]

## Install Fluent Scaffold CLI Tool

To install the Fluent scaffold CLI tool, run the following command in your terminal:

```bash
cargo install gblend
```

To create a project, run the following in your terminal:

```bash
gblend init
```

This will prompt you to choose from the available setup options. You can opt for either **Hardhat, JavaScript or TypeScript**; in this guide, we'll proceed with **JavaScript**.

## **Project Structure**

```
.
├── contracts
│   ├── hello.sol (our solidity hello world smart contract)
│   └── hello-v.vy 
├── hardhat.config.js (contains Fluent devnet config and plugins)
├── package.json
└── scripts
    ├── deploy-solidity.js (deployment script for solidity smart contract)
    └── deploy-vyper.js
```

## Getting Started

Before we interact with our `helloworld` smart contract, run the below command to install all dependencies in the `package.json` file.

```bash
npm install
```

### Hardhat Configs

To first get a quick sense of Fluent's network parameters, head over to the `hardhat.config.js` file in the root directory.&#x20;

You will find the configuration for connecting to the Fluent Devnet.

```javascript

require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-vyper");
    /**
     * @type import('hardhat/config').HardhatUserConfig
     */
    module.exports = {
      networks: {
        fluent_devnet1: {
          url: 'https://rpc.dev.gblend.xyz/', 
          chainId: 20993, 
          accounts : [
            `0x${"ADD YOUR PRIVATE KEY HERE"}` ], // Replace with the private key of the deploying account
        },
      },
      solidity: {
        version: '0.8.19', 
      },
      vyper: {
        version: "0.3.0",
      },
    };
  

```

Within the `networks` object, you can see the **`fluent_devnet1`** configuration. This specifies the URL to connect to the Fluent Devnet, along with the chain ID and the accounts available for transactions.

> ℹ️ **Note**  
>
> Use [Fluent Faucet](https://faucet.dev.gblend.xyz/) to request test tokens.

Next, let's explore how you can compile and deploy your first smart contract to the Fluent Devnet.

### Compiling the Smart Contract

If you take a look in the `contracts/` folder, you'll see `hello.sol` file:

```solidity
// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    contract Hello {
        function greeting() public pure returns (string memory) {
            return "Hello, Solidity!";
        }
    }
```

To compile it, simply run:

```bash
 npm run compile
```

### Deploying the Solidity contract

In the `scripts` folder is the deployment script `deploy-solidity.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contract...");
  console.log("Chain ID:", network.chainId);
  console.log("Deployer address:", deployer.address);
  console.log(
    "Deployer balance:",
    ethers.utils.formatEther(await deployer.getBalance()),
    "ETH"
  );

  const ContractFactory = await ethers.getContractFactory("Hello");
  const contract = await ContractFactory.deploy();

  // Access the address property directly
  console.log("Contract address:", contract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

```

To deploy the compiled solidity smart contract, run:

```bash
npx hardhat run scripts/deploy-solidity.js --network fluent_devnet1

# Deploying contract...
# Chain ID: 20993
# Deployer address: 
# Deployer balance:
# Contract address: 
```

To view your deployed contract on Fluent, navigate to the [Fluent Devnet Explorer](https://blockscout.dev.gblend.xyz/). From there, you can input your token address to explore your deployed contract.