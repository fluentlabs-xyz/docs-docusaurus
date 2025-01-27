---
title: Step 1 - Start Rust Contract
sidebar_position: 2
---

# Step 1: Start Rust Contract

### 1.1 Set Up the Rust Project

```bash
cargo new --lib greeting
cd greeting
```

### 1.2 Configure the Rust Project

`Cargo.toml`

```toml
[package]
edition = "2021"
name = "greeting"
version = "0.1.0"

[dependencies]
alloy-sol-types = {version = "0.7.4", default-features = false}
fluentbase-sdk = {git = "https://github.com/fluentlabs-xyz/fluentbase", default-features = false}

[lib]
crate-type = ["cdylib", "staticlib"] #For accessing the C lib
path = "src/lib.rs"

[profile.release]
lto = true
opt-level = 'z'
panic = "abort"
strip = true

[features]
default = []
std = [
  "fluentbase-sdk/std",
]

```

### 1.3 Write the Rust Smart Contract

`src/lib.rs`

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]
extern crate alloc;

use alloc::string::{String, ToString};
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{function_id, router, Contract},
    SharedAPI,
};

#[derive(Contract)]
struct ROUTER<SDK> {
    sdk: SDK,
}

pub trait RouterAPI {
    fn greeting(&self) -> String;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> RouterAPI for ROUTER<SDK> {
    #[function_id("greeting()")]
    fn greeting(&self) -> String {
        "Hello".to_string()
    }
}

impl<SDK: SharedAPI> ROUTER<SDK> {
    fn deploy(&self) {
        // any custom deployment logic here
    }
}

basic_entrypoint!(ROUTER);
```

<details>

<summary><strong>Detailed Code Explanation</strong></summary>

#### 1. `#![cfg_attr(target_arch = "wasm32", no_std)]`

This line is a compiler directive. It specifies that if the target architecture is `wasm32` (WebAssembly 32-bit), the code should be compiled without the standard library (`no_std`). This is necessary for WebAssembly, which doesn't have a full standard library available.

#### 2. `extern crate alloc;` and `extern crate fluentbase_sdk;`

These lines declare external crates (libraries) that the code depends on.

* `alloc` is a core library that provides heap allocation functionality.
* `fluentbase_sdk` is the SDK provided by Fluent for writing contracts.

#### 3. `use alloc::string::{String, ToString};`

This line imports the `String` and `ToString` types from the `alloc` crate. This is necessary because the standard `std` library, which normally includes these, is not available in `no_std` environments.

#### 4. `use fluentbase_sdk::{ basic_entrypoint, derive::{router, function_id, Contract}, SharedAPI };`

This line imports various items from the `fluentbase_sdk` crate:

* `basic_entrypoint` is a macro for defining the main entry point of the contract.
* `router` and `function_id` are macros for routing function calls and defining function signatures.
* `Contract` Trait enabling contract functionality.
* `SharedAPI` is a trait that abstracts the API shared between different environments.

#### 5. `#[derive(Contract)] struct ROUTER;`

This line defines a struct named `ROUTER` and derives a contract implementation for it. The `ROUTER` struct will implement the logic for our contract.

#### 6. `pub trait RouterAPI { fn greeting(&self) -> String; }`

This defines a trait named `RouterAPI` with a single method `greeting`. This method returns a `String`.

#### 7. `#[router(mode = "solidity")] impl<SDK: SharedAPI> RouterAPI for ROUTER<SDK> { ... }`

This block implements the `RouterAPI` trait for the `ROUTER` struct. The `#[router(mode = "solidity")]` attribute indicates that this implementation is for a Solidity-compatible router.

**Inside the Implementation:**

* `#[function_id("greeting()"]` specifies the function signature in Solidity syntax. This tells the router how to call this function from Solidity.
* `fn greeting<SDK: SharedAPI>(&self) -> String { "Hello".to_string() }` is the implementation of the `greeting` method, which simply returns the string "Hello".

#### 8. `impl<SDK: SharedAPI> ROUTER<SDK> { fn deploy(&self) { // any custom deployment logic here } }`

This block provides an additional method `deploy` for the `ROUTER` struct. This method can include custom deployment logic. Currently, it's an empty placeholder.

#### 9. `basic_entrypoint!(ROUTER);`

This macro invocation sets up the `ROUTER` struct as the main entry point for the contract. It handles necessary boilerplate code for contract initialization and invocation.

### Summary

This Rust code defines a smart contract that will be compiled to WebAssembly. The contract implements a single function `greeting` that returns the string "Hello". The contract is designed to be called from a Solidity environment, showcasing interoperability between different virtual machines. The `basic_entrypoint!` macro ties everything together, making `ROUTER` the entry point for the contract.

</details>

### 1.4 Build the Wasm Project

Run:

```bash
gblend build rust -r
```