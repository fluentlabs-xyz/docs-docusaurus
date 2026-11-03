---
sidebar_position: 1
---

# Executing Batch operations

A Batch operation is an ordered list of contract calls the widget executes for the Widget
account as one unit. It is the one way an App sends anything: there is no separate call for a
single transfer or a single contract call. This guide builds calls, executes them, chooses how
gas is paid, reads the result and handles rejections. The terms are defined in
[concepts.md](../concepts.md); every type named here is in [api.md](../api.md#fluentbatchapi).

How an operation lands depends on the account kind:

| Widget account | How the calls land | Review | Gas |
|---|---|---|---|
| Fluent ID | In one transaction, atomically: all calls apply or none does. | The widget's Review in Prompt mode, none in Silent mode: see [concepts.md](../concepts.md#prompt-mode-and-silent-mode). | Sponsorship, the account's own ETH or a Gas token. |
| External wallet | One transaction per call, in order, each awaited before the next. | No widget Review: the wallet handles each transaction with its own prompt. | The wallet's own ETH. |

## Calls

Each call is a `FluentBatchCallInput`:

| Member | What it is |
|---|---|
| `to` | The contract or account the call targets. Required. |
| `abi`, `method`, `args` | The ABI, the name of the function to encode, and its arguments. |
| `data` | Raw calldata, used as given instead of `abi` and `method`. |
| `value` | Native ETH sent with the call, in wei. Defaults to `0n`. |
| `id`, `label` | Your own names for the call; the widget copies them into `encodedCalls`. |

A call needs either `data`, or both `abi` and `method`. The package has no transfer helper:
build a token transfer as an ERC-20 `transfer` call, with viem's `erc20Abi` and `parseUnits`,
and a native ETH transfer as a call with a `value` and empty `data`:

```ts
import type { FluentBatchCallInput } from "@fluent.xyz/connect";
import { erc20Abi, parseEther, parseUnits, type Address } from "viem";

const token: Address = "0x1111111111111111111111111111111111111111";
const recipient: Address = "0x2222222222222222222222222222222222222222";

// 25 units of an ERC-20 with 18 decimals.
export const tokenTransfer: FluentBatchCallInput = {
  to: token,
  abi: erc20Abi,
  method: "transfer",
  args: [recipient, parseUnits("25", 18)],
};

// 0.01 ETH. `data: "0x"` is required: a call with neither `data` nor `abi` and `method` is
// refused when the operation is built.
export const ethTransfer: FluentBatchCallInput = {
  to: recipient,
  value: parseEther("0.01"),
  data: "0x",
};
```

## Building and executing

`widget.createBatchOp({ calls })` builds a `FluentBatchOperation` and encodes its calls at once.
It throws a plain `Error` when `calls` is empty, or when a call has neither `data` nor `abi` with
`method`, so a mistake in a call surfaces before anything is shown to the person. The optional
`reviewTitle` is the heading of the operation's Review (Fluent ID, Prompt mode).

`execute(options?)` sends the operation for the Widget account and resolves once it is
included in a block. With no options, it follows `widget.signingMode` and the Gas payment
chosen in the widget; [Gas payment](#gas-payment) and
[concepts.md](../concepts.md#prompt-mode-and-silent-mode) cover the options.

Before offering the action, read the Widget account from `widget.account`:

- `executionReady` is `true` when the account can send now.
- `executionStatus` says why it cannot: `"disconnected"` when no Widget account can send, which
  includes a Fluent ID still being prepared or whose account failed; `"unavailable"` or
  `"error"` (with a reason in `executionError`) only for a connected External wallet whose client
  is not ready. Keep a `default` branch in any `switch` over it.
- The operation's own `canExecute` is read once, when the operation is built, and is not
  updated afterwards; read `widget.account.executionReady` for the live value.

When the Widget account is not ready, `execute()` first tries to prepare the Fluent ID, and
rejects with a plain `Error` when it cannot. With nobody connected, it opens the connect dialog
and rejects with a plain `Error`: call it again once the person is connected. In Prompt mode the
Review is shown before either.

A call that reverts rejects `execute()`. For a Fluent ID nothing of the operation applies; under
Sponsorship the rejection can be a `FluentSponsorshipFallbackError`
([sponsorship.md](sponsorship.md)). For an External wallet the calls that landed before the
reverted one stay applied, and the calls after it are not sent.

## Example: approve and deposit in one Batch operation

The App deposits 10 tokens into an ERC-4626 vault: an `approve` of the vault, then the vault's
`deposit`. For a Fluent ID the two calls land in one transaction, so the approval never lands
without the deposit. For an External wallet they are two transactions, two wallet prompts.

```tsx
import {
  FluentReviewRejectedError,
  FluentWidget,
  useFluentWidget,
  type FluentWidgetConfig,
} from "@fluent.xyz/connect";
import { useState } from "react";
import { erc20Abi, parseAbi, parseUnits, type Address } from "viem";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

const asset: Address = "0x1111111111111111111111111111111111111111";
const vault: Address = "0x3333333333333333333333333333333333333333";
const vaultAbi = parseAbi([
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
]);

function Deposit() {
  const { widget, status } = useFluentWidget();
  const [note, setNote] = useState("");
  const { account } = widget;

  async function deposit() {
    const receiver = account.address;
    if (!receiver) return;
    const assets = parseUnits("10", 18);
    const operation = widget.createBatchOp({
      reviewTitle: "Deposit 10 tokens",
      calls: [
        { to: asset, abi: erc20Abi, method: "approve", args: [vault, assets] },
        { to: vault, abi: vaultAbi, method: "deposit", args: [assets, receiver] },
      ],
    });
    try {
      const result = await operation.execute();
      setNote(`Deposited in ${result.hash}`);
    } catch (error) {
      if (error instanceof FluentReviewRejectedError) return; // the person said no
      setNote(error instanceof Error ? error.message : "The deposit failed.");
    }
  }

  if (status !== "connected") return <p>Connect to deposit.</p>;
  return (
    <div>
      <button type="button" disabled={!account.executionReady} onClick={() => void deposit()}>
        Deposit 10 tokens
      </button>
      {account.executionReady ? null : <p>Your account cannot send yet.</p>}
      <p>{note}</p>
    </div>
  );
}

export function App() {
  return <FluentWidget config={config} mode="page" renderPage={() => <Deposit />} />;
}
```

## Gas payment

A Fluent ID's operation is paid in one of three ways. With **Sponsorship**, the App pays
through Fluent's sponsorship service; it is asked for on an operation paid in ETH unless
`sponsorship` is `"never"`. With **the account's own ETH**, the account pays: when Sponsorship
is not asked for, or as the fallback when it is refused. With **a Gas token**, the account pays
in one of the Gas tokens Fluent ships for the Network, and Sponsorship is not asked for. An
External wallet always pays its own ETH, and the `gasPayment` option does not apply to it.
Every Sponsorship outcome, the fallback and `FluentSponsorshipFallbackError` are in
[sponsorship.md](sponsorship.md).

`widget.gasPayment` is the Gas payment chosen in the widget, which `execute()` uses when given
no `gasPayment`; pass a `FluentGasPayment` to `execute()` to decide for one operation.

A Gas token is charged by its paymaster only up to the account's allowance to it, so an operation
paid in a Gas token can start with an approval of that paymaster. Without `includeApproval`, the
widget adds the approval automatically when the allowance is short: 1 USDnr when the USDnr
allowance is below 0.1 USDnr, and 10 BLEND when the BLEND allowance is below 1 BLEND. An
allowance the widget cannot read counts as none, and when ZeroDev cannot name the paymaster,
`execute()` rejects before anything is signed, with an error whose `name` is
`FluentGasPaymentError` and whose `code` is `paymaster_unavailable`. With `includeApproval: true` and an
`approveAmount` (in the token's smallest unit), the operation starts with an approval of that
amount instead, whatever the allowance. The Review lists the operation's own calls, not the
approval, and an operation paid in ETH or sent by an External wallet gets none.

Gas limits can be fixed by hand with the experimental `userOperationGas` option
([experimental.md](../experimental.md#useroperationgas)); leaving it out lets the widget
estimate.

## The result

`execute()` resolves with a `FluentExecuteResult`:

| Member | Fluent ID | External wallet |
|---|---|---|
| `hash` | The hash of the one transaction. | The hash of the last call's transaction. |
| `hashes` | `[hash]`. | One hash per call, in order. |
| `receipt` | The transaction's receipt, when present. | The last call's receipt. |
| `userOpHash` | The ERC-4337 operation hash. | Absent. |
| `atomic` | `true`. | `false`. |
| `sponsored` | See below. | `false`. |

`sponsored` says whether the App's Sponsorship paid, read from the included operation's
receipt and, when the receipt names no paymaster, from whether a sponsored submission was made:
treat only `true` as sponsored. When it is `false` and when `null`:
[sponsorship.md](sponsorship.md). The members `paymaster` and `timing` are experimental
([experimental.md](../experimental.md#paymaster-and-timing)).

## Rejections

Branch on the error's class with `instanceof`, then on its `code`, never on its message:

| Error | `code` | When |
|---|---|---|
| `FluentReviewRejectedError` | `"transaction_review_rejected"` | A Fluent ID in Prompt mode: the person dismissed the Review. |
| `FluentSponsorshipFallbackError` | `"denied"`, `"unauthorized"`, `"unreachable"`, `"no_token"` | A Fluent ID: the sponsored attempt and the fallback both failed. |
| `FluentUserOperationGasError` | see [errors.md](../errors.md#fluentuseroperationgaserror) | Experimental, with the `userOperationGas` option ([experimental.md](../experimental.md#useroperationgas)). |

An External wallet shows no widget Review: when the person refuses in the wallet's own prompt,
`execute()` rejects with the wallet's error, not with a `FluentReviewRejectedError`. Which
failures under Sponsorship become a `FluentSponsorshipFallbackError` and which arrive as they were
thrown: [sponsorship.md](sponsorship.md).
Keep a `default` branch in every `switch` over a `code`: a later release may add one.

```ts
import {
  FluentReviewRejectedError,
  FluentSponsorshipFallbackError,
  type FluentBatchOperation,
  type FluentExecuteResult,
} from "@fluent.xyz/connect";

export async function executeOrExplain(
  operation: FluentBatchOperation,
): Promise<FluentExecuteResult | string> {
  try {
    return await operation.execute();
  } catch (error) {
    if (error instanceof FluentReviewRejectedError) {
      switch (error.code) {
        case "transaction_review_rejected":
          return "You dismissed the operation.";
        default:
          return "You dismissed the request.";
      }
    }
    if (error instanceof FluentSponsorshipFallbackError) {
      switch (error.code) {
        case "unreachable":
          return "Sponsorship did not answer, and paying with your own ETH failed too.";
        case "denied":
          return "The sponsored attempt failed, and paying with your own ETH failed too.";
        default:
          return "The operation could not be sent.";
      }
    }
    // A wallet's own refusal, or a failure outside a sponsored attempt.
    return error instanceof Error ? error.message : "Something went wrong.";
  }
}
```

Every code and what to do about it: [errors.md](../errors.md).
