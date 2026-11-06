---
title: Our Vision
sidebar_position: 2
---
Our Vision
---

While developing a zkVM for an EVM-compatible, Wasm based rollup on Ethereum, Fluent explored methods to optimize the
proving process of smart contracts.
A major challenge lies in the fact that using a zkVM to support multiple VMs only allows for the proof of the root STF,
while the remaining nested execution of other VMs requires emulation.

To address this issue, Fluent proposes a VM capable of performing nested execution without incurring additional
emulation overhead.
This is achieved through a hardware acceleration process similar to the translation of smart contracts, applications,
and precompiled contracts into a specialized low-level intermediary representation (IR) binary structure known as rWasm.
This structure can be proven much more efficient compared to running emulator software.

With its unique interruption system, rWasm emerged as an innovative solution for handling nested calls and compiling
diverse smart contracts, revolutionizing the landscape of efficient zk-Wasm based applications on Ethereum.

## Meet Blended Execution

With blended execution on Fluent, developers can create applications using languages and tools from various VMs yet
coexisting in the same execution space.
This is possible because all smart contracts share the same account space.
As a result, native composability is achieved for anything within Fluent that can be represented as rWasm (which relies
on Wasm and LLVM, making 17+ languages available for development).

Different VMs can be supported using an AOT translation process (directly into Rwasm) or an emulation process.
Fluent can enable execution environments like the EVM, bringing Solidity and Vyper support.
Similarly, the new language Sway from Fuel can be integrated by running an FVM execution precompile.

Both users and developers obtain major benefits from blended execution because it enhances the experience of developers
who are ready to expand the Fluent ecosystem by bringing more development languages and execution environments on board.
Additionally, it bridges the gap between Web2 and Web3 users by providing a shared set of tools and new ways to interact
with applications through account abstraction backed by EIP-7702 and modules such as OAuth 2.0 and WebAuthn.

## Product Vision

The Fluent Blended Execution Layer will revolutionize the way developers create, deploy, and prove smart contracts by
unifying multiple VMs into a single, highly efficient execution environment. At the heart of this vision is rWasm, a
unique IR language designed to bridge the gap between various VMs and EEs such as the EVM, SVM, and Wasm. By eliminating
the emulation overhead typically associated with nested execution, Fluent enables faster, more secure, and more scalable
smart contract execution.

Key features:

1. **Unified Execution Environment**: Support for multiple VMs and EEs through a single execution environment, enabling
   native composability between different smart contracts, tools, and languages.
2. **rWasm Integration**: Full compatibility with standard Wasm and support for over 17+ traditional programming
   languages, allowing developers to use familiar tools such as Rust, C, Solidity, TinyGo, and AssemblyScript without
   sacrificing performance.
3. **Optimized Proving Infrastructure**: Efficient proving through rWasm that drastically reduces overhead and
   complexity, providing optimal performance for ZK circuits.
4. **Seamless Expansion**: Advanced JIT/AOT compilers to integrate new VMs and EEs, ensuring extensibility for
   future-proofing and scalability.
5. **Security and Extensibility**: BlendedVM unifies the execution space, providing enhanced security and preventing
   vulnerabilities that arise from managing multiple VMs while enabling new VMs to be added.

The Fluent Blended Execution Layer empowers developers to build diverse applications without managing disparate systems,
optimizing their experience and fostering rapid growth in the Ethereum ecosystem.

## Technical Vision

Extracting traces is crucial for proving. It involves obtaining snapshots of stack and memory operations to feed into zk
circuits. Aligning the IR language with the trace structure and ensuring its compatibility with zk is essential to
minimize circuit size, ultimately improving proving speed and reducing code complexity. rWasm, as an IR binary language,
combines execution concepts and maps its execution trace to the zkVM circuit structure. This approach aims to achieve
optimal performance, minimizing both proving and execution overhead.

Blended execution natively supports multiple VMs and EEs within a single execution environment, and within Fluent, is
enabled by employing a single IR known as rWasm, which serves as its primary VM. This IR enables the verification of all
state transitions occurring within the system, encompassing various VMs and EEs. In the case of the Fluent L2, the EVM,
SVM, and Wasm are supported. As a result, developers familiar with any of these primitives can leverage circuits
designed for rWasm and effortlessly obtain the necessary optimal proving infrastructure for their applications. In
essence, blended execution acts as a state verification function responsible for representing every operation within the
Fluent execution layer.

Given that rWasm serves as the IR language for Fluent, it has the potential to represent not only Wasm or EVM but also
other VMs and EEs. This is facilitated by providing dedicated compilation or emulation software for these platforms or
in some cases utilizing emulation software.

rWasm is a derivative of the Wasm assembly language that keeps 100% backward compatibility with original Wasm standards.
Leveraging the extensive adoption and support of Wasm, rWasm enables blockchain developers to effortlessly create new
applications in traditional languages like Rust and C. Fluent's advanced AOT compilers handle all IR compilation tasks,
simplifying the development and deployment process of Wasm-based blockchain applications in the Ethereum ecosystem.
