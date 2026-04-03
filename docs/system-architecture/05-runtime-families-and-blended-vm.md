---
title: Runtime Families and Blended VM
sidebar_position: 5
---

Fluent’s architecture supports multiple runtime families while keeping one shared execution/state model.

## rWasm as the execution substrate

The tech-book frames rWasm as Fluent’s proving-friendly execution substrate:

- derived from Wasm concepts,
- adapted for ZK/proving constraints,
- used as the core execution representation in the blended model.

In architecture terms, rWasm is not “just another VM plugin”; it is the substrate around which runtime routing and host coordination are built.

## Two integration styles

The architecture commonly uses two patterns:

1. **Translation-style path**
   - source format is translated into rWasm-compatible execution representation.

2. **Runtime-proxy path**
   - account execution is delegated to specialized runtime logic under ownership/routing rules.

These patterns allow incremental support for different EE families without abandoning one-state-machine design.

## EVM-oriented path

Fluent’s EVM integration keeps Ethereum-facing developer ergonomics while fitting Fluent runtime boundaries.

Conceptually:

- deployment and execution are routed through Fluent runtime mechanisms,
- EVM compatibility surface is preserved where expected,
- host/runtime boundaries still apply for privileged operations.

## Wasm-oriented path

Wasm-oriented flows are close to native Fluent execution because rWasm is Wasm-derived.

The architecture still applies additional constraints/checking relevant to proving and runtime policy.

## Solana/SVM-oriented path

The tech-book describes Solana-oriented integration through projection/routing ideas and runtime execution support.

As with any evolving architecture documentation, specific maturity and network-level availability can differ by release. The stable architectural takeaway is:

- non-EVM formats are integrated via explicit routing/runtime boundaries,
- address and data-model differences are handled by compatibility/projection mechanisms,
- shared-state composability remains the design target.

## Why families are still one architecture

Even with multiple runtime families, Fluent avoids fragmented execution domains by keeping:

- one state machine,
- one host-authoritative commit model,
- one interruption/syscall control plane.

That is the core “blended VM” architecture claim.
