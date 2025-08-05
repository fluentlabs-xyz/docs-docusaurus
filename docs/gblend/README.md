---
title: gblend Overview
---

gblend Overview
---

The `gblend` CLI tool and development tooling is a [Foundry Forge](https://github.com/fluentlabs-xyz/gblend) wrapper optimized for Fluent Network and WASM smart contract development.

`gblend` wraps Foundry's Forge and integrates Fluent’s custom REVM, providing a seamless experience for building and deploying WASM-based smart contracts. It enables you to:

- Compile Rust smart contracts for WASM execution
- Deploy contracts to the Fluent Network
- Verify WASM contracts on-chain
- Scaffold new projects using templates from [fluentlabs-xyz/examples](https://github.com/fluentlabs-xyz/examples)

The CLI usage is nearly identical to standard Forge, with a few Fluent-specific extensions. For example, to verify WASM contracts, you must pass the `--wasm` flag.

:::tip[Prefer working with Hardhat?]

Although `gblend` is forked from Foundry's forge and works really well within the Foundry dev environment, it's also possible to use Hardhat if that's your preferred dev environment.

Please refer to the [Foundry documentation on integrating Hardhat and Foundry](https://getfoundry.sh/config/hardhat#adding-foundry-to-a-hardhat-project) and use the same strategy when using Fluent's `gblend`.

:::
