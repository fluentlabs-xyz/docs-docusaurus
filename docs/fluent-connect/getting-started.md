---
sidebar_position: 1
---

# Getting started

This guide takes a React App from nothing to a mounted widget that reads the Widget account. It
covers what to ask Fluent for, the install, the styles, the Network, mounting `<FluentWidget>`,
the connect button, reading the account, and debugging. The terms it uses (Fluent ID, External
wallet, Widget account, Widget session) are defined in [concepts.md](concepts.md); every option
of `config` is in [configuration.md](configuration.md).

## What you need from Fluent

Ask Fluent for these before you write any code:

- **`appId`**: the App's id, `app_` followed by 32 lowercase hex characters, as the Fluent
  Dashboard shows it.
- **`privyClientId`**: the login client Fluent issues for the App, a `client-…` value. It is
  required today and is marked experimental, because it goes away when Fluent's own login
  replaces it ([experimental.md](experimental.md#privyclientid)).
- **Your page origins allow-listed for Direct login**: Direct login happens in the App's own
  page, so every origin the App is served from, a development origin included, has to be
  allow-listed for the App's login client beforehand.
- **For `getAuthToken()`, Sponsorship, `linkX()` and User settings**: Auth tokens enabled for
  the App, and each page origin that calls it registered on the App. Without them
  `getAuthToken()` rejects with `FluentAuthError` and `code` `app_not_auth_enabled` or
  `origin_not_allowed` ([errors.md](errors.md#fluentautherror)), a Fluent ID's operations are not
  sponsored, `linkX()` cannot complete a link, and a person's User settings are neither loaded
  nor saved. See [guides/backend-auth.md](guides/backend-auth.md).
- **For Sponsorship, the App enabled for Sponsorship**: without it a Fluent ID's operations are
  not sponsored ([guides/sponsorship.md](guides/sponsorship.md)).

## Install

Install the package and its peer dependencies:

```bash
pnpm add @fluent.xyz/connect @tanstack/react-query react react-dom viem wagmi
```

The peers are `@tanstack/react-query` 5, `react` and `react-dom` 18 or later, `viem` 2 and
`wagmi` 2. They are peers rather than dependencies so that your App and the widget resolve one
copy of each: the `viem` types the Widget API takes and returns (an `Address`, a `Hex`, an
`Abi`) are the ones your own code imports.

You do not need a `QueryClientProvider`. The widget mounts a TanStack Query client of its own.
When your App mounts its own `QueryClientProvider` around `<FluentWidget>`, the content your
`renderPage` or `renderHome` returns is rendered under your client again, so a query your App
prefetched or hydrated is read from your cache; the widget's own queries stay on its client.

You do not need a `Buffer` polyfill either. Importing `@fluent.xyz/connect` defines
`globalThis.Buffer` when the page has none, and leaves an existing one in place.

## Styles

Import the widget's stylesheet once, in your App's entry module:

```tsx
import "@fluent.xyz/connect/styles.css";
```

## Network

`config.network` names the Network the widget runs on: `"testnet"` or `"mainnet"`. It is
required and has no default, and the widget reads no environment variable for it. Rendering
`<FluentWidget>` with no `network` throws `FluentWidgetConfigError` with `code`
`missing_option`; a value other than the two throws it with `code` `invalid_option`
([errors.md](errors.md#fluentwidgetconfigerror)). The error is thrown during the render, so the
nearest error boundary catches it.

The Network is chosen once per deployment of the App, and choosing it is your App's own code.
Pass the literal each deployment runs on: for example one config module per deployment, each
with its own literal, or a build-time constant of your own that your code checks is exactly
`"testnet"` or `"mainnet"` before it reaches `config`. Do not map an unknown value to one of the
two: a production build with a misspelled value would then run on the wrong Network.

```ts
import type { FluentWidgetConfig } from "@fluent.xyz/connect";

// config.testnet.ts; the mainnet deployment's module passes network: "mainnet".
export const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};
```

Keep `config` stable: a module constant, as here, or a memo. The widget resolves `config` again
on every render that passes a new object, and such a render can throw too.

## Mount the widget

`<FluentWidget>` renders the connect button, the connect dialog and the account drawer, and
hands your App's content the widget's render context. `mode` picks which of your two render
functions it calls:

- `mode="home"`, the default, calls `renderHome`.
- `mode="page"` calls `renderPage`.

Each receives the render context, a `FluentWidgetRenderContext`. Any component rendered inside
that content can read the same object with `useFluentWidget()`, so you do not have to pass it
down. `useFluentWidget()` throws an `Error` when it is called outside the content of
`<FluentWidget>`, the button `renderConnectButton` returns included: that button receives its
own context, described below.

```tsx
import "@fluent.xyz/connect/styles.css";
import { FluentWidget, useFluentWidget, type FluentWidgetConfig } from "@fluent.xyz/connect";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

function Dashboard() {
  const { status, widget } = useFluentWidget();
  if (status !== "connected") return <p>Connect to continue.</p>;
  return <p>Your account: {widget.account.address}</p>;
}

export function Root() {
  return <FluentWidget config={config} mode="page" renderPage={() => <Dashboard />} />;
}
```

## The connect button

`connectButton` decides where the widget's own button goes:

- `"fixed"`, the default: a floating button at the top right of the page.
- `"inline"`: the same button without fixed positioning, for your own layout to place.
- `false`: no button; open the widget's screens yourself.

The button opens the connect dialog while no Widget account is connected, and toggles the
account drawer once one is.

To draw your own button in that place, pass `renderConnectButton`. It receives a
`FluentWidgetConnectButtonRenderContext`: `connected`, `pending` (true while a Fluent ID's
account is being prepared), `addressLabel` (once connected, the shortened
address, or `"Connected"`), `userAvatarUrl`, `userXDisplayName` and `userGoogleName` (the same
values as the render context's, see [Account name](#account-name)), `onClick` (what the default
button does on click),
`openConnect`, `openAccount`, and `DefaultButton`, which renders the widget's own button. When
`renderConnectButton` returns `null` or `undefined`, the widget falls back to the button
`connectButton` names.

```tsx
import { FluentWidget, type FluentWidgetConfig } from "@fluent.xyz/connect";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

export function Root() {
  return (
    <FluentWidget
      config={config}
      renderConnectButton={({ connected, onClick, DefaultButton }) =>
        connected ? (
          <DefaultButton />
        ) : (
          <button type="button" onClick={onClick}>
            Connect
          </button>
        )
      }
      renderHome={() => <main>Your App</main>}
    />
  );
}
```

With `connectButton={false}`, open the screens from your own content with the render context's
`openConnect` (the connect dialog) and `openAccount` (the account drawer). `openConnect` ignores
a click event passed to it, so it can be handed straight to `onClick`. The example after the
next section shows both.

## Reading the account

The render context, and `useFluentWidget()`, tell your App who is connected:

- **`status`**, a `FluentWidgetStatus`: `"restoring"` (a session from a previous visit may
  exist and nothing is decided yet), `"connecting"` (a Fluent ID's login is done and its account
  is being prepared, after a Direct login or on a restore), `"connected"` (a Widget account is
  connected) or `"disconnected"`. Branch on `status`, not on `hasConnectedAccount` alone:
  `hasConnectedAccount` is `false` both while a stored session is being restored and when
  nobody is connected, and treating the two alike shows a Connect button to a person who is
  already connected.
- **`hasConnectedAccount`**: whether a Widget account, a Fluent ID or an External wallet, is
  connected now.
- **`widget.account`**, a `FluentWidgetAccount`: `address` (the Fluent ID's address, or the
  External wallet's; `undefined` while there is none), `type` (`"smart"` for a Fluent ID whose
  account is ready, `"eoa"` for a connected External wallet, `undefined` otherwise),
  `executionReady` (whether the account can send now), `executionStatus` (`"ready"`, or why it
  cannot send: `"disconnected"`, which is also what a Fluent ID still being prepared, or whose
  account failed, reads; `"unavailable"` or `"error"` only for a connected External wallet whose
  client is not ready), and `capabilities` (`atomicBatch` and `erc20Gas`, both `true` only for a
  Fluent ID). While no External wallet is connected, `address` falls back to the address of the
  stored Widget session, so it can be set while `status` is not `"connected"`: branch on
  `status` before you use it.
- **`session`**, a `FluentWidgetSession` or `null`: the Widget session, which holds the Fluent ID's
  `account` (`address` and `type`) and `issuedAt`. It is `null` until a Fluent ID connects, and
  an External wallet never sets it: read an External wallet from `widget.account`. A session
  stored on a previous visit is in `session` from the first render, without any callback, and
  stays there until a disconnect through the widget or a new Direct login replaces it, even while
  `status` is `"disconnected"` or only an External wallet is connected. The session is not a
  credential; to prove who the person is to your backend, use an Auth token
  ([guides/backend-auth.md](guides/backend-auth.md)).

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";

export function AccountBar() {
  const { status, widget, openConnect, openAccount } = useFluentWidget();
  switch (status) {
    case "connected":
      return (
        <button type="button" onClick={openAccount}>
          {widget.account.address ?? "Connected"}
        </button>
      );
    case "disconnected":
      return (
        <button type="button" onClick={openConnect}>
          Connect
        </button>
      );
    default:
      // "restoring", "connecting", and any status a later release adds.
      return <span>Loading…</span>;
  }
}
```

Keep a `default` branch in any `switch` over `status` or another code or status union: a later
release may add a value.

A Fluent ID can sign without the widget's Review, under Quick sign: see
[concepts.md](concepts.md#prompt-mode-and-silent-mode).

`onSessionChange` is called each time the widget writes its Widget session: with the new
`FluentWidgetSession` when a Fluent ID connects by Direct login, and with `null` on a disconnect
through the widget. It is not called for a session restored from storage when the widget mounts,
nor when an External wallet connects; read `session` and `widget.account` from the render
context for those. One exception: when a restored login has no matching stored session, the
widget writes a new one after it mounts and calls `onSessionChange` with it.

```tsx
import {
  FluentWidget,
  type FluentWidgetConfig,
  type FluentWidgetSession,
} from "@fluent.xyz/connect";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

function handleSessionChange(session: FluentWidgetSession | null) {
  console.info(session ? `Connected: ${session.account.address}` : "Disconnected");
}

export function Root() {
  return (
    <FluentWidget
      config={config}
      onSessionChange={handleSessionChange}
      renderHome={({ status }) => <p>Status: {status}</p>}
    />
  );
}
```

### Account name

The render context, `useFluentWidget()` and the context `renderConnectButton` receives carry the
names the person is known by: `userXDisplayName`, the display name of their linked X account (the
name X shows above the handle, not the handle), and `userGoogleName`, the name on the Google
account linked to their Direct login. Each is `undefined` when no such account is linked or it
reports no name, and while an External wallet is connected without a Fluent ID.
`avatar.forceDefault` hides the Account avatar's picture only and leaves both names in place.
Neither is a fallback for the other: a person with Google linked and no X account has no X
display name, so pick your own order.

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";

export function Greeting() {
  const { userXDisplayName, userGoogleName } = useFluentWidget();
  const name = userXDisplayName ?? userGoogleName;
  return <span>{name ? `Hi, ${name}` : "Hi"}</span>;
}
```

## Debugging

`debugLogging` prints the widget's connect, account and signing diagnostics to the browser
console, and in `mode="home"` also shows the widget's debug panel. It is off by default; turn it
on only while debugging an integration.

```tsx
import { FluentWidget, type FluentWidgetConfig } from "@fluent.xyz/connect";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

export function Root() {
  return <FluentWidget config={config} debugLogging renderHome={() => <main>Your App</main>} />;
}
```

When the widget refuses its `config`, the error's message names the option and how to fix it,
and its `code` is listed in [errors.md](errors.md#fluentwidgetconfigerror).

## Checklist

- `appId` and `privyClientId` from Fluent, and every page origin allow-listed for Direct login.
- For `getAuthToken()`, Sponsorship, `linkX()` and User settings: Auth tokens enabled for the
  App and each calling origin registered.
- For Sponsorship: the App enabled for Sponsorship.
- `@fluent.xyz/connect` and all five peers installed.
- `@fluent.xyz/connect/styles.css` imported once.
- `network` passed as a literal per deployment, never defaulted.
- `config` kept stable: a module constant or a memo.
- `useFluentWidget()` called only inside the content `renderPage` or `renderHome` returns.
- UI branched on `status`, with a `default` branch.
- `debugLogging` off in production.

Next: send a Batch operation ([guides/transactions.md](guides/transactions.md)), request a
signature ([guides/signing.md](guides/signing.md)), or verify the person on your backend
([guides/backend-auth.md](guides/backend-auth.md)).
