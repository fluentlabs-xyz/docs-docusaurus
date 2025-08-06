---
title: Step 1 - Start Rust Contract
sidebar_position: 2
---

# Step 1: Start Rust Contract

<!-- ### 1.1 Set Up the Rust Project with Cargo

```bash
cargo new --lib types_test
cd types_test
``` -->

### 1.1 Set Up the Rust Project with gblend


<!-- > ℹ️ **Note**  
>
> You can also set up your first blended app with 
> 
>```shell
>   gblend init
>``` -->

Fluent gblend tool:

https://github.com/fluentlabs-xyz/gblend

1. Install `gblendup`:

```shell
curl -sSL https://raw.githubusercontent.com/fluentlabs-xyz/gblend/refs/tags/latest/gblendup/install | bash
```

2. Start a new terminal session or update source file

3. Install `gblend` using `gblendup`

```shell
gblendup
```

This will automatically download precompiled binaries for your platform or build from source if needed.

### Verify Installation

After installation, verify gblend is working:

```shell
gblend --version
```

### 1.2 Write the Rust Smart Contract with Fluentbase SDK

```rust
pub trait RouterAPI
```
is used to define Solidity interfaces.

```rust
impl<SDK: SharedAPI> RouterAPI for ROUTER<SDK> 
```
is used to define Solidity function implementations.

The Rust contract is located in this file path:

`src/lib.rs`

for this guide, define the Rust contract as:

```rust
#![cfg_attr(target_arch = "wasm32", no_std)]
extern crate alloc;

use alloc::string::{String, ToString};
use fluentbase_sdk::{
    basic_entrypoint,
    derive::{router, Contract},
    SharedAPI,
    U256,    // alloy Solidity type for uint256
    I256,    // alloy Solidity type for int256
    Address, // alloy Solidity type for address
    address, // alloy Solidity marco to define values for type Address
    Bytes,   // alloy Solidity type for bytes
    B256,    // alloy Solidity type for bytes32
    b256     // alloy Solidity marco to define values for type B256
};

#[derive(Contract)]
struct ROUTER<SDK> {
    sdk: SDK,
}

pub trait RouterAPI {
    // Make sure type interfaces are defined here or else there will be a compiler error.
    fn rust_string(&self) -> String;
    fn rust_uint256(&self) -> U256;
    fn rust_int256(&self) -> I256;
    fn rust_address(&self) -> Address;
    fn rust_bytes(&self) -> Bytes;
    fn rust_bytes32(&self) -> B256;
    fn rust_bool(&self) -> bool;
}

#[router(mode = "solidity")]
impl<SDK: SharedAPI> RouterAPI for ROUTER<SDK> {

    // ERC-20 with Fluent SDK example:
    // https://github.com/fluentlabs-xyz/fluentbase/blob/devel/contracts/examples/erc20/lib.rs

    #[function_id("rustString()")]
    fn rust_string(&self) -> String {
        let string_test = "Hello".to_string();
        return string_test;
    }

    #[function_id("rustUint256()")]
    fn rust_uint256(&self) -> U256 {
        let uint256_test = U256::from(10);
        return uint256_test;
    }

    #[function_id("rustInt256()")]
    fn rust_int256(&self) -> I256 {
        // Declare Signed variables in alloy.rs:
        // https://docs.rs/alloy-primitives/latest/alloy_primitives/struct.Signed.html#method.from_dec_str
        let int256_test = I256::unchecked_from(-10);
        return int256_test;
    }

    #[function_id("rustAddress()")]
    fn rust_address(&self) -> Address {
        let address_test: Address = address!("d8da6bf26964af9d7eed9e03e53415d37aa96045"); // vitalik.eth 0xd8da6bf26964af9d7eed9e03e53415d37aa96045
        return address_test;
    }
    
    #[function_id("rustBytes()")]
    fn rust_bytes(&self) -> Bytes {
        let bytes_test = Bytes::from("FLUENT");
        return bytes_test;
    }

    #[function_id("rustBytes32()")]
    fn rust_bytes32(&self) -> B256 {
        let bytes256_test = b256!("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        return bytes256_test;
    }

    #[function_id("rustBool()")]
    fn rust_bool(&self) -> bool {
        let bool_test = true;
        return bool_test;
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

#### Summary

This Rust code defines a smart contract that will be compiled to WebAssembly. The contract implements a single function `greeting` that returns the string "Hello". The contract is designed to be called from a Solidity environment, showcasing interoperability between different virtual machines. The `basic_entrypoint!` macro ties everything together, making `ROUTER` the entry point for the contract.

</details>

### 1.3 Optional Example Rust Cargo.toml file with Fluentbase SDK

You can manually create the TOML file for your rust project with the Fluentbase SDK as well like the example below.
This is already done in the gblend tool for reference.

`Cargo.toml`

```toml
[package]
edition = "2021"
name = "types_test"
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

### 1.4 Build the Wasm Project

Generate the WASM binary file with:

```bash
gblend build rust -r
```

We will deploy the compiled Rust contract with the WASM binary file later in this guide.

:::warning

Note: to update Rust crate `fluentbase-sdk` if there are issues:

```shell
cargo clean
cargo update -p fluentbase-sdk
```
:::
