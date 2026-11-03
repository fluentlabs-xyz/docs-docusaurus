---
sidebar_position: 2
---

# Concepts

The widget gives your App one Widget account, and that account is one of two kinds. Most of what
the widget does depends on which kind is connected, so this page sets the two side by side. The
words in bold are the glossary's; the API reference ([api.md](api.md)) uses the same ones.

## The two account kinds

**Fluent ID.** A person's account on Fluent, created at Direct login, which happens inside your
App's own page. It is the primary identity the widget gives a person, and the address the
widget's actions target.

**External wallet.** A third-party wallet the person connects themselves. It signs for itself and
holds its own balances, independently of any Fluent ID.

Read the kind from `widget.account.type` (`useFluentWidget().widget`, or `widget` in the render
context): `"smart"` for a Fluent ID once its account is ready, `"eoa"` for a connected External
wallet (even before its client is ready to sign), and absent otherwise. `FluentAccountType` may gain
values in a later release, so keep a `default` branch in any `switch` over it. To adapt your UI
without branching on the kind, read `widget.account.capabilities`
([api.md](api.md#fluentaccountcapabilities)).

## What differs by account kind

| Behaviour | Fluent ID | External wallet |
|---|---|---|
| Widget session (`session` in the render context) | Built at Direct login, and restored from storage on a later page load with its original `issuedAt`. `session.account.type` is `"smart"`. A session from an earlier visit stays in `session` until a disconnect through the widget or a new Direct login replaces it, even while `status` is `"disconnected"`: branch on `status`. | Not built for an External wallet: `session` is `null`, unless a Fluent ID's session from an earlier visit is still stored. Read the account from `widget.account`. |
| How a Batch operation lands | Atomically, in one transaction: `atomic` is `true` on the result. | One transaction per call, in order: `atomic` is `false`, and `hashes` holds one hash per call. When a call reverts, `execute()` rejects, sends none of the calls after it, and the calls before it stay included. |
| Review before a Batch operation | Shown in Prompt mode, skipped in Silent mode: see [Prompt mode and Silent mode](#prompt-mode-and-silent-mode). | No widget Review: the wallet shows its own prompt, and `confirmation` is ignored. A refusal there rejects with the wallet's own error. |
| Review before a signature (`signMessage`, `signTypedData`) | Shown in Prompt mode, skipped in Silent mode. | Always shown, then the wallet's own prompt. |
| Quick sign and Silent mode | Apply. | Do not apply. |
| Gas payment | Native ETH, or a Gas token (`gasPayment` on `execute()`, or the person's choice in the widget). | Always the wallet's own native ETH; `gasPayment` is ignored. |
| Sponsorship | Asked for on an operation paid in native ETH, unless `sponsorship` is `"never"`. When it is refused, the account pays its own gas. Once the service refuses the App outright, the widget stops asking until it is mounted again. | Never sponsored. |
| `sponsored` on `FluentExecuteResult` | `false` for a Gas token payment; `true` when the receipt names a sponsoring paymaster; `false` when the receipt names no paymaster and the operation made no sponsored submission, which is an operation the account paid for itself in ETH; `null` when the receipt names no paymaster after a sponsored submission. | Always `false`. |
| `paymaster` on `FluentExecuteResult` | The paymaster the receipt names, when it names one. Experimental: see [experimental.md](experimental.md#paymaster-and-timing). | Always absent. |
| `getAuthToken()` | Uses the Direct login: no signature is asked for. | Signs a Sign-in challenge when a Service session opens (a second time when the service refuses the first challenge and the call retries); renewals the service accepts ask the wallet for nothing. See [guides/backend-auth.md](guides/backend-auth.md#renewal). |

Every Sponsorship outcome, `FluentSponsorshipFallbackError`, and how to tell why an operation was
not sponsored are in [guides/sponsorship.md](guides/sponsorship.md).

The Auth token itself, and how a backend verifies it, are in
[guides/backend-auth.md](guides/backend-auth.md). Batch operations and their results are in
[guides/transactions.md](guides/transactions.md), signatures in
[guides/signing.md](guides/signing.md).

## Prompt mode and Silent mode

These two modes decide whether the widget shows its Review before a Fluent ID signs a Batch
operation or a signature (`signMessage`, `signTypedData`). They apply to a Fluent ID only: an
External wallet's Batch operation never shows the widget's Review and goes through the wallet's
own prompt, and its signatures always show the Review, then the wallet's own prompt.

- **Prompt mode** (`"prompt"`): the widget shows its Review and signs once the person confirms
  it. If the person dismisses it, `execute()` rejects with `FluentReviewRejectedError`, `code`
  `"transaction_review_rejected"`, and a signature with `code` `"signature_review_rejected"`
  ([errors.md](errors.md#fluentreviewrejectederror)).
- **Silent mode** (`"silent"`): the widget shows no Review and signs directly.

**Quick sign** is the person's choice of Silent mode: the "Quick sign" switch in the Settings of
the widget's account drawer; no option of the App sets it. It is kept in the person's User
settings, which the widget reads and saves with an Auth token. After every page load and every
connect, Quick sign is on until the widget has read the person's User settings, so until then a
Fluent ID signs in Silent mode, subject to the steps below. Without an Auth token the read and the
save fail: a person's choice to turn Quick sign off is not loaded, and lasts only until the next
page load or connect.

`widget.signingMode` is the current mode: `"silent"` while Quick sign is on, `"prompt"`
otherwise. Signatures follow it and take no option. Which mode a Batch operation gets is decided
once per `execute()` call:

1. The `confirmation` option of `execute()`, when you pass it. Only the exact value `"silent"`
   gives Silent mode; any other value gives Prompt mode, including `null` and the 0.5 values
   `"always"` and `"session"`.
2. When you leave `confirmation` out, `widget.signingMode`.
3. Then the App's `quickSign.whitelistAddresses`, when it is set: an operation in Silent mode with
   any call whose `to` is not on the list is switched to Prompt mode, so it shows the Review. This
   applies to an explicit `confirmation: "silent"` as well as to Quick sign, so a per-call option
   cannot lift the App's list. An empty list switches every operation to Prompt mode; leaving the
   option out lets Silent mode cover every address. Addresses are compared case-insensitively.
   The list does not apply to `signMessage` and `signTypedData`, which have no call target.

The option itself is in [configuration.md](configuration.md).

## What the Swap page can do on mainnet

The drawer's Swap page deposits from Ethereum into the user's Fluent smart
account. On **mainnet** its Receive side also offers the other tokens Fluent
ships — so a user can deposit ETH and end up holding USDnr. That is a **two-step
deposit**: the bridge runs first and credits the smart account, then the smart
account swaps what landed, on Fluent, through FluxFlow. The user signs the bridge
alone; once the deposit lands, the swap is priced and sent without a second
press, from whichever drawer page the user is on.

Five consequences reach your integration:

- **The swap is an operation from the smart account**, like a Send: it uses the
  user's gas token from Settings, it can be sponsored by your paymaster, and it
  shows the Fluent transaction review. Its calls go to the FluxFlow router
  (`0x23a8…3701`) and, for an ERC-20 input, to that token for an `approve` of
  exactly the amount being swapped. If you set
  `quickSign.whitelistAddresses` ([configuration.md](configuration.md)),
  those targets have to be on the list for Quick
  sign to cover it; otherwise the user sees the Review, which is the documented
  behaviour of that option and not a bug. Because the swap starts on its own, a
  user without Quick sign sees that Review open by itself when the deposit lands;
  dismissing it, or a swap that fails, leaves a button on the Swap page to try
  again, and the widget does not reopen it on its own.
- **It needs a Fluent ID.** A user whose widget account is an external wallet
  sees the Receive side as it has always been — whatever the bridge delivers —
  because the deposit is credited to the smart account and only that account can
  swap it.
- **It keeps its place in `localStorage`.** From the moment the bridge is signed,
  the deposit's progress is stored under
  `fluent-connect:two-step-deposit:v1:<network>:<smart account>` in your page's
  origin, so another drawer page or a reload comes back to the same step. The
  entry is removed once the deposit is over. Where the browser refuses storage
  the deposit is still followed, but only while the page stays open.
- **The swap sells what landed, never more than the deposit was to deliver.** A
  smaller arrival is swapped as it is; a larger rise in the balance is other
  money and is left alone. A swap whose confirmation never came back is not
  offered again, because it may still land.
- **Testnet is unchanged.** FluxFlow runs on Fluent mainnet only, so on testnet
  the Swap page offers the bridge alone.

Nothing here is configurable and no prop changed: a two-step deposit is the
user's choice on that page, made per deposit.
