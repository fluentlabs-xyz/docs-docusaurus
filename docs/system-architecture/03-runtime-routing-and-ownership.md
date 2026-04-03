---
title: Runtime Routing and Ownership
sidebar_position: 3
---

Fluentbase separates two concerns that are often conflated:

- **account identity/state**, and
- **execution engine selection**.

## Ownable-account routing model

In Fluent’s architecture, account execution can be delegated through ownership/runtime metadata.
That lets many accounts share runtime logic while preserving per-account state isolation.

Why this matters:

- avoids per-account runtime duplication,
- makes runtime families explicit,
- gives deterministic dispatch behavior.

## Create-time runtime selection

At deployment time, constructor payload format/prefix and routing rules determine the runtime class.

Examples from current Fluentbase architecture include routed paths such as:

- EVM/default delegated runtime,
- runtime-specific routed deploy paths (for supported formats),
- specialized runtime paths (for example universal token runtime pattern).

Once created, account execution follows that routing model consistently.

## Execution-time behavior

When a routed account is called:

- delegated runtime logic is used for execution,
- account-local state remains attached to the called account,
- host/REVM maintains authoritative commit semantics.

This is how Fluent gets “shared runtime logic + isolated account state” simultaneously.

## Direct-runtime call policy

Runtime-owner addresses are not intended to be regular user-facing contracts.
By design, user execution should go through routed account semantics, not bypass routing invariants via direct runtime-owner invocation.

## Metadata and ownership boundaries

Metadata-changing operations are ownership-scoped.
A runtime family must not freely mutate metadata for accounts owned by another runtime family.

This boundary is part of consensus safety: incorrect ownership checks can become cross-runtime privilege bugs.

## Architectural connection to composability

Routing and ownership are what make cross-EE composability feasible without losing determinism:

- calls remain in one shared state space,
- each account still has clear execution semantics,
- host maintains invariant checks at interruption/syscall boundaries.
