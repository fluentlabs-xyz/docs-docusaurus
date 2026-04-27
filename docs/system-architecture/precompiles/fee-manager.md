---
title: Fee Manager
sidebar_position: 5
---

The system contract that holds accumulated protocol fees. The owner can withdraw the contract's full balance to a recipient address. There is no other operation; fees are paid into this address by the protocol and accumulate until withdrawn.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_FEE_MANAGER` | `0x0000000000000000000000000000000000520fee` |

## Authority

| Constant | Default address |
|---|---|
| `DEFAULT_FEE_MANAGER_AUTH` | `0xa7bf6a9168fe8a111307b7c94b8883fe02b30934` |

The owner defaults to the genesis-init value. Live networks rotate it. `changeOwner(address)` transfers ownership (zero-address rejected); `renounceOwnership()` sets the owner to the system address.

## Interface

```solidity
function withdraw(address recipient) external;
function changeOwner(address newOwner) external;
function owner() external view returns (address);
function renounceOwnership() external;
```

`withdraw` is owner-only and transfers the contract's full balance to `recipient`.

## Events

```solidity
event FeeWithdrawn(address recipient, uint256 amount);
event OwnerChanged(address newOwner);
```

## Source

`fluentbase/contracts/fee-manager/`
