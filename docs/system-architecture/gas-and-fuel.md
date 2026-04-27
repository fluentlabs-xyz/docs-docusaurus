---
title: Gas and Fuel
sidebar_position: 6
---

Fluent charges work in two accounting units. **Gas** is what users pay with — the same EVM-visible unit wallets quote, explorers display, and transactions settle in ETH. **Fuel** is what the rWasm runtime consumes while executing. Every runtime step is metered in fuel; every transaction is paid in gas; a fixed deterministic conversion links them.

If you're writing tooling that estimates costs, building a custom runtime, or auditing gas charging on privileged paths, this split matters. For ordinary contract development it's invisible.

## Why two units

Runtime execution, host operations, and EVM interpretation all need one shared accounting model. Gas alone doesn't work — it was designed around EVM opcodes, and Fluent runs more than the EVM. Fuel is the engine-level unit every runtime shares. Gas stays as the user-facing economic unit Ethereum-compatible tooling expects.

One conversion ratio keeps them in lockstep. Anything a user pays gas for translates into a fuel budget the runtime consumes, and any fuel the runtime returns to the host translates back into gas settlement.

## The conversion ratio

The conversion is a fixed protocol constant:

```text
FUEL_DENOM_RATE = 20
```

Each unit of gas is worth 20 units of fuel. The runtime fuel limit for a call is derived from whatever gas is available when the call starts; any consumed or refunded fuel converts back into gas when the runtime returns or yields. Rounding at the conversion boundary is deterministic — every node performs it identically — because any divergence here is consensus-splitting.

:::info
Changing `FUEL_DENOM_RATE` or the rounding rules at the conversion boundary is a fork-level change. Gas and fuel conversion is part of consensus correctness, not a tuning knob.
:::

## How settlement works

Inside a normal call or resume cycle, the host goes through four steps:

1. Compute the runtime fuel limit from the gas remaining in the frame.
2. Invoke the runtime with that limit.
3. Receive back the fuel consumed and any fuel refunded.
4. Convert the deltas into gas and apply them to the interpreter's gas state.

That happens on every runtime invocation and every resume. If the runtime doesn't consume its full budget, leftover fuel is refunded as gas. If it runs out of fuel mid-execution, the call aborts with an out-of-gas-class error.

## Keeping the delegated EVM runtime in sync

The delegated EVM runtime runs under rWasm, which creates a subtle accounting risk: the EVM runtime tracks committed gas locally for EVM-visible gas semantics, while the host tracks fuel consumed at the rWasm level. If those two diverge, user-visible gas usage stops matching what the runtime actually did.

To prevent that, the delegated EVM runtime syncs its local committed-gas delta back to host-level fuel before every interruption and before every final return. The sync happens at well-defined boundaries so no EVM operation can hide gas usage by yielding before its gas is committed.

## Import-level fuel schedules

Every runtime import carries an explicit fuel formula — a charging procedure attached to the syscall index at compile or translation time. The formula shape depends on the operation:

- **Constant.** Some state and control calls have a fixed cost. One charge per invocation, regardless of data size.
- **Linear in data size.** Copy, hash, and log operations scale with the bytes they touch. The per-byte rate is part of the import's fuel schedule.
- **Quadratic.** A few operations, notably `exec`, use a quadratic policy that reflects the work they trigger downstream.

These formulas aren't optimization heuristics. They're part of the runtime's ABI: a contract compiled for Fluent expects specific charges on specific operations, and changing a formula changes the cost semantics of every existing contract that uses that import.

## Engine-metered vs self-metered runtimes

Not every system runtime meters fuel the same way.

**Self-metered runtimes** charge fuel explicitly in their code. Every operation that costs fuel has a matching charge call, and the runtime does its own bookkeeping.

**Engine-metered runtimes** let the execution engine meter configured precompiles automatically. The runtime doesn't charge itself; the engine inserts fuel accounting at compilation time.

The Universal Token runtime is classified as engine-metered. This is a per-runtime policy decision, not a global behavior — which runtimes are engine-metered is part of the protocol's runtime classification and is versioned accordingly. The full classification table lives in [Precompiles](./precompiles/).

## Calldata surcharge

Large calldata payloads attract a quadratic surcharge above a threshold. The reason is practical block-data pressure control: without the surcharge, it's cheap to flood a block with enormous calldata that other users then pay to store and process.

This is block economics, not runtime internals. It shows up in transaction cost estimation and in any tooling that predicts gas for data-heavy transactions.

## Operational invariants

A few rules the host enforces at every syscall entry:

- **Never allocate large host buffers before bounding length.** Untrusted lengths are validated first; only then is memory allocated. Otherwise an untrusted caller can make the host allocate unbounded memory before any gas is charged.
- **Charge before expensive host work where feasible.** If a host operation is costly, its fuel is debited before the operation runs, not after.
- **Treat conversion and rounding as consensus surface.** No change to conversion, rounding, or charging order ships as a silent improvement. These are fork-level coordination events.
