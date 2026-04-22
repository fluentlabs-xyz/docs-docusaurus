---
title: Upgrades and Security Boundaries
sidebar_position: 8
---

Fluent’s architecture is designed to evolve runtime behavior without treating every runtime change as a full protocol rewrite.

That flexibility exists, but only within strict authority boundaries.

## Runtime upgrade control plane

At architecture level, upgrades follow a privileged path:

1. governance-authorized caller triggers upgrade flow,
2. runtime artifact validation/translation checks are applied,
3. host-enforced upgrade path updates target runtime code,
4. change is visible as consensus-relevant runtime behavior.

Both contract-level permissions and host-level path restrictions are required.

## Why host enforcement is mandatory

Contract checks alone are insufficient for protocol safety.

Host-side enforcement prevents:

- unauthorized runtime replacement,
- invalid upgrade payload application,
- static-context bypasses,
- upgrade path misuse by ordinary execution calls.

## Core security boundaries to preserve

From current Fluentbase security docs, these boundaries are the most architecture-critical:

- routing integrity (runtime resolution cannot drift),
- interruption integrity (call ID / resume correctness),
- static-context immutability for mutating operations,
- bounds-before-allocation for untrusted lengths,
- deterministic syscall semantics,
- strict upgrade authority boundaries.

## Typical failure classes

Most critical failures in this architecture are not ordinary business-logic bugs; they are boundary violations, for example:

- cross-runtime metadata mutation bypass,
- interruption context confusion,
- inconsistent gas/fuel settlement,
- malformed envelope decode leading to wrong side-effect commits,
- weakly constrained upgrade entry points.

## Operational posture

Because runtime updates are consensus-sensitive:

- release process must be deterministic,
- upgrade artifacts and hashes must be auditable,
- network rollout must be coordinated,
- post-upgrade checks must validate expected routing and execution behavior.

In short: Fluent supports runtime evolution, but treats upgrade machinery as high-trust critical infrastructure.
