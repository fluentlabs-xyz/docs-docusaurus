---
title: Runtime Upgrade Precompile
sidebar_position: 4
---

The contract-side of Fluent's runtime upgrade flow. The conceptual mechanism — governance owner, host enforcement, the privileged syscall — is documented in [Runtime Upgrade](../runtime-upgrade.md).

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_RUNTIME_UPGRADE` | `0x0000000000000000000000000000000000520010` |

## Authority

| Constant | Default address |
|---|---|
| `DEFAULT_UPDATE_GENESIS_AUTH` | `0xa7bf6a9168fe8a111307b7c94b8883fe02b30934` |

The owner is initialized to the default at genesis. Live networks rotate it to a multisig immediately — treat the default as a starting point, not the current value. The contract reads its stored owner first and falls back to the default only when the slot is zero. Ownership transfer goes through `changeOwner(address)` (zero-address rejected); `renounceOwnership()` sets the owner to the system address (`0xfffffffffffffffffffffffffffffffffffffffe`), freezing future upgrades through the owner-based path.

## Interface

Solidity-style 4-byte selector dispatch.

```solidity
function upgradeTo(address target, uint256 genesisHash, string genesisVersion, bytes wasmBytecode) external;
function changeOwner(address newOwner) external;
function owner() external view returns (address);
function renounceOwnership() external;
```

The function selector for `upgradeTo` is published as a constant:

```text
UPDATE_GENESIS_PREFIX = 0x288fb3b8 = keccak256("upgradeTo(address,uint256,string,bytes)")[:4]
```

`upgradeTo` validates the input WASM starts with the WASM magic preamble, compiles it to rWasm via `compile_rwasm_maybe_system`, invokes `SYSCALL_ID_UPGRADE_RUNTIME` with the target address and serialized rWasm, then reads the installed code hash and emits `RuntimeUpgraded`. Failure at any step panics with a specific message that surfaces as an EVM revert — see Errors.

## Events

```solidity
event RuntimeUpgraded(address indexed targetAddress, bytes32 indexed genesisHash, string genesisVersion, bytes32 codeHash);
event OwnerChanged(address newOwner);
```

`RuntimeUpgraded` is emitted on every successful `upgradeTo` after the host installs the new bytecode at `targetAddress`; `codeHash` is the hash of the installed bytecode. `OwnerChanged` is emitted by `changeOwner` and `renounceOwnership`.

## Errors

All failure paths use Rust `panic!` and surface as EVM revert. Messages:

- `runtime-upgrade: incorrect caller`
- `runtime-upgrade: malformed wasm bytecode`
- `runtime-upgrade: failed to compile bytecode`
- `runtime-upgrade: failed to upgrade`
- `runtime-upgrade: can't obtain code hash`
- `runtime-upgrade: can't set owner to zero address`

## Routing note

`PRECOMPILE_RUNTIME_UPGRADE` is not in `EXECUTE_USING_SYSTEM_RUNTIME_ADDRESSES`. The contract is pre-deployed at genesis and executes as a normal rWasm contract — no system-runtime envelope, no per-runtime storage prefetch. Standard `CALL` semantics apply.

## Source

`fluentbase/contracts/runtime-upgrade/`. CLI driver: `fluentbase/bins/runtime-upgrade/main.rs`.
