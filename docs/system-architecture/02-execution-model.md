---
title: Execution Model
sidebar_position: 2
---

Fluent executes applications under a **shared execution model** rather than isolated per-VM silos.

## Blended execution in practice

At runtime, the system treats different EE styles (EVM-oriented, Wasm-oriented, and other routed runtimes) as parts of one coherent execution domain.

The practical outcome:

- contracts share one state space,
- cross-runtime interactions are direct and synchronous,
- composability does not require external asynchronous bridges for in-transaction calls.

## Why not classic multi-VM

Classic multi-VM systems frequently pay extra complexity for:

- state synchronization between VM domains,
- consistency guarantees across VM boundaries,
- duplicated invariants in multiple runtimes.

Fluent’s architecture instead centralizes execution coordination and state commitment, and uses runtime routing + interruption to keep policy enforcement unified.

## Integration challenges Fluent must solve

The tech-book highlights several architectural pain points when blending EEs. These remain useful design constraints:

1. **Cryptography mismatch** between ecosystems.
2. **Address format mismatch** (20-byte vs other formats).
3. **Different metering models** and gas accounting assumptions.
4. **Different bytecode/account metadata requirements**.
5. **Variable storage patterns and data sizes**.

Fluent addresses these by combining:

- runtime-specific execution paths,
- compatibility-oriented interfaces,
- raw/storage-oriented interfaces where needed,
- host-governed syscall/interruption boundaries.

## Deterministic host authority

A key architectural rule: even when runtime code executes most of the business logic, sensitive operations still pass through host authority paths.

This is enforced through interruption protocol and syscall handlers, so consensus-critical behavior is concentrated in one deterministic control plane.

## Conceptual flow

At high level, one transaction follows this shape:

1. tx enters node pipeline,
2. REVM/frame setup resolves target execution path,
3. runtime executes until finalization or interruption,
4. host resolves interruptions and resumes execution as needed,
5. final result + state effects are committed.

The rest of this section explains each of those moving parts in detail.
