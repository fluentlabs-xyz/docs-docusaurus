---
sidebar_position: 7
---

# API reference

Every export of `@fluent.xyz/connect`: 65 names, 15 values and 50 types. A name or member marked **experimental** may change or be removed in a minor release; [experimental.md](experimental.md) explains each one. Every other name is kept after 0.6.0.

Each export shows its TSDoc, its declaration (a function's body left out), the literals of a union of strings, and a table of its members, nested members by their dotted path; a union of object types shows its members in its declaration instead.

## Contents

- [Widget and hooks](#widget-and-hooks): `FluentWidget`, `FluentWidgetProps`, `FluentWidgetRenderContext`, `FluentWidgetConnectButtonRenderContext`, `useFluentWidget`, `FluentWidgetStatus`, `FluentWidgetSession`, `FluentWidgetAccount`, `FluentAccountType`, `FluentAccountCapabilities`, `FluentWidgetExecutionStatus`, `AccountAvatar`, `AccountAvatarProps`
- [Config](#config): `FluentWidgetConfig`, `FluentWidgetNetwork`, `FluentWidgetAuthMethod`, `FluentWidgetAssets`
- [Batch operations](#batch-operations): `FluentBatchApi`, `FluentBatchOperationInput`, `FluentBatchCallInput`, `FluentBatchOperation`, `FluentBatchOperationExecuteOptions`, `FluentEncodedBatchCall`, `FluentExecuteResult`, `FluentGasPayment`, `FluentWidgetGasPayment`, `FluentGasTokenSymbol`
- [Signing](#signing): `FluentSignApi`, `FluentSigningMode`
- [Auth and errors](#auth-and-errors): `FluentAuthError`, `FluentAuthErrorCode`, `FluentWidgetConfigError`, `FluentWidgetConfigErrorCode`, `FluentReviewRejectedError`, `FluentReviewRejectedErrorCode`, `FluentSponsorshipFallbackError`, `FluentSponsorshipReason`, `FluentGasPaymentError`, `FluentGasPaymentErrorCode`
- [Link X](#link-x): `useLinkX`, `FluentLinkXStatus`, `FluentLinkXResult`, `FluentXAccount`
- [Iframe](#iframe): `useFluentIframeBridge`, `UseFluentIframeBridgeOptions`, `FluentIframeElement`
- [Chains and tokens](#chains-and-tokens): `fluentMainnet`, `fluentTestnet`, `getFluentChainByChainId`, `getFluentChainForNetwork`, `FluentChainDefinition`, `FluentTokenDefinition`
- [Experimental](#experimental): `FluentPrivyAdapter`, `FluentExternalWalletState`, `FluentWalletChoice`, `FluentWidgetExecution`, `FluentWidgetExecutionSource`, `FluentUserOperationGas`, `FluentUserOperationGasError`, `FluentUserOperationGasErrorCode`, `FluentFixedAccountGas`, `FluentFixedPaymasterGas`, `FluentExecuteTiming`, `FluentExecuteTimingInstants`, `FluentGasPaymentEthRates`

## Widget and hooks

### `FluentWidget`

*value*

The Fluent Connect widget: the connect button, the sign-in dialog, the account drawer and the
Widget API, provided to the App's own content rendered through `renderHome` or `renderPage`.

**Throws** `FluentWidgetConfigError` from a render when `config` cannot be used, its `code`
`missing_option`, `invalid_option` or `removed_option` with the option named in its message,
or, for the experimental `execution`, `invalid_fee_source`, `invalid_receipt_source` or
`invalid_chain_check_before_sign`. The config is resolved again on every render that passes
a new `config` object, so such a render can throw too; keep `config` stable (a module
constant or a memo) to resolve it once.

**Example**

```tsx
import { FluentWidget, type FluentWidgetConfig } from "@fluent.xyz/connect";

// The App's id, its login client and the Network: see the configuration guide.
declare const config: FluentWidgetConfig;

export function App() {
  return <FluentWidget config={config} mode="page" renderPage={() => <main>Your App</main>} />;
}
```

```ts declaration
export function FluentWidget(props: FluentWidgetProps) { … }
```

### `FluentWidgetProps`

*type*

The props of `<FluentWidget>`.

```ts declaration
export type FluentWidgetProps = {
  wallet?: FluentExternalWalletState | null;
  config: FluentWidgetConfig;
  privyAdapter?: FluentPrivyAdapter;
  mode?: "home" | "page";
  connectButton?: "fixed" | "inline" | false;
  renderConnectButton?: (context: FluentWidgetConnectButtonRenderContext) => ReactNode;
  renderHome?: (context: FluentWidgetRenderContext) => ReactNode;
  renderPage?: (context: FluentWidgetRenderContext) => ReactNode;
  tokens?: readonly FluentTokenDefinition[];
  debugLogging?: boolean;
  onSessionChange?: (session: FluentWidgetSession | null) => void;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `wallet` | `FluentExternalWalletState \| null` | yes | **yes** | An External wallet the host connects itself, a `FluentExternalWalletState` whose inline choices are `FluentWalletChoice`s; omit it to let the widget connect one. **Experimental.** May change or be removed in a minor release: a host that brings its own wallet connection is not a 0.6.0 commitment. |
| `config` | `FluentWidgetConfig` | no | no |  |
| `privyAdapter` | `FluentPrivyAdapter` | yes | **yes** | Optional native Privy SDK bridge, a `FluentPrivyAdapter`, for a host that runs Privy's native SDK; requires Direct login. **Experimental.** May change or be removed in a minor release: the one provider seam of the widget, kept for hosts that run a native login SDK. |
| `mode` | `"home" \| "page"` | yes | no |  |
| `connectButton` | `"fixed" \| "inline" \| false` | yes | no | Show the default connect/account control. - `"fixed"` (default) — top-right floating button - `"inline"` — same button, no fixed positioning (host places via CSS / wrapper) - `false` — hide; use `renderConnectButton`, `openConnect`, or `openAccount` |
| `renderConnectButton` | `(context: FluentWidgetConnectButtonRenderContext) => ReactNode` | yes | no | Replace the default connect button UI / placement entirely. |
| `renderHome` | `(context: FluentWidgetRenderContext) => ReactNode` | yes | no |  |
| `renderPage` | `(context: FluentWidgetRenderContext) => ReactNode` | yes | no |  |
| `tokens` | `readonly FluentTokenDefinition[]` | yes | no | Integrator tokens the widget lists beside its Default tokens; see `FluentTokenDefinition`. |
| `debugLogging` | `boolean` | yes | no | Print the widget's internal connect / smart-account / signing diagnostics to the console, and show the debug panel in `mode="home"`. Off by default; turn on only while debugging an integration. |
| `onSessionChange` | `(session: FluentWidgetSession \| null) => void` | yes | no | Called each time the widget writes its stored session: with the new `FluentWidgetSession` when a Fluent ID signs in by Direct login, and with `null` on a disconnect through the widget. It is not called for a session restored from storage on mount, nor when an External wallet connects; read the render context's `session` and `widget.account` for those. |

### `FluentWidgetRenderContext`

*type*

What the widget hands an App's own content: the Widget session, the Widget API, the External
wallet, and the calls that open the widget's screens, disconnect, mint an Auth token and link
X. `renderHome` and `renderPage` receive it, and `useFluentWidget()` returns it.

```ts declaration
export type FluentWidgetRenderContext = {
  session: FluentWidgetSession | null;
  userAvatarUrl?: string;
  userXDisplayName?: string;
  userGoogleName?: string;
  wallet: FluentExternalWalletState | null;
  widget: FluentBatchApi;
  openConnect: () => void;
  openAccount: () => void;
  disconnect: () => Promise<void>;
  hasConnectedAccount: boolean;
  status: FluentWidgetStatus;
  refreshBalances: () => void;
  getAuthToken: () => Promise<string>;
  linkX: () => Promise<FluentLinkXResult>;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `session` | `FluentWidgetSession \| null` | no | no | Who is signed in, or `null`: a `FluentWidgetSession`. Once `onSessionChange` has fired on this page, equal to (not the same object as) the last value it received; a session restored from storage is here before any callback. Connecting an External wallet neither writes nor clears it; read the connected account from `widget.account`. |
| `userAvatarUrl` | `string` | yes | no | The Account avatar's linked X picture; absent for an External wallet or `forceDefault`. |
| `userXDisplayName` | `string` | yes | no | The display name of the person's linked X account, the name X shows above the handle, not the handle. Absent when no X account is linked or X reports no name for it, and while an External wallet is connected without a Fluent ID. `avatar.forceDefault` does not hide it. |
| `userGoogleName` | `string` | yes | no | The name on the Google account linked to the person's Direct login. Absent when none is linked or Google reports no name for it, and while an External wallet is connected without a Fluent ID. `avatar.forceDefault` does not hide it. |
| `wallet` | `FluentExternalWalletState \| null` | no | **yes** | The External wallet as the widget sees it, a `FluentExternalWalletState` whose inline choices are `FluentWalletChoice`s, or `null`. **Experimental.** May change or be removed in a minor release: a host that brings its own wallet connection is not a 0.6.0 commitment. |
| `widget` | `FluentBatchApi` | no | no | The Widget API: the account, Batch operations, signatures and the current Gas payment. |
| `openConnect` | `() => void` | no | no | Opens the sign-in dialog, the same one the connect button opens. A click event passed to it is ignored, so it can be handed straight to `onClick`. |
| `openAccount` | `() => void` | no | no | Opens the account drawer, as the connect button does once a Widget account is connected. |
| `disconnect` | `() => Promise<void>` | no | no | Tear down the current session without going through the widget's account menu — the same teardown that menu's "Disconnect" runs. The session and the stored identity token are cleared before this resolves, so a host can await it before resetting its own state. It also asks the service to revoke the Service session, and any Service session that a `getAuthToken()` still out at the disconnect opens later, and resolves once those requests have been answered or have failed, so it can take as long as that `getAuthToken()` does. A failed revocation is not retried: the promise resolving does not prove the service ended the Service session. |
| `hasConnectedAccount` | `boolean` | no | no | Whether a Widget account, a Fluent ID or an External wallet, is connected now. `false` while a stored session is still being restored: branch on `status` to tell that apart. |
| `status` | `FluentWidgetStatus` | no | no | Connection state as a single value that is meaningful on every render — including the first, before a stored session has been reconciled. Branch on this rather than on `hasConnectedAccount` alone: `"restoring"` and `"disconnected"` both have `hasConnectedAccount === false`, and treating them alike shows a Connect button to users who are already signed in. The account's address is `widget.account.address`. |
| `refreshBalances` | `() => void` | no | no | Refetch the widget's on-chain balances. Transactions run through `widget.createBatchOp` refresh automatically, and the wallet menu reads them itself when it opens and every 10 seconds while it stays open; call this to show a tx sent via an External wallet client (outside the widget's execution path) before the next scheduled read. |
| `getAuthToken` | `() => Promise<string>` | no | no | A short-lived (5 min) Auth token, a Fluent-signed JWT for the connected person. Verify it on your backend against `<iss>/.well-known/jwks.json` (ES256), checking `iss`, `aud` (= your appId) and `exp`; `sub` is stable per person per App. Reused until `authTokenRenewalOffsetSeconds` before `exp`, then renewed; a renewal the service accepts asks the wallet for nothing. When the wallet is asked to sign: [guides/backend-auth.md](guides/backend-auth.md#renewal). External wallets: EOAs and deployed smart-contract wallets sign in; a not-yet-deployed smart account cannot (no ERC-6492). **Throws** `FluentAuthError`, its `code` one of: - `not_connected`: no Widget account is connected, or an External wallet has no client when the call has to sign the Sign-in challenge; - `login_credential_missing`: a Fluent ID's login left no credential in the page; - `origin_mismatch`: the Sign-in challenge names an origin other than the page's; - `request_failed`: the request did not reach the service, its answer carried no code or no token, or the External wallet refused to sign the Sign-in challenge; - `service_refused`: the service refused with a code this SDK does not name; - a code the service answered with: `unknown_app`, `app_not_auth_enabled`, `origin_not_allowed`, `origin_missing`, `bad_request`, `challenge_unknown`, `challenge_used`, `challenge_expired`, `app_mismatch`, `invalid_signature`, `signature_prefix_rejected`, `address_already_linked`, `invalid_login_credential`, `no_signer`, `rate_limited` or `internal`. A refused refresh credential is not among them: the call forgets it and signs in again within the same call, which can prompt the External wallet. Keep a `default` branch. |
| `linkX` | `() => Promise<FluentLinkXResult>` | no | no | Link an X account to the connected person, headless: no widget screen, no settings page, one call. Idempotent and re-enterable, because linking X needs an OAuth round trip that leaves the page. A person who already has X resolves `{ status: "linked", x }` without leaving the page. A person who has none resolves `{ status: "redirecting" }` once the navigation to X has started: the page is unloading, so nothing on it may wait for the link to finish. When the browser comes back, `useLinkX()` calls `linkX()` again on mount, and it resolves `linked`; nothing public tells a page that calls `linkX()` itself that it is a return from X. A link somebody else started in this tab, or a stale record of one, is discarded rather than resumed: the call does no work and rejects with `link_failed`; call again to start one for the signed-in person. An External wallet can be asked to sign before either result: [guides/link-x.md](guides/link-x.md) says when. **Throws** `FluentAuthError`, whose codes today are `user_rejected`, `linked_to_another_user`, `not_authenticated`, `bad_request` and `link_failed`; keep a `default` branch for any code a later release adds. |

### `FluentWidgetConnectButtonRenderContext`

*type*

What `renderConnectButton` receives to draw its own connect button.

```ts declaration
export type FluentWidgetConnectButtonRenderContext = {
  connected: boolean;
  pending: boolean;
  addressLabel?: string;
  userAvatarUrl?: string;
  userXDisplayName?: string;
  userGoogleName?: string;
  onClick: () => void;
  openConnect: () => void;
  openAccount: () => void;
  DefaultButton: () => ReactNode;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `connected` | `boolean` | no | no |  |
| `pending` | `boolean` | no | no | True while a Fluent ID's smart account is being prepared after sign-in. |
| `addressLabel` | `string` | yes | no |  |
| `userAvatarUrl` | `string` | yes | no | The Account avatar's linked X picture; absent for an External wallet or `forceDefault`. |
| `userXDisplayName` | `string` | yes | no | The person's X display name, the render context's `userXDisplayName`. |
| `userGoogleName` | `string` | yes | no | The person's Google name, the render context's `userGoogleName`. |
| `onClick` | `() => void` | no | no |  |
| `openConnect` | `() => void` | no | no |  |
| `openAccount` | `() => void` | no | no |  |
| `DefaultButton` | `() => ReactNode` | no | no |  |

### `useFluentWidget`

*value*

Access the Fluent widget render context from any component rendered inside
`<FluentWidget>` (e.g. within `renderHome` / `renderPage`). Returns the same
object the render props receive — `session`, `widget`, `openConnect`, etc. —
so host apps no longer need to prop-drill it. The Widget API is
`useFluentWidget().widget`.

Throws if used outside `<FluentWidget>`.

**Example**

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";

const calls = [{ to: "0x000000000000000000000000000000000000dEaD", value: 1n, data: "0x" }] as const;

export function Send() {
  const { widget, status } = useFluentWidget();
  if (status !== "connected") return null;
  return <button onClick={() => widget.createBatchOp({ calls }).execute()}>Send</button>;
}
```

```ts declaration
export function useFluentWidget(): FluentWidgetRenderContext { … }
```

### `FluentWidgetStatus`

*type*

Top-level connection state of the widget, safe to read on any render.

The distinction that matters is `"restoring"` vs `"disconnected"`: a session
restored from a previous visit is not known synchronously, so a host that
treats "not connected yet" as "no account" will render a Connect button at
users who do have a live session. Wait out `"restoring"` instead.

- `"restoring"` — a previous session may exist; nothing is decided yet.
- `"connecting"` — a sign-in the user started is in flight.
- `"connected"` — an account is available. Whether it can send transactions
  *right now* is a separate question — see `widget.account.executionStatus`.
- `"disconnected"` — no account, and none is being restored or negotiated.

```ts declaration
export type FluentWidgetStatus = "restoring" | "connecting" | "connected" | "disconnected";
```

Literals: `connected`, `connecting`, `disconnected`, `restoring`.

### `FluentWidgetSession`

*type*

What the widget tells an App about who is signed in: the Widget account's address and type,
and when the widget built that snapshot. Not a credential: an App proves who the person is
with an Auth token from `getAuthToken()`.

Only a Fluent ID's Direct login writes a session. Connecting an External wallet neither writes nor
clears it; read the connected account from `widget.account`.

```ts declaration
export type FluentWidgetSession = {
  account: {
    address: Address;
    type: FluentAccountType;
  };
  issuedAt: number;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `account` | `{ address: Address; type: FluentAccountType; }` | no | no |  |
| `account.address` | `Address` | no | no | The Fluent ID's smart account address. |
| `account.type` | `FluentAccountType` | no | no | `"smart"`: today a session is only ever a Fluent ID's. `FluentAccountType` may gain values, so a `switch` over it keeps a `default` branch. |
| `issuedAt` | `number` | no | no | The local time the widget built the snapshot, in Unix seconds from the browser's clock; not a time the service attests. A session restored on a later page load keeps that time. |

### `FluentWidgetAccount`

*type*

The Widget account as the Widget API reports it: its address and type, whether it is
connected and can send now, and what it can do.

```ts declaration
export type FluentWidgetAccount = {
  address?: Address;
  connected: boolean;
  executionReady: boolean;
  executionStatus: FluentWidgetExecutionStatus;
  executionError?: string;
  type?: FluentAccountType;
  capabilities: FluentAccountCapabilities;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `address` | `Address` | yes | no | The Widget account's address: the Fluent ID's, or the External wallet's. |
| `connected` | `boolean` | no | no | Whether a Widget account, a Fluent ID or an External wallet, is connected. |
| `executionReady` | `boolean` | no | no | Whether the Widget account can send now; `executionStatus` says why it cannot. |
| `executionStatus` | `FluentWidgetExecutionStatus` | no | no | Where sending stands, a `FluentWidgetExecutionStatus`. |
| `executionError` | `string` | yes | no | The message of the last failure to prepare the Fluent ID's account, if any: the reason an `executionStatus` of `"error"` gives. |
| `type` | `FluentAccountType` | yes | no | Active account kind, or undefined when nothing is connected. |
| `capabilities` | `FluentAccountCapabilities` | no | no | What the active account can do — lets hosts adapt UI without branching on `type`. |

### `FluentAccountType`

*type*

How the connected account executes transactions.

```ts declaration
export type FluentAccountType = "smart" | "eoa";
```

Literals: `eoa`, `smart`.

### `FluentAccountCapabilities`

*type*

What the Widget account can do, so a host adapts its UI without branching on its type.

```ts declaration
export type FluentAccountCapabilities = {
  atomicBatch: boolean;
  erc20Gas: boolean;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `atomicBatch` | `boolean` | no | no | Multiple calls land in a single atomic transaction (smart account only). |
| `erc20Gas` | `boolean` | no | no | Gas can be paid in an ERC-20 (BLEND / USDnr) via the paymaster instead of native ETH — smart account only. This is NOT free/sponsored gas: the user still pays, just in a token. |

### `FluentWidgetExecutionStatus`

*type*

Whether the Widget account can send now: `ready`, `disconnected`, `unavailable` (connected
but not ready yet) or `error` (see `FluentWidgetAccount.executionError`).

```ts declaration
export type FluentWidgetExecutionStatus = "disconnected" | "ready" | "unavailable" | "error";
```

Literals: `disconnected`, `error`, `ready`, `unavailable`.

### `AccountAvatar`

*value*

The Account avatar: the person's linked X picture, else the host's default logo, else the
Fluent mark.

**Example**

```tsx
import { AccountAvatar, useFluentWidget } from "@fluent.xyz/connect";

export function Avatar() {
  const { userAvatarUrl } = useFluentWidget();
  return <AccountAvatar userAvatarUrl={userAvatarUrl} />;
}
```

```ts declaration
export function AccountAvatar({ userAvatarUrl, defaultLogoUrl, className }: AccountAvatarProps) { … }
```

### `AccountAvatarProps`

*type*

The props of `AccountAvatar`.

```ts declaration
export type AccountAvatarProps = {
  userAvatarUrl?: string | null;
  defaultLogoUrl?: string | null;
  className?: string;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `userAvatarUrl` | `string \| null` | yes | no | The person's linked X picture, the render context's `userAvatarUrl`. Wins over `defaultLogoUrl`. |
| `defaultLogoUrl` | `string \| null` | yes | no | Host-supplied stand-in for the Fluent mark — a URL or a data URI. |
| `className` | `string` | yes | no |  |

## Config

### `FluentWidgetConfig`

*type*

The configuration of one `<FluentWidget>`, fixed for the App's deployment.

```ts declaration
export type FluentWidgetConfig = {
  appId: string;
  privyClientId: string;
  clientId?: never;
  partnerId?: never;
  network: FluentWidgetNetwork;
  appName?: string;
  customOAuthRedirectUrl?: string;
  enabledAuthMethods?: FluentWidgetAuthMethod[];
  swapper?: {
    enabled?: boolean;
    integratorId?: string;
    dstChainId?: string;
    dstTokenAddress?: string;
  };
  gasPayment?: {
    defaultToken?: FluentGasTokenSymbol;
    sponsorship?: "auto" | "never";
    ethValueByToken?: FluentGasPaymentEthRates;
  };
  execution?: FluentWidgetExecution;
  quickSign?: {
    whitelistAddresses?: readonly string[];
  };
  reputationEnabled?: boolean;
  source?: string;
  campaign?: string;
  disableAnalytics?: boolean;
  reconnectOnMount?: boolean;
  sponsorshipUrl?: string;
  authTokenRenewalOffsetSeconds?: number;
  assets?: Partial<FluentWidgetAssets>;
  avatar?: {
    defaultLogoUrl?: string;
    forceDefault?: boolean;
  };
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `appId` | `string` | no | no | The App's id (`app_<32 hex>`) — the same string the Fluent Dashboard shows and the token's `aud` carries. |
| `privyClientId` | `string` | no | **yes** | The Privy app client issued by Fluent for this App. Login configuration, not identity: it carries the allowed origins for Privy login, while `appId` is what sponsorship, auth and analytics speak. Required while login runs on Privy. **Experimental.** May change or be removed in a minor release: it exists while login runs on Privy, and goes when Fluent's own login replaces it. |
| `clientId` | `never` | yes | no | Removed in 0.2.0 — the type exists only so the error names the fix. |
| `partnerId` | `never` | yes | no | Renamed to `appId` in 0.3.0 — the type exists only so the error names the fix. |
| `network` | `FluentWidgetNetwork` | no | no | The Network the widget runs on. It picks the chain, the funds, the login app, the account project and the service, so the App names it: the widget reads no environment variable for it and has no default. |
| `appName` | `string` | yes | no |  |
| `customOAuthRedirectUrl` | `string` | yes | **yes** | An HTTPS URL passed to the provider behind Direct login as its OAuth redirect URL. When to use it: [experimental.md](experimental.md#customoauthredirecturl). **Experimental.** May change or be removed in a minor release: it configures the redirect of the login provider the widget runs on today. |
| `enabledAuthMethods` | `FluentWidgetAuthMethod[]` | yes | no | Sign-in methods the sign-in dialog offers beside X, in the order given. Defaults to `["google", "email", "passkey"]` — all of them; name a shorter set to drop the rest, or `[]` to leave X as the only Fluent method. Sign-in with X is always offered and is not a value here. A method still has to be enabled for the App by Fluent — listing it here only decides whether its button is drawn. |
| `swapper` | `{ enabled?: boolean; integratorId?: string; dstChainId?: string; dstTokenAddress?: string; }` | yes | **yes** | The swap entry in the account drawer. **Experimental.** May change or be removed in a minor release while the defaults are measured; the defaults are the recommended setting. |
| `swapper.enabled` | `boolean` | yes | no |  |
| `swapper.integratorId` | `string` | yes | no |  |
| `swapper.dstChainId` | `string` | yes | no |  |
| `swapper.dstTokenAddress` | `string` | yes | no |  |
| `gasPayment` | `{ defaultToken?: FluentGasTokenSymbol; sponsorship?: "auto" \| "never"; ethValueByToken?: FluentGasPaymentEthRates; }` | yes | no |  |
| `gasPayment.defaultToken` | `FluentGasTokenSymbol` | yes | no | Initial/fallback token. Defaults to ETH; a valid saved user choice wins. |
| `gasPayment.sponsorship` | `"auto" \| "never"` | yes | no | Native-gas sponsorship policy. Defaults to `auto`; `never` skips the paymaster. |
| `gasPayment.ethValueByToken` | `FluentGasPaymentEthRates` | yes | **yes** | What one unit of each Gas token is worth in ETH, a `FluentGasPaymentEthRates` keyed by `FluentGasTokenSymbol`, for the cost the widget shows beside each Gas token. **Experimental.** May change or be removed in a minor release while the defaults are measured; the defaults are the recommended setting. |
| `execution` | `FluentWidgetExecution` | yes | **yes** | How a Fluent ID's send is executed: a `FluentWidgetExecution`, each of whose sources is a `FluentWidgetExecutionSource`. Every field defaults to the fast path, which falls back to the bundler on its own: set a field to switch that one answer to the bundler for good. **Experimental.** May change or be removed in a minor release while the defaults are measured; the defaults are the recommended setting. |
| `quickSign` | `{ whitelistAddresses?: readonly string[]; }` | yes | no |  |
| `quickSign.whitelistAddresses` | `readonly string[]` | yes | no | Call targets Quick sign may execute without the Review. With a list set, a Batch operation runs in Silent mode only when every call's `to` is on it; a single call to any other address shows the Review, even with Quick sign on. An empty list is honoured and stops Quick sign from silencing anything; omit the option to keep it covering every address. Compared case-insensitively. `signMessage` / `signTypedData` have no call target and are not scoped by this. |
| `reputationEnabled` | `boolean` | yes | no | `false` drops the Reputation tab that follows Tokens and Activity in the account drawer. The families request is never made. Default `true`. |
| `source` | `string` | yes | no |  |
| `campaign` | `string` | yes | no |  |
| `disableAnalytics` | `boolean` | yes | no | Turns off all analytics: PostHog is never initialised, nothing is sent or stored. |
| `reconnectOnMount` | `boolean` | yes | no | Restore injected wallets and WalletConnect by default; true restores all, false restores none. |
| `sponsorshipUrl` | `string` | yes | **yes** | Point the widget at a sponsorship service other than the network default. Local development only: the deployed URL is the one every real integration should use. **Experimental.** May change or be removed in a minor release while the defaults are measured; the defaults are the recommended setting. |
| `authTokenRenewalOffsetSeconds` | `number` | yes | no | `getAuthToken()` reuses a token until this many seconds before its `exp`, then fetches a fresh one (the renewal-offset pattern: MSAL's `tokenRenewalOffsetSeconds`, Go oauth2's `expiryDelta`). Default 30. Set 0 to drop the margin entirely: a token is then reused until `exp` itself, which is not the same as always fetching — it is the case the margin exists for, a token handed out a moment before it expires and rejected by the backend it is sent to. |
| `assets` | `Partial<FluentWidgetAssets>` | yes | no | Images for the widget; see `FluentWidgetAssets`. |
| `avatar` | `{ defaultLogoUrl?: string; forceDefault?: boolean; }` | yes | no | The account avatar shown on the connect button and in the account drawer. |
| `avatar.defaultLogoUrl` | `string` | yes | no | Image used when there is no X avatar to show — a URL or a data URI. Defaults to the Fluent mark. |
| `avatar.forceDefault` | `boolean` | yes | no | Always show `defaultLogoUrl`, even for users who signed in with X. Default `false` (the linked X picture wins when the person has one). |

### `FluentWidgetNetwork`

*type*

Which of Fluent's two deployments the widget runs on.

```ts declaration
export type FluentWidgetNetwork = "testnet" | "mainnet";
```

Literals: `mainnet`, `testnet`.

### `FluentWidgetAuthMethod`

*type*

A sign-in method the sign-in dialog can offer beside X. X is not on this list:
it is always offered and cannot be switched off.

```ts declaration
export type FluentWidgetAuthMethod = "google" | "email" | "passkey";
```

Literals: `email`, `google`, `passkey`.

### `FluentWidgetAssets`

*type*

Images for the widget, each a URL or a data URI. Today the widget reads only `fluentLogo`,
which it passes to the provider behind Direct login as its logo; see `assets` in
[configuration.md](configuration.md).

```ts declaration
export type FluentWidgetAssets = {
  fluentLogo: string;
  walletConnectIcon: string;
  metamaskIcon: string;
  coinbaseIcon: string;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `fluentLogo` | `string` | no | no | The Fluent mark. |
| `walletConnectIcon` | `string` | no | no | The WalletConnect icon. |
| `metamaskIcon` | `string` | no | no | The MetaMask icon. |
| `coinbaseIcon` | `string` | no | no | The Coinbase Wallet icon. |

## Batch operations

### `FluentBatchApi`

*type*

The Widget API: what the widget gives an App's code to act for the Widget account. Reached as
`widget` in the render context or from `useFluentWidget()`.

```ts declaration
export type FluentBatchApi = FluentSignApi & {
  account: FluentWidgetAccount;
  signingMode: FluentSigningMode;
  gasPayment: FluentWidgetGasPayment;
  createBatchOp: (input: FluentBatchOperationInput) => FluentBatchOperation;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `signMessage` | `(params: { message: SignableMessage }) => Promise<Hex>` | no | no | EIP-191 signature. ERC-1271 (ERC-6492 before deployment) for a smart account, ECDSA for an External wallet. **Throws** `FluentReviewRejectedError` with `code` `signature_review_rejected` when the person dismisses the Review: always shown for an External wallet, and for a Fluent ID unless Quick sign is on. An External wallet's refusal in its own prompt rejects with the wallet's error. **Throws** `FluentAuthError` with `code` `not_connected` when no Widget account is connected or the External wallet has no client, and `root_signer_required` when neither of the Fluent ID's signing paths signs with its root Signer, a guard no configuration reaches today. (example below) |
| `signTypedData` | `< const typedData extends TypedData \| Record<string, unknown>, primaryType extends keyof typedData \| "EIP712Domain" = keyof typedData, >( typedData: TypedDataDefinition<typedData, primaryType>, ) => Promise<Hex>` | no | no | EIP-712 signature. ERC-1271 (ERC-6492 before deployment) for a smart account, ECDSA for an External wallet. **Throws** `FluentReviewRejectedError` with `code` `signature_review_rejected` when the person dismisses the Review, as for `signMessage`. **Throws** `FluentAuthError` with `code` `not_connected` or `root_signer_required`, as for `signMessage`. (example below) |
| `account` | `FluentWidgetAccount` | no | no | The Widget account: its address, type, readiness and capabilities. |
| `signingMode` | `FluentSigningMode` | no | no | How the widget signs by default: `"silent"` while the person's Quick sign is on. |
| `gasPayment` | `FluentWidgetGasPayment` | no | no | The Gas payment chosen in the widget, which `execute()` uses when given no `gasPayment`. |
| `createBatchOp` | `(input: FluentBatchOperationInput) => FluentBatchOperation` | no | no | Builds a Batch operation, encoding its calls now; `execute()` sends it. **Throws** `Error` when `calls` is empty, or when a call has neither `data` nor `abi` with `method`: a call that still names its function in 0.5's `functionName` is one. |

**`signMessage` example**

```ts
import { useFluentWidget } from "@fluent.xyz/connect";

export function useSignGreeting() {
  const { widget } = useFluentWidget();
  return () => widget.signMessage({ message: "Sign in to Marketplace" });
}
```

**`signTypedData` example**

```ts
import { useFluentWidget } from "@fluent.xyz/connect";

const verifyingContract = "0x0000000000000000000000000000000000000001";
const order = { maker: "0x0000000000000000000000000000000000000002", price: 100n } as const;

export function useSignOrder() {
  const { widget } = useFluentWidget();
  return () =>
    widget.signTypedData({
      domain: { name: "Marketplace", version: "1", chainId: 20994, verifyingContract },
      types: {
        Order: [
          { name: "maker", type: "address" },
          { name: "price", type: "uint256" },
        ],
      },
      primaryType: "Order",
      message: order,
    });
}
```

### `FluentBatchOperationInput`

*type*

What `widget.createBatchOp` takes: the calls of one Batch operation, and its Review title.

```ts declaration
export type FluentBatchOperationInput = {
  id?: string;
  reviewTitle?: string;
  calls: readonly FluentBatchCallInput[];
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `id` | `string` | yes | no |  |
| `reviewTitle` | `string` | yes | no | Heading of this Batch operation's Review (Fluent ID, Prompt mode). Defaults to the widget's own copy, "Confirm transaction". |
| `calls` | `readonly FluentBatchCallInput[]` | no | no |  |

### `FluentBatchCallInput`

*type*

One contract call of a Batch operation: either raw `data`, or an `abi` with the `method` to
encode and its `args`.

```ts declaration
export type FluentBatchCallInput = {
  id?: string;
  label?: string;
  to: Address;
  value?: bigint;
  data?: Hex;
  abi?: Abi;
  method?: string;
  args?: readonly unknown[];
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `id` | `string` | yes | no |  |
| `label` | `string` | yes | no |  |
| `to` | `Address` | no | no |  |
| `value` | `bigint` | yes | no | Native ETH sent with the call, in wei. Defaults to `0n`. |
| `data` | `Hex` | yes | no |  |
| `abi` | `Abi` | yes | no |  |
| `method` | `string` | yes | no | The ABI function to encode, with `abi` and `args`, when `data` is not given. |
| `args` | `readonly unknown[]` | yes | no |  |

### `FluentBatchOperation`

*type*

A Batch operation `widget.createBatchOp` built: its calls, encoded, and `execute`, which sends
them for the Widget account.

```ts declaration
export type FluentBatchOperation = {
  id?: string;
  reviewTitle?: string;
  calls: readonly FluentBatchCallInput[];
  encodedCalls: FluentEncodedBatchCall[];
  canExecute: boolean;
  execute: (options?: FluentBatchOperationExecuteOptions) => Promise<FluentExecuteResult>;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `id` | `string` | yes | no | `FluentBatchOperationInput.id`, copied. |
| `reviewTitle` | `string` | yes | no | `FluentBatchOperationInput.reviewTitle`, copied. |
| `calls` | `readonly FluentBatchCallInput[]` | no | no | The calls as the host passed them. |
| `encodedCalls` | `FluentEncodedBatchCall[]` | no | no | The same calls encoded, in order: what `execute()` sends. |
| `canExecute` | `boolean` | no | no | Whether the widget could send the operation when it was built: the Widget account ready, or able to prepare itself when `execute()` is called. Not updated afterwards; read `widget.account.executionReady` for the live value. |
| `execute` | `(options?: FluentBatchOperationExecuteOptions) => Promise<FluentExecuteResult>` | no | no | Executes the operation for the Widget account and resolves once it is included. **Throws** `FluentReviewRejectedError` with `code` `transaction_review_rejected` when the person dismisses the Review, which a Fluent ID shows in Prompt mode; an External wallet's refusal in its own prompt rejects with the wallet's error. **Throws** `FluentSponsorshipFallbackError` when a Fluent ID asked for Sponsorship, a sponsored submission failed, and the submission in which the account pays its own gas failed too; its `code` says why Sponsorship failed: `denied`, `unauthorized`, `unreachable` or `no_token`. A failure while waiting for an operation's inclusion is not wrapped: it rejects with its own error, and an operation whose wait failed was submitted. What else is not wrapped: [guides/sponsorship.md](guides/sponsorship.md#both-failed-fluentsponsorshipfallbackerror). **Throws** `FluentUserOperationGasError` (experimental) with `code` `invalid_policy` for a `skipEstimation` policy that cannot be used (other invalid `userOperationGas` values throw a plain `Error`), and `paymaster_gas_mismatch` when, with estimation skipped, the paymaster's authorization of a Gas token payment does not match the fixed gas limits. Under Sponsorship, a failed check of the paymaster's gas fails the sponsored submission instead, and the account pays its own gas. **Throws** `FluentGasPaymentError` with `code` `paymaster_unavailable` when a Fluent ID's operation is paid in a Gas token and the address of the paymaster to approve it to cannot be read; nothing has been signed or sent. |

### `FluentBatchOperationExecuteOptions`

*type*

The options of `FluentBatchOperation.execute`, every one optional.

```ts declaration
export type FluentBatchOperationExecuteOptions = {
  confirmation?: FluentSigningMode;
  gasPayment?: FluentGasPayment;
  userOperationGas?: FluentUserOperationGas;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `confirmation` | `FluentSigningMode` | yes | no | The `FluentSigningMode` of this operation. Defaults to the widget's `signingMode`, which follows the person's Quick sign. A `"silent"` operation with a call outside `quickSign.whitelistAddresses` is signed as `"prompt"`. Any value but `"silent"`, 0.5's `"always"` and `"session"` included, is `"prompt"`. Ignored for an External wallet. |
| `gasPayment` | `FluentGasPayment` | yes | no | How the gas of this operation is paid. Defaults to the Gas payment chosen in the widget. |
| `userOperationGas` | `FluentUserOperationGas` | yes | **yes** | Fluent ID gas limits, estimation opt-out or headroom: a `FluentUserOperationGas`, whose fixed limits are a `FluentFixedAccountGas` and a `FluentFixedPaymasterGas`. Ignored for External wallet sends. **Experimental.** May change or be removed in a minor release while the gas policy is measured; omitting it, which lets the widget estimate, is the recommended setting. |

### `FluentEncodedBatchCall`

*type*

A Batch operation's call as it is sent: `data` encoded, `value` defaulted to `0n`.

```ts declaration
export type FluentEncodedBatchCall = {
  id?: string;
  label?: string;
  to: Address;
  value: bigint;
  data: Hex;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `id` | `string` | yes | no |  |
| `label` | `string` | yes | no |  |
| `to` | `Address` | no | no |  |
| `value` | `bigint` | no | no |  |
| `data` | `Hex` | no | no |  |

### `FluentExecuteResult`

*type*

Result of executing a batch operation.

```ts declaration
export type FluentExecuteResult = {
  hash: Hash;
  hashes: Hash[];
  receipt?: TransactionReceipt;
  userOpHash?: Hash;
  atomic: boolean;
  sponsored: boolean | null;
  paymaster?: Address;
  timing?: FluentExecuteTiming;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `hash` | `Hash` | no | no | Primary transaction hash — the final/target call (e.g. deposit/withdraw). |
| `hashes` | `Hash[]` | no | no | All transaction hashes in order. One for a smart-account UserOp; one per call for an EOA. |
| `receipt` | `TransactionReceipt` | yes | no | Included receipt for hash (the final EOA call); not a finality guarantee. |
| `userOpHash` | `Hash` | yes | no | ERC-4337 operation hash when executing through a smart account. |
| `atomic` | `boolean` | no | no | True when all calls landed atomically (smart account), false for sequential EOA txs. |
| `sponsored` | `boolean \| null` | no | no | Whether the App's Sponsorship paid the gas for this operation, read back off the settled operation (which contract the EntryPoint charged) first: a refused Sponsorship falls back to the account paying its own gas, so a flag set from asking for Sponsorship would report the fallback as a success. `false` for a Gas token payment and always for an External wallet, which has no paymaster. When a Fluent ID's receipt names no paymaster, the way the operation was sent decides: `false` when it made no sponsored submission (the fallback, `sponsorship: "never"`, Sponsorship unavailable or not configured), and `null` after a sponsored submission, where nothing says who paid. |
| `paymaster` | `Address` | yes | **yes** | The paymaster a Fluent ID's receipt names: the Sponsorship paymaster or a Gas token's paymaster, when one paid. Undefined when the receipt carried no paymaster — `sponsored` is then `false`, or `null` after a sponsored submission — and always for an External wallet, which has no paymaster. **Experimental.** May change or be removed in a minor release while the numbers are measured. |
| `timing` | `FluentExecuteTiming` | yes | **yes** | Where this send's milliseconds went, as a `FluentExecuteTiming` whose raw instants are a `FluentExecuteTimingInstants`. Fluent ID only: an External wallet performs its prompt, its signing and its broadcast behind one `sendTransaction` await, so EIP-1193 exposes no truthful instant to put a boundary on. **Experimental.** May change or be removed in a minor release while the numbers are measured. |

### `FluentGasPayment`

*type*

How one operation's gas is paid: a Gas token by symbol, or native ETH, and whether
Sponsorship is asked for.

Without `includeApproval`, the widget adds the approval of the Gas token to its ERC-20
paymaster at the start of the operation when the account's allowance is below the threshold:
1 USDnr when the allowance is below 0.1 USDnr, 10 BLEND when it is below 1 BLEND. An
allowance that cannot be read counts as none. `includeApproval: true` with an `approveAmount`
approves that amount instead, whatever the allowance. Either way the Review lists the
operation's own calls, and nothing is added for `"ETH"` or for an External wallet.

```ts declaration
export type FluentGasPayment = {
  /**
   * Gas token symbol. The widget resolves the ERC-20 address for the active
   * network internally — callers never pass (or risk mistyping) an address.
   * `"ETH"` means native gas (no ERC-20 paymaster).
   */
  symbol: FluentGasTokenSymbol;
  /**
   * Whether to ask the App's sponsorship paymaster to pay for this operation.
   *
   * `"auto"` tries Sponsorship, and if the paymaster refuses, resends with the account paying
   * its own gas. `"never"` skips the paymaster outright, so the account pays from the first
   * attempt and the result reports `sponsored: false`. What an omitted value means:
   * [guides/sponsorship.md](guides/sponsorship.md#not-asking-sponsorship-never-and-gas-tokens).
   *
   * Ignored when `symbol` names an ERC-20: that token's own paymaster pays,
   * and sponsorship is not in the picture.
   */
  sponsorship?: "auto" | "never";
} & (
  | {
      /** Approves `approveAmount` to the paymaster whatever the allowance, for a Gas token. */
      includeApproval: true;
      /** In the Gas token's smallest unit. */
      approveAmount: bigint;
    }
  | {
      includeApproval?: false;
      approveAmount?: never;
    }
);
```

### `FluentWidgetGasPayment`

*type*

The Gas payment chosen in the widget: the Gas token's symbol, its address and decimals.

```ts declaration
export type FluentWidgetGasPayment = {
  symbol: FluentGasTokenSymbol;
  token?: Address;
  decimals: number;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `symbol` | `FluentGasTokenSymbol` | no | no |  |
| `token` | `Address` | yes | no |  |
| `decimals` | `number` | no | no |  |

### `FluentGasTokenSymbol`

*type*

A symbol that can pay for gas. Deliberately `string`: which tokens are
payable is data on the token definitions now, not a fixed set of literals.

```ts declaration
export type FluentGasTokenSymbol = string;
```

## Signing

### `FluentSignApi`

*type*

The signatures of the Widget API, for the Widget account. A Fluent ID shows the Review in
Prompt mode and none in Silent mode; an External wallet always shows the Review, then its own
prompt.

```ts declaration
export type FluentSignApi = {
  signMessage: (params: { message: SignableMessage }) => Promise<Hex>;
  signTypedData: <
    const typedData extends TypedData | Record<string, unknown>,
    primaryType extends keyof typedData | "EIP712Domain" = keyof typedData,
  >(
    typedData: TypedDataDefinition<typedData, primaryType>,
  ) => Promise<Hex>;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `signMessage` | `(params: { message: SignableMessage }) => Promise<Hex>` | no | no | EIP-191 signature. ERC-1271 (ERC-6492 before deployment) for a smart account, ECDSA for an External wallet. **Throws** `FluentReviewRejectedError` with `code` `signature_review_rejected` when the person dismisses the Review: always shown for an External wallet, and for a Fluent ID unless Quick sign is on. An External wallet's refusal in its own prompt rejects with the wallet's error. **Throws** `FluentAuthError` with `code` `not_connected` when no Widget account is connected or the External wallet has no client, and `root_signer_required` when neither of the Fluent ID's signing paths signs with its root Signer, a guard no configuration reaches today. (example below) |
| `signTypedData` | `< const typedData extends TypedData \| Record<string, unknown>, primaryType extends keyof typedData \| "EIP712Domain" = keyof typedData, >( typedData: TypedDataDefinition<typedData, primaryType>, ) => Promise<Hex>` | no | no | EIP-712 signature. ERC-1271 (ERC-6492 before deployment) for a smart account, ECDSA for an External wallet. **Throws** `FluentReviewRejectedError` with `code` `signature_review_rejected` when the person dismisses the Review, as for `signMessage`. **Throws** `FluentAuthError` with `code` `not_connected` or `root_signer_required`, as for `signMessage`. (example below) |

**`signMessage` example**

```ts
import { useFluentWidget } from "@fluent.xyz/connect";

export function useSignGreeting() {
  const { widget } = useFluentWidget();
  return () => widget.signMessage({ message: "Sign in to Marketplace" });
}
```

**`signTypedData` example**

```ts
import { useFluentWidget } from "@fluent.xyz/connect";

const verifyingContract = "0x0000000000000000000000000000000000000001";
const order = { maker: "0x0000000000000000000000000000000000000002", price: 100n } as const;

export function useSignOrder() {
  const { widget } = useFluentWidget();
  return () =>
    widget.signTypedData({
      domain: { name: "Marketplace", version: "1", chainId: 20994, verifyingContract },
      types: {
        Order: [
          { name: "maker", type: "address" },
          { name: "price", type: "uint256" },
        ],
      },
      primaryType: "Order",
      message: order,
    });
}
```

### `FluentSigningMode`

*type*

How a Fluent ID signs: `"prompt"` shows the widget's Review first (Prompt mode), `"silent"`
signs with none (Silent mode), except that where the App set `quickSign.whitelistAddresses`, a
Batch operation with a call outside it is signed as `"prompt"`. An External wallet always
shows its own prompt.

```ts declaration
export type FluentSigningMode = "prompt" | "silent";
```

Literals: `prompt`, `silent`.

## Auth and errors

### `FluentAuthError`

*value*

A refused Auth token or X link. `code` is a `FluentAuthErrorCode`; `status` is the service's
HTTP status when the service refused it.

```ts declaration
export class FluentAuthError extends Error {
  constructor(
    readonly code: FluentAuthErrorCode,
    message: string,
    readonly status?: number,
  ) { … }
}
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `code` | `FluentAuthErrorCode` | no | no |  |
| `status` | `number` | yes | no |  |

### `FluentAuthErrorCode`

*type*

Why `getAuthToken()`, `linkX()`, or `widget.signMessage()` / `widget.signTypedData()` was
refused (the signatures throw `not_connected` and `root_signer_required`). The codes are the
SDK's own, named for the product rather than for a vendor or a mechanism: where the service
answers with a code of its own, the SDK maps it here before it reaches the App, and a service
code the SDK does not name reaches `getAuthToken()` as `service_refused` and `linkX()` as
`link_failed`. Keep a `default` branch in a
`switch` over them: a later release may add a code.

```ts declaration
export type FluentAuthErrorCode =
  // the service's codes, as the SDK names them
  | "unknown_app"
  | "app_not_auth_enabled"
  | "origin_not_allowed"
  | "origin_missing"
  | "bad_request"
  | "challenge_unknown"
  | "challenge_used"
  | "challenge_expired"
  | "app_mismatch"
  | "invalid_signature"
  | "signature_prefix_rejected"
  | "address_already_linked"
  | "invalid_login_credential"
  | "no_signer"
  | "invalid_refresh_token"
  | "refresh_token_reused"
  | "rate_limited"
  | "internal"
  // client-side
  | "not_connected"
  | "root_signer_required"
  | "login_credential_missing"
  | "origin_mismatch"
  | "request_failed"
  // the service refused with a code this SDK does not name; the message carries that code
  | "service_refused"
  // client-side, linking an X account (`linkX()`)
  | "not_authenticated"
  | "user_rejected"
  | "linked_to_another_user"
  | "link_failed";
```

Literals: `address_already_linked`, `app_mismatch`, `app_not_auth_enabled`, `bad_request`, `challenge_expired`, `challenge_unknown`, `challenge_used`, `internal`, `invalid_login_credential`, `invalid_refresh_token`, `invalid_signature`, `link_failed`, `linked_to_another_user`, `login_credential_missing`, `no_signer`, `not_authenticated`, `not_connected`, `origin_mismatch`, `origin_missing`, `origin_not_allowed`, `rate_limited`, `refresh_token_reused`, `request_failed`, `root_signer_required`, `service_refused`, `signature_prefix_rejected`, `unknown_app`, `user_rejected`.

### `FluentWidgetConfigError`

*value*

A value in `FluentWidgetConfig` the widget refuses to start with.

Thrown when `<FluentWidget>` renders with a config it has not resolved yet: on its first
render, and again on any render that passes a new `config` object. So it surfaces at startup
where the integrator is looking rather than at the first send. The message names the option and
how to fix it; `code`, a `FluentWidgetConfigErrorCode`, is what to branch on.

**Example**

```tsx
import { FluentWidgetConfigError } from "@fluent.xyz/connect";

export function WidgetBoundaryFallback({ error }: { error: unknown }) {
  // More than one option is required, and the message names the one that is missing.
  if (error instanceof FluentWidgetConfigError && error.code === "missing_option") {
    return <p>The widget config is missing a required option: {error.message}</p>;
  }
  throw error;
}
```

```ts declaration
export class FluentWidgetConfigError extends Error {
  readonly code: FluentWidgetConfigErrorCode;

  constructor(code: FluentWidgetConfigErrorCode, message: string) { … }
}
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `code` | `FluentWidgetConfigErrorCode` | no | no |  |

### `FluentWidgetConfigErrorCode`

*type*

Which value in `FluentWidgetConfig` was refused, for a host that branches rather than reads
the message.

```ts declaration
export type FluentWidgetConfigErrorCode =
  | "invalid_fee_source"
  | "invalid_receipt_source"
  | "invalid_chain_check_before_sign"
  /** A required option is absent or empty. */
  | "missing_option"
  /** An option holds a value the widget cannot use. */
  | "invalid_option"
  /** An option an earlier release removed or renamed is still passed. */
  | "removed_option";
```

Literals: `invalid_chain_check_before_sign`, `invalid_fee_source`, `invalid_option`, `invalid_receipt_source`, `missing_option`, `removed_option`.

### `FluentReviewRejectedError`

*value*

The person dismissed a Review (transaction or signature) instead of confirming it.

A class with a `code`, not a message, so a host branches on `code` and callers that translate
errors for another party — the iframe bridge maps it to EIP-1193 `4001` — recognise it
without parsing prose.

**Example**

```ts
import { FluentReviewRejectedError, type FluentBatchApi } from "@fluent.xyz/connect";

const calls = [{ to: "0x000000000000000000000000000000000000dEaD", value: 1n, data: "0x" }] as const;

export async function send(widget: FluentBatchApi) {
  try {
    await widget.createBatchOp({ calls }).execute();
  } catch (error) {
    if (error instanceof FluentReviewRejectedError) return; // the person said no
    throw error;
  }
}
```

```ts declaration
export class FluentReviewRejectedError extends Error {
  readonly code: FluentReviewRejectedErrorCode;

  constructor(readonly review: "transaction" | "signature") { … }
}
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `code` | `FluentReviewRejectedErrorCode` | no | no |  |
| `review` | `"transaction" \| "signature"` | no | no |  |

### `FluentReviewRejectedErrorCode`

*type*

Which Review the person dismissed: a Batch operation's or a signature's.

```ts declaration
export type FluentReviewRejectedErrorCode =
  | "transaction_review_rejected"
  | "signature_review_rejected";
```

Literals: `signature_review_rejected`, `transaction_review_rejected`.

### `FluentSponsorshipFallbackError`

*value*

Both the sponsored submission and the fallback, the account paying its own gas, failed.
`code` (equal to `sponsorshipReason`) says why Sponsorship was refused: `no_token`, `denied`,
`unauthorized` or `unreachable`, never `not_requested`. `fallbackError` is what the own-gas
submission failed with, and `cause` the sponsored submission's error.

Neither is the error that was thrown. Each is a plain object `{ name, message, status? }`:
`name` is the thrown error's name (`"Error"` for a thrown value that is not an `Error`),
`message` the text of the innermost error along its `cause` chain that has any (an
`AggregateError` gives the texts of its first four `errors`), and `status` the first integer
`status` along that chain, such as an HTTP status, present only when there is one; the chain
itself is not kept. A thrown value that cannot be read without an exception is summarized as
`{ name: "Error", message: "[unreadable error]" }`.

In `message`, here and in each of the two, a balanced `{…}` or `[…]` span becomes `[body]`, a
`scheme://` URL `[url]`, a `Bearer` token or a JWT `[token]`, a `did:` id or a UUID `[id]`, an
email address `[email]`, and `0x` with 40 or 64 hex digits `[address]` or `[hash]`. Any other
`0x` run of 40 or more hex digits becomes `[data 0x…]` with its first four bytes, and the
reason of an `Error(string)` revert is decoded and redacted in the same way.

```ts declaration
export class FluentSponsorshipFallbackError extends Error {
  readonly code: FluentSponsorshipReason;
  readonly sponsorshipReason: FluentSponsorshipReason;
  readonly fallbackError: unknown;

  constructor(params: {
    sponsorshipReason: FluentSponsorshipReason;
    sponsorshipError: unknown;
    fallbackError: unknown;
  }) { … }
}
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `code` | `FluentSponsorshipReason` | no | no |  |
| `sponsorshipReason` | `FluentSponsorshipReason` | no | no |  |
| `fallbackError` | `unknown` | no | no |  |

### `FluentSponsorshipReason`

*type*

Why an operation was not sponsored, and the `code` of a `FluentSponsorshipFallbackError`.
`not_requested` is the only one that is not a failure: the caller asked to pay its own gas,
so the sponsorship paymaster was never contacted. For the same reason it is never the error's
code, which is thrown only after a sponsored attempt failed: the error carries one of the
other four.

```ts declaration
export type FluentSponsorshipReason =
  | "no_token"
  | "denied"
  | "unauthorized"
  | "unreachable"
  | "not_requested";
```

Literals: `denied`, `no_token`, `not_requested`, `unauthorized`, `unreachable`.

### `FluentGasPaymentError`

*value*

A Gas token payment the widget could not prepare. Thrown by `execute()` of a Fluent ID's Batch
operation paid in a Gas token, before any signature is requested and before anything is sent,
so the operation can be tried again as it is. `code`, a `FluentGasPaymentErrorCode`,
identifies the failure; `cause` holds the error of the failed request when there was one.

```ts declaration
export class FluentGasPaymentError extends Error {
  constructor(
    readonly code: FluentGasPaymentErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) { … }
}
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `code` | `FluentGasPaymentErrorCode` | no | no |  |

### `FluentGasPaymentErrorCode`

*type*

Why a `FluentGasPaymentError` was thrown. `paymaster_unavailable`: the request for the address
of the paymaster that charges Gas tokens on the operation's Network failed, or its answer held
no address, so the widget has no spender to approve the Gas token to. Keep a `default` branch
in a `switch` over it: a later release may add a code.

```ts declaration
export type FluentGasPaymentErrorCode = "paymaster_unavailable";
```

Literals: `paymaster_unavailable`.

## Link X

### `useLinkX`

*value*

Linking X as a component sees it: the call, and what the last one did.

`redirecting` is the status a page is unlikely to render for long — it is set just before the
browser leaves for X — and `linked` after a return is what the mount-time re-entry produces
without the component asking for anything.

**Throws** From `linkX`, as the render context's `linkX()` does: a `FluentAuthError` whose `code`
is today `not_authenticated`, `user_rejected`, `linked_to_another_user`, `bad_request` or
`link_failed` (keep a `default` branch); the same error is kept in `error`.

**Example**

```tsx
import { useLinkX } from "@fluent.xyz/connect";

export function LinkXButton() {
  const { linkX, status, x, error } = useLinkX();
  if (x) return <span>Linked as @{x.handle}</span>;
  return (
    <button onClick={() => void linkX().catch(() => undefined)} disabled={status === "pending"}>
      {error ? `Retry (${error.code})` : "Link X"}
    </button>
  );
}
```

```ts declaration
export function useLinkX(): {
  linkX: () => Promise<FluentLinkXResult>;
  status: FluentLinkXStatus;
  x: FluentXAccount | null;
  error: FluentAuthError | null;
} { … }
```

### `FluentLinkXStatus`

*type*

Where `useLinkX()`'s last link stands: `idle` before any, `pending` while one runs,
`redirecting` just before the browser leaves for X, `linked` once the Linked X account is
there, `error` when the last one was refused.

```ts declaration
export type FluentLinkXStatus = "idle" | "pending" | "redirecting" | "linked" | "error";
```

Literals: `error`, `idle`, `linked`, `pending`, `redirecting`.

### `FluentLinkXResult`

*type*

What a `linkX()` resolves: `linked` with the Linked X account, or `redirecting` while the page
leaves for X.

```ts declaration
export type FluentLinkXResult =
  | { status: "linked"; x: FluentXAccount }
  /** The page is leaving for X. Call linkX() again after the return; useLinkX() does it on mount. */
  | { status: "redirecting" };
```

### `FluentXAccount`

*type*

One X account as the Fluent auth service reports it.

```ts declaration
export type FluentXAccount = {
  id: string;
  handle: string;
  avatarUrl: string;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `id` | `string` | no | no |  |
| `handle` | `string` | no | no |  |
| `avatarUrl` | `string` | no | no |  |

## Iframe

### `useFluentIframeBridge`

*value*

Lets a page embedded in `iframeRef` use the account signed in here, over the
JSON-RPC `postMessage` protocol `@ledgerhq/iframe-provider` speaks. The bridge lives
while the component is mounted; the bridge states the chain and account before its
first reply, and sign-in and sign-out reach the iframe as `accountsChanged`.

**Parameter** iframeRef The `<iframe>` the embedded page runs in; read on every message, so an
element swapped in after mount is still answered.

**Parameter** options `allowedOrigin`, the one origin whose messages are answered.

**Throws** `Error`, from the effect that builds the bridge (so to the nearest error boundary),
when `allowedOrigin` is not an `http:` or `https:` origin: `"*"` and a bare host are
refused.

**Example**

```tsx
import { useFluentIframeBridge } from "@fluent.xyz/connect";
import { useRef } from "react";

export function Marketplace() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useFluentIframeBridge(iframeRef, { allowedOrigin: "https://market.example" });
  return <iframe ref={iframeRef} src="https://market.example/collection/cards" />;
}
```

```ts declaration
export function useFluentIframeBridge(
  iframeRef: RefObject<FluentIframeElement | null>,
  { allowedOrigin }: UseFluentIframeBridgeOptions,
): void { … }
```

### `UseFluentIframeBridgeOptions`

*type*

The options of `useFluentIframeBridge`.

```ts declaration
export type UseFluentIframeBridgeOptions = {
  allowedOrigin: string;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `allowedOrigin` | `string` | no | no | The exact origin the embedded page is served from. Messages from any other origin are dropped without a reply: this is the only origin check in the exchange. |

### `FluentIframeElement`

*type*

The iframe element, reduced to the window the bridge replies to. Read on every
message, so an element swapped in later is picked up without rebuilding the bridge.

```ts declaration
export type FluentIframeElement = {
  contentWindow: { postMessage: (message: unknown, targetOrigin: string) => void } | null;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `contentWindow` | `{ postMessage: (message: unknown, targetOrigin: string) => void } \| null` | no | no |  |
| `contentWindow.postMessage` | `(message: unknown, targetOrigin: string) => void` | no | no |  |

## Chains and tokens

### `fluentMainnet`

*value*

Fluent mainnet (chain id 25363)

```ts declaration
export const fluentMainnet: Chain;
```

### `fluentTestnet`

*value*

Fluent public testnet (chain id 20994)

```ts declaration
export const fluentTestnet: Chain;
```

### `getFluentChainByChainId`

*value*

Looks up a Fluent chain by its EVM chain id, among the chains the registry knows: Fluent
testnet (`20994`) and Fluent mainnet (`25363`).

**Parameter** chainId The EVM chain id, as a wallet or `eth_chainId` reports it.

**Returns** The chain's `FluentChainDefinition`, or `undefined` for any other chain id,
an L1's included.

**Example**

```ts
import { getFluentChainByChainId } from "@fluent.xyz/connect";

export const explorer = getFluentChainByChainId(20994)?.blockExplorers.default.url;
```

```ts declaration
export function getFluentChainByChainId(
  chainId: number,
): FluentChainDefinition | undefined { … }
```

### `getFluentChainForNetwork`

*value*

The viem chain of a Network, for a host's own chain config.

**Example**

```ts
import { getFluentChainForNetwork } from "@fluent.xyz/connect";

export const chain = getFluentChainForNetwork("mainnet"); // chain.id === 25363
```

```ts declaration
export function getFluentChainForNetwork(network: FluentWidgetNetwork): Chain { … }
```

### `FluentChainDefinition`

*type*

One Fluent chain as the registry describes it: its ids, native currency, RPC and explorer
endpoints, its L1 parent and its contracts. Declared rather than inferred from
`fluentChainSchema`, so its shape is what this file says; `chainDefinitionMatchesSchema`
below fails the build if the two drift apart.

```ts declaration
export type FluentChainDefinition = {
  id: string;
  name: string;
  chainId: number;
  testnet: boolean;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: { default: { http: string[]; webSocket?: string[] } };
  blockExplorers: { default: { name: string; url: string } };
  infoURL: string;
  faucets?: string[];
  parent?: { type: "L2"; chainId: number; bridgeUrl: string };
  contracts?: {
    fluentBridge?: { address: string; implementation?: string };
    nativeGateway?: { address: string; implementation?: string };
    erc20Gateway?: { address: string; implementation?: string };
    wethGateway?: { address: string; implementation?: string };
    universalTokenFactory?: { address: string; implementation?: string };
    paymentGateway?: { address: string; implementation?: string };
    peggedTokenPrecompile?: { address: string };
  };
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `id` | `string` | no | no | The registry's own id: `"fluent-testnet"`, `"fluent-mainnet"`. |
| `name` | `string` | no | no |  |
| `chainId` | `number` | no | no |  |
| `testnet` | `boolean` | no | no |  |
| `nativeCurrency` | `{ name: string; symbol: string; decimals: number }` | no | no |  |
| `nativeCurrency.name` | `string` | no | no |  |
| `nativeCurrency.symbol` | `string` | no | no |  |
| `nativeCurrency.decimals` | `number` | no | no |  |
| `rpcUrls` | `{ default: { http: string[]; webSocket?: string[] } }` | no | no |  |
| `rpcUrls.default` | `{ http: string[]; webSocket?: string[] }` | no | no |  |
| `rpcUrls.default.http` | `string[]` | no | no |  |
| `rpcUrls.default.webSocket` | `string[]` | yes | no |  |
| `blockExplorers` | `{ default: { name: string; url: string } }` | no | no |  |
| `blockExplorers.default` | `{ name: string; url: string }` | no | no |  |
| `blockExplorers.default.name` | `string` | no | no |  |
| `blockExplorers.default.url` | `string` | no | no |  |
| `infoURL` | `string` | no | no |  |
| `faucets` | `string[]` | yes | no |  |
| `parent` | `{ type: "L2"; chainId: number; bridgeUrl: string }` | yes | no | The L1 the chain settles to, and where its bridge is. |
| `parent.type` | `"L2"` | no | no |  |
| `parent.chainId` | `number` | no | no |  |
| `parent.bridgeUrl` | `string` | no | no |  |
| `contracts` | `{ fluentBridge?: { address: string; implementation?: string }; nativeGateway?: { address: string; implementation?: string }; erc20Gateway?: { address: string; implementation?: string }; wethGateway?: { address: string; implementation?: string }; universalTokenFactory?: { address: string; implementation?: string }; paymentGateway?: { address: string; implementation?: string }; peggedTokenPrecompile?: { address: string }; }` | yes | no | Addresses of the chain's system contracts, each with its implementation when proxied. |
| `contracts.fluentBridge` | `{ address: string; implementation?: string }` | yes | no |  |
| `contracts.fluentBridge.address` | `string` | no | no |  |
| `contracts.fluentBridge.implementation` | `string` | yes | no |  |
| `contracts.nativeGateway` | `{ address: string; implementation?: string }` | yes | no |  |
| `contracts.nativeGateway.address` | `string` | no | no |  |
| `contracts.nativeGateway.implementation` | `string` | yes | no |  |
| `contracts.erc20Gateway` | `{ address: string; implementation?: string }` | yes | no |  |
| `contracts.erc20Gateway.address` | `string` | no | no |  |
| `contracts.erc20Gateway.implementation` | `string` | yes | no |  |
| `contracts.wethGateway` | `{ address: string; implementation?: string }` | yes | no |  |
| `contracts.wethGateway.address` | `string` | no | no |  |
| `contracts.wethGateway.implementation` | `string` | yes | no |  |
| `contracts.universalTokenFactory` | `{ address: string; implementation?: string }` | yes | no |  |
| `contracts.universalTokenFactory.address` | `string` | no | no |  |
| `contracts.universalTokenFactory.implementation` | `string` | yes | no |  |
| `contracts.paymentGateway` | `{ address: string; implementation?: string }` | yes | no |  |
| `contracts.paymentGateway.address` | `string` | no | no |  |
| `contracts.paymentGateway.implementation` | `string` | yes | no |  |
| `contracts.peggedTokenPrecompile` | `{ address: string }` | yes | no |  |
| `contracts.peggedTokenPrecompile.address` | `string` | no | no |  |

### `FluentTokenDefinition`

*type*

A token a host adds to the list the widget shows: an Integrator token. It describes the token
and grants nothing — whether a token can pay for gas is a property only Default tokens have,
so the widget would strip any such field from a host's token anyway.

```ts declaration
export type FluentTokenDefinition = {
  chainId: number;
  address?: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `chainId` | `number` | no | no | The chain the token lives on. The widget does not filter by it: pass the Network's tokens. |
| `address` | `Address` | yes | no | The token's contract address; absent for the chain's native token. |
| `name` | `string` | no | no |  |
| `symbol` | `string` | no | no |  |
| `decimals` | `number` | no | no |  |
| `logoURI` | `string` | yes | no | An image for the token, a URL or a data URI. |

## Experimental

### `FluentPrivyAdapter`

*type* · **experimental**

Privy runtime supplied by a host using a native SDK. Its Provider owns session
restoration, login and wallet RPC; web hosts keep the normal React SDK.
Keep one stable adapter per runtime. Changing its Provider remounts descendants
so React hooks from different SDKs never share a component lifetime.

**Experimental.** May change or be removed in a minor release: the one provider seam of the
widget, kept for hosts that run a native login SDK.

```ts declaration
export type FluentPrivyAdapter = Pick<
  typeof web,
  | "PrivyProvider"
  | "Captcha"
  | "usePrivy"
  | "useSignMessage"
  | "useSignTypedData"
  | "useWallets"
  | "useIdentityToken"
  | "useUser"
  | "useLinkAccount"
  | "useLoginWithSiwe"
  | "useModalStatus"
  | "useCreateWallet"
  | "useLoginWithEmail"
  | "useLoginWithOAuth"
  | "useLoginWithPasskey"
  | "useLinkWithPasskey"
>;
```

### `FluentExternalWalletState`

*type* · **experimental**

An External wallet as the widget sees it: whether one is connected, its address, chain and
client, and how to open, connect, switch and disconnect it. Its inline choices are
`FluentWalletChoice`s.

**Experimental.** May change or be removed in a minor release: a host that brings its own wallet
connection is not a 0.6.0 commitment.

```ts declaration
export type FluentExternalWalletState = {
  configured: boolean;
  connected: boolean;
  address?: string;
  chainId?: number;
  walletClient?: WalletClient;
  reconnecting?: boolean;
  choices?: readonly FluentWalletChoice[];
  connectChoice?: (id: string) => Promise<void>;
  open: () => void;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `configured` | `boolean` | no | no |  |
| `connected` | `boolean` | no | no |  |
| `address` | `string` | yes | no |  |
| `chainId` | `number` | yes | no |  |
| `walletClient` | `WalletClient` | yes | no |  |
| `reconnecting` | `boolean` | yes | no | True while the wallet is being restored from a previous visit and neither `connected` nor "no wallet" is known yet. Optional so hosts supplying their own wallet state keep working; omitting it just means the widget reports `"disconnected"` slightly earlier during a reload. |
| `choices` | `readonly FluentWalletChoice[]` | yes | no | Optional inline choices; hosts without them keep their existing open() picker. |
| `connectChoice` | `(id: string) => Promise<void>` | yes | no |  |
| `open` | `() => void` | no | no |  |
| `disconnect` | `() => void` | no | no |  |
| `switchChain` | `(chainId: number) => Promise<void>` | no | no |  |

### `FluentWalletChoice`

*type* · **experimental**

One wallet the connect dialog offers inline, as a host's `FluentExternalWalletState` lists it.

**Experimental.** May change or be removed in a minor release: a host that brings its own wallet
connection is not a 0.6.0 commitment.

```ts declaration
export type FluentWalletChoice = {
  id: string;
  name: string;
  icon?: string;
  handoff?: boolean;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `id` | `string` | no | no |  |
| `name` | `string` | no | no |  |
| `icon` | `string` | yes | no |  |
| `handoff` | `boolean` | yes | no | This connector opens an external wallet/QR surface. |

### `FluentWidgetExecution`

*type* · **experimental**

`FluentWidgetConfig.execution`, every field optional.

**Experimental.** May change or be removed in a minor release while the defaults are measured;
the defaults are the recommended setting.

```ts declaration
export type FluentWidgetExecution = {
  feeSource?: FluentWidgetExecutionSource;
  receiptSource?: FluentWidgetExecutionSource;
  chainCheckBeforeSign?: boolean;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `feeSource` | `FluentWidgetExecutionSource` | yes | **yes** | Where the fees of a user operation come from, a `FluentWidgetExecutionSource`. `chain` reads the widget chain's `eth_gasPrice` and caps `maxFeePerGas` 10 % above it; `bundler` takes the bundler's own gas price quote unchanged. Defaults to `chain`. **Experimental.** May change or be removed in a minor release while the defaults are measured; the defaults are the recommended setting. |
| `receiptSource` | `FluentWidgetExecutionSource` | yes | **yes** | Where inclusion is read from, a `FluentWidgetExecutionSource`. `chain` polls the EntryPoint's `UserOperationEvent` with `eth_getLogs`; `bundler` polls `eth_getUserOperationReceipt`. Defaults to `chain`. **Experimental.** May change or be removed in a minor release while the defaults are measured; the defaults are the recommended setting. |
| `chainCheckBeforeSign` | `boolean` | yes | **yes** | Whether the Signer's chain is read before every signature. The widget gives the Signer's provider its own chain as the only one, and the smart account checks the chain once when it is created, so the repeat costs a provider round trip per signature and switches nothing. Defaults to `false`. **Experimental.** May change or be removed in a minor release while the defaults are measured; the defaults are the recommended setting. |

### `FluentWidgetExecutionSource`

*type* · **experimental**

Where a Fluent ID's send reads a value it could ask either side for: the widget chain's own
RPC, or the bundler.

**Experimental.** May change or be removed in a minor release while the defaults are measured;
the defaults are the recommended setting.

```ts declaration
export type FluentWidgetExecutionSource = "chain" | "bundler";
```

Literals: `bundler`, `chain`.

### `FluentUserOperationGas`

*type* · **experimental**

Gas policy for a Fluent ID batch. Estimation is enabled unless `skipEstimation` is true.
Skipping requires account limits. Omit both paymaster limits to use provider-authorized
paymaster gas and calldata overhead within `preVerificationGas`; supply both to fix all gas.
The fixed limits are a `FluentFixedAccountGas` and a `FluentFixedPaymasterGas`.

**Experimental.** May change or be removed in a minor release while the gas policy is measured;
omitting it, which lets the widget estimate, is the recommended setting.

```ts declaration
export type FluentUserOperationGas =
  | (FluentFixedAccountGas & FluentFixedPaymasterGas & {
      /** Skip the account gas hook and bundler gas estimation. Defaults to false. */
      skipEstimation: true;
      callGasBuffer?: never;
    })
  | { skipEstimation?: false; callGasLimit: bigint; callGasBuffer?: never }
  | {
      skipEstimation?: false;
      callGasLimit?: never;
      callGasBuffer: {
        /** Extra percent of the bundler estimate, rounded up. Must be a nonnegative safe integer. */
        percentage?: number;
        /** Extra gas added after the percentage buffer. Must be nonnegative. */
        fixed?: bigint;
      };
    };
```

### `FluentUserOperationGasError`

*value* · **experimental**

An invalid skip-estimation policy or paymaster authorization for different gas limits.
`code`, a `FluentUserOperationGasErrorCode`, identifies the failure; `message` names the
option or gas field to correct.

**Experimental.** May change or be removed in a minor release while the gas policy is measured;
omitting it, which lets the widget estimate, is the recommended setting.

```ts declaration
export class FluentUserOperationGasError extends Error {
  constructor(readonly code: FluentUserOperationGasErrorCode, message: string) { … }
}
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `code` | `FluentUserOperationGasErrorCode` | no | no |  |

### `FluentUserOperationGasErrorCode`

*type* · **experimental**

Reasons explicit gas preparation can fail before signing.

**Experimental.** May change or be removed in a minor release while the gas policy is measured;
omitting it, which lets the widget estimate, is the recommended setting.

```ts declaration
export type FluentUserOperationGasErrorCode = "invalid_policy" | "paymaster_gas_mismatch";
```

Literals: `invalid_policy`, `paymaster_gas_mismatch`.

### `FluentFixedAccountGas`

*type* · **experimental**

The account's own gas limits, all three fixed, for a `FluentUserOperationGas` that skips
estimation.

**Experimental.** May change or be removed in a minor release while the gas policy is measured;
omitting it, which lets the widget estimate, is the recommended setting.

```ts declaration
export type FluentFixedAccountGas = {
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `callGasLimit` | `bigint` | no | no | Whole-batch execution budget, including any Gas token approval. Positive uint128. |
| `verificationGasLimit` | `bigint` | no | no | Account validation and deployment budget. Positive uint128. |
| `preVerificationGas` | `bigint` | no | no | Calldata overhead, or its ceiling with provider-owned paymaster gas. Positive uint256. |

### `FluentFixedPaymasterGas`

*type* · **experimental**

The paymaster's gas limits for a `FluentUserOperationGas` that skips estimation: both, or
neither to use the limits the paymaster authorizes.

**Experimental.** May change or be removed in a minor release while the gas policy is measured;
omitting it, which lets the widget estimate, is the recommended setting.

```ts declaration
export type FluentFixedPaymasterGas = {
  paymasterVerificationGasLimit?: bigint;
  paymasterPostOpGasLimit?: bigint;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `paymasterVerificationGasLimit` | `bigint` | yes | no | Fixed validation budget, a positive uint128. Omit both paymaster limits to use its answer. |
| `paymasterPostOpGasLimit` | `bigint` | yes | no | Fixed post-operation budget, a nonnegative uint128. Supplied together with validation. |

### `FluentExecuteTiming`

*type* · **experimental**

Where one send's milliseconds went, stage by stage.

Two clocks, and the difference decides how these numbers may be read. `prepareMs`,
`signMs`, `broadcastMs`, `retryMs` and `totalMs` are direct monotonic measurements on the
client (`performance.now()`). `inclusionMs` and `detectMs` are *signed estimates* across the
client's clock and the chain's: `block.timestamp` has one-second resolution and no relation
to the browser's clock, so either may legitimately be negative when it is small, and neither
is clamped — a clamp would turn a known skew into a silent zero. `instants` keeps the inputs,
so the subtraction can be redone by whoever doubts it.

`totalMs` is measured, not summed: it runs from the start of the first submission to the
instant the receipt was in hand, and excludes both the smart-account and authentication setup
before the send and the block read after it. It does not equal the sum of the stages and must
not be displayed as if it did.

Collected for every send, whatever `debugLogging` is set to — the numbers are the answer to
"where did the four seconds go", which is a question a host asks in production. A failure
inside the measuring code costs the stages it could not establish, never the send.

**Experimental.** May change or be removed in a minor release while the numbers are measured.

```ts declaration
export type FluentExecuteTiming = {
  prepareMs?: number;
  signMs?: number;
  broadcastMs?: number;
  inclusionMs?: number;
  detectMs?: number;
  retryMs: number;
  totalMs: number;
  instants: FluentExecuteTimingInstants;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `prepareMs` | `number` | yes | no | Building the UserOperation — nonce, gas estimate, paymaster — up to the signature request. Absent when the clock could not be read at that boundary: every stage here is absent rather than approximated, because a stage silently widened to cover its neighbours is worse than a stage the display can mark as unmeasured. |
| `signMs` | `number` | yes | no | Producing the signature. Absent when the settled attempt never got that far. |
| `broadcastMs` | `number` | yes | no | Handing the signed operation to the bundler. Absent when signing never finished. |
| `inclusionMs` | `number` | yes | no | Bundler acceptance to the including block's timestamp: bundling plus block time. Signed estimate; absent when the including block could not be read. |
| `detectMs` | `number` | yes | no | The including block's timestamp to the instant this client held the receipt: how long the inclusion took to notice. Signed estimate; absent when the including block could not be read. |
| `retryMs` | `number` | no | no | Time spent on submissions that did not settle — a rejected sponsorship bearer, a refused sponsorship falling back to own gas — and on the token exchange between them. It belongs to no stage, is counted inside `totalMs`, and is `0` for a send that submitted once. |
| `totalMs` | `number` | no | no | First submission to receipt in hand. Measured directly; never a sum of the stages. |
| `instants` | `FluentExecuteTimingInstants` | no | no | The raw instants the signed estimates above were computed from. |

### `FluentExecuteTimingInstants`

*type* · **experimental**

Absolute instants behind `FluentExecuteTiming`, kept so its signed estimates can be
re-checked rather than believed. Epoch milliseconds (`Date.now()`), because the only other
clock in the arithmetic — the including block's `timestamp` — is a wall clock too.

**Experimental.** May change or be removed in a minor release while the numbers are measured.

```ts declaration
export type FluentExecuteTimingInstants = {
  submittedAtEpochMs: number;
  broadcastedAtEpochMs: number;
  receivedAtEpochMs: number;
  blockTimestampEpochMs?: number;
  attempts: number;
};
```

| Member | Type | Optional | Experimental | Description |
|---|---|---|---|---|
| `submittedAtEpochMs` | `number` | no | no | When the first submission attempt of this send began. |
| `broadcastedAtEpochMs` | `number` | no | no | When the bundler accepted the operation that settled. |
| `receivedAtEpochMs` | `number` | no | no | When that operation's receipt was in hand. |
| `blockTimestampEpochMs` | `number` | yes | no | The including block's `timestamp`, in milliseconds. Absent exactly when `inclusionMs` and `detectMs` are absent: the block could not be read. |
| `attempts` | `number` | no | no | How many operations were submitted; more than one means a retry or an own-gas fallback. |

### `FluentGasPaymentEthRates`

*type* · **experimental**

What one unit of each Gas token is worth in ETH, as a decimal string, keyed by its
`FluentGasTokenSymbol`.

**Experimental.** May change or be removed in a minor release while the defaults are measured;
the defaults are the recommended setting.

```ts declaration
export type FluentGasPaymentEthRates = Partial<Record<FluentGasTokenSymbol, string>>;
```
