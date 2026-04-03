---
title: Interruption and Syscall Architecture
sidebar_position: 4
---

Interruption is one of Fluent’s defining mechanisms.

It exists because runtime code should not directly perform every privileged or shared-state operation.

## The `exec` / `resume` handshake

At a high level:

1. runtime executes,
2. runtime requests host intervention (interruption),
3. host handles requested operation,
4. runtime resumes with result,
5. repeat until final exit.

This creates a deterministic boundary between:

- execution logic in runtime,
- authority logic in host/REVM layer.

## Why interruption exists

Some operations need centralized host control, such as:

- frame orchestration,
- privileged account/state access,
- validated state mutations,
- protocol-enforced checks.

Interruption avoids embedding all of those directly into application runtime execution paths.

## Two syscall layers

Fluentbase docs describe two related syscall surfaces:

### A) Runtime import layer

The runtime imports a defined namespace of system bindings (I/O, context, hashing/crypto, control, nested execution, fuel helpers, etc.).

This is what contracts/runtimes call.

### B) Host interruption syscall-ID layer

Host handlers process interruption payloads with protocol-level semantics (storage access, call/create flows, metadata operations, runtime-governed actions, etc.).

This is where consensus-critical validation and charging behavior lives.

## Determinism requirements

Interruption handlers must stay deterministic across nodes:

- input validation,
- static-context handling,
- charging order,
- output encoding,
- error mapping,
- ownership checks.

Changing these casually is not a “refactor”; it is a protocol change.

## Call IDs and resumable contexts

Resumable context IDs are transaction-scoped protocol objects, not convenience IDs.

Safety expectations include:

- correct association of resume data with call ID,
- proper lifecycle reset per transaction,
- no state leakage across independent execution flows.

## System-runtime structured envelopes

For system runtime paths, output is transported in structured envelopes so host can safely and deterministically apply:

- return values,
- logs,
- storage effects,
- metadata updates,
- frame outcomes.

This envelope contract is a critical part of host/runtime interoperability.
