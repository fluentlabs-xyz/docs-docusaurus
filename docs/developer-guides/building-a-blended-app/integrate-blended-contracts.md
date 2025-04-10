---
title: Step 4 - Integrate Blended Contracts
sidebar_position: 5
---

#  Step 4 - Integrate Blended Contracts

### 4.1 Frontend Integration

Once a blended application is deployed, you can use popular libraries such as ethers.js to integrate
your application into user interfaces such as a frontend website.

### 4.2 Install ethers.js in node.js

Install ethers.js in node.js

```shell
npm i ethers@5.7.2 
```

### 4.3 Test ethers.js script with node.js

Update string variable `contractAddress` with your deployed Solidity contract

```javascript
const ethers = require("ethers") // npm i ethers@5.7.2 https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/5139#discussioncomment-5444517

const rpcURL = "https://rpc.dev.gblend.xyz/" // Your RPC URL goes here

const provider = new ethers.providers.JsonRpcProvider(rpcURL)

const contractAddress = "<INPUT_CONTRACT_ADDRESS_HERE>"
const contractABI = [{"inputs":[{"internalType":"address","name":"FluentRustAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"fluentRust","outputs":[{"internalType":"contractIFluentRust","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustBool","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustBytes","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustBytes32","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustInt256","outputs":[{"internalType":"int256","name":"","type":"int256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustString","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRustUint256","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]

const contractDeployed = new ethers.Contract(contractAddress, contractABI, provider);

let fluent_sepolia_chain_id = 20993;

getStoredValues()

async function getStoredValues() {

  const connectedNetworkObject = await provider.getNetwork();
  const chainIdConnected = connectedNetworkObject.chainId;
  console.log("chainIdConnected: "+ chainIdConnected)

  if(chainIdConnected != fluent_sepolia_chain_id){
    console.log("RPC endpoint not connected to Fluent Sepolia (chainId: " + fluent_sepolia_chain_id + ").");
    console.log("Switch to Fluent Sepolia then try again.");
    return;
  }

  const fluentRustContractAddress = await contractDeployed.fluentRust()
  console.log("fluentRustContractAddress: "+ fluentRustContractAddress)

  const rustString = await contractDeployed.getRustString()
  console.log("rustString: "+ rustString)

  const rustUint256 = await contractDeployed.getRustUint256()
  console.log("rustUint256: "+ rustUint256)

  const rustInt256 = await contractDeployed.getRustInt256()
  console.log("rustInt256: "+ rustInt256)

  const rustAddress = await contractDeployed.getRustAddress()
  console.log("rustAddress: "+ rustAddress)

  const rustBytes = await contractDeployed.getRustBytes()
  console.log("rustBytes: "+ rustBytes)

  const rustBytes32 = await contractDeployed.getRustBytes32()
  console.log("rustBytes32: "+ rustBytes32)

  const rustBool = await contractDeployed.getRustBool()
  console.log("rustBool: "+ rustBool)

}
```

The script should return the expected value the Solidity contract gets from the Rust contract.

