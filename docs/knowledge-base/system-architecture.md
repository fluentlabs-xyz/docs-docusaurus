---
title: Fluent System Architecture
sidebar_position: 3
---

Fluent is built as a **blended execution** system: different execution environments can coexist behind one shared state machine and one proving-oriented runtime model.

This page is a practical architecture map based on:

- the `fluentlabs-xyz/tech-book` architecture chapters, and
- current Fluentbase runtime docs (`fluentbase/docs/*`).

When older tech-book wording and current runtime behavior diverge, this page follows current Fluentbase behavior.

---

## 1) Big picture

At a high level, Fluent has three layers:

1. **Node/consensus shell** (modified Reth stack): transaction/block pipeline, networking, RPC, and chain integration.
2. **Execution coordination layer** (REVM integration + host): frame lifecycle, journal/state commit rules, privileged host operations.
3. **Runtime execution layer** (rWasm-based runtime model): contract logic execution, runtime dispatch, and resumable interruption flow.

The key design choice is that **execution** and **state commitment** are deliberately separated:

- runtimes execute logic and can yield,
- host/REVM performs authoritative stateful operations,
- final effects are committed deterministically.

---

## 2) Blended execution model

Traditional multi-VM designs often keep separate VM engines with explicit cross-VM bridges.
Fluent’s architecture instead centers on one execution substrate and shared state semantics.

In practice:

- applications from different VM ecosystems are represented through Fluent runtime routing,
- they share one address/state space,
- composability is native and synchronous at execution time.

This is the architectural reason Fluent emphasizes **blended execution** rather than “many isolated VMs in one node.”

---

## 3) Runtime routing via ownable accounts

Fluentbase uses an ownable-account model to decide **which runtime executes an account**.

Conceptually:

- account identity and account state remain local to that account,
- execution engine is selected by owner/runtime routing,
- many accounts can share the same runtime implementation safely.

Create-time routing determines runtime class (for example EVM/default path, and other runtime-specific paths via constructor format/prefix rules).

Execution-time behavior then loads delegated runtime logic while preserving account-specific state isolation.

This is the core mechanism that enables one state machine to host multiple EE styles without per-account VM duplication.

---

## 4) Interruption protocol (`exec` / `resume`)

Fluent runtimes are not treated as all-powerful engines.
When runtime code needs host-authoritative work (stateful/privileged operations), execution uses interruption:

1. runtime executes,
2. runtime yields with interruption metadata,
3. host processes the requested action,
4. runtime resumes from saved context,
5. flow continues until final exit.

Important properties:

- resumable contexts are transaction-scoped,
- call IDs are protocol-significant,
- host remains final authority for sensitive transitions,
- deterministic resume behavior is required for consensus safety.

This protocol is one of the most important architecture differences from simpler “single engine call” models.

---

## 5) Syscall architecture (two layers)

Fluentbase separates syscall concerns into two related surfaces:

- **Runtime import layer**: what contracts/runtimes can call through the import namespace.
- **Host interruption syscall IDs**: host-side operation handlers used during interruption processing.

Why this matters:

- API shape and fuel rules at the import layer affect runtime compatibility,
- handler semantics at host layer affect consensus behavior,
- both must evolve in lockstep.

---

## 6) Dual metering: gas and fuel

Fluent keeps both:

- **gas** (EVM-visible economics), and
- **fuel** (runtime execution accounting).

These are linked by deterministic conversion (currently documented as `FUEL_DENOM_RATE = 20`).

Operationally:

- runtime runs under fuel limits derived from remaining gas,
- consumed/refunded fuel is translated back into gas settlement,
- conversion behavior is part of protocol consistency.

So metering is not cosmetic; it is a core architecture contract between runtime and host.

---

## 7) System runtimes and structured envelopes

Fluent distinguishes regular contract execution from selected system/runtime paths.
For system runtime flows, output is carried in structured envelopes so host can deterministically apply:

- return payload,
- storage/log effects,
- metadata transitions,
- frame/continuation outcomes.

This envelope discipline is essential for correctness when execution is resumable and host-mediated.

---

## 8) Upgrade architecture

Fluent supports privileged runtime upgrades through a constrained control plane.

Design intent:

- allow runtime evolution without repeated hard-fork style node rewrites,
- keep authority and execution-path checks explicit,
- enforce host-side validation and routing restrictions for upgrade calls.

In other words, runtime extensibility is intentional, but bounded by strict governance and host enforcement.

---

## 9) Security and consensus boundaries

From an architecture perspective, the highest-risk boundaries are:

- runtime routing integrity,
- interruption/resume integrity,
- static-context immutability enforcement,
- bounds-before-allocation in host paths,
- syscall semantic determinism,
- upgrade authority boundaries.

Most critical bugs in this type of system come from violating one of those boundaries, not from ordinary application logic.

---

## 10) Practical mental model

If you need one sentence:

**Fluent is a host-governed, interruption-driven, rWasm-centered blended execution architecture where multiple EE styles share one state machine under deterministic routing, metering, and commit rules.**

That model matches the tech-book architecture goals while aligning with current Fluentbase runtime docs and implementation direction.
