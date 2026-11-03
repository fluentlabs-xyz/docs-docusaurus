---
sidebar_position: 2
---

# Sponsorship

Sponsorship is the App paying the gas of a Fluent ID's Batch operation through Fluent's
sponsorship service. The widget asks for it per operation, and when it is refused the account
pays its own gas instead: that is the fallback. This guide follows one operation through each
outcome: sponsored, refused, both submissions failed, and not asked for. It ends with how to read
the result and a checklist for an operation that was not sponsored. Building and executing a
Batch operation is in [transactions.md](transactions.md); the terms are defined in
[concepts.md](../concepts.md).

## Before you start

- **A Fluent ID.** Sponsorship applies to a Fluent ID's operations only. An External wallet is
  never sponsored: each of its calls is a transaction paid from the wallet's own ETH, the
  `gasPayment` option does not apply to it, and `sponsored` on its result is always `false`.
- **The App enabled for Sponsorship.** Ask Fluent to enable Sponsorship for the App. The widget
  names the App to the sponsorship service by the `appId` of your config. When the service
  refuses the App (HTTP 403), the operation falls back to the account's own ETH, and the widget
  stops asking for Sponsorship on later operations until the `<FluentWidget>` is mounted again:
  a page load, an unmount and remount, or a change of its `network`. Until then those
  operations pay their own ETH from the first attempt, as if `sponsorship` were `"never"`.
