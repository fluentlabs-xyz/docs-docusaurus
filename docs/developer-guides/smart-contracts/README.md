---
title: Building a Blended App
---

Get started building on Fluent
---

Fluent allows developers to write smart contracts in Rust (using [Fluentbase SDK](../../fluentbase-sdk/build-w-fluentbase-sdk.md) that compile down to WASM) or Solidity. Each language has its unique advantages and syntax, enabling developers to choose the best fit for their projects.

This guide will walk you through creating a `HelloWorld` contract in each of these languages and deploying it to Fluent.

## Get Started

To simplify the setup process, your project can be bootstrapped using Fluent’s scaffold tooling [`gblend`](../../gblend/README.md), which is a Foundry forge wrapper. This tool automates the creation of the project structure and necessary directories for smart contract development.

:::info[Install gblend]

Ensure you've got `gblend` installed by following the [installation instructions](../../gblend/installation.md). Check by running:

```bash
gblend --version
```

And see if you get an output.

:::

## Smart Contracts on Fluent Guides

Building on Fluent is supported in these languages as of today (or build [blended applications](../building-a-blended-app/README.md)):

<table data-column-title-hidden data-view="cards" id="language-table">
    <tbody>
        <tr>
            <td>
                <a href="solidity">
                    <span>Smart Contracts on</span> 
                    <strong>Solidity</strong>
                </a>
            </td>
            <td>
                <a href="rust">
                    <span>Smart Contracts on</span> 
                    <strong>Rust</strong>
                </a>
            </td>
            <!-- <td>
                <a href="go">
                    <span>Smart Contracts on</span> 
                    <strong>Go</strong>
                </a>
            </td> -->
            <!-- <td>
                <a href="vyper">
                    <span>Smart Contracts on</span> 
                    <strong>Vyper</strong>
                </a>
            </td> -->
        </tr>
    </tbody>
</table>
<div data-view="cards" id="language-table">
    <a href="solidity">
        <span>Smart Contracts on</span> 
        <strong>Solidity</strong>
    </a>
    <a href="rust">
        <span>Smart Contracts on</span> 
        <strong>Rust</strong>
    </a>
    <!-- <a href="go">
        <span>Smart Contracts on</span> 
        <strong>Go</strong>
    </a> -->
    <!-- <a href="vyper">
        <span>Smart Contracts on</span> 
        <strong>Vyper</strong>
    </a> -->
</div>

