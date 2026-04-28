---
title: Universal Token Runtime
sidebar_position: 3
---

A shared ERC-20 implementation that every Universal Token deployment routes through. One contract, many tokens — each token is an ownable account pointing at this runtime, with its name, symbol, decimals, balances, and (optional) wrapped-token state stored under the account's own address.

## Address

| Constant | Address |
|---|---|
| `PRECOMPILE_UNIVERSAL_TOKEN_RUNTIME` | `0x0000000000000000000000000000000000520008` |

## Routing

Init code starting with `UNIVERSAL_TOKEN_MAGIC_BYTES = 0x45524320` (ASCII `"ERC "`) routes to this runtime at deploy time. Direct calls to the runtime address are rejected; user contracts reach it only via the ownable-account indirection.

## Constructor payload

Deployment input is the magic prefix followed by the SolidityABI-encoded `InitialSettings` struct:

```text
0x45524320 ++ abi.encode(token_name, token_symbol, decimals, initial_supply, minter, pauser, wrapped)
```

| Field | ABI type | Notes |
|---|---|---|
| `token_name` | `bytes32` | Fixed 32-byte field, not a `string` (see below). |
| `token_symbol` | `bytes32` | Fixed 32-byte field. |
| `decimals` | `uint8` | Standard ERC-20 decimals. |
| `initial_supply` | `uint256` | Credited to deployer if non-zero. |
| `minter` | `address` | Stored even when zero; gates `mint` / `burn`. |
| `pauser` | `address` | Stored even when zero; gates `pause` / `unpause`. |
| `wrapped` | `bool` | Marks this token as a wrapped-asset deployment that gates `deposit` / `withdraw`. |

Wrapped tokens cannot have a non-zero `minter` — deploys with `wrapped == true && minter != address(0)` are rejected with `ERR_UST_NOT_MINTABLE`.

### `bytes32` name and symbol — not `string`

Name and symbol are 32-byte fixed values. The runtime reads the leading bytes of each `bytes32`, stops at the first `0x00`, and validates UTF-8 (malformed input is rejected with `MalformedBuiltinParams`). Encode human-readable text in the leading bytes; leave the tail zero-padded.

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

- stores `name`, `symbol`, `decimals`, `minter`, `pauser`, and the `wrapped` flag in account metadata,
- if `initial_supply > 0`: credits the deployer's balance, sets `totalSupply`, and emits `Transfer(address(0), deployer, initial_supply)`.

A minimal Solidity-side deploy:

```solidity
bytes4 constant UNIVERSAL_TOKEN_MAGIC = 0x45524320; // "ERC "

bytes memory initCode = bytes.concat(
    UNIVERSAL_TOKEN_MAGIC,
    abi.encode(name32, symbol32, decimals, initialSupply, minter, pauser, wrapped)
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

Wrapped-asset selectors active only on tokens deployed with `wrapped == true`:

| Selector | Behavior |
|---|---|
| `deposit()` | Mints the caller a wrapped balance equal to the `msg.value` sent. |
| `withdraw(uint256 wad)` | Burns the caller's wrapped balance and transfers the underlying value back. |

Unknown selectors return `ERR_UST_UNKNOWN_METHOD`.

## Events

```solidity
event Transfer(address indexed from, address indexed to, uint256 amount);
event Approval(address indexed owner, address indexed spender, uint256 amount);
event Paused(address pauser);
event Unpaused(address pauser);
event Deposit(address indexed dst, uint256 wad);
event Withdrawal(address indexed src, uint256 wad);
```

## Errors

Role and state checks return distinct error classes:

- `ERR_UST_NOT_MINTABLE`, `ERR_UST_MINTER_MISMATCH` — mint or burn against a token deployed without a minter, or by the wrong caller.
- `ERR_UST_NOT_PAUSABLE`, `ERR_UST_PAUSER_MISMATCH` — pause or unpause against a non-pausable token, or by the wrong caller.
- `ERR_UST_NOT_WRAPPED` — `deposit` / `withdraw` against a token deployed without `wrapped == true`.
- `ERR_PAUSABLE_ENFORCED_PAUSE`, `ERR_PAUSABLE_EXPECTED_PAUSE` — pause when already paused, unpause when not paused, or transfer / mint / burn while paused.
- `ERR_ERC20_INVALID_RECEIVER`, `ERR_ERC20_INVALID_SENDER` — mint to or burn from the zero address.
- `ERR_ERC20_INSUFFICIENT_BALANCE`, `ERR_ERC20_INSUFFICIENT_ALLOWANCE` — transfer or approve more than the caller has, or spend more than was approved.

## Storage

Each Universal Token contract is stored as `Bytecode::OwnableAccount(owner = PRECOMPILE_UNIVERSAL_TOKEN_RUNTIME, metadata = original constructor input)`. The metadata payload is the SolidityABI-encoded `InitialSettings` struct itself; per-token configuration (name, symbol, decimals, minter, pauser, wrapped flag) is read from this metadata at runtime. Balances, allowances, and totalSupply live in the deployed account's regular storage slots.

## Source

`fluentbase/contracts/universal-token/`
