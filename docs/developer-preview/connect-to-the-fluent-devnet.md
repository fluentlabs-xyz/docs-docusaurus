---
title: Connect to the Fluent Devnet
sidebar_position: 1
---

# Connect to the Fluent Devnet

---
Fluent Public Devnet
---

This is the second devnet version of the Fluent L2, explicitly designed for deploying and interacting with EVM and Rust-based smart contracts. Solidity and Rust contracts can be deployed independently, or call each other as part of a [blended application](https://docs.fluentlabs.xyz/learn/developer-guides/building-a-blended-app) that utilizes both types of contracts.

> ⚠️ **Caution**  
>
> Due to possible issues in devnet implementations, 
> we can reset the network at any time to upgrade it to a more stable version.

## **Network Parameters**

<table><tbody><tr><td><strong class="row-name">Network Name:</strong></td><td>Fluent Developer Preview</td></tr><tr><td><strong class="row-name">RPC URL:</strong></td><td><a href="https://rpc.dev.gblend.xyz/">https://rpc.dev.gblend.xyz/</a></td></tr><tr><td><strong class="row-name">Chain ID:</strong></td><td>20993</td></tr><tr><td><strong class="row-name">Symbol:</strong></td><td>ETH</td></tr></tbody></table>

To quickly integrate Fluent with MetaMask, visit our [Dev Homepage](https://dev.gblend.xyz/)

## Fluent Developer Preview Resources

<table><tbody><tr><td><strong class="row-name">Faucet:</strong></td><td><a href="https://faucet.dev.gblend.xyz/">https://faucet.dev.gblend.xyz/</a></td></tr><tr><td><strong class="row-name">RPC:</strong></td><td><a href="https://rpc.dev.gblend.xyz/">https://textrpc.dev.gblend.xyz/</a></td></tr><tr><td><strong class="row-name">Explorer:</strong></td><td><a href="https://blockscout.dev.gblend.xyz/">https://blockscout.dev.gblend.xyz/</a></td></tr></tbody></table>

***

## Supported Languages

The Fluentbase SDK currently supports writing smart contracts in:

* Rust
* Solidity
* Vyper

Future iterations will introduce more language support.

## Current Features and Limitations

In this version, the offering includes a basic Reth implementation, where the execution environment is substituted with Fluent's VM, rWasm. Rollup and zk functionalities are not available at this stage.&#x20;

It's essential to note that significant changes might occur in the VM structure, host SDK, and execution layer in subsequent releases.