---
title: Rollup Architecture
sidebar_position: 10
---

Fluent is an Ethereum-aligned L2 rollup. Every block produced on Fluent eventually settles to Ethereum under a cryptographic integrity story, and the way that story is composed — fast preconfirmation plus slow cryptographic adjudication — is what makes the chain usable and safe at the same time.

This page describes the verification pipeline at the protocol level: how batches are committed, how data is made available, how execution is preconfirmed, how disputes are resolved, and how the system halts itself when something breaks. Running a node isn't covered here; see the node runbook in the upstream `fluentbase/docs`.

## Shared state, execution-agnostic settlement

Blended execution — EVM, Wasm, and (soon) SVM contracts sharing one state machine — is documented in [Blended 101](../knowledge-base/blended-101.md). What matters for settlement is that Fluent verifies rollup commitments over **block headers and batch Merkle roots**, not over VM-specific execution traces. Adding a new execution environment doesn't change what the rollup proves; it changes what fits into a block the rollup already knows how to settle.

Each batch is a sequential record identified by a root, a block span, a declared block count, an expected blob count, and timing windows for each phase. Verification parameters are frozen per batch at commit time, so retroactive governance edits can't change the security conditions of an in-flight batch.

## Not pure optimistic, not pure validity

Two well-known models sit on either side of what Fluent does.

**Optimistic rollups** accept state transitions on the assumption that they're correct and rely on economic challenges to catch faults within a dispute window. They're cheap and fast in the happy path, but the dispute window dominates user-perceived finality.

**Validity (ZK) rollups** require a succinct proof for every state transition before accepting it. Security is purely cryptographic at the transition level, but proving cost and latency are non-trivial, and prover decentralization is a hard open problem.

Fluent is an **optimistic-ZK hybrid**. Batch commitment and data publication are fast. A TEE-based preconfirmation gives users rapid execution attestations and is the prerequisite for any batch to finalize. Challenges are economically bonded and resolved with SP1-backed proofs. A preconfirmed batch finalizes after a configured delay by default, or sooner if every block in it has been proven through dispute resolution. Users experience optimistic throughput; adversarial operation gets cryptographic adjudication.

## The five-stage verification pipeline

![Five-stage rollup verification pipeline: commitBatch, submitBlobs, preconfirmBatch, then finalizeBatches on the happy path; if disputed, challenge contracts resolve via SP1 proof into finalizeWithProofs, or the chain halts under rollupCorrupted and revertBatches.](/img/system-architecture/rollup-pipeline.svg)

### Stage A — Batch commitment

The sequencer commits a batch by calling `commitBatch` with:

- the batch root,
- block-span continuity — `fromBlockHash` of the first block and `toBlockHash` of the last,
- the declared number of blocks,
- the expected blob count,
- deposit-consumption metadata.

The contract enforces continuity across batches: the previous batch's `toBlockHash` must match the new batch's `fromBlockHash`. It records the block at which the commit happened, snapshots all timing windows in effect, and anchors the bridge sent-message cursor (`sentMessageCursorStart`) so an emergency revert has a deterministic rollback target.

### Stage B — Blob publication and DA binding

`submitBlobs` records EIP-4844 versioned blob hashes using the `blobhash` opcode. Blobs can be posted incrementally, but the batch only transitions from **Committed** to **Submitted** when the total submitted hash count equals the `expectedBlobs` value declared at commit time.

The effect is a strong data-availability binding: on-chain adjudication is keyed to immutable blob hashes. Compression and serialization happen off-chain, but every downstream step — preconfirmation, challenge, resolution — is parameterized by the exact blob hash vector stored on-chain. Data published to the L1 blob store is what the protocol adjudicates over, and nothing else.

The enclave itself is network-isolated and doesn't see what the host actually publishes on Ethereum. It receives the canonical batch payload from the host, decompresses it, cross-checks the decoded block hashes against the STF execution result, and computes the EIP-4844 commitments over the raw blob bytes itself — deriving its own versioned-hash vector rather than trusting anything the host might claim. The SP1 guest follows the same procedure during dispute resolution (Stage D), so Nitro and SP1 produce the same hashes from the same canonical data.

That vector is bound into the preconfirmation signature (Stage C). If a malicious host feeds the enclave honest data but publishes *different* blobs on L1, the on-chain `blobhash` values won't match the ones signed over, signature recovery returns an address that is not in the attested-key whitelist, and the contract rejects the batch. The DA loop closes on that equality: on-chain adjudication, TEE signing, and ZK proving all key to the same derived hashes.

### Stage C — TEE preconfirmation

