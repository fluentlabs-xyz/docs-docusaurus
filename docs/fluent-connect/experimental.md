---
sidebar_position: 6
---

# Experimental API

> **Everything on this page is `@experimental`.** Each option, member and export below may
> change or be removed in a minor release. The rest of the API, every name [api.md](api.md)
> does not mark **experimental**, is kept after 0.6.0. Build on an experimental name only where
> you can follow its changes from release to release.

Each section says what the item does, its default, when to use it, and which account kind it
applies to: a Fluent ID, an External wallet, or both. The exact types are in [api.md](api.md).

| Name | Where it appears | Section |
|---|---|---|
| `privyAdapter`, `FluentPrivyAdapter` | `FluentWidgetProps` | [`privyAdapter`](#privyadapter) |
| `wallet`, `FluentExternalWalletState`, `FluentWalletChoice` | `FluentWidgetProps`, `FluentWidgetRenderContext` | [`wallet`](#wallet) |
| `execution`, `FluentWidgetExecution`, `FluentWidgetExecutionSource` | `FluentWidgetConfig` | [`execution`](#execution) |
| `userOperationGas`, `FluentUserOperationGas`, `FluentFixedAccountGas`, `FluentFixedPaymasterGas`, `FluentUserOperationGasError`, `FluentUserOperationGasErrorCode` | `FluentBatchOperationExecuteOptions` | [`userOperationGas`](#useroperationgas) |
| `paymaster`, `timing`, `FluentExecuteTiming`, `FluentExecuteTimingInstants` | `FluentExecuteResult` | [`paymaster` and `timing`](#paymaster-and-timing) |
| `gasPayment.ethValueByToken`, `FluentGasPaymentEthRates` | `FluentWidgetConfig` | [`gasPayment.ethValueByToken`](#gaspaymentethvaluebytoken) |
| `customOAuthRedirectUrl` | `FluentWidgetConfig` | [`customOAuthRedirectUrl`](#customoauthredirecturl) |
| `swapper` | `FluentWidgetConfig` | [`swapper`](#swapper) |
| `sponsorshipUrl` | `FluentWidgetConfig` | [`sponsorshipUrl`](#sponsorshipurl) |
| `privyClientId` | `FluentWidgetConfig` | [`privyClientId`](#privyclientid) |

## `privyAdapter`

`FluentWidgetProps.privyAdapter` takes a `FluentPrivyAdapter`: the provider component and the
hooks of Privy's React SDK, taken from the host's own runtime
([api.md](api.md#fluentprivyadapter)).

- **What it does**: the widget uses the adapter's provider and hooks in place of the web SDK it
  bundles, so Direct login, its restore on a later page load and the Signer's signatures run
  through the host's SDK.
- **Default**: none. Without it the widget uses its bundled web SDK, which is what a web App
  needs.
- **When to use it**: only in a host that runs Privy's native SDK instead of the web one.
- **Applies to**: a Fluent ID, and an External wallet's `linkX()`. Connecting an External
  wallet does not use it.
- **Keep it stable**: pass one adapter object for the life of the page. An adapter whose
  provider component differs from the last one remounts everything the widget renders.

## `wallet`

`FluentWidgetProps.wallet` takes a `FluentExternalWalletState`: an External wallet the host
connects itself ([api.md](api.md#fluentexternalwalletstate)).

- **What it does**: the widget uses the host's state as its External wallet instead of
  connecting one itself. The state says whether a wallet is `configured` and `connected`, its
  `address`, `chainId` and `walletClient`, and gives the widget `open`, `disconnect` and
  `switchChain` to call. `reconnecting` is `true` while a wallet from an earlier visit is being
  restored; leaving it out makes the widget report `"disconnected"` a little earlier on a
  reload.
- **Inline choices**: `choices` lists `FluentWalletChoice` entries (`id`, `name`, an optional
  `icon`, and `handoff` for a wallet that opens its own window or a QR code) that the connect
  dialog shows inline; the widget calls `connectChoice(id)` with the one picked. Without them
  the host's `open()` picker is used ([api.md](api.md#fluentwalletchoice)).
- **Default**: none. Omitted, or `null`, the widget connects External wallets itself.
- **When to use it**: when the App already manages its own wallet connection and the widget
  has to act for that same wallet.
- **Applies to**: an External wallet. An External wallet's Batch operation is executed through
  `walletClient`, so the state needs `connected` set to `true` and a `walletClient` for one to be
  sent.

`FluentWidgetRenderContext.wallet` (also on `useFluentWidget()`) is the External wallet state the
widget is using: the host's when the prop is passed, the widget's own otherwise
([api.md](api.md#fluentwidgetrendercontext)).

## `execution`

`FluentWidgetConfig.execution` takes a `FluentWidgetExecution`, every field optional
([api.md](api.md#fluentwidgetexecution)). Both sources are a `FluentWidgetExecutionSource`,
`"chain"` or `"bundler"` ([api.md](api.md#fluentwidgetexecutionsource)).

| Field | Default | What it sets |
|---|---|---|
| `feeSource` | `"chain"` | Where a Fluent ID's operation takes its fee quote from: the Fluent chain, or the bundler. |
| `receiptSource` | `"chain"` | Where the widget watches for the operation's inclusion: the Fluent chain, or the bundler. |
| `chainCheckBeforeSign` | `false` | `true` reads the Signer's chain before every signature, one extra round trip each. |

- **Default**: the values above, on both Networks. A `"chain"` source that fails falls back to
  the bundler on its own, within the operation that needed it. The defaults are the recommended
  setting.
- **When to use it**: leave it out. Set one field to `"bundler"` to take that one answer from
  the bundler for every operation, for example while diagnosing slow operations with Fluent.
- **Applies to**: a Fluent ID. `chainCheckBeforeSign` covers both its Batch operations and its
  `signMessage` and `signTypedData` signatures. An External wallet ignores `execution`.
- **Invalid values**: `<FluentWidget>` throws `FluentWidgetConfigError` from its render, with
  `code` `invalid_fee_source`, `invalid_receipt_source` or `invalid_chain_check_before_sign`
  ([errors.md](errors.md#fluentwidgetconfigerror)).

## `userOperationGas`

`userOperationGas` is an option of `execute()`, on `FluentBatchOperationExecuteOptions`. It takes
a `FluentUserOperationGas`, one of three shapes ([api.md](api.md#fluentuseroperationgas)):

| Shape | What the widget does |
|---|---|
| `{ callGasLimit }` | Uses this execution gas limit for the whole Batch operation and estimates the rest; the gas of a Gas token approval, explicit or the one the widget adds automatically, is spent inside this limit. |
| `{ callGasBuffer: { percentage?, fixed? } }` | Estimates, then adds `percentage` percent (rounded up), then `fixed` gas. |
| `{ skipEstimation: true, ... }` | Estimates nothing: the App fixes the account's limits, and either fixes the paymaster's too or leaves them to the paymaster. |

With `skipEstimation: true`, the account's three limits are a `FluentFixedAccountGas`
(`callGasLimit`, `verificationGasLimit`, `preVerificationGas`, all required), and the
paymaster's two are a `FluentFixedPaymasterGas` (`paymasterVerificationGasLimit` and
`paymasterPostOpGasLimit`): pass both, or neither to use the limits the paymaster authorizes
([api.md](api.md#fluentfixedaccountgas), [api.md](api.md#fluentfixedpaymastergas)).

For a Gas token payment, whatever the policy, the widget asks the paymaster for a
`paymasterPostOpGasLimit` of at least 50 000 gas: the paymaster charges the Gas token after
the operation, and ZeroDev refuses to authorize a USDnr payment whose request leaves that limit
at 0 or out. A larger limit, fixed or estimated, is asked for as it is. A `skipEstimation` policy
that fixes `paymasterPostOpGasLimit` below 50 000 for a Gas token payment therefore rejects with
`paymaster_gas_mismatch` before anything is signed.

- **Default**: omitted, the widget estimates every limit. Omitting it is the recommended
  setting.
- **When to use it**: a buffer when an operation's estimate runs short; fixed limits when the
  App knows them and wants no estimate.
- **Applies to**: the policy's shape is checked at the start of every `execute()`, before the
  Review, whatever the account kind, so an invalid shape rejects for an External wallet too. It
  shapes only a Fluent ID's operation: an External wallet's operation ignores a valid policy.
- **Errors**: `execute()` rejects with `FluentUserOperationGasError`, whose `code` is a
  `FluentUserOperationGasErrorCode` ([errors.md](errors.md#fluentuseroperationgaserror),
  [api.md](api.md#fluentuseroperationgaserror)). A `skipEstimation` policy of the wrong shape is
  `invalid_policy`. Two more checks of a `skipEstimation` policy run at submission, and only
  when a paymaster pays: only one of the two paymaster limits is `invalid_policy`, and a
  paymaster authorization that does not match the fixed limits is `paymaster_gas_mismatch`.
  For a Gas token payment they reject. Under Sponsorship they fail the sponsored submission
  instead, and the operation falls back to the account's own gas
  ([guides/sponsorship.md](guides/sponsorship.md)). An invalid `callGasLimit` or
  `callGasBuffer` without `skipEstimation` rejects with a plain `Error`. Keep a `default` branch
  in any `switch` over the code.

This component adds a fifth to the estimate and logs where the time went:

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";
import { parseEther, type Address } from "viem";

const RECIPIENT: Address = "0x0000000000000000000000000000000000000001";

export function TipWithHeadroom() {
  const { widget, status } = useFluentWidget();
  if (status !== "connected") return null;
  const tip = async () => {
    const result = await widget
      .createBatchOp({ calls: [{ to: RECIPIENT, value: parseEther("0.001"), data: "0x" }] })
      .execute({ userOperationGas: { callGasBuffer: { percentage: 20 } } });
    console.log(result.timing?.totalMs, result.paymaster);
  };
  return <button onClick={() => void tip()}>Tip 0.001 ETH</button>;
}
```

## `paymaster` and `timing`

Two members of `FluentExecuteResult`, what `execute()` resolves with
([api.md](api.md#fluentexecuteresult)).

`paymaster` is the address of the contract that paid the operation's gas, read off a Fluent ID's
receipt: the Sponsorship paymaster or a Gas token's paymaster.

- **Absent**: always for an External wallet, whose `sponsored` is always `false`. For a Fluent
  ID, whenever the receipt names no paymaster, which includes an operation the account paid for
  itself; `sponsored` is then `false`, or `null` after a sponsored submission.
- **When to use it**: to log or check which contract paid. To know whether Sponsorship paid,
  read the kept `sponsored` member instead.

`timing` is a `FluentExecuteTiming`: where one operation's milliseconds went
([api.md](api.md#fluentexecutetiming)).

- `prepareMs`, `signMs` and `broadcastMs` are measured on the page's clock, and each is absent
  when the widget could not measure it. `retryMs` is the time spent on submissions that did not
  settle, such as a refused Sponsorship before the fallback, and is `0` for an operation
  submitted once.
- `inclusionMs` and `detectMs` are signed estimates across the page's clock and the chain's,
  so either can be negative when it is small. Both are absent when the including block could
  not be read.
- `totalMs` runs from the first submission to the receipt. It is measured, not summed, and does
  not equal the sum of the parts.
- `instants`, a `FluentExecuteTimingInstants`, keeps the epoch-millisecond instants and the
  number of `attempts` the estimates were computed from
  ([api.md](api.md#fluentexecutetiminginstants)).
- **Absent**: always for an External wallet, whose wallet does its prompt, signing and
  broadcast in one call; and for a Fluent ID when the page's clock could not be read.
- **When to use it**: for logs and latency dashboards. It is collected for every Fluent ID
  operation, whatever `debugLogging` is set to.

## `gasPayment.ethValueByToken`

`FluentWidgetConfig.gasPayment.ethValueByToken` takes a `FluentGasPaymentEthRates`: what one
unit of each Gas token is worth in ETH, as a decimal string, keyed by its `FluentGasTokenSymbol`
([api.md](api.md#fluentgaspaymentethrates)).

- **What it does**: sets the rates behind the cost the widget shows beside each Gas token.
- **Default**: the widget works the rates out from the USD prices it reads for the Gas tokens,
  where it has them, with ETH at `"1"`. A rate set here wins over the derived one for its
  symbol; the others stay derived. The defaults are the recommended setting.
- **When to use it**: when the costs the widget shows for a Gas token are wrong for your App.
- **Applies to**: a Fluent ID, the only account kind that pays in a Gas token. An External
  wallet pays its gas in ETH.

## `customOAuthRedirectUrl`

`FluentWidgetConfig.customOAuthRedirectUrl` is passed to the provider behind Direct login as
its OAuth redirect URL ([api.md](api.md#fluentwidgetconfig)). The widget reads it nowhere else.

- **Default**: omitted, no redirect URL is passed.
- **When to use it**: in a Capacitor or other native app, where an OAuth return has to land on a
  Universal Link that the host app handles.
- **Requirements**: an absolute HTTPS URL, with no credentials, query string or fragment.
  Anything else makes `<FluentWidget>` throw `FluentWidgetConfigError` with `code`
  `invalid_option` ([errors.md](errors.md#fluentwidgetconfigerror)); a blank string counts as
  omitted. The exact URL must also be registered with Fluent among the allowed redirects of the
  App's login client.
- **Applies to**: the OAuth flows of the provider behind Direct login. Which of them return to
  this URL is the provider's to decide, not the widget's.

## `swapper`

`FluentWidgetConfig.swapper` sets up the on-ramp that the account drawer's Get USDnr button
opens: `enabled`, `integratorId`, `dstChainId` and `dstTokenAddress`
([api.md](api.md#fluentwidgetconfig)).

- **Default**: `enabled` is `true`, and the other three are Fluent's own: the on-ramp buys
  USDnr on Fluent mainnet. The defaults are the recommended setting.
- **When to use it**: `enabled: false` turns the on-ramp off; Get USDnr is then disabled, with
  "Not configured for this app" on hover.
- **Applies to**: a Fluent ID on mainnet. The on-ramp delivers to the Fluent ID's address, so
  Get USDnr is disabled while no Fluent ID is connected. On testnet, Get USDnr mints testnet
  USDnr instead and `swapper` is not read.

## `sponsorshipUrl`

`FluentWidgetConfig.sponsorshipUrl` points the widget at a sponsorship service other than the
Network's own ([api.md](api.md#fluentwidgetconfig)).

- **Default**: the deployed sponsorship service of the configured Network.
- **When to use it**: local development of the sponsorship service only. Every real
  integration uses the default.
- **Applies to**: Sponsorship of a Fluent ID's operations. An External wallet is never
  sponsored.

## `privyClientId`

`FluentWidgetConfig.privyClientId` is the login client Fluent issues for the App, a `client-…`
value ([api.md](api.md#fluentwidgetconfig)). It carries the origins allow-listed for Direct
login; `appId` is what names the App for Sponsorship, Auth tokens and analytics.

- **Default**: none. It is required today although it is marked experimental: it exists while
  login runs on the current provider, and goes when Fluent's own login replaces it.
- **Errors**: `<FluentWidget>` throws `FluentWidgetConfigError` with `code` `missing_option`
  when it is absent or empty, and `invalid_option` when it does not start with `client-`, an
  `app_…` id included ([errors.md](errors.md#fluentwidgetconfigerror)).
- **Applies to**: every App, whatever account kind its users connect.
