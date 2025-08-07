---
title: Step 4 - Integrate Blended Contracts
sidebar_position: 5
---

Step 4 - Integrate Blended Contracts
---

This guide is based off of the template blended application in this [Github repo](https://github.com/fluentlabs-xyz/blended-template-foundry-cli).

:::prerequisite

Make sure you've followed along [step 1](./start-rust-contract.md), [step 2](start-solidity-contract.md) and [step 3](deploy-blended-contracts.md).

:::

Once a blended application is deployed, you can use popular libraries such as [ethers.js](https://docs.ethers.org/v5/) to integrate your application into user interfaces such as a frontend website.

:::info[Rust x Ethereum Maxi?]

If you prefer Rust development, consider using [alloy-rs](https://github.com/alloy-rs/core) instead of ethers.js for a more native Rust experience when interacting with blended contracts.

:::

## 4.1 Add ethers.js to Foundry project

Add ethers.js as a dependency to your Foundry project. Note that you'll first have to initialise an npm package (as this is not by default available in Foundry nor `gblend` projects).

```shell
mkdir js-client && cd js-client && \
npm init -y && \
npm i ethers@5.7.2 && \
touch rust.js solidity.js && \
cd ..
```

## 4.2 Test ethers.js script to call Solidity contract

Add the following script to the `js-client/solidity.js` file that was created in the step above. This script calls the `FluentSolRustTypesTest.sol` contract, which then externally calls the Rust contract functions. 

Update string variable `contractAddress` with your deployed `FluentSolRustTypesTest` contract address

```javascript
const ethers = require("ethers") // npm i ethers@5.7.2 https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/5139#discussioncomment-5444517

const rpcURL = "https://rpc.testnet.fluent.xyz/" // Your RPC URL goes here

const provider = new ethers.providers.JsonRpcProvider(rpcURL)

const contractAddress = "<INPUT_SOLIDITY_CONTRACT_ADDRESS_HERE>"
const contractABI = [{"inputs":[{"internalType":"address","name":"FluentRustAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"rustTypesTest","outputs":[{"internalType":"contractIRustTypesTest","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustBool","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustBytes","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustBytes32","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustInt256","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustString","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustUint256","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]

const contractDeployed = new ethers.Contract(contractAddress, contractABI, provider);

let fluent_sepolia_chain_id = 20994;

testSolidityContractRead()

async function testSolidityContractRead() {

  const connectedNetworkObject = await provider.getNetwork();
  const chainIdConnected = connectedNetworkObject.chainId;
  console.log("chainIdConnected: " + chainIdConnected)

  if(chainIdConnected != fluent_sepolia_chain_id){
    console.log("RPC endpoint not connected to Fluent Sepolia (chainId: " + fluent_sepolia_chain_id + ").");
    console.log("Switch to Fluent Sepolia then try again.");
    return;
  }

  const rustTypesTestContractAddress = await contractDeployed.rustTypesTest()
  console.log("rustTypesTestContractAddress: " + rustTypesTestContractAddress)

  const rustString = await contractDeployed.getRustString()
  console.log("rustString: " + rustString)

  const rustUint256 = await contractDeployed.getRustUint256()
  console.log("rustUint256: " + rustUint256)

  const rustInt256 = await contractDeployed.getRustInt256()
  console.log("rustInt256: " + rustInt256)

  const rustAddress = await contractDeployed.getRustAddress()
  console.log("rustAddress: " + rustAddress)

  const rustBytes = await contractDeployed.getRustBytes()
  console.log("rustBytes: " + rustBytes)

  const rustBytes32 = await contractDeployed.getRustBytes32()
  console.log("rustBytes32: " + rustBytes32)

  const rustBool = await contractDeployed.getRustBool()
  console.log("rustBool: " + rustBool)

}
```

This script should return the expected values the Solidity contract gets from the Rust contract.

### 4.4 Test ethers.js script to call Rust contract

Add the following script to the `js-client/solidity.js` file that was created in the step above. This script calls the Rust contract directly with the `IRustTypesTest` Solidity interface.

Update string variable `contractAddress` with your deployed Rust contract address

```javascript
const ethers = require("ethers") // npm i ethers@5.7.2 https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/5139#discussioncomment-5444517

const rpcURL = "https://rpc.dev.gblend.xyz/" // Your RPC URL goes here

const provider = new ethers.providers.JsonRpcProvider(rpcURL)

const contractAddress = "<INPUT_RUST_CONTRACT_ADDRESS_HERE>"
const contractABI = [{"inputs":[],"name":"rustAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rustBool","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rustBytes","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rustBytes32","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rustInt256","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rustString","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rustUint256","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]

const contractDeployed = new ethers.Contract(contractAddress, contractABI, provider);

let fluent_sepolia_chain_id = 20993;

testRustContractRead()

async function testRustContractRead() {

  const connectedNetworkObject = await provider.getNetwork();
  const chainIdConnected = connectedNetworkObject.chainId;
  console.log("chainIdConnected: " + chainIdConnected)

  if(chainIdConnected != fluent_sepolia_chain_id){
    console.log("RPC endpoint not connected to Fluent Sepolia (chainId: " + fluent_sepolia_chain_id + ").");
    console.log("Switch to Fluent Sepolia then try again.");
    return;
  }

  const rustString = await contractDeployed.rustString()
  console.log("rustString: " + rustString)

  const rustUint256 = await contractDeployed.rustUint256()
  console.log("rustUint256: " + rustUint256)

  const rustInt256 = await contractDeployed.rustInt256()
  console.log("rustInt256: " + rustInt256)

  const rustAddress = await contractDeployed.rustAddress()
  console.log("rustAddress: " + rustAddress)

  const rustBytes = await contractDeployed.rustBytes()
  console.log("rustBytes: " + rustBytes)

  const rustBytes32 = await contractDeployed.rustBytes32()
  console.log("rustBytes32: " + rustBytes32)

  const rustBool = await contractDeployed.rustBool()
  console.log("rustBool: " + rustBool)

}
```

This script should return the expected values directly from the Rust contract.

## 🎉 Congratulations! 

You've successfully built and deployed your first blended application to Fluent Testnet! 🚀

:::summary

✅ **Rust Contract Development** - Created a Rust/WASM contract with multiple data types  
✅ **Solidity Contract Integration** - Built a Solidity contract that seamlessly calls your Rust contract  
✅ **Blended Deployment** - Deployed both contracts to Fluent Testnet using `gblend`  
✅ **Frontend Integration** - Connected your contracts to a JavaScript frontend using ethers.js  
✅ **Cross-Contract Communication** - Demonstrated Solidity calling Rust functions with different data types  

:::

### Next Steps:

Now that you have a working blended application, you can:

- **Explore Advanced Features** - Try more complex data structures and contract interactions
- **Build User Interfaces** - Create web apps, mobile apps, or CLI tools
- **Join the Community** - Share your projects and get help from other developers

Thank you for being part of the _Era of Expressivity_! 🌟