---
title: Rust
sidebar_position: 2
---

# Rust Developer Guide

For Rust smart contracts, any  **`no_std`** compatible crate (e.g., `rand`, `alloc`) can be used. Standard library crates are not supported. Verified libraries can be found on [**crates.io**](https://crates.io/categories/no-std)**.**&#x20;

## **Prerequisites**

Before getting started, ensure you have the following dependencies installed on your system:

* **Clang and CMake**: Install these if they are not already on your system.
*   For macOS users, LLVM can be installed via Homebrew:

    ```bash
    brew install llvm
    ```

***

## Install Fluent Scaffold CLI tool

To install the Fluent scaffold CLI tool, run the following command in your terminal:

```bash
cargo install gblend
```

To create a project, run the following in your terminal:

```bash
gblend init
```

After installing the Fluent build tool, you can initialize a new project and choose the `Rust` option to bootstrap the starter project.

## Project Structure

```
.
├── Cargo.toml
└── lib.rs

```

## Getting Started

In this guide, we will be working with the `lib.rs` file located in the `src` folder. The structure for any Rust smart contract will be as follows

`lib.rs`

```rust
// 1. Set the target to wasm32 and enable no_std for compatibility.
// no_std is required since WebAssembly's minimal runtime lacks support for Rust’s standard library.
#![cfg_attr(target_arch = "wasm32", no_std)]

// 2. Import FluentBase SDK
extern crate fluentbase_sdk;

use fluentbase_sdk::{basic_entrypoint, derive::Contract, SharedAPI};

// 3. Define Contract Struct with SDK: Acts as the core of the contract’s logic.
#[derive(Contract)]
struct GREETING<SDK> {
    sdk: SDK,
}

impl<SDK: SharedAPI> GREETING<SDK> {
    // 4. Deployment Logic: Placeholder for setup during deployment.
    fn deploy(&mut self) {
        // Add any custom deployment logic here
    }

    // 5. Core Contract Logic: writes "Hello, World" message to output.
    fn main(&mut self) {
        self.sdk.write("Hello, World".as_bytes());
    }
}

// 6. Set Entry Point: Connects GREETING struct to the WASM runtime.
basic_entrypoint!(GREETING);
```

This snippet shows how simple it is to interact with the Fluent VM: just call the SDK, initialize your contract, add the functions, and, if needed, define a custom deployment process).&#x20;

### **Compiling the Rust Smart Contract**

Understanding the deployment process starts with comprehending the role of the Makefile. This file compiles Rust code into Wasm & rWasm and generates the necessary binaries that will be embedded in a tx for deployment.


```shell 
gblend build rust -r
```

Executing this command compiles the code and generates a file named `lib.wasm` in the `bin` directory.

:::warning

Note: to update Rust crate `fluentbase-sdk` if there are issues:

```shell
cargo clean
cargo update -p fluentbase-sdk
```
:::

### **Deploying the Contract**

To deploy contract, use gblend cli:

```shell
gblend deploy \
--private-key <PRIVATE_KEY> \
--dev lib.wasm \
--gas-limit 300000
```

Upon successful deployment, the receipt of your deployment transaction will be displayed, confirming the smart contract deployment on Fluent using the Fluent SDK.

To view your deployed Fluent contract, navigate to the [Fluent Devnet Explorer.](https://blockscout.dev.gblend.xyz/) From there, you can input your contract address to explore your deployed contract.
