---
title: Interruption and Syscalls
sidebar_position: 5
---

Runtime execution on Fluent isn't a single uninterrupted run. When a contract needs to read storage, emit an event, create a nested call, or touch shared state in any way, it doesn't do it. It yields back to the host, the host performs the operation, and the runtime resumes from where it stopped. That pattern — the **interruption protocol** — is how every privileged operation on Fluent is performed.

This page covers the protocol itself and the two syscall surfaces layered on top of it.

## The `exec` / `resume` handshake

From the host's side, running a runtime frame is a deterministic handshake:

1. The host calls `exec` with the runtime's input and a fuel budget.
2. The runtime executes until it either finishes or needs something.
3. If it needs something, it yields an interruption request.
4. The host performs the requested operation.
5. The host calls `resume` with the result, fuel accounting, and any returned data.
6. The runtime picks up from the saved point.

Steps 2 through 5 repeat until the runtime returns a final result. There's no other path for a runtime to affect state or interact with the rest of the system.

## How a yield is signalled

The runtime's exit code is overloaded by protocol convention:

- **`exit_code <= 0`** — the runtime is done. The value is a final status: success, revert, or a specific error class. Return bytes are the final output.
- **`exit_code > 0`** — the runtime is yielding. The value is a `call_id`, a transaction-scoped handle pointing at a saved execution context. Return bytes carry the encoded parameters of the syscall being requested.

One exit integer carrying both "here is my result" and "here is my interruption" is economical, and it's also consensus-critical. Treating a positive exit as a final status would commit whatever's in the runtime's return buffer as if it were real output. That failure mode is called out in the [security invariants](./security-invariants.md).

## The interruption payload

When a runtime yields, the host decodes a payload containing:

- the `call_id` identifying the saved context,
- the syscall parameters (syscall id, input byte range, fuel available, static-context flags),
- a gas snapshot for deterministic settlement on resume.

The host uses `call_id` to find the saved context to resume later, validates the syscall parameters, and routes the syscall id into the host handler for that operation.

## How the host handles an interruption

Every interruption runs through the same sequence on the host side:

1. Read the syscall input from the runtime's memory at the declared byte range.
2. Validate input lengths and state-context constraints. Reject oversized reads, malformed payloads, and mutating operations invoked from static context.
3. Charge gas according to the operation's fuel procedure.
4. Execute the host operation. Simple calls (hash, storage read) are immediate; compound operations (`CALL`, `CREATE`) spin up a new frame.
5. Return the immediate result, or — for frame-creating operations — wait for the nested frame to complete.
6. Store the interruption outcome for the resume phase to hand back to the runtime.

Every step in this sequence is deterministic across nodes. Same inputs produce the same outputs, the same errors, and the same gas charges everywhere. Anything less would make the syscall a consensus-splitting surface.

## The resume path

After the host operation finishes, the runtime resumes with:

- its `call_id` so the executor picks the right saved context,
- a mapped exit code translating the host action's outcome into a runtime-visible status,
- the returned data buffer,
- the consumed or refunded fuel,
- optionally a pointer at which the runtime wants fuel accounting written as a tuple.

The runtime continues from the interrupted instruction, consumes or ignores the returned data, and either finishes or yields again.

## Two syscall layers

The interruption protocol has two sides, and they're not the same API.

### Layer A — the runtime import layer

The public import namespace exposed to runtime code is `fluentbase_v1preview`. This is what a contract compiled for Fluent sees as available imports:

- input and output helpers,
- state selectors (deploy vs main entry, context queries),
- `exec` and `resume` themselves,
- fuel APIs for self-metered paths,
- hash and crypto builtins.

Each import is bound to a syscall index and a fuel procedure at compile or translation time. Fuel formulas follow predictable shapes — constant, linear in data size, quadratic where appropriate — so every operation has a known cost up front, not one determined at runtime.

The import table is part of protocol behavior. Changing it touches every contract that imports from it and every tool that produces compiled runtimes.

### Layer B — the host interruption syscall IDs

When an interruption arrives, the host routes it through its own handler set, indexed by `SYSCALL_ID_*` constants. These aren't exposed to contracts. They're the protocol-level operations the host knows how to perform:

- storage, transient storage, and block-level access,
- call, create, and destroy flows,
- code, balance, and account queries,
- metadata ownership and metadata storage operations,
- the runtime-upgrade governance syscall.

Layer A describes what a runtime can *ask for*. Layer B describes what the host actually *does*. They evolve together — change one side without the other and the protocol drifts.

## Transaction-scoped context IDs

Every `call_id` is transaction-scoped. Resumable contexts are created when a runtime frame starts, retained across interruptions within that frame, and forgotten when the transaction finalizes. Per-transaction reset clears recovery state and counters so no context leaks between independent flows.

A few guarantees follow:

- `call_id` values from one transaction aren't valid in another.
- A context resumes with the exact state it yielded, not a fresh one.
- Resume is root-only in the current runtime flow: nested user code can't call `resume` directly. Only the host drives resume, and only for the `call_id` the host is currently servicing.

Protocol correctness depends on all three holding. Violations show up as call-id confusion or state leakage across frames — both enumerated explicitly in the [security invariants](./security-invariants.md).

## System-runtime envelopes

One more protocol surface lives on top of interruption, specific to system-mode runtimes: the structured envelopes introduced in the [execution model](./execution-model.md). When a system runtime yields or finalizes, its payload isn't an opaque return buffer — it's an envelope that explicitly carries return data, storage diffs, emitted logs, metadata updates, and frame outcomes.

The host decodes the envelope and applies each piece deterministically. Without the envelope contract, the host would have to reconstruct side effects from ad-hoc return bytes — exactly the parser-driven ambiguity consensus-critical code should not have.