`preconfirmBatch` accepts an ECDSA signature from a whitelisted AWS Nitro enclave over a digest that binds four things: the L1 chain id, the `NitroVerifier` contract's own address, the batch root, and the versioned blob-hash vector the enclave derived in Stage B. The digest is `sha256(abi.encode(chain_id, verifier_address, batch_root, versioned_hashes))`. The chain id and contract fields rule out replay across chains and across contracts; the batch-root and hash-vector fields tie the signature to a specific batch and its specific blobs.

The signing key behind that signature never exists on disk. It's derived entirely inside the enclave's RAM from two independent entropy sources — a hardware secret bound to the specific Nitro instance, and a KMS-decrypted blob whose decrypt role is scoped to the enclave's live attestation — mixed into a single key through HKDF. AWS Nitro physically blocks reads of enclave RAM from the host, including from the host's root user, so the derived key cannot be extracted or mirrored. The matching public key is embedded in the enclave's attestation document (signed by the AWS Nitro root key) and reaches L1 only through the proof flow described below.

The Nitro verifier contract runs a two-phase filter on admitted signing keys:

- **Attestation phase.** The enclave-derived public key is admitted only after an SP1 proof verifies the enclave's attestation. Public outputs of that proof include the pubkey and an attestation timestamp, and a bounded freshness window stops stale attestations from being replayed.
- **Batch-signature phase.** Only attested public keys are allowed to authorize batch signatures. The whitelist is maintained by governance; keys can be rotated or revoked.

Fluent doesn't accept an arbitrary attester key. A key has to pass attestation verification before it's admitted, and the attestation is cryptographically bound to the expected enclave image measurement (PCR0) via the SP1 proof.

#### PCR0-bound key verification

The enclave's signing identity isn't trusted on submission. The attestation pipeline verifies a statement whose public outputs include the enclave-derived pubkey and the attestation timestamp, and the SP1 proof is checked against the attestation program key before the pubkey is admitted for batch-signature checks. The sequence:

1. The enclave session derives a signing identity entirely inside its RAM, as in Stage C.
2. Attestation evidence binds that identity to the enclave image's PCR0 measurement.
3. An SP1 proof validates the attestation statement on-chain against a verification key pinned in the `NitroVerifier` contract.
4. Only then is the pubkey accepted for batch-signature use.

If an enclave image is modified outside the expected measurement, the attestation proof fails validation under the configured verification key, and the signer is never admitted. Preconfirmation signatures are grounded in a measured enclave context, not in an arbitrary off-chain key registration.

#### The identity chain: source to on-chain verification key

"PCR0-bound" is load-bearing only if the measurement can be tied back to reviewable source. The design's fundamental axiom is **source code = PCR0**: a hermetic build pipeline guarantees that an unchanged source tree compiles to the same PCR0 hash regardless of who's building it. That turns a measurement into a reproducible commitment to a specific audited codebase, not just to whatever binary happened to boot.

From there the identity chain closes in four steps:

1. The release build compiles the enclave image and computes its PCR0.
2. That PCR0 is automatically injected into the attestation-validator source, per network.
3. SP1 compiles the validator, producing a verification key that uniquely identifies that compiled program.
4. The `NitroVerifier` contract pins that key. Swapping the validator — for example, removing the PCR0 check — changes the key and is rejected on-chain.

The consequence: a valid attestation proof is cryptographically bound to a specific audited enclave image, which is bound to its source. Read end to end, the chain of trust is that the contract accepts the pubkey because the proof attested that PCR0 matches; PCR0 guarantees the expected STF code is what's running; that code signs only correctly computed state roots; and because the signing key cannot be extracted from hardware, a valid signature from it is an unforgeable claim that the STF executed honestly.

### Stage D — Challenge and ZK resolution

Fluent exposes two dispute objects:

- `challengeBatchRoot` — disputes the batch root itself.
- `challengeBlock` — disputes a specific block inside a batch.

Both require the exact challenger deposit and must arrive within challenge-window deadlines derived from the per-batch snapshots recorded at commit time. A challenged batch transitions to **Challenged**. For block-level disputes, commitments are verified against the committed batch Merkle root; for batch-root disputes, linkage to the previous batch's tail block is checked.

Resolution uses proof-backed validation:

- `resolveBlockChallenge` verifies the SP1 proof against the challenged block, its header, and the batch's blob hash context.
- `resolveBatchRootChallenge` verifies block-header chain consistency and recomputed batch-root agreement.

What the proof actually certifies over a disputed block is a four-part statement:

