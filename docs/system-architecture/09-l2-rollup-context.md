---
title: L2 Rollup Context
sidebar_position: 9
---

Fluent architecture should be read in L2-rollup context, not as an isolated VM experiment.

## Rollup framing

At system level, Fluent is positioned as an Ethereum-aligned rollup architecture where:

- execution happens in Fluent’s blended model,
- resulting state transitions are committed in rollup form,
- proving/verification pipeline is a first-class design concern.

## Why blended execution and proving are linked

A key motivation from the tech-book is reducing complexity from proving many isolated nested VM models.

Fluent’s architecture seeks to represent execution under a unified substrate/control model so proving surfaces stay coherent.

In practical terms, this means architecture decisions in runtime routing, interruption, syscall design, and metering are all made with proving constraints in mind.

## Data and proof topics

The tech-book includes dedicated placeholders/chapters for ZK proof system and data availability context.

At this docs level, the safe takeaway is:

- proof/DA strategy is part of architecture constraints,
- execution model is intentionally shaped to be proof-friendly,
- application/runtime interfaces are designed to preserve deterministic replay and verifiable transitions.

## Keep architecture and runtime docs aligned

Because this stack evolves, the most reliable mental model is:

- use tech-book for system intent,
- use current Fluentbase runtime docs for present behavior,
- treat mismatches as versioning drift and resolve in favor of current runtime semantics for implementation-sensitive decisions.
