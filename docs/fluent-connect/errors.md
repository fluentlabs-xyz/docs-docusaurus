---
sidebar_position: 5
---

# Errors

Every error the widget hands an App on purpose is an instance of one of six classes, each with
a string `code`. This page lists every code of each class, the call that throws it today, what it
means and what to do. The [API reference](api.md#auth-and-errors) holds the declarations.

## How to branch

Check the class with `instanceof`, then `switch` on `code`. Keep a `default` branch in every
`switch` over a code or status union: a later release may add a code, and a `switch` without a
`default` branch would then fall through in silence.

```ts
import {
  FluentAuthError,
  FluentReviewRejectedError,
  FluentSponsorshipFallbackError,
} from "@fluent.xyz/connect";

export function describeError(error: unknown): string {
  if (error instanceof FluentReviewRejectedError) return "You dismissed the request.";
  if (error instanceof FluentSponsorshipFallbackError) {
    switch (error.code) {
      case "unreachable":
        return "The sponsorship service did not answer, and paying your own gas failed too.";
      default:
        return "The operation could not be sent.";
    }
  }
  if (error instanceof FluentAuthError) {
    switch (error.code) {
      case "not_connected":
        return "Connect first.";
      case "rate_limited":
        return "Too many requests; try again in a minute.";
      default:
        return `Sign-in failed (${error.code}).`;
    }
  }
  return "Something went wrong.";
}
```

An error a call does not list here (a wallet's own refusal, a reverted call, a network failure)
reaches the App as it was thrown: keep a fallback for it too. The exception is
[`FluentSponsorshipFallbackError`](#fluentsponsorshipfallbackerror), which wraps such errors.

The calls named in "Thrown by":

| Call | Where it is |
|---|---|
| `<FluentWidget>` | rendering the widget with its `config` |
| `execute()` | `widget.createBatchOp({ calls }).execute()` |
| `signMessage()`, `signTypedData()` | `widget.signMessage(…)`, `widget.signTypedData(…)` |
| `getAuthToken()`, `linkX()` | the render context, or `useFluentWidget()` |
| `useLinkX()` | its `linkX()`, which also keeps the error in `error` |

## `FluentWidgetConfigError`

Thrown during the render of `<FluentWidget>` when its `config` cannot be used, so the nearest
error boundary catches it. The config is resolved again on every render that passes a new
`config` object: keep `config` stable (a module constant or a memo). The message names the
option to fix. See [configuration.md](configuration.md).

| `code` | Thrown by | What it means | What to do |
|---|---|---|---|
| `missing_option` | `<FluentWidget>` | A required option is absent: `config` itself `undefined` or `null`, `appId` or `privyClientId` absent or empty, or `network` `undefined` or `null` (an empty `network` is `invalid_option`). | Pass the option; `network` has no default. |
| `invalid_option` | `<FluentWidget>` | An option holds a value the widget cannot use: an `appId` or `privyClientId` of the wrong shape, a `network` other than `"testnet"` and `"mainnet"`, a `customOAuthRedirectUrl` that is not an absolute HTTPS URL, a `gasPayment.defaultToken` that names no Gas token of the Network, an `enabledAuthMethods` or `quickSign.whitelistAddresses` that is not a list, a `quickSign.whitelistAddresses` entry that is not an address, an `avatar.defaultLogoUrl` that is not a string. | Fix the value the message names. |
| `removed_option` | `<FluentWidget>` | An option an earlier release removed is still passed: `clientId`, `partnerId`, or an `authMode` other than `"direct"` (`"direct"` only logs a warning). | Remove the option. |
| `invalid_fee_source` | `<FluentWidget>` | The experimental `execution.feeSource` is neither `"chain"` nor `"bundler"`. | Fix it, or leave `execution` out. |
| `invalid_receipt_source` | `<FluentWidget>` | The experimental `execution.receiptSource` is neither `"chain"` nor `"bundler"`. | Fix it, or leave `execution` out. |
| `invalid_chain_check_before_sign` | `<FluentWidget>` | The experimental `execution.chainCheckBeforeSign` is not a boolean. | Fix it, or leave `execution` out. |

## `FluentAuthError`

A refused Auth token, signature or X link. `code` is a `FluentAuthErrorCode`; `status` is the
service's HTTP status when the service refused. Where the service answers with a code of its
own, this package names it here. A service code this package does not name arrives as
`service_refused` from `getAuthToken()`, and as `link_failed` from `linkX()`. Not every rejection
of `getAuthToken()` is a `FluentAuthError`: a failure to read a Fluent ID's Direct-login
credential arrives as it was thrown.

| `code` | Thrown by | What it means | What to do |
|---|---|---|---|
| `not_connected` | `getAuthToken()`, `signMessage()`, `signTypedData()` | No Widget account is connected, or an External wallet is connected but its client is not ready yet (for `getAuthToken()`, only when the call has to sign the Sign-in challenge). | Wait for `widget.account.executionReady` to be `true`, then call again. |
| `root_signer_required` | `signMessage()`, `signTypedData()` | Neither of a Fluent ID's signing paths signs with its root Signer. A guard: no configuration of the widget reaches it today. | Report it to Fluent. |
| `login_credential_missing` | `getAuthToken()` | A Fluent ID's Direct login left no credential in the page. | Ask the person to connect again. |
| `origin_mismatch` | `getAuthToken()` | The Sign-in challenge names an origin other than the page's, so the External wallet was not asked to sign. | Report it to Fluent with the page's origin. |
| `request_failed` | `getAuthToken()` | The request did not reach the service, its answer carried no code or no token, or the External wallet refused to sign the Sign-in challenge. | Retry once the network is back; when the person refused to sign, retrying prompts the wallet again. |
| `service_refused` | `getAuthToken()` | The service refused with a code this package does not name; the message carries that code. | Log the message and report it. |
| `unknown_app` | `getAuthToken()` | The service does not know the App's `appId`. | Check `appId`. |
| `app_not_auth_enabled` | `getAuthToken()` | Auth tokens are not enabled for the App. | Ask Fluent to enable them. |
| `origin_not_allowed` | `getAuthToken()` | The page's origin is not registered on the App. | Ask Fluent to add the origin. |
| `origin_missing` | `getAuthToken()` | The request carried no origin. | Call from a page, not from a worker or a server. |
| `bad_request` | `getAuthToken()`, `linkX()`, `useLinkX()` | The service refused the request body. | Report it to Fluent: the request is this package's. |
| `challenge_unknown` | `getAuthToken()` | The service does not know the Sign-in challenge the External wallet signed. | Call again. |
| `challenge_used` | `getAuthToken()` | The Sign-in challenge was already used. The call retries once with a fresh one, which prompts the External wallet again, and rejects with whatever the retry fails with. | Call again. |
| `challenge_expired` | `getAuthToken()` | The Sign-in challenge expired before it was signed. Retried once, as above. | Call again. |
| `app_mismatch` | `getAuthToken()` | The credential or challenge belongs to another App. | Check `appId`. |
| `invalid_signature` | `getAuthToken()` | The External wallet's signature over the Sign-in challenge does not verify. | Call again; a smart-contract wallet must be deployed to sign the Sign-in challenge. |
| `signature_prefix_rejected` | `getAuthToken()` | The External wallet signed with a prefix the service refuses. Retried once, as above. | Call again. |
| `address_already_linked` | `getAuthToken()` | The External wallet is already bound to another person. | Tell the person to use the account it is bound to. |
| `invalid_login_credential` | `getAuthToken()` | The service did not accept a Fluent ID's Direct-login credential. | Ask the person to connect again. |
| `no_signer` | `getAuthToken()` | The service finds no Signer for the Fluent ID. | Ask the person to connect again; report it if it persists. |
| `invalid_refresh_token` | none | Not delivered: when the service refuses the stored refresh credential, `getAuthToken()` forgets it and opens a new Service session within the same call, which can prompt an External wallet. | Nothing. |
| `refresh_token_reused` | none | Not delivered, for the same reason as `invalid_refresh_token`. | Nothing. |
| `rate_limited` | `getAuthToken()` | Too many requests. | Retry later. |
| `internal` | `getAuthToken()` | The service failed. | Retry later. |
| `not_authenticated` | `linkX()`, `useLinkX()` | No Fluent ID or External wallet is connected, or the External wallet's client is not ready yet. | Connect first, or wait and call again. |
| `user_rejected` | `linkX()`, `useLinkX()` | The person said no at X, closed the flow, or declined a signature the link needed. | Nothing; offer the button again. |
| `linked_to_another_user` | `linkX()`, `useLinkX()` | That X account is already linked to another person. | Tell the person. |
| `link_failed` | `linkX()`, `useLinkX()` | Anything else under the link, including a refusal from the Auth token it mints (its message is kept) and a link record left in the tab for another account, which is discarded. | Call again. |

`getAuthToken()` throws the codes of its rows today, and `linkX()` throws its five. A code a later
release adds arrives in the `default` branch. Keep a fallback outside the `instanceof` check too:
not every rejection is a `FluentAuthError`.

## `FluentReviewRejectedError`

The person dismissed a Review instead of confirming it. `review` is `"transaction"` or
`"signature"`, and `code` says the same as a `FluentReviewRejectedErrorCode`. When a Fluent ID
shows a Review is in [concepts.md](concepts.md#prompt-mode-and-silent-mode). A Review that a
newer one replaces, or that closes because the widget unmounts, rejects with a plain `Error`.

| `code` | Thrown by | What it means | What to do |
|---|---|---|---|
| `transaction_review_rejected` | `execute()` | The person dismissed the Review of a Batch operation. An External wallet shows its own prompt instead, and its refusal arrives as the wallet's error. | Nothing: the person said no. |
| `signature_review_rejected` | `signMessage()`, `signTypedData()` | The person dismissed the Review of a signature, which an External wallet always shows. | Nothing: the person said no. |

## `FluentSponsorshipFallbackError`

A Fluent ID's sponsored submission failed, and the own-gas submission after it failed too
([which failures become this error](guides/sponsorship.md#both-failed-fluentsponsorshipfallbackerror)).
`code` (equal to `sponsorshipReason`) says why the sponsored submission failed; `fallbackError`
is the own-gas submission's error, and `cause` the sponsored submission's.

`cause` and `fallbackError` are not the errors the submissions threw, and not `Error` instances.
Each is a plain object with these fields and no others:

- `name`, a `string`: the name of the error the submission threw, such as `HttpRequestError`;
  `Error` when what it threw is not an `Error`.
- `message`, a `string`: the text of the innermost error along the thrown error's `cause`
  chain that has any, usually the vendor's own sentence, such as `AA21 didn't pay prefund`. An
  `AggregateError` with `errors` contributes the texts of its first four, joined by `; `. A viem
  error's text is its `details`, or its short message when `details` is empty; when `details` is
  a JSON object with a string `message`, that `message`.
- `status`, a `number`: the first integer `status` along the error's cause chain, such as the
  sponsorship service's HTTP status. Absent when the chain has none.

The cause chain under the thrown error is not kept: its text is in `message` and its status in
`status`. When the thrown value cannot be read without an exception, for example a getter that
throws, the summary is `{ name: "Error", message: "[unreadable error]" }` and the App still
receives a `FluentSponsorshipFallbackError` with its `code`.

In `message`, here and in the error's own `message`, these forms are replaced by a placeholder:

| Form | Placeholder |
|---|---|
| A `{…}` or `[…]` span that balances, brackets inside double-quoted strings not counted (a request or response body). Each span is replaced on its own, so the text between two bodies is kept. | `[body]` |
| A URL with a scheme (`https://…`), up to the first character a URL cannot hold | `[url]` |
| `Bearer` followed by spaces, `%20` or `+` and a token, quoted or not | `[token]` |
| Three dot-separated base64url segments, the first at least 16 characters long and the second at least 2 (a JWT) | `[token]` |
| A `did:` id | `[id]` |
| An email address | `[email]` |
| A UUID | `[id]` |
| `0x` and 40 hex digits, or 64 | `[address]`, `[hash]` |
| `0x` and any other number of hex digits from 40 up (call data, a signature, revert data) | `[data 0x…]` with its first four bytes, the selector of a revert; for an `Error(string)` revert, `[data 0x08c379a0: <reason>]` with the decoded reason, redacted in the same way |

A Privy DID, an Auth token, an address, a user operation hash or an RPC key in one of these
forms does not reach a log of the whole error. Other forms are not looked for and are kept as
the vendor wrote them unless they happen to match a listed one, for example a URL without a
scheme, a URL-encoded `did:` id (`did%3Aprivy%3A…`), 40 hex digits without `0x`, a `Basic`
credential or an `x-api-key` header value.

| `code` | Thrown by | What it means | What to do |
|---|---|---|---|
| `denied` | `execute()` | Any failure of the sponsored submission the other codes do not name: the sponsorship service refused the operation, or the operation itself failed, for example a call that reverts. | Check the fallback's error in `fallbackError`: the account may lack the ETH to pay itself. |
| `unauthorized` | `execute()` | The sponsorship service refused the App (HTTP 403) or its Auth token (HTTP 401, also after one fresh token). | Ask Fluent whether Sponsorship is enabled for the App. |
| `unreachable` | `execute()` | The request to the sponsorship service failed with an HTTP status other than 401 and 403, or with none. | Retry later. |
| `no_token` | `execute()` | The service refused the Auth token, and minting a fresh one failed. | Retry; check that `getAuthToken()` works for this person. |
| `not_requested` | none | Never this error's code: it is the reason for an operation that did not ask for Sponsorship, which has no sponsored submission to fail. | Nothing. |

### What the submissions threw

The errors that reach the widget before it builds `cause` and `fallbackError`, on each of the two
paths that end in this error, as measured against viem 2.52.0 and `@zerodev/sdk` 5.5.10. Each
chain runs from the error thrown to the innermost `cause`. "Identifiers" says what the raw error
carried in its fields or its `message`. Of each raw error only the name, the text chosen for
`message` (redacted as above) and the status reach the error the App receives.

| Path | Error | Raw error | Vendor | Identifiers |
|---|---|---|---|---|
| After a failed forced token refresh (`no_token`) | `cause` | `HttpRequestError` with `status` 401, the paymaster's refusal of the first Auth token. The refusal of the fresh token's exchange is not part of the error. | The sponsorship paymaster, through viem's HTTP transport | Yes: `url` is the paymaster URL with the App's `appId`; `body`, repeated in `message`, is the `zd_sponsorUserOperation` request with the user operation: the smart account's address as `sender`, its call data and its signature. `details` is the paymaster's error text, whatever it holds. The Auth token is not carried: viem keeps the response's headers, not the request's. |
| After a failed forced token refresh (`no_token`) | `fallbackError` | `UserOperationExecutionError`, then the bundler error viem maps the refusal to (for example `InsufficientPrefundError`), then `InvalidParamsRpcError`, then `RpcRequestError`, then the JSON-RPC error object `{ code, message }`. | The ZeroDev bundler, through viem's HTTP transport; viem wraps it | Yes: `UserOperationExecutionError`'s `message` lists the user operation (`sender`, call data, signature, paymaster fields); `RpcRequestError`'s `url` is the bundler URL with the ZeroDev project id, and its `message` repeats the URL and the `eth_sendUserOperation` request body. The bundler's text is in `details`. |
| After a failed sponsored submission (`denied`, `unauthorized`, `unreachable`) | `cause` | For `unauthorized` and `unreachable`: `HttpRequestError` with `status` 401 (the fresh Auth token refused too), 403 or another status, or without a status when the request did not reach the paymaster, with the same fields as above. For `denied`, when the paymaster refuses the operation: an `RpcError` such as `InvalidParamsRpcError`, then `RpcRequestError`, then `{ code, message }`. For `denied`, when the operation itself fails, such as a call that reverts during gas estimation, or when the bundler refuses the sponsored submission: a `UserOperationExecutionError` chain as for `fallbackError`. | The sponsorship paymaster, through viem's HTTP transport; the ZeroDev bundler for the estimation | Yes: the paymaster URL with the App's `appId`, and the request body with the smart account's address, call data and signature, in `url`, `body` and `message`; the paymaster's or bundler's text in `details`. |
| After a failed sponsored submission (`denied`, `unauthorized`, `unreachable`) | `fallbackError` | The same `UserOperationExecutionError` chain as on the first path. | The ZeroDev bundler, through viem's HTTP transport; viem wraps it | Yes, as on the first path. |
| Either path | `fallbackError` | When the Signer refuses to sign the own-gas submission, Privy's provider error, unwrapped: viem signs outside the part of the submission it wraps. Its `name` is `Error`, its `message` `The user rejected the request.`, with `type` `provider_error`, `code` 4001 and `details`, an entry of Privy's error table. The summary is `{ name: "Error", message: "The user rejected the request." }`. | Privy, the Signer | No: a fixed sentence, a code and a table entry. |

None of the raw errors measured carried a Privy DID or a user operation hash in a field of its own;
either can still reach one inside a vendor's text, which is why `message` is redacted. The
sponsored submission signs too, once the paymaster has answered, so a Signer's refusal there
reaches `cause` the same way, with the code `denied`; that case was read from viem's code, not
measured.

## `FluentGasPaymentError`

A Fluent ID's Batch operation paid in a Gas token could not be prepared. Before the operation is
signed, the widget reads the address of the paymaster that charges Gas tokens, because the
approval it may add to the operation names that paymaster as the spender. It throws before any
signature is requested and before anything is sent, so the same operation can be tried again.
`cause` holds the error of the failed request when there was one. An External wallet pays its own
gas and never throws it.

| `code` | Thrown by | What it means | What to do |
|---|---|---|---|
| `paymaster_unavailable` | `execute()` | The request for the paymaster's address on the operation's Network failed, or its answer held no address, so the widget has no spender to approve the Gas token to. | Try again later, or pay in ETH (`gasPayment: { symbol: "ETH" }`). |

## `FluentUserOperationGasError`

*Experimental*: may change or be removed in a minor release, with the `userOperationGas` option
it belongs to ([experimental.md](experimental.md#useroperationgas)).

| `code` | Thrown by | What it means | What to do |
|---|---|---|---|
| `invalid_policy` | `execute()` | A `skipEstimation` policy cannot be used: `skipEstimation` is not a boolean, is combined with `callGasBuffer`, comes with fixed gas limits that are missing or out of range, or, for a Gas token payment, gives only one of the two paymaster gas limits. A bad `callGasLimit` or `callGasBuffer` without `skipEstimation` throws a plain `Error` instead. | Fix the option, or leave it out to let the widget estimate. |
| `paymaster_gas_mismatch` | `execute()` | With estimation skipped, the paymaster's authorization of a Gas token payment does not match the fixed gas limits. | Leave `userOperationGas` out for Gas token payments. |