1. The State Transition Function ran step-by-step and produced the claimed block hash.
2. That block is physically present in the supplied blob data.
3. The supplied data strictly matches the EIP-4844 commitments — substitution or truncation of the transaction batch is mathematically impossible.
4. The proof's public values include the versioned blob hashes derived from those commitments, and the resolver contract checks them against the real on-chain values recorded in Stage B.

The public-values layout is a flat buffer carrying, in order, the block's parent hash, the block hash itself, a withdrawal-root hash, a deposit-root hash, and the versioned blob hashes. The resolver assembles this buffer from the prover-supplied header and the blob-hash vector recorded on-chain in Stage B, then passes it to the SP1 verifier against the pinned program verification key. The ZK circuit's committed public values must match the supplied buffer byte-for-byte, binding the proof to that exact header and to the on-chain blob-hash vector. That equality closes the symmetric-DA loop: Nitro and SP1 derive the same blob hashes from the same canonical data, the contract supplies the on-chain vector to the SP1 check, and a disagreement at any layer aborts resolution.

Economic flows use a pull pattern. When a prover successfully resolves a challenge, the challenger's deposit accrues to the prover's reward balance, claimable via `withdrawProofReward`. In emergency-revert paths, the challenger's deposit is credited back along with a configured incentive fee, claimable via `withdrawChallengerReward`.

:::info
Challenge initiation is currently role-gated — only specific operational participants can open disputes. This is a temporary trust configuration. The target end-state is permissionless challenge access where any qualified participant can trigger dispute resolution under the same proof rules.
:::

### Stage E — Finalization modes

Two finalization paths exist, and which one applies depends on what's happened to the batch:

- **`finalizeBatches`** (delay-based) — the default. Finalization is strictly sequential: the contract advances the finalization cursor one batch at a time, stopping at the first batch whose `finalizationDelay` has not elapsed or whose status is not `Preconfirmed`. No gaps, no out-of-order finalization.
- **`finalizeWithProofs`** (proof-gated) — accelerated. Once every block in a batch has been resolved via SP1 proof, the batch can finalize without waiting for the remainder of `finalizationDelay`. Because a block is marked as proven only through successful challenge resolution, this path applies to batches that went through the dispute pipeline, not as a fast-track for unchallenged ones.

## Corruption detection and safety halt

Fluent treats certain protocol violations as reasons to stop making forward progress. The corruption-detected state is a first-class safety gate, and it fires when either:

- the bridge's deposit-liveness indicator shows the oldest unconsumed message has expired, or
- the oldest non-finalized batch exceeds the deadline of its current phase (blob submission, preconfirmation, or challenge resolution).

The emergency role can call `revertBatches` to undo non-finalized batches, rewind the bridge consumption cursor, clean challenge and proof state, and re-open safe progress from a deterministic index. The corrupted state is the intended trigger, though the function itself accepts any non-finalized batch range. The design explicitly favors safety over liveness: if invariants have been violated, the chain halts state-changing progress until operators intervene.

## Roles and trust model

Fluent's rollup is operated by a set of explicit roles, each with a scoped responsibility:

- `SEQUENCER` — orders transactions and commits batches.
- `PRECONFIRMATION` — produces TEE-backed preconfirmation signatures.
- `CHALLENGER` — initiates disputes (currently role-gated; target end-state is permissionless).
- `PROVER` — produces SP1 proofs to resolve disputes and to gate fast finalization.
- `EMERGENCY` — can trigger revert flows under the corruption conditions above.
- `admin` / upgrader — governs the contract set itself.

"No centralized override over the state transition function" is not the same as "zero trust." Fluent reduces unilateral-override risk by combining immutable batch and data commitments, bonded adversarial participation in challenges, cryptographic proof verification for disputed transitions, and explicit role separation — but governance and role-based trust in upgrade and emergency controls remain part of the model. The accurate framing is **structured, compartmentalized trust with cryptographic fault containment**, not trustlessness.

## Economic framing

The pipeline is designed to exploit cheap data availability (EIP-4844 blobs) while keeping dispute-grade verification available on demand. In steady state, marginal transaction cost is low because expensive proof generation is shifted to adversarial or accelerated paths rather than required for every block up front.

From a systems perspective, Fluent aims for a Pareto surface:

- **optimistic throughput and low UX latency** in normal operation,
- **cryptographic recoverability and challenge enforceability** under fault,
- **deterministic rollback** when safety invariants are violated.

For users, this is a rollup that feels fast in the happy path and audits cleanly under pressure. For protocol engineers, it's a template for composing TEE liveness with ZK correctness without collapsing into pure trust on one side or pure proving on the other.
