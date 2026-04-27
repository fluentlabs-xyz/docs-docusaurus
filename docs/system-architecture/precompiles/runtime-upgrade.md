---
title: Runtime Upgrade Precompile
sidebar_position: 4
---

The contract-side of Fluent's runtime upgrade flow. The conceptual mechanism — governance owner, host enforcement, the privileged syscall — is documented in [Runtime Upgrade](../runtime-upgrade.md). This page covers the precompile's address, calldata format, and authority.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_RUNTIME_UPGRADE` | `0x0000000000000000000000000000000000520010` |

## Authority

| Constant | Default address |
|---|---|
| `DEFAULT_UPDATE_GENESIS_AUTH` | `0xa7bf6a9168fe8a111307b7c94b8883fe02b30934` |

The owner is initialized to the default at genesis. Live networks rotate it to a multisig immediately — treat the default as a starting point, not the current value. Ownership transfer goes through `changeOwner(address)` (zero-address rejected); `renounceOwnership()` sets the owner to the system address, freezing future upgrades through the owner-based path.

## Interface

Solidity-style 4-byte selector dispatch.

```solidity
function upgradeTo(address target, uint256 genesisHash, string version, bytes wasmBytecode) external;
function changeOwner(address newOwner) external;
function owner() external view returns (address);
function renounceOwnership() external;
```

The function selector for `upgradeTo` is published as a constant:

```text
UPDATE_GENESIS_PREFIX = 0x288fb3b8 = keccak256("upgradeTo(address,uint256,string,bytes)")[:4]
```

The full upgrade flow — what `upgradeTo` does internally, host-side enforcement, when each event fires — lives in [Runtime Upgrade](../runtime-upgrade.md).

## Events

```solidity
event RuntimeUpgraded(address indexed targetAddress, bytes32 indexed genesisHash, string genesisVersion, bytes32 codeHash);
event OwnerChanged(address newOwner);
```

`RuntimeUpgraded` is emitted on every successful `upgradeTo` after the host installs the new bytecode at `targetAddress`; `codeHash` is the hash of the installed bytecode. `OwnerChanged` is emitted by `changeOwner` and `renounceOwnership`.

## Source

`fluentbase/contracts/runtime-upgrade/`
