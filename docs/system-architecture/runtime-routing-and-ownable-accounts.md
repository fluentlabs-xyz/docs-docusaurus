---
title: Runtime Routing and Ownable Accounts
sidebar_position: 3
---

Fluent hosts multiple execution environments on one state machine without duplicating runtime logic for every account. It does that by separating two things most chains conflate: **who owns the state** and **which engine runs the code**. An account always owns its storage, but its executable behavior is delegated to a runtime picked at deployment.

This routing mechanism — ownable accounts — is what makes cross-VM composability work. A Solidity contract and a Rust contract end up in the same state trie, each with isolated storage, calling each other atomically, but each executed by the runtime that knows how to interpret its bytecode.

## The ownable account format

Every contract deployed on Fluent lives in an account whose code field is an **ownable-account wrapper**. The wrapper carries three things:

- a **magic and version header** identifying the account as runtime-owned,
- an `owner_address` — the delegated runtime that should execute this account,
- **runtime metadata** bytes — context the runtime needs to interpret the account (original bytecode, compilation flags, class markers, anything runtime-family-specific).

`owner_address` is the load-bearing field. When a call targets this account, REVM doesn't load code from the account itself. It loads code from the owner, and forwards the call into that delegated runtime with the account as the state target.

## Create-time routing

Which runtime owns a new account is decided at deployment. When init code arrives, the routing layer inspects the leading bytes for a magic prefix and picks a runtime accordingly:

| Init code prefix | Delegated runtime |
|---|---|
| Wasm / rWasm magic | Wasm delegated runtime |
| SVM ELF payload *(feature-gated)* | SVM delegated runtime |
| `UNIVERSAL_TOKEN_MAGIC_BYTES = 0x45524320` (`"ERC "`) | Universal Token runtime |
| Anything else | Delegated EVM runtime |

Two things happen next. The new account's code is set to the ownable-account wrapper pointing at the chosen runtime, and the original init payload is passed to the delegated runtime for whatever deploy-time logic that runtime defines — constructor execution, storage initialization, role assignment.

After that, the account's execution class is frozen. There's no later toggle that switches a Solidity contract to the Wasm runtime. Ownership is established at deploy and is part of the account's identity.

## Execution-time behavior

When a routed account is called during a transaction:

1. REVM sees the call target is an ownable account.
2. It reads `owner_address` from the wrapper.
3. It loads the delegated runtime's code from that owner address.
4. It keeps the original callee as the **state target** — storage reads and writes hit the callee's slots, not the runtime's.
5. It forwards the call input to the delegated runtime.

The delegated runtime executes the account's logic from there. It can read and write the callee's storage, emit logs under the callee's address, and yield to the host for privileged operations like any other runtime frame.

That's why many accounts can share one runtime implementation without leaking state between them: runtime code loads from the owner, but the storage domain is always the called account.

## Direct calls to delegated runtime addresses are blocked

An obvious attack is to target the delegated runtime address directly and skip the wrapper. If a user could call `owner_address` like a regular contract, they could execute runtime logic in the runtime's own storage domain instead of an ownable account's.

The execution path rejects this. Delegated runtime addresses aren't callable as normal contracts; the router forces user-facing flows to go through an ownable account.

:::warning
A call that targets a delegated runtime address directly is rejected at execution time. User flows must go through an ownable account, not bypass it. This is a consensus-safety boundary, not a UX preference.
:::

## Metadata ownership rules

The runtime metadata attached to an ownable account is mutable, but only by the runtime that owns the account. When a runtime frame tries to mutate metadata on a target account, two checks run:

1. The target must be an ownable account.
2. The target's `owner_address` must match the caller's delegated runtime.

If either check fails, the operation is rejected. That keeps one runtime family — say, the EVM runtime — from rewriting metadata on accounts owned by another family like the Wasm runtime. It's the mechanism that stops cross-runtime privilege bugs from becoming cross-runtime state corruption.

Static-context mutations — anything invoked from a `STATICCALL` frame — are rejected for metadata operations regardless of ownership.

## The Wasm-wrapper deploy rewrite

One special path worth knowing about if you're auditing the deployment flow. The Wasm runtime's deploy output can contain a compiled rWasm payload followed by a constructor tail. In that case, the deployed code is rewritten: the account's code is set to the compiled rWasm bytecode directly, not to the ownable-account wrapper, and the constructor tail runs with the remaining deployment parameters.

This supports Wasm-wrapper deployment flows where the final on-chain representation is the compiled artifact rather than a pointer to a delegated runtime. From an execution-semantics perspective the account is still routed consistently; the rewrite is a storage-level detail.

## Why this model

Three things fall out of ownable-account routing:

**Shared runtime logic without per-account duplication.** One delegated Wasm runtime executes every Wasm contract. Fixing a bug or upgrading behavior happens in one place, not per-deployment.

**Deterministic dispatch by owner.** Given an account's wrapper, the execution engine is decidable in constant time. The router reads one field.

**Cross-environment composability over shared state.** A Solidity contract and a Rust contract are two ownable accounts pointing at two different delegated runtimes. They call each other, they share the state trie, and the host mediates every operation between them with the same rules.
