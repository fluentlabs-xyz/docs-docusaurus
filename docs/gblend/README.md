---
title: gblend Overview
---

gblend Overview
---

`gblend` is a specialized Foundry forge wrapper designed for hybrid Solidity and WebAssembly (WASM) smart contract development on Fluent Network. It seamlessly integrates Rust-based WASM contracts with traditional Solidity development workflows.

:::summary[Key Features]

- **Rust to WASM Compilation** - Compile Rust smart contracts to WebAssembly
- **Hybrid Development** - Seamlessly work with both Solidity and WASM contracts
- **Reproducible Builds** - Docker-based compilation ensures consistent WASM builds
- **Full Verification Support** - Verify both Solidity and WASM contracts on-chain
- **Foundry Compatible** - Maintains full compatibility with existing Foundry projects

:::

The CLI usage is nearly identical to standard Forge, with a few Fluent-specific extensions. For example, to verify WASM contracts, you must pass the `--wasm` flag.

:::tip[Prefer working with Hardhat?]

Although `gblend` is forked from Foundry's forge and works really well within the Foundry dev environment, it's also possible to use Hardhat if that's your preferred dev environment.

Please refer to the [Foundry documentation on integrating Hardhat and Foundry](https://getfoundry.sh/config/hardhat#adding-foundry-to-a-hardhat-project) and use the same strategy when using Fluent's `gblend`.

:::

## Resources

- [Fluent Network Documentation](https://docs.fluent.xyz)
- [Foundry Book](https://book.getfoundry.sh)
- [gblend Repository](https://github.com/fluentlabs-xyz/gblend)
- [Example Projects](https://github.com/fluentlabs-xyz/examples)

## Next up

* **[Installation](installation.md)**: Installation instructions for `gblend`.
* **[Using `gblend`](usage.md)**: Learn the basic commands to start building with `gblend`.
* **[Developer guides](../developer-guides/building-a-blended-app/README.md)**: Find out further how to use `gblend` by following along with the developer guides.
