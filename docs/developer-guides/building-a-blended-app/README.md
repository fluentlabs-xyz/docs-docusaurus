---
title: Building a Blended App
---

## Introduction

This guide provides detailed instructions on how to build a blended application on Fluent. 
It combines a Rust smart contract to return value types to a Solidity smart contract.

This setup demonstrates:

* composability between different programming languages (Solidity and Rust)
* and interoperability between different virtual machine targets (EVM and Wasm)

within a single execution environment.

## Prerequisites

### Overview 

* Rust and Cargo
* Metamask for Remix IDE
* Node.js and npm

### Quick Install Dependencies

This script combines multiple commands to install all packages needed using Brew and Cargo to develop Blended Apps

```shell
brew install rust && \
brew install foundry && \
brew install node && \
cargo install gblend
```
