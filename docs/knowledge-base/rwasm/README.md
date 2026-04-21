---
title: rWASM
---

rWASM
---

rWASM (reduced WebAssembly) is an EIP-3540 compatible binary intermediary representation (IR) of WASM (WebAssembly).
It is designed
to simplify the execution process of WASM binaries while maintaining 99% compatibility with original WASM features.

## Key Features

- **ZK-Friendliness**: rWASM achieves Zero-Knowledge (ZK) friendliness by having a more flattened binary structure and a simplified instruction set.
- **Compatibility**: rWASM retains full compatibility with WASM, ensuring that all original WASM features are preserved.

## Important Notice

rWASM is a trusted execution runtime and should not be run without proper validation.
It is safe to translate WASM to rWASM and execute, as rWASM injects all necessary validations into the entrypoint.
