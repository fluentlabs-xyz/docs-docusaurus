---
title: Architecture Overview
sidebar_position: 1
---

Fluent is designed as a **blended execution** system: contracts from different execution environments can coexist behind one shared state machine.

This section explains architecture at a systems level (not line-by-line code internals), using:

- `fluentlabs-xyz/tech-book` as the conceptual baseline,
- current `fluentbase/docs` as implementation-aligned behavior.

## The core architectural idea

Most systems either:

- run one VM everywhere, or
- run many VMs side-by-side and bridge between them.

Fluent’s model is different:

- one shared execution/state surface,
- runtime routing to decide how account logic is executed,
- host-governed interruption protocol for privileged/stateful operations,
- deterministic commit via REVM integration.

This is why Fluent uses the term **blended execution** instead of just “multi-VM.”

## Three layers to keep in mind

### 1) Node and consensus shell

A modified Reth-based node stack handles standard blockchain concerns:

- networking,
- tx/block processing,
- mempool,
- RPC and external interfaces.

### 2) Execution coordination layer

This layer (REVM integration + host handlers) is responsible for:

- frame lifecycle,
- state journal/commit rules,
- privileged host actions,
- syscall interruption handling.

### 3) Runtime execution layer

This layer runs contract/runtime logic using Fluent’s rWasm-centered runtime model.
It includes runtime dispatch, resumable contexts, and SDK/system binding boundaries.

## Why this split matters

Execution and commitment are not the same thing:

- runtime executes logic and can yield,
- host validates and performs privileged state actions,
- final effects are committed deterministically.

That separation is central to both security and proving ergonomics.

## What this architecture is trying to optimize

Fluent’s architecture balances:

- **compatibility** (especially Ethereum-facing behavior),
- **composability** (cross-EE calls over shared state),
- **determinism** (consensus safety),
- **proving friendliness** (single blended execution model rather than many isolated proof domains).

## Reading order

1. [Execution model](./02-execution-model.md)
2. [Runtime routing and ownership](./03-runtime-routing-and-ownership.md)
3. [Interruption and syscall model](./04-interruption-and-syscalls.md)
4. [Runtime families and blended VM mapping](./05-runtime-families-and-blended-vm.md)
5. [State and storage model](./06-state-and-storage-model.md)
6. [Gas/fuel metering model](./07-gas-and-fuel-model.md)
7. [Upgrade and security boundaries](./08-upgrades-and-security-boundaries.md)
8. [L2/rollup context](./09-l2-rollup-context.md)
