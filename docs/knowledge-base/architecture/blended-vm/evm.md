---
title: EVM
sidebar_position: 2
---
EVM
---

Fluent integrates with the EVM by leveraging special EVM precompiled contracts.
These contracts facilitate the execution of EVM bytecode,
enabling the deployment and operation of smart contracts designed for the EVM ecosystem.
This allows developers to seamlessly deploy their applications built for EVM platforms using languages like Solidity or
Viper.

The EVM executor, a Rust-based smart contract, provides two key functions:

1. **`deploy`**: Deploys the EVM application and stores the bytecode state.
2. **`main`**: Executes the already deployed EVM application.

During deployment, a specialized rWasm proxy is deployed under the smart contract address.
This proxy redirects all deployment and execution calls to the EVM executor.

The deployment process is identical to that of Ethereum and other Ethereum-compatible platforms.
Additionally, there are no differences in calling conventions or contract interactions.
This consistency ensures a smooth app migration process for developers.
