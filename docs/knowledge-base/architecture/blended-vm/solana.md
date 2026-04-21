---
title: Solana Integration
sidebar_position: 4
---
Solana Integration
---

Solana natively supports composability with both EVM and Wasm applications. This is made possible because Fluent
addresses Solana applications by mapping them into Fluent's account space. To achieve SVM support, a special rPBF
executor is employed, which defines the execution of Solana binaries and specifies a list of mapped system bindings and
calls. Native support for rPBF bytecode is achieved by mapping each operation into the Fluent EE space.

## Address Format

Solana uses a 32-byte address format, while Fluent operates with a 20-byte format. Instead of storing a mapping from the
32-byte to the 20-byte format, Fluent employs a special address convention to convert addresses between formats. A
unique magic prefix is attached to Solana addresses to make them convertible into the same binary representation within
the 20-byte Fluent account trie.

The first 12 bytes of the address are used to route transfers and calls between SVM and EVM+Wasm accounts. This routing
is necessary to achieve full EE compatibility and perform additional containment checks when required. For example,
while a simple transfer without invoking callee bytecode is not allowed in EVM, it is possible in SVM. Therefore,
differentiating between SVM and EVM accounts is essential.

## Transaction Type

Fluent does not support Solana transactions directly; instead, EIP-1559 transactions must be used. During deployment,
Fluent automatically detects Solana applications (EFL+rPBF) and specifies a special proxy that refers to the SVM
executor system's precompiled contract.

Currently, Fluent does not support an additional transaction type for Solana transactions. However, this feature could
be added in the future if there is enough demand.

## PDA (Program-Derivable Address)

Program Derived Addresses (PDA) are a core feature of Solana, allowing for the management of nested contracts with
dedicated storage. Fluent leverages various derivation schemes for Solana programs, ensuring that the migration process
remains seamless for developers. The `CREATE2` derivation scheme is used to replicate the PDA functionality.

To maintain an identical storage layout, Fluent offers supplementary storage interfaces. These interfaces enable Solana
applications to efficiently manage data chunks without incurring extra overhead.

## Accounts

Fluent employs account projection, also known as EE simulation, to integrate Solana accounts into the unified Fluent
account space. This approach ensures that all EVM, Wasm, and SVM accounts are treated uniformly, leveraging the same
rWasm VM. Consequently, this enables seamless interoperability and balance transfers between various account types.