- **Auth tokens enabled for the App, and the page origin registered on it.** The widget
  authenticates each sponsored attempt with an Auth token for the person and the App, which it
  obtains itself, from the same Service session as the token `getAuthToken()` returns. Your App
  does not call `getAuthToken()` or pass a token for Sponsorship; for a Fluent ID, obtaining it
  asks the person for no signature. When the token cannot be obtained, for example because Auth
  tokens are not enabled for the App (`getAuthToken()` would reject with `FluentAuthError` and
  `code` `app_not_auth_enabled`) or the page origin is not registered (`origin_not_allowed`), no
  sponsored attempt is made and the account pays its own ETH. Nothing is latched: the next
  operation tries to obtain a token again. See [backend-auth.md](backend-auth.md) and
  [errors.md](../errors.md#fluentautherror).

## The usual path: sponsored

With no options, a Fluent ID's operation asks for Sponsorship. Two settings decide it:

- The Gas payment is native ETH. `execute()` given no `gasPayment` uses the Gas payment chosen
  in the widget (`widget.gasPayment`), which starts at the config's `gasPayment.defaultToken`,
  ETH when unset, unless the person saved another choice.
- `sponsorship` is `"auto"`. The config's `gasPayment.sponsorship` is the App's default, and
  `"auto"` when unset; `execute({ gasPayment: { symbol: "ETH", sponsorship } })` sets it for
  one operation, and a `gasPayment` without `sponsorship` takes the config's value.

The widget then obtains the Auth token, asks the sponsorship service to pay, and submits the
operation. When the service refuses the Auth token itself (HTTP 401), the widget obtains a fresh
token once and tries once more. `execute()` resolves once the operation is included, and
`sponsored` is `true` when its receipt names a paymaster: that is how the result shows that
Sponsorship paid.

## Refused: the account pays its own gas

When the sponsored submission fails, the widget submits the same calls again with the account
paying its own ETH. When that succeeds, `execute()` resolves and nothing is thrown. The
sponsored submission fails when:

- the sponsorship service refuses this operation;
- the service refuses the App (HTTP 403), which also stops later operations from asking;
- the service refuses the Auth token (HTTP 401), and the fresh token is refused too or cannot
  be obtained;
- the service cannot be reached, or answers with another HTTP error;
- the operation itself fails before it is submitted, for example a call that reverts, which
  fails the fallback as well (see the next section).

The account paid, so `sponsored` is not `true`. The result carries no reason for the refusal,
and the fallback needs enough ETH in the account to pay its gas.

## Both failed: `FluentSponsorshipFallbackError`

When the sponsored submission fails and the own-gas submission fails too, `execute()` rejects
with a `FluentSponsorshipFallbackError`. Its `code` says why the sponsored submission failed:

- `unauthorized`: the service refused the App (HTTP 403) or the Auth token (HTTP 401, also
  after one fresh token).
- `unreachable`: the request to the service failed with an HTTP status other than 401 and 403,
  or with none.
- `no_token`: the service refused the Auth token, and obtaining a fresh one failed.
- `denied`: any other failure, such as the service refusing this operation, or the operation
  itself failing, for example a call that reverts whoever pays.

`fallbackError` is what the own-gas submission failed with; read it first, since it says why the
account could not pay, for example too little ETH. `cause` is the sponsored submission's error.
Both are plain `{ name, message, status? }` objects, not the errors the submissions threw: their
`message` keeps the vendor's sentence with URLs, request bodies, addresses, hashes, tokens and
ids replaced by placeholders, and `status` is a status such as the HTTP one, present when the
error carried one ([the fields](../errors.md#fluentsponsorshipfallbackerror)).
Keep a `default` branch in any `switch` over `code`: a later release may add one. What to do for
each code is in [errors.md](../errors.md#fluentsponsorshipfallbackerror).

Only these two failed submissions make this error. Every other failure under Sponsorship
arrives as it was thrown:

- The operation's fee was refused in the sponsored submission, also after the widget's one
  retry with a new fee quote. There is no fallback for it.
- Waiting for the receipt failed, of the sponsored operation or of the fallback. The operation
  was submitted and can still be included.
- No sponsored submission was made, because no Auth token could be obtained or the widget had
  stopped asking after an HTTP 403. The account paid its own ETH from the start.
- The operation was included and reverted: a plain `Error`, whoever paid.

## Not asking: `sponsorship: "never"` and Gas tokens

- **`sponsorship: "never"`**, in the config's `gasPayment` or in `execute({ gasPayment })`:
  with ETH as the Gas payment, the widget asks no sponsorship service and obtains no Auth token
  for it. The account pays its own ETH from the first submission, and a failure arrives as it
  was thrown. `sponsored` is not `true`.
- **A Gas token**, chosen by the person in the widget or passed as
  `execute({ gasPayment: { symbol } })`: the account pays its gas in that Gas token, Sponsorship
  is not asked for, and `sponsorship` is ignored. `sponsored` is always `false`. A `symbol` that
  names no Gas token on the Network is paid in ETH, and then asks for Sponsorship like any ETH
  operation.

```ts
import type { FluentBatchOperation, FluentExecuteResult } from "@fluent.xyz/connect";

// Pays from the account's own ETH, without asking for Sponsorship.
export function executeWithOwnEth(operation: FluentBatchOperation): Promise<FluentExecuteResult> {
  return operation.execute({ gasPayment: { symbol: "ETH", sponsorship: "never" } });
}
```

## Reading `sponsored`

`sponsored` on `FluentExecuteResult` is read from the included operation's receipt first. Only
when the receipt names no paymaster does the way the operation was submitted decide:

| `sponsored` | When |
|---|---|
| `true` | A Fluent ID, ETH as the Gas payment, and the receipt names a paymaster: Sponsorship paid. |
| `false` | Always for an External wallet. Always for a Fluent ID paying in a Gas token. For a Fluent ID paying in ETH, when the receipt names the account as the payer, or names no paymaster and the operation made no sponsored submission: the fallback (after a refused sponsored submission, an HTTP 403 or for lack of an Auth token), `sponsorship: "never"`, every operation after an HTTP 403, and an App with no Sponsorship configured. |
| `null` | A Fluent ID paying in ETH whose sponsored submission went through, and the receipt names no paymaster, so it does not say who paid. |

Treat only `true` as sponsored. `null` is not a refusal: a sponsored submission went through,
and the receipt does not name who paid. The experimental `paymaster` member names the paymaster
the receipt names; see [experimental.md](../experimental.md#paymaster-and-timing).

## Example: a sponsored ETH transfer

The App sends 0.001 ETH from the Widget account and tells the person who paid the gas.

```tsx
import {
  FluentReviewRejectedError,
  FluentSponsorshipFallbackError,
  FluentWidget,
  useFluentWidget,
  type FluentWidgetConfig,
} from "@fluent.xyz/connect";
import { useState } from "react";
import { parseEther, type Address } from "viem";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

const recipient: Address = "0x2222222222222222222222222222222222222222";

function describeFallback(error: FluentSponsorshipFallbackError): string {
  switch (error.code) {
    case "denied":
      return "Sponsorship refused this operation, and paying with your own ETH failed too.";
    case "unauthorized":
      return "Sponsorship refused this App or its Auth token, and your own ETH failed too.";
    case "unreachable":
      return "Sponsorship did not answer, and paying with your own ETH failed too.";
    case "no_token":
      return "No Auth token for Sponsorship, and paying with your own ETH failed too.";
    default:
      return "The operation could not be sent.";
  }
}

function Transfer() {
  const { widget, status } = useFluentWidget();
  const [note, setNote] = useState("");

  async function transfer() {
    const operation = widget.createBatchOp({
      reviewTitle: "Send 0.001 ETH",
      // `data: "0x"` is required: a call with neither `data` nor `abi` and `method` is refused.
      calls: [{ to: recipient, value: parseEther("0.001"), data: "0x" }],
    });
    try {
      const result = await operation.execute();
      if (result.sponsored === true) {
        setNote(`Sent in ${result.hash}; the App paid the gas.`);
      } else if (result.sponsored === false) {
        setNote(`Sent in ${result.hash}; your account paid the gas.`);
      } else {
        setNote(`Sent in ${result.hash}; the receipt does not say who paid the gas.`);
      }
    } catch (error) {
      if (error instanceof FluentReviewRejectedError) return; // the person said no
      if (error instanceof FluentSponsorshipFallbackError) {
        setNote(describeFallback(error));
        return;
      }
      setNote(error instanceof Error ? error.message : "The transfer failed.");
    }
  }

  if (status !== "connected") return <p>Connect to send.</p>;
  return (
    <div>
      <button
        type="button"
        disabled={!widget.account.executionReady}
        onClick={() => void transfer()}
      >
        Send 0.001 ETH
      </button>
      <p>{note}</p>
    </div>
  );
}

export function App() {
  return <FluentWidget config={config} mode="page" renderPage={() => <Transfer />} />;
}
```

## Why was my operation not sponsored?

The result says only whether Sponsorship paid, not why it did not. Check, in order:

- **The Widget account is an External wallet.** It is never sponsored; `sponsored` is `false`.
- **A Gas token was the Gas payment.** The person may have chosen one in the widget, which
  `execute()` uses when given no `gasPayment`; read `widget.gasPayment.symbol`. `sponsored` is
  `false`.
- **`sponsorship` is `"never"`**, in the config's `gasPayment` or in the `gasPayment` passed to
  `execute()`.
- **The App is not enabled for Sponsorship.** The service refused the App with HTTP 403, and the
  widget stopped asking until the `<FluentWidget>` is mounted again. Ask Fluent to enable it for
  your `appId`, then reload the page.
- **No Auth token could be obtained.** Auth tokens are not enabled for the App, or the page
  origin is not registered on it. Call `getAuthToken()` and read the `FluentAuthError` `code` it
  rejects with ([errors.md](../errors.md#fluentautherror)).
- **The sponsorship service refused this operation**, or could not be reached. The account paid
  through the fallback, which resolves without an error; only a failed fallback carries a
  `code`.
- **`sponsored` is `null`.** The operation made a sponsored submission and the receipt names no
  paymaster, so it does not say who paid. An operation that made no sponsored submission
  reports `false` instead.

With `debugLogging` on ([configuration.md](../configuration.md)), the widget prints a console
warning when the Auth token for a sponsored attempt cannot be obtained or the sponsored attempt
fails and the account pays its own gas.
