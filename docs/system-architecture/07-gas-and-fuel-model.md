---
title: Gas and Fuel Model
sidebar_position: 7
---

Fluent architecture uses two accounting units:

- **Gas** for Ethereum-visible economics,
- **Fuel** for runtime execution accounting.

## Why two units

Different runtime paths and host operations need a uniform internal accounting model, while external users still expect gas semantics.

Fuel is the internal execution meter; gas remains the external economic meter.

## Deterministic conversion contract

Fluentbase currently documents a fixed conversion linkage (`FUEL_DENOM_RATE = 20`).

Architecture-level implication:

- conversion rules are protocol-sensitive,
- rounding/settlement behavior must stay deterministic,
- changing conversion semantics is effectively fork-level behavior change.

## Settlement flow

During execution/resume cycles:

1. host derives runtime fuel budget from remaining gas,
2. runtime executes and reports consumed/refunded fuel,
3. host maps fuel deltas back into gas settlement,
4. final interpreter/journal accounting is committed.

This is where runtime work and EVM-visible economics are reconciled.

## Import-level fuel schedules

System imports are associated with explicit charging procedures (constant/linear/quadratic style depending on operation type).

This prevents undercharging expensive paths and keeps runtime cost model transparent and deterministic.

## Runtime-family metering differences

Some runtime paths are self-metered while others are engine-metered by policy.

Architecturally, this means metering policy is part of runtime classification and not a single universal behavior for all paths.

## Why this matters for architecture

Metering is not a minor implementation detail:

- it constrains runtime API design,
- it affects DoS resistance,
- it impacts proving and execution economics,
- it is part of consensus correctness.
