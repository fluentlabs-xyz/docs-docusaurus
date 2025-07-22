---
title: Connect to Fluent 
sidebar_position: 1
---
Connect to Fluent
---

This is the second devnet version of the Fluent L2, explicitly designed for deploying and interacting with EVM and Rust-based smart contracts. Solidity and Rust contracts can be deployed independently, or call each other as part of a [blended application](https://docs.fluent.xyz/developer-guides/building-a-blended-app/) that utilizes both types of contracts.

:::warning

Due to possible issues in devnet implementations, 
we can reset the network at any time to upgrade it to a more stable version.

:::

## Quickstart Metamask Connect

To quickly integrate Fluent with MetaMask, use Chainlist:

https://chainlist.org/?testnets=true&search=fluent

or visit our Dev Homepage: 

https://dev.gblend.xyz/

## Fluent Testnet

### Network Parameters

<table><tbody><tr><td><strong class="row-name">Network Name:</strong></td><td>Fluent Testnet</td></tr>
<tr><td><strong class="row-name">HTTPS RPC URL:</strong></td><td>https://rpc.testnet.fluent.xyz/</td></tr>
<tr><td><strong class="row-name">Chain ID:</strong></td><td>20994</td></tr>
<tr><td><strong class="row-name">Symbol:</strong></td><td>ETH</td></tr>
<tr><td><strong class="row-name">Explorer:</strong></td><td><a href="https://testnet.fluentscan.xyz/">https://testnet.fluentscan.xyz/</a></td></tr></tbody></table>

### Network Resources

<table>
<tbody><tr><td><strong class="row-name">Faucet:</strong></td><td><a href=" https://faucet.testnet.fluent.xyz/"> https://faucet.testnet.fluent.xyz/</a></td></tr>
<tr><td><strong class="row-name">Websocket RPC URL:</strong></td><td>wss://rpc.testnet.fluent.xyz/ws</td></tr></tbody>
</table>

## Fluent Devnet

### Network Parameters

<table><tbody><tr><td><strong class="row-name">Network Name:</strong></td><td>Fluent Developer Preview</td></tr>
<tr><td><strong class="row-name">HTTPS RPC URL:</strong></td><td>https://rpc.dev.gblend.xyz</td></tr>
<tr><td><strong class="row-name">Chain ID:</strong></td><td>20993</td></tr>
<tr><td><strong class="row-name">Symbol:</strong></td><td>ETH</td></tr>
<tr><td><strong class="row-name">Explorer:</strong></td><td><a href="https://blockscout.dev.gblend.xyz/">https://blockscout.dev.gblend.xyz/</a></td></tr></tbody></table>

### Network Resources

<table>
<tbody><tr><td><strong class="row-name">Faucet:</strong></td><td><a href="https://dev.gblend.xyz/faucet/">https://dev.gblend.xyz/faucet/</a></td></tr>
<tr><td><strong class="row-name">Websocket RPC URL:</strong></td><td>wss://rpc.dev.gblend.xyz/ws</td></tr></tbody>
</table>

## Supported Languages

The Fluentbase SDK currently supports writing smart contracts in:

* Rust
* Solidity
* Vyper

Future iterations will introduce more language support.

## Current Features and Limitations

In this version, the offering includes a basic Reth implementation, where the execution environment is substituted with Fluent's VM, rWasm. Rollup and zk functionalities are not available at this stage.&#x20;

It's essential to note that significant changes might occur in the VM structure, host SDK, and execution layer in subsequent releases.
