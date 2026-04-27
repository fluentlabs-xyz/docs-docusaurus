---
title: Universal Token Runtime
sidebar_position: 3
---

A shared ERC-20 implementation that every Universal Token deployment routes through. One contract, many tokens — each token is an ownable account pointing at this runtime, with its name, symbol, decimals, and balances stored under the account's own address.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_UNIVERSAL_TOKEN_RUNTIME` | `0x0000000000000000000000000000000000520008` |

## Routing

Init code starting with `UNIVERSAL_TOKEN_MAGIC_BYTES = 0x45524320` (ASCII `"ERC "`) routes to this runtime at deploy time.

## Constructor payload

Deployment input must be:

```text
0x45524320 ++ abi.encode(token_name, token_symbol, decimals, initial_supply, minter, pauser)
```

| Field | ABI type | Notes |
|---|---|---|
| `token_name` | `bytes32` | Fixed 32-byte field, not a `string` (see below). |
| `token_symbol` | `bytes32` | Fixed 32-byte field. |
| `decimals` | `uint8` | Standard ERC-20 decimals. |
| `initial_supply` | `uint256` | Credited to deployer if non-zero. |
| `minter` | `address` | Stored only if non-zero; gates `mint` / `burn`. |
| `pauser` | `address` | Stored only if non-zero; gates `pause` / `unpause`. |

### `bytes32` name and symbol — not `string`

Name and symbol are 32-byte fixed values. The runtime reads the leading bytes of each `bytes32`, stops at the first `0x00`, and validates UTF-8 (malformed input is rejected). Encode human-readable text in the leading bytes; leave the tail zero-padded.

```solidity
function stringToBytes32(string memory s) internal pure returns (bytes32 out) {
    require(bytes(s).length <= 32, "string too long");
    assembly {
        out := mload(add(s, 32))
    }
}
```

## Deploy behavior

On a successful deploy the runtime:

- stores `name`, `symbol`, and `decimals` in account metadata,
- stores `minter` and `pauser` only if they are non-zero,
- if `initial_supply > 0`: credits the deployer's balance, sets `totalSupply`, and emits `Transfer(address(0), deployer, initial_supply)`.

A minimal Solidity-side deploy:

```solidity
bytes4 constant UNIVERSAL_TOKEN_MAGIC = 0x45524320; // "ERC "

bytes memory initCode = bytes.concat(
    UNIVERSAL_TOKEN_MAGIC,
    abi.encode(name32, symbol32, decimals, initialSupply, minter, pauser)
);

address token;
assembly { token := create(0, add(initCode, 0x20), mload(initCode)) }
```

`CREATE2` works the same way with a salt argument.

## Interface

Selectors are dispatched Solidity-style by 4-byte function ID. The runtime exposes the standard ERC-20 surface:

| Selector | Returns |
|---|---|
| `name()` | `string` |
| `symbol()` | `string` |
| `decimals()` | `uint8` |
| `totalSupply()` | `uint256` |
| `balanceOf(address)` | `uint256` |
| `transfer(address,uint256)` | `bool` |
| `transferFrom(address,address,uint256)` | `bool` |
| `approve(address,uint256)` | `bool` |
| `allowance(address,address)` | `uint256` |

Plus one Fluent-specific helper:

| Selector | Returns |
|---|---|
| `balance()` | `uint256` (caller's balance — equivalent to `balanceOf(msg.sender)`) |

Privileged selectors active only when the corresponding role was set at deploy:

| Selector | Role required |
|---|---|
| `mint(address,uint256)` | `minter` |
| `burn(address,uint256)` | `minter` |
| `pause()` | `pauser` |
| `unpause()` | `pauser` |

Unknown selectors return `ERR_UST_UNKNOWN_METHOD`.

## Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 amount);
event Approval(address indexed owner, address indexed spender, uint256 amount);
event Paused(address pauser);
event Unpaused(address pauser);
```

## Errors

Role and state checks return distinct error classes:

- `ERR_UST_NOT_MINTABLE`, `ERR_UST_MINTER_MISMATCH` — mint or burn against a token deployed without a minter, or by the wrong caller.
- `ERR_UST_NOT_PAUSABLE`, `ERR_UST_PAUSER_MISMATCH` — pause or unpause against a non-pausable token, or by the wrong caller.
- `ERR_PAUSABLE_ENFORCED_PAUSE`, `ERR_PAUSABLE_EXPECTED_PAUSE` — pause when already paused, unpause when not paused, or transfer / mint / burn while paused.
- `ERR_ERC20_INVALID_RECEIVER`, `ERR_ERC20_INVALID_SENDER` — mint to or burn from the zero address.

## Storage

Balances and allowances are stored under the token's own account address using the Fluentbase SDK's storage primitives (`StorageMap`). Token configuration (name, symbol, decimals, minter, pauser, frozen flag, total supply) lives in account metadata at deterministic slots set during deployment.

## Source

`fluentbase/contracts/universal-token/`
