---
title: Runtime Upgrade
sidebar_position: 7
---

Fluent's delegated runtimes — the EVM runtime, the Wasm runtime, the Universal Token runtime, and others — are protocol-owned bytecode. They decide how every ownable account in their class behaves. Fixing bugs and evolving behavior in those runtimes without a full node rewrite is a design goal. Making absolutely sure no one else can do it is another.

Runtime upgrade is the privileged control plane for this. It's tightly constrained on every axis — who can call it, through what path, with what payload — because an unconstrained upgrade is a total compromise of the chain.

## The upgrade flow

A runtime replacement goes through five steps:

1. The **governance owner** (an externally held key or multisig) calls the runtime-upgrade contract.
2. The contract **validates** the proposed Wasm artifact and **compiles** it to rWasm.
3. It invokes the **native upgrade syscall**, passing the target runtime address and the serialized rWasm module.
4. The **host** verifies the caller arrived through the upgrade precompile's execution path and installs the new code at the target address.
5. An **upgrade event** is emitted with the target, a genesis reference, and the new code's hash.

The separation matters. Steps 1 and 2 are a contract the governance owner talks to. Step 3 is a syscall that contract is allowed to invoke. Step 4 is host enforcement, which exists precisely because contract-level authorization alone can't guarantee protocol safety. If an attacker found a way to call the upgrade syscall from somewhere that wasn't the upgrade precompile, step 4 is what rejects it.

## Contract-level controls

The upgrade contract exposes a minimal surface:

- `upgradeTo(...)` — the main entry. Only the owner can call it. The argument is the target runtime address plus the new artifact.
- `changeOwner(...)` — transfers ownership. Assigning the zero address is rejected — there's no valid "burn the key" result from this path.
- `owner()` — returns the current owner.
- `renounceOwnership()` — sets the owner to a designated system address, effectively freezing upgrades through the owner-based path while leaving a deterministic default.

A default-owner fallback is defined for the unset state, so the contract always has a well-formed owner to check against.

## Host-side enforcement

The upgrade syscall handler runs its own checks on top of whatever the contract enforces:

- **Not callable in static context.** A `STATICCALL` frame can't trigger an upgrade, full stop.
- **Only reachable via the runtime-upgrade precompile's execution path.** The host checks which address the call came from and rejects anything that didn't arrive through the precompile.
- **Payload must decode correctly.** Malformed inputs are rejected before any state change.
- **Bytecode must be a valid rWasm payload.** Validation happens before installation — the runtime executor is never asked to load garbage.
- **Installation is deterministic.** The target account is loaded, its code field is replaced with the new bytecode, and the change commits in one host action. There's no multi-step install path where a partial update could leave the runtime undefined.

Host-level checks are what make the overall system safe. Contract-level permissions alone would let a bug in the upgrade contract compromise every delegated runtime on the chain. The host rejects any attempt that didn't arrive through the one blessed execution path, regardless of contract state.

:::warning
Runtime upgrade changes consensus behavior. Every upgrade is fork-critical change management: deterministic artifacts, coherent network rollout, and post-upgrade verification are not optional.
:::

## The legacy testnet hook

One carveout worth knowing about. A chain-id-gated legacy upgrade path exists for historical testnet behavior. It's temporary — documented as such — and should be read as compatibility debt rather than part of the target architecture. Mainnet doesn't use it; auditors should trace it but treat it as out-of-scope for the target security model.

## Operational expectations

Upgrading a runtime isn't like deploying a contract. A runtime change affects every account in that runtime's class retroactively, which means every user of the chain lives with the consequences. Treat every upgrade as fork-critical change management:

- Produce **deterministic build artifacts** so the artifact installed on chain is byte-identical to what was audited.
- Use **multisig or operator quorum** on the governance owner. A single key with unilateral upgrade authority is a single point of failure.
- **Roll out coherently** across nodes. A chain where some nodes have upgraded and others haven't is a chain that will fork.
- **Verify post-upgrade.** Check the installed code hash against the expected artifact. Run smoke tests against runtime behavior. Confirm events fired with the expected metadata.
- **Keep an audit trail.** Who proposed, who approved, who triggered, what was installed, what the hash was. On-chain events help; the operational record matters too.

Runtime extensibility is intentional. It's also one of the most sensitive pieces of infrastructure on the chain, and it should be operated accordingly.
