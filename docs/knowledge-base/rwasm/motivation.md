---
title: Motivation
sidebar_position: 1 
---
Motivation
---

WebAssembly (WASM) is an interpreted language and binary format favored by many Web2 developers.
Our approach aims to seamlessly integrate these developers into the Web3 world,
despite the challenges this integration presents.
We prefer WASM over RISC-V or other binary formats due to its well-established and widely adopted standard,
which developers appreciate and support.
Moreover, WASM includes a self-described binary format (covering memory structure, type mapping, and more),
unlike RISC-V/AMD/Intel binary formats,
which require binary wrappers like EXE or ELF.

However, WASM is not without its drawbacks,
particularly its non-ZK friendly structures that complicate the proving process.
This is where rWASM (Reduced WebAssembly) comes into play.

## Introducing rWASM

rWASM is a specially modified binary intermediary representation (IR) of WASM execution.
It retains 99% compatibility with the original WASM bytecode and instruction set
but features a modified binary structure that avoids the pitfalls of non-ZK friendly elements,
without altering opcode behavior.

The main issue with WASM is its use of relative offsets for type mappings, function mappings, and block/loop statements,
which complicates the proving process.
rWASM addresses this by adopting a more flattened binary structure without relative offsets
and eliminating the need for a type mapping validator,
allowing for straightforward execution.

## Benefits of rWASM

The flattened structure of rWASM simplifies the process of proving the correctness of each opcode execution
and places several verification steps in the hands of the developer.
This modification makes rWASM a more efficient and ZK-friendly option
for integrating Web2 developers into the Web3 ecosystem.
