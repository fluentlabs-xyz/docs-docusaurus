---
sidebar_position: 3
---

# Configuration

`<FluentWidget>` takes one `config`, a `FluentWidgetConfig`, and a handful of props. This page
says what each option and prop is for, what it defaults to, and what a bad value throws. The exact
types are in the API reference: [`FluentWidgetConfig`](api.md#fluentwidgetconfig) and
[`FluentWidgetProps`](api.md#fluentwidgetprops).

## When the config is checked

The widget resolves `config` while `<FluentWidget>` renders, so a value it cannot use throws a
`FluentWidgetConfigError` from that render, where the nearest error boundary catches it. Its
message names the option to fix, and its `code` says what is wrong:

- `missing_option`: a required option is absent (for `appId` and `privyClientId`, also empty).
- `invalid_option`: an option holds a value the widget cannot use.
- `removed_option`: an option an earlier release removed is still passed.

The full table of codes is in [errors.md](errors.md#fluentwidgetconfigerror). The config is
resolved again on every render that passes a new `config` object, so such a render can throw too:
keep `config` stable, as a module constant or a memo.

## A complete config

```ts
import type { FluentWidgetConfig } from "@fluent.xyz/connect";

export const config: FluentWidgetConfig = {
  // Who the App is, and where it runs.
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
  appName: "Marketplace",
  // X is always offered; these stand beside it, in this order.
  enabledAuthMethods: ["email", "passkey"],
  gasPayment: { defaultToken: "ETH", sponsorship: "auto" },
  quickSign: { whitelistAddresses: ["0x1111111111111111111111111111111111111111"] },
  avatar: { defaultLogoUrl: "https://marketplace.example/logo.png" },
  reputationEnabled: true,
  source: "marketplace",
  campaign: "launch",
};
```

Only `appId`, `privyClientId` and `network` are required; every other option may be left out.

## `FluentWidgetConfig`

### Identity of the App

**`appId`** (required). The App's id, `app_` followed by 32 lowercase hex digits: the id the
Fluent Dashboard shows for the App, and the `aud` of every Auth token the widget mints for it.
Sponsorship, Auth tokens and analytics are all decided for this id.

- `missing_option` when it is absent or empty after trimming.
- `invalid_option` when it is not a string, when it holds a `client-…` value (the login client,
  which belongs in `privyClientId`), or when it has any other shape.

**`privyClientId`** (required). The login client Fluent issues for the App, a `client-…` value.
The option is required, and it is also experimental: see
[experimental.md](experimental.md#privyclientid). Direct login works only on an origin Fluent has
allow-listed for the App beforehand, so ask Fluent to register each origin your App runs on.

- `missing_option` when it is absent or empty after trimming.
- `invalid_option` when it is not a string, when it holds an `app_…` id (the two were swapped),
  or when it does not start with `client-`.

**`appName`**. The App's name, as the widget shows it: in the connect dialog's description and
on the Review of a Batch operation. Set it. Unset, the connect dialog says "this app" and the
Review shows the placeholder name `Fluent Connect Demo`.

### Network

**`network`** (required). The Network the widget runs on: `"testnet"` or `"mainnet"`. It picks
the chain, its tokens and the service. There is no default, and the widget reads no environment
variable for it: if your App picks the Network from its own build settings, read them yourself and
pass the value.

- `missing_option` when it is absent (`undefined` or `null`).
- `invalid_option` for any other value than `"testnet"` and `"mainnet"`.

The two chains are exported as [`fluentTestnet`](api.md#fluenttestnet) and
[`fluentMainnet`](api.md#fluentmainnet).

### Auth methods

**`enabledAuthMethods`**. The Auth methods the connect dialog offers beside X, in the order
given: any of `"google"`, `"email"` and `"passkey"`. X is always offered and is not a value here.
The default is `["google", "email", "passkey"]`; a shorter list drops the rest, and `[]` leaves X
alone. Unknown values and duplicates are dropped. An Auth method also has to be enabled for the
App by Fluent: listing it here only decides whether its button is drawn.

- `invalid_option` when it is not a list or another iterable. `null` counts as unset and gives
  the default; a non-empty string is read character by character, so every value is dropped and
  only X is offered.

### Gas payment

These options apply to a Fluent ID. An External wallet always pays its own gas in native ETH
([concepts.md](concepts.md)).

**`gasPayment.defaultToken`**. The Gas token the widget charges until the person chooses one:
`"ETH"` for native ETH (the default), or the symbol of a Gas token of the Network, compared
case-insensitively. A valid Gas token the person has saved in their User settings wins over it.

- `invalid_option` when it is not a string, or names no Gas token of the Network.

**`gasPayment.sponsorship`**. Whether the widget asks for Sponsorship on an operation paid in
native ETH. `"auto"` (the default) asks, and when the Sponsorship is refused the account pays its
own gas instead. `"never"` does not ask, so the account pays from the start. One operation can
override it with `gasPayment` on `execute()` ([guides/transactions.md](guides/transactions.md)).
An operation paid in a Gas token is never sponsored, whatever this option says.

**`gasPayment.ethValueByToken`** is experimental: see
[experimental.md](experimental.md#gaspaymentethvaluebytoken).

### Quick sign

**`quickSign.whitelistAddresses`**. The call targets Quick sign may cover. Set, a Fluent ID's
Batch operation runs in Silent mode only when every call's `to` is on the list; an operation with
a call to any other address is switched to Prompt mode and shows the Review, even with Quick sign
on and even with `confirmation: "silent"`. An empty list switches every Batch operation to Prompt
mode. Unset (the default), Silent mode covers every address. Entries are trimmed and compared
case-insensitively. Signatures (`signMessage`, `signTypedData`) have no call target, so the list
does not scope them. How the modes are chosen:
[concepts.md](concepts.md#prompt-mode-and-silent-mode).

- `invalid_option` when it is not a list, or when an entry is not an address.

### Account avatar and images

**`avatar.defaultLogoUrl`**. The image the Account avatar falls back to when the person has no
linked X picture, a URL or a data URI. Unset, the avatar is the Fluent mark. An empty string
counts as unset.

- `invalid_option` when it is not a string.

**`avatar.forceDefault`**. `true` shows `defaultLogoUrl` even for a person with a linked X
picture. Default `false`. It does not hide the render context's `userXDisplayName` and
`userGoogleName` ([Account name](getting-started.md#account-name)).

**`assets`**. Images for the widget, each a URL or a data URI
([`FluentWidgetAssets`](api.md#fluentwidgetassets)). Today the widget reads only `fluentLogo`,
which it passes to the provider behind Direct login as its logo; the connect button, the account
drawer and the External wallet choices of the connect dialog keep their own images.

### Account drawer

**`reputationEnabled`**. `false` drops the Reputation tab that follows Tokens and Activity in the
account drawer; the widget then makes no reputation request. Default `true`.

**`swapper`** is experimental: see [experimental.md](experimental.md#swapper).

### Auth tokens

**`authTokenRenewalOffsetSeconds`**. `getAuthToken()` reuses an Auth token until this many seconds
before its `exp`, then fetches a fresh one. Default `30`. `0` reuses a token until `exp` itself;
it does not mean fetching a new token on every call. How the token is used:
[guides/backend-auth.md](guides/backend-auth.md).

### External wallets

**`reconnectOnMount`**. Which External wallets from an earlier visit the widget reconnects when
it mounts. Unset (the default), it reconnects only browser-extension wallets and WalletConnect;
`true` reconnects every kind of External wallet; `false` reconnects none. A Fluent ID's Widget
session is restored either way.

### Analytics

**`disableAnalytics`**. `true` turns off the widget's analytics: it sends no event and stores
nothing for them. Default `false`.

**`source`** and **`campaign`**. Attribution tags the widget adds to every analytics event it
sends. `source` defaults to `"fluent_connect_widget"`; `campaign` has no default.

### Experimental options

These options may change or be removed in a minor release. Each is named here only so you can
find it; what it does is in [experimental.md](experimental.md):

- `customOAuthRedirectUrl`: [experimental.md](experimental.md#customoauthredirecturl)
- `swapper`: [experimental.md](experimental.md#swapper)
- `gasPayment.ethValueByToken`: [experimental.md](experimental.md#gaspaymentethvaluebytoken)
- `execution`: [experimental.md](experimental.md#execution)
- `sponsorshipUrl`: [experimental.md](experimental.md#sponsorshipurl)
- `privyClientId`, which is required: [experimental.md](experimental.md#privyclientid)

### Removed options

The type still lists `clientId` and `partnerId` as `never`, so that a config carrying one fails
the typecheck; past the type, `<FluentWidget>` throws `removed_option` for either. An `authMode`
key throws `removed_option` too, unless its value is `"direct"`, which only logs a warning. What
each was and what replaces it: [upgrading-0.5.md](upgrading-0.5.md).

## Capacitor and other web views

Direct login happens inside your App's own page, so the origin a Capacitor web view serves the
App from has to be allow-listed by Fluent, like any other origin; ask Fluent for it with your
`appId`.

X is always offered, and a Direct login with X or Google goes through an OAuth round trip.
Leaving Google out of `enabledAuthMethods` removes one of the two; X cannot be removed. The option
that passes a return URL for that round trip to the provider is `customOAuthRedirectUrl`, which is
experimental: see [experimental.md](experimental.md#customoauthredirecturl).

## `FluentWidgetProps`

The exact member list and types are in [api.md](api.md#fluentwidgetprops).

**`config`** (required). The `FluentWidgetConfig` above.

**`mode`**. Which of your two render props the widget renders: `"page"` renders `renderPage`, and
`"home"` (the default) renders `renderHome`. With `debugLogging` on, `"home"` also shows the
widget's debug panel.

**`renderHome`** and **`renderPage`**. Your App's content. Each receives the render context
([`FluentWidgetRenderContext`](api.md#fluentwidgetrendercontext)): the Widget session, the Widget
API as `widget`, `status`, and the calls that open the widget's screens, disconnect, mint an Auth
token and link X. Any component rendered inside reads the same object from `useFluentWidget()`.

**`connectButton`**. Where the widget's own connect button goes: `"fixed"` (the default) floats it
at the top right of the page; `"inline"` renders it without fixed positioning, for your layout to
place; `false` hides it, and your App opens the connect dialog and the account drawer itself with
`openConnect` and `openAccount` from the render context.

**`renderConnectButton`**. Draws your own connect button in place of the widget's. It receives
[`FluentWidgetConnectButtonRenderContext`](api.md#fluentwidgetconnectbuttonrendercontext): whether
a Widget account is connected, whether a Fluent ID is still being prepared, the click handler, and
the widget's own button as `DefaultButton`. When it returns `null` or `undefined`, the
`connectButton` setting applies instead.

**`tokens`**. Integrator tokens the widget lists beside its Default tokens, each a
[`FluentTokenDefinition`](api.md#fluenttokendefinition). An Integrator token is listed only: it
never becomes a Gas token.

**`debugLogging`**. `true` prints the widget's diagnostics to the console, and shows the debug
panel in `mode="home"`. Off by default; turn it on only while debugging an integration.

**`onSessionChange`**. Called with the new Widget session when a Fluent ID connects by Direct
login, and with `null` on a disconnect through the widget. It is not called for a Widget session
restored from storage when the widget mounts, nor when an External wallet connects: read
`session` and `widget.account` from the render context for those. It is called on mount when a
restored login has no matching stored Widget session, because the widget then writes a new one.

**`wallet`** and **`privyAdapter`** are experimental: see
[experimental.md](experimental.md#wallet) and [experimental.md](experimental.md#privyadapter).

```tsx
import { FluentWidget } from "@fluent.xyz/connect";
import type { FluentWidgetConfig, FluentWidgetSession } from "@fluent.xyz/connect";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
  appName: "Marketplace",
};

function reportSession(session: FluentWidgetSession | null): void {
  console.info(session ? `Connected as ${session.account.address}` : "Disconnected");
}

export function App() {
  return (
    <FluentWidget
      config={config}
      mode="page"
      connectButton="inline"
      onSessionChange={reportSession}
      renderPage={({ status, widget }) => (
        <main>{status === "connected" ? widget.account.address : "Connect to continue"}</main>
      )}
    />
  );
}
```
