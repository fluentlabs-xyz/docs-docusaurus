---
title: WebAssembly
sidebar_position: 3
---
WebAssembly
---

Fluent offers near-native support for Wasm, with the primary distinction being that, during deployment, it's compiled
into rWasm.
A Wasm application can use the same system calls as EVM applications without any restrictions.

During the deployment process,
Fluent enhances the rWasm codebase with additional checks for gas measurement and modifies certain instructions or
segment structures when necessary.
For more details, refer to the [rWasm section](rwasm.md).
