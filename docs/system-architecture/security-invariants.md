---
title: Security Invariants
sidebar_position: 9
---

The other pages in this section describe how Fluent works. This page is the list of things that cannot stop being true without the chain breaking. These are the consensus-critical invariants — break any one and the failure mode isn't a bug, it's a consensus split, a privilege escalation, or a host-level instability that affects every account on the chain.

Anyone modifying runtime-host interaction code, syscall handlers, or upgrade paths should treat this as a review checklist.

:::danger
Most critical bugs in this architecture are boundary violations, not ordinary application logic errors. Every invariant below is part of the consensus surface.
:::

## Routing integrity

New contracts must route to the correct delegated runtime class. User calls must not bypass routing by targeting a delegated runtime address directly. Metadata ownership boundaries between runtime families must hold. Two contracts with different intended runtimes are fundamentally different contracts, and routing is what enforces that. A misrouted deploy or a successful bypass means the same storage can be interpreted under two different runtime rules, which is how a chain executes contradictory state transitions. Mechanism: [Runtime Routing and Ownable Accounts](./runtime-routing-and-ownable-accounts.md).

## Interruption integrity

Positive exit codes are **call IDs**, not final statuses. A runtime yielding a positive exit is asking for host action, and its output buffer carries syscall parameters — not committed output. Resume must use the exact recoverable context associated with the `call_id`, and per-transaction reset must clear recovery state so no context survives past its owning transaction. Call-id confusion — treating a yield as a finalization or resuming the wrong context — corrupts execution flow and can leak state across frames. Mechanism: [Interruption and Syscalls](./interruption-and-syscalls.md).

## Bounds-before-allocation

Untrusted lengths must be validated before the host allocates memory to service them. Memory reads and writes must fail safely when they go out of bounds. Large copy paths — hashing, calldata, log emission — must carry explicit upper bounds. Without these checks, untrusted input can make the host allocate unboundedly and crash itself before any gas is charged, which is a DoS surface on every node simultaneously.

## Static-call immutability

State-changing operations must reject static context. That covers ordinary storage mutations, metadata mutations, account lifecycle operations (create, destroy), and privileged runtime state transitions like upgrade. `STATICCALL` exists so callers can invoke untrusted code knowing no state change can result. Any mutation that slips through the static check defeats that guarantee and silently changes the semantics of every existing contract that relies on it.

## System-runtime envelope discipline

For system-mode runtimes, structured output envelopes must decode deterministically across nodes. Storage diffs, logs, and metadata updates must only commit on a successful runtime exit — a fatal exit or a decode failure means *no* side effects are applied, not "whatever we managed to parse." Envelope mis-handling is how you commit wrong side effects from a runtime that didn't actually complete.

## Upgrade authority boundaries

The runtime-upgrade path must stay tightly scoped to the upgrade precompile's execution path on the host side. Authority defaults and owner transitions must be explicit and reviewed — no silent zero-owner assignment, no ambiguous fallback. Upgrade-authority compromise is full-system compromise; the safety here comes from layering contract-level permissioning under host-level path enforcement. Mechanism: [Runtime Upgrade](./runtime-upgrade.md).

## Fatal-code containment

Non-system user contracts must not be able to surface internal fatal runtime-only classes as normal outputs. Some error classes are meaningful only inside the host-runtime protocol (envelope-decode failures, recovery-state violations). Letting user contracts produce those classes as their return status lets applications impersonate protocol-level failures and confuse every downstream consumer.

## Bridge hook consistency

Bridge hooks rely on specific event shapes, data layouts, and ordering guarantees. Any change to the events, the runtime side, or the flow that produces them must update the bridge-side hook logic in the same change. Mismatch here mints, burns, or settles wrong amounts — the most expensive kind of bug a bridge can have.

## Panic policy

The release build profile is `panic = "abort"`. Consensus-critical paths must not rely on unwind-based recovery: a panic aborts the process, and any fallback that assumes the stack will be unwound before cleanup is wrong. Design error handling around explicit `Result` returns and anticipated failures. Don't rely on catching implicit panics.

## Checklist for syscall-handler changes

Any change that touches a syscall handler should confirm, explicitly, that it:

- preserves strict input and state validation,
- preserves static-call rejection for mutating branches,
- keeps gas and fuel charging order deterministic,
- keeps allocation safety bounded and pre-validated,
- preserves ownership checks on metadata operations,
- keeps interruption and resume symmetry intact.

If any box isn't clearly preserved, the change isn't ready to merge. These aren't style concerns. They're the boundaries this architecture depends on.
