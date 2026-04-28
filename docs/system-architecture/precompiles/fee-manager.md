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

The owner defaults to the genesis-init value. Live networks rotate it. The contract reads its stored owner first and falls back to the default only when the slot is zero. `changeOwner(address)` transfers ownership (zero-address rejected); `renounceOwnership()` sets the owner to the system address (`0xfffffffffffffffffffffffffffffffffffffffe`).

## Interface

```solidity
function withdraw(address recipient) external;
function changeOwner(address newOwner) external;
function owner() external view returns (address);
function renounceOwnership() external;
```

`withdraw` is owner-only and transfers the contract's full balance to `recipient`. Reverts if the contract balance is zero (`fee-manager: nothing to withdraw`).

## Events

```solidity
event FeeWithdrawn(address recipient, uint256 amount);
event OwnerChanged(address newOwner);
```

## Errors

All failure paths use Rust `panic!` and surface as EVM revert. Messages:

- `fee-manager: incorrect caller`
- `fee-manager: nothing to withdraw`
- `fee-manager: can't send funds to recipient`
- `fee-manager: can't obtain self balance`

## Routing note

`PRECOMPILE_FEE_MANAGER` is not in `EXECUTE_USING_SYSTEM_RUNTIME_ADDRESSES`. The contract is pre-deployed at genesis and executes as a normal rWasm contract — no system-runtime envelope, no per-runtime storage prefetch. Standard `CALL` semantics apply.

## Source

`fluentbase/contracts/fee-manager/`
