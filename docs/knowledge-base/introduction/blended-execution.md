---
title: Blended Execution
sidebar_position: 3
---
Blended Execution
---

Blended Execution \- is an approach that aims to increase the efficiency of executing smart contracts from diverse VMs
by utilizing a unified IR known as rWasm.
rWasm facilitates the expansion of system functionality by leveraging native composability across different execution
environments.
This innovative approach enables seamless execution of smart contracts, optimizing performance and enhancing the overall
capabilities of the system.

This system allows for the verification of all state transitions within a unified execution environment,
thereby minimizing emulation overhead typically associated with nested execution in various VMs.
By employing rWasm, which retains full compatibility with standard Wasm,
developers can seamlessly deploy and integrate smart contracts across multiple programming languages and execution
environments.
Fluent features native, real-time composability, as the different applications the network supports share the same
execution space.
The use of compilation software allows for efficient integration of various VMs, such as the EVM and SVM,
while maintaining optimal proving infrastructure.

Ultimately, blended execution serves as a state verification function, streamlining the development process and
broadening the capabilities of builders on Ethereum the Fluent ecosystem without affecting developer experience.

## BlendedVM vs MultiVM

MultiVM is an execution layer that provides multiple VMs for running user applications.
It offers developers the opportunity to create new types of applications and combine different programming languages in
a single platform.
However, MultiVM requires developers to manage these VMs within the execution layer.
Most of these VMs use varying ISAs, which impact execution costs and supported functionality.
Developers must carefully handle these parameters to avoid miscalculations or vulnerabilities that could lead to
malicious state trie modifications.

BlendedVM takes a similar approach to MultiVM, but instead of having multiple VMs, it uses a single VM to represent all
VM operations.
This is achieved by employing compilation and emulation software to translate user applications into native instructions
for BlendedVM.
This approach enhances security by preventing malicious state access outside the single VM, even in the event of a
vulnerability in the AOT compiler.
Furthermore, BlendedVM offers system extensibility, allowing developers to incorporate support for additional VMs or EEs
in a trusted or trustless manner.
