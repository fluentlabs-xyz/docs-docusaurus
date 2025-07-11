---
title: Step 3 - Deploy Blended Contracts 
sidebar_position: 4
---

<!-- # Step 3: Deploy Blended Contracts

### 3.1 Create the Deployment Script

This deployment script is responsible for deploying both the Rust smart contract (compiled to Wasm) and the Solidity smart contract (`GreetingWithWorld`).

`deploy/01_deploy_contracts.ts`

```typescript
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "ethers";
import fs from "fs";
import crypto from "crypto";
import path from "path";
require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers, config, network } = hre;
  const { deploy, save, getOrNull } = deployments;
  const { deployer: deployerAddress } = await getNamedAccounts();

  console.log("deployerAddress", deployerAddress);
  // Deploy WASM Contract
  console.log("Deploying WASM contract...");
  const wasmBinaryPath = "./greeting/lib.wasm";

  // @ts-ignore
  const provider = new ethers.JsonRpcProvider(network.config.url);
  const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);

  const checkmateValidatorAddress = await deployWasmContract(wasmBinaryPath, deployer, provider, getOrNull, save);

  //Deploy Solidity Contract
  console.log("Deploying GreetingWithWorld contract...");
  const fluentGreetingContractAddress = checkmateValidatorAddress;

  const greetingWithWorld = await deploy("GreetingWithWorld", {
    from: deployerAddress,
    args: [fluentGreetingContractAddress],
    log: true,
  });

  console.log(`GreetingWithWorld contract deployed at: ${greetingWithWorld.address}`);
};

async function deployWasmContract(
  wasmBinaryPath: string,
  deployer: ethers.Wallet,
  provider: ethers.JsonRpcProvider,
  getOrNull: any,
  save: any
) {
  const wasmBinary = fs.readFileSync(wasmBinaryPath);
  const wasmBinaryHash = crypto.createHash("sha256").update(wasmBinary).digest("hex");
  const artifactName = path.basename(wasmBinaryPath, ".wasm");
  const existingDeployment = await getOrNull(artifactName);

  if (existingDeployment && existingDeployment.metadata === wasmBinaryHash) {
    console.log(`WASM contract bytecode has not changed. Skipping deployment.`);
    console.log(`Existing contract address: ${existingDeployment.address}`);
    return existingDeployment.address;
  }

  const gasPrice = (await provider.getFeeData()).gasPrice;

  const transaction = {
    data: "0x" + wasmBinary.toString("hex"),
    gasLimit: 300_000_000,
    gasPrice: gasPrice,
  };

  const tx = await deployer.sendTransaction(transaction);
  const receipt = await tx.wait();

  if (receipt && receipt.contractAddress) {
    console.log(`WASM contract deployed at: ${receipt.contractAddress}`);

    const artifact = {
      abi: [],
      bytecode: "0x" + wasmBinary.toString("hex"),
      deployedBytecode: "0x" + wasmBinary.toString("hex"),
      metadata: wasmBinaryHash,
    };

    const deploymentData = {
      address: receipt.contractAddress,
      ...artifact,
    };

    await save(artifactName, deploymentData);
  } else {
    throw new Error("Failed to deploy WASM contract");
  }

  return receipt.contractAddress;
}

export default func;
func.tags = ["all"];

```

### 3.2 Create the Hardhat Task

`tasks/get-greeting.ts`

```tsx
import { task } from "hardhat/config";

task("get-greeting", "Fetches the greeting from the deployed GreetingWithWorld contract")
  .addParam("contract", "The address of the deployed GreetingWithWorld contract")
  .setAction(async ({ contract }, hre) => {
    const { ethers } = hre;
    const GreetingWithWorld = await ethers.getContractAt("GreetingWithWorld", contract);
    const greeting = await GreetingWithWorld.getGreeting();
    console.log("Greeting:", greeting);
  });

```

### 3.3 Compile and Deploy the Contracts

Run the following commands to compile and deploy your contracts:

```bash
pnpm hardhat compile
pnpm hardhat deploy
pnpm hardhat get-greeting --contract <CONTRACT_ADDRESS>
``` -->

# Step 3: Deploy Blended Contracts

### 3.1 Deploy the Rust Contract with gblend

```shell
gblend deploy \
--chain-id 20993 \
--rpc https://rpc.dev.gblend.xyz \
--private-key $devTestnetPrivateKey \
--gas-limit 3000000 \
lib.wasm
```

### 3.2 Deploy the Solidity Contract with Remix IDE

Copy and paste the Solidity contract above into Remix IDE.
Select:
```
Deploy & Run Transactions > Environment > Injected Provider - Metamask
```
while connected to Fluent testnet, then deploy the contract with the deployed Rust contract address
for the constructor input argument.

### 3.3 Verify the Solidity Contract with Blockscout Frontend

Go to the Fluent testnet Blockscout Explorer:

https://blockscout.dev.gblend.xyz/

Search for the contract address the Solidity contract was deployed to. 
Go to:
```
Contract > Verify & publish
```
then select the correct parameters to verify the contract.

### 3.4 Read the Solidity function return values

With the Solidity contract verified on Blockscout, we are now able to test 
the Solidity and Rust contract Blended App. With the verified Solidity contract on Blockscout, go to:
```
Read/Write contract > Read
``` 
and click on the different function names. You should see values that match the correct type for that function name, confirming your Blended App is setup between Solidity and Rust.
