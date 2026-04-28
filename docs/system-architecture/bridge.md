---
title: Bridge Architecture
sidebar_position: 11
---

Fluent's bridge is the two-way interface between the L2 and Ethereum. It carries two kinds of traffic under two different trust models: **deposits** (L1 → L2) are optimistic — they become spendable on the L2 once a rollup batch has consumed them — and **withdrawals** (L2 → L1) are Merkle-proven against the rollup's batch root. The bridge is a family of contracts deployed symmetrically on both chains, layered on top of the [rollup's batch lifecycle](./rollup-architecture.md).

This page describes the bridge at the protocol level: how a cross-chain message travels, where trust resides, and what stops an adversary from compromising either side.

## Layered model

The bridge follows the same three-layer pattern as the rest of the system, deployed symmetrically on each layer.

![Bridge topology across L1 and L2, showing gateways on top of bridge contracts, with L1FluentBridge tied to the rollup and L2FluentBridge reading L1 oracles. Deposit traffic flows L1 to L2 via the sequencer; withdrawals flow L2 to L1 via Merkle proof against the rollup's batch root.](/img/system-architecture/bridge-topology.svg)

**Gateways.** Per-asset entry points. `NativeGateway` bridges ETH. `ERC20Gateway` bridges ERC-20 tokens and drives pegged-token deployment on the receiving chain. Gateways wrap the bridge in token-specific deposit and withdraw semantics, consult optional safety registries (`Blacklist`, `FastWithdrawalList`), and validate that inbound messages came from their paired gateway on the other chain.

**Bridge core.** `FluentBridge` is the shared base; `L1FluentBridge` and `L2FluentBridge` add chain-specific behaviour on top. The core handles message encoding, sequential nonces, per-message status tracking, and the gas-bounded execution of inbound messages via `ExcessivelySafeCall`. Message destinations must be on the bridge's gateway whitelist — both on the send path and on the receive path.

**Settlement integration.** L1FluentBridge owns a FIFO queue of pending L1 → L2 message hashes and a cursor that the rollup's `commitBatch` consumes. It also verifies withdrawals against the rollup's `batchRoot`. L2FluentBridge reads an on-chain `L1BlockOracle` for expiry checks and an `L1GasOracle` for outbound-fee computation.

## L1 → L2: the deposit lifecycle

A user calls a gateway on L1 — typically `NativeGateway.sendNativeTokens(to)` or the ERC-20 equivalent. The gateway checks the blacklist, computes the bridged amount as `msg.value - bridge fee`, and wraps the destination-side receive call as calldata for the paired L2 gateway. It then invokes `L1FluentBridge.sendMessage{value: msg.value}(otherSideGateway, payload)`.

The bridge does four things at send time:

1. Rejects the send if the destination is not on the gateway whitelist (`GatewayNotWhitelisted`).
2. Rejects the send if the rollup is in its corruption state (`RollupCorrupted`) — no new deposits enter a paused rollup.
3. Takes the next nonce, computes `validUntilBlockNumber = block.number + receiveMessageDeadline`, hashes the full message, and emits `SentMessage`.
4. Appends the message hash to `_sentMessageHashes[_sentMessageBack++]` and freezes a per-slot processing deadline: `_sentMessageProcessByBlock[slot] = block.number + depositProcessingWindow`.

Both deadlines — the receive expiry committed into the message hash and the per-slot processing window — are **frozen at send time**. Admin updates to either window parameter afterwards never retroactively affecting messages already in the queue. Each value is either hashed or stored once and never re-read. The `depositProcessingWindow` is bounded at `MAX_DEPOSIT_PROCESSING_WINDOW = 50_400` blocks (~7 days at 12 s/block) and must be strictly greater than zero.

The rollup's sequencer commits batches via `Rollup.commitBatch`. That batch bundles the L2 transactions that execute the queued deposits; on L1, the rollup consumes the corresponding hashes via `consumeNextSentMessage` or `advanceSentMessageCursor`. Persistent semantics apply: consumed slots are not deleted — only the cursor moves forward. If a later `revertBatches` rewinds the rollup, `rewindSentMessageCursor` moves the bridge cursor backward to match, and the replacement batch re-consumes the same hashes.

On L2, `RELAYER_ROLE` calls `L2FluentBridge.receiveMessage(...)`. The bridge enforces the next expected `receivedNonce`, reconstructs the message hash, and refuses duplicates. Then it checks the committed `validUntilBlockNumber` against the latest L1 block number read from `L1BlockOracle`. If the deadline has passed, the bridge marks the message `Failed`, emits `RollbackMessage` (which becomes part of the L2 block's `withdrawalRoot`), and returns without executing. Otherwise it forwards the call to the gateway via `ExcessivelySafeCall`, bounded by `executeGasLimit`. On Fluent L2, native ETH for inbound messages is minted by the chain's consensus layer before execution and burned on failure — the bridge balance is sufficient by protocol invariant.

If execution reverts for any other reason — gateway bug, recipient contract revert, ERC-20 callback failure — the message status becomes `Failed`. Anyone can call `receiveFailedMessage` later to retry, which runs the same flow but with full `gasleft()` instead of the capped limit. The message can transition `Failed → Success` exactly once; it cannot go back to `None`.

## L2 → L1: the withdrawal lifecycle

A user calls a gateway on L2. The gateway checks the blacklist and forwards `msg.value` (including the bridge fee) to `L2FluentBridge.sendMessage`. The bridge charges an outbound fee derived from the L1 gas oracle:

```text
fee = l1GasLimit * ((l1GasPrice * scalar / 1e18) + overhead)
```

The fee transfers to the configured `feeTreasury` in a call that happens *after* the message parameters have been snapshotted — so a malicious treasury can't observe or influence pre-snapshot state. The message hash is emitted in `SentMessage` and becomes part of the L2 block's `withdrawalRoot`, which is itself committed into the rollup's batch root at the next `commitBatch`.

Once the originating batch reaches `Preconfirmed` (TEE-signed, Stage C of the [rollup pipeline](./rollup-architecture.md)) or `Finalized`, a relayer calls `L1FluentBridge.receiveMessageWithProof(batchIndex, blockHeader, ..., withdrawalProof, blockProof)`. The bridge runs two Merkle checks: the block header must be a leaf of the batch's `batchRoot`, and the message hash must be a leaf of the block's `withdrawalRoot`. Any failure reverts with `InvalidBlockProof` or `InvalidWithdrawalProof`.

If the batch is still `Preconfirmed` rather than `Finalized`, the withdrawal enters the **optimistic path**: before releasing funds, the gateway consults the `FastWithdrawalList` rate-cap registry (covered below). If the batch is already `Finalized`, no rate limit applies.

## Gateways

A gateway does three things on top of the bridge:

1. **Owns the token side of the transfer.** Locks on the origin chain, releases or mints on the destination — the exact mechanics depend on the asset and whether it uses a pegged or native representation.
2. **Verifies cross-chain origin.** During an in-flight receive, `bridge.getNativeSender()` returns the address that sent the message on the other chain. Gateways require this to match their configured `otherSideGateway` — otherwise the receive reverts with `MessageFromWrongGateway`. The value is cleared at the end of the receive, so it can't be observed outside an in-flight call.
3. **Delegates to the optimistic-withdrawal gate.** Every gateway receive calls `_consumeLimit(tokenKey, amount)` before releasing funds. The gate is a no-op unless the withdrawal is optimistic.

Only the configured local bridge can call a gateway's receive functions (`onlyFluentBridge`). The bridge's `executeGasLimit` caps gas on first delivery; retries via `receiveFailedMessage` run with the caller's full transaction gas.

Two optional safety registries sit alongside the gateways:

- **`Blacklist`** is a UUPS-upgradeable denylist with an ERC-7201 storage namespace. Gateways consult it on outbound deposits: if either `msg.sender` or the recipient is blacklisted, the gateway reverts with `AddressBlacklisted`. A separate instance is deployed on each chain; `setBlacklistRegistry(address(0))` disables enforcement per gateway.
- **`FastWithdrawalList`** is the rate-cap registry for optimistic withdrawals, described next.

## Optimistic withdrawals and FastWithdrawalList

Preconfirmation gives withdrawals fast user-perceived finality — the batch is TEE-signed, the signing key is PCR0-bound via SP1 — but the batch is not yet cryptographically finalized. A later challenge can revert it. Releasing arbitrary amounts during the preconfirmation window is economically dangerous; releasing them after finalization is not.

`FastWithdrawalList` is a per-chain, per-token rate-cap registry. Admin registers tokens with packed-`uint96` hourly and daily limits. The gateway, acting as `CONSUMER_ROLE`, calls `consumeUsage(token, amount)` on every optimistic-path withdrawal. Rolling windows are keyed by `block.timestamp / 1 hours` and `block.timestamp / 1 days` — a new window resets the counter for that token.

Tokens can alias into a shared bucket: e.g. ETH and WETH registered under one canonical key, so an attacker cannot drain the cap twice by exploiting both parallel gateways. The alias is set by admin via `setAlias` and is enforced at consume time.

The gate in `GatewayBase._consumeLimit` has four states:

| `whitelistEnabled` | Batch status | Result |
|---|---|---|
| `false` | any | no-op |
| `true` | Finalized or no batch context | no-op |
| `true` | Preconfirmed, token **not** registered | revert `FastWithdrawalNotAllowed` |
| `true` | Preconfirmed, token registered | `consumeUsage` (rate-limited) |

The "which batch is my withdrawal from" signal uses EIP-1153 transient storage: `L1FluentBridge.receiveMessageWithProof` writes the originating `batchIndex` into `_currentBatchIndex` for the duration of the receive, and `isCurrentBatchPreconfirmed()` reads it. Transient semantics mean the context auto-clears at transaction end and cannot leak into a subsequent call — no manual reset, no stale state.

The `_whitelistEnabled` toggle is structurally tied to the registry address: `setWhitelistEnabled(true)` reverts if `_fastWithdrawalList` is unset, and clearing the registry (`setFastWithdrawalList(address(0))`) reverts while the whitelist is enabled. The "enabled but no list" misconfiguration is unreachable.

## Safety boundaries

The bridge has several consensus-grade invariants. Breaking any of them is either a protocol error or a path to fund loss.

**Frozen per-message deadlines.** `validUntilBlockNumber` and `_sentMessageProcessByBlock[slot]` are snapshotted at send time. Admin updates to `receiveMessageDeadline` or `depositProcessingWindow` never retroactively affect in-flight messages.

**Deposit liveness signals rollup corruption.** `L1FluentBridge.isOldestUnconsumedExpired()` returns true if the head of the queue missed its processing deadline. The rollup's `isRollupCorrupted()` consults this: if the sequencer stops processing deposits, the rollup halts.

**Permissionless escape hatch — currently pauser-gated.** `skipExpiredDeposits` advances the cursor past expired head slots. It is guarded by `PAUSER_ROLE` in this release and explicitly marked temporary: each skipped slot is a permanently lost deposit until it is replaced by a user-initiated cancel/refund path. The interface comment reads *"TEMPORARY. Each skipped slot represents a permanently lost user deposit until the user-initiated cancel/refund mechanism replaces this function."*

:::warning
`L1FluentBridge.rollbackMessageWithProof` is **not implemented in this release**. It currently reverts with `"NOT_IMPLEMENTED"`. The full flow (chainId guard, two Merkle proofs, ETH refund) is preserved in git history and will be restored in a future release together with the user-initiated cancel/refund path that replaces `skipExpiredDeposits`. Integrators should not assume L1 → L2 message rollback is available today.
:::

**Gateway whitelist is part of message authority.** Both `sendMessage` destinations and receive targets must be on the bridge's gateway whitelist. Deregistering a gateway stops further sends and rejects inbound messages targeting it; outbound messages already enqueued are unaffected.

**Bounded execution.** `ExcessivelySafeCall` caps gas and return-data size on every cross-chain call. No griefing via huge return buffers, no unbounded gas drain. Receive functions use `nonReentrant`, and `to == address(this)` is rejected at both send and receive with `ForbiddenSelfCall` / `InvalidDestinationAddress`.

**Rollup rebind is queue-safe.** `setRollup` reverts with `QueueNotEmpty` if the sent-message queue is non-empty. You cannot point the bridge at a new rollup while deposits are pending — the new rollup would have no knowledge of them.

**One-shot message status.** Each message hash has exactly one terminal outcome per direction. `Failed → Success` is allowed (via `receiveFailedMessage`); `Success → anything` is not. Duplicate receive attempts revert with `MessageAlreadyReceived`.

## Roles and operational expectations

- **`DEFAULT_ADMIN_ROLE`** configures the rollup binding, oracles, gas price config, window parameters, and the gateway whitelist on the bridge.
- **`PAUSER_ROLE`** can pause or unpause the bridge and call `skipExpiredDeposits` on L1.
- **`RELAYER_ROLE`** is the only role allowed to call `receiveMessage` (L2) and `receiveMessageWithProof` (L1). It is not required on the send path — user sends are permissionless through the gateway.
- **Gateways** have their own `Ownable2Step` owners for per-gateway config (blacklist, fast list, remote pairing, bridge address).

A few practical notes for operators:

- `L1BlockOracle` and `L1GasOracle` are liveness dependencies of the L2 bridge. Stale oracles break expiry checks (risk of stranded or prematurely expired messages) and fee calculations. Monitor their freshness.
- `feeTreasury` must accept plain ETH transfers. The L2 outbound fee transfer uses a bare `call` — if the treasury address reverts on receive, `sendMessage` reverts with `FailedToDeductFee` and the user cannot bridge.
- Rotate `RELAYER_ROLE` through the same operational process as the sequencer key. A compromised relayer cannot forge messages (the hash and proofs are public), but it can censor delivery order on L2 by stalling `receiveMessage`.
- UUPS upgrades on the bridges, gateways, and safety registries are consensus-grade in the same sense as runtime upgrades (see [Runtime Upgrade](./runtime-upgrade.md)): deterministic artifacts, multisig authority, and coherent rollout.

## Mainnet addresses

Most bridge contracts use CREATE2 deterministic deployment — the same salt and bytecode produce the same address on L1 and L2. Implementations behind UUPS proxies are upgrade-target infrastructure and are not listed here.

### L1 (Ethereum)

| Contract | Address |
|---|---|
| FluentBridge | `0x9CAcf613fC29015893728563f423fD26dCdB8Ddc` |
| Native gateway | `0x8976Ca4E0c8467097Da675399fB7DB454a1b56dd` |
| ERC-20 gateway | `0xFD4C62647A34FF6d6802092F5fbe176099223B61` |
| Token factory | `0xF6d49E874Cb64b8ee56D6F99BD340134B30AB225` |
| Token factory beacon (UUPS) | `0xdd283a04cc711ab9c08d79e665835821beef710b` |
| WETH gateway (proxy) | `0x1e1f5Df9D48e8E88C037e9255a769e77c9fe587b` |
| FastWithdrawalList (proxy) | `0x3eFc3c84ecf259Da36E33692f2a107A0AB88D30E` |
| Blacklist (proxy) | `0x05C5d46a5e6f92fB9CdA9A8b03E4440A175D1484` |

### L2 (Fluent, chainId 25363)

| Contract | Address |
|---|---|
| FluentBridge | `0x9CAcf613fC29015893728563f423fD26dCdB8Ddc` |
| Native gateway | `0x8976Ca4E0c8467097Da675399fB7DB454a1b56dd` |
| ERC-20 gateway | `0xFD4C62647A34FF6d6802092F5fbe176099223B61` |
| Token factory | `0xF6d49E874Cb64b8ee56D6F99BD340134B30AB225` |
| L1BlockOracle | `0x19e1b30C792E417BC1827f5E2F288052b5c05e8F` |
| L1GasOracle | `0x207FBb4AC5227Ab598B8072BdC1E150dF687AC5B` |
| WETH gateway (proxy) | `0x1e1f5Df9D48e8E88C037e9255a769e77c9fe587b` |

The L2 FluentBridge address coincides with `PRECOMPILE_ROLLUP_BRIDGE` (see [Precompiles](./precompiles/)) — the bridge is genesis-deployed on Fluent via `PRECOMPILE_ROLLUP_BRIDGE_DEPLOYER` using the same CREATE2 salt as the L1 deployment.

Pegged tokens minted by the ERC-20 gateway on Fluent L2 use the [Universal Token runtime](./precompiles/universal-token-runtime.md) (`PRECOMPILE_UNIVERSAL_TOKEN_RUNTIME = 0x0000000000000000000000000000000000520008`) as their implementation — each pegged token is an ownable account pointing at that runtime.

### Operator EOAs

| Role | Address |
|---|---|
| Relayer (`RELAYER_ROLE`) | `0x4A0e88275dC08a15Bad0d12e7805574Ca0853A48` |
| L1BlockOracle submitter | `0xf1af41d33CfFdc8d08107713c0c2DF5De7f2Bd5c` |
| L1GasOracle submitter | `0x1Bee0BD77E76aD9692F6A3b4388DdE371b69fdD7` |
