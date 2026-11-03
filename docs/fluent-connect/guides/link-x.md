---
sidebar_position: 5
---

# Link X

How an App lets a person link an X account to their Widget account. The Linked X account is the one
the service has bound to the person: at most one per person, used for their reputation and, while a
Fluent ID is connected, for its Account avatar. Linking it is a single call with no widget screen
and no settings page. The terms used here are defined in [concepts.md](../concepts.md).

## The call

Two ways in, both inside `<FluentWidget>`:

- `useLinkX()` returns `linkX`, the call, and three values describing the last call: `status`,
  `x` and `error`. Use it in a component: it also finishes a link after the return from X on its
  own (see [The return from X](#the-return-from-x)).
- `linkX()` on the render context (or on `useFluentWidget()`) is the same call without that
  state.

`linkX()` resolves a `FluentLinkXResult`:

- `{ status: "linked", x }` when the person has a Linked X account. `x` is a `FluentXAccount`:
  `id`, `handle` and `avatarUrl`.
- `{ status: "redirecting" }` when the person has none and the browser has started leaving the
  page for X. Code after the `await` still runs, briefly, enough to show a "taking you to X"
  state, but the page is unloading: nothing on it may wait for the link to finish.

`useLinkX()`'s `status` is a `FluentLinkXStatus`:

| `status` | Meaning |
|---|---|
| `"idle"` | No call yet, or a link resumed on mount was discarded. |
| `"pending"` | A call is running. |
| `"redirecting"` | The browser is about to leave for X. |
| `"linked"` | The call resolved with the Linked X account, which is in `x`. |
| `"error"` | The last call was refused; the `FluentAuthError` is in `error`. |

`x` is `null` until a call in this component resolves `linked`, even for a person who linked X
earlier, and goes back to `null` while a later call runs or after it fails. For a person with a
Linked X account, `linkX()` resolves `linked` without leaving the page; an External wallet may
sign first ([An External wallet signs first](#an-external-wallet-signs-first)). For a person
with no Linked X account, `linkX()` leaves the page, so call it from a click and not on mount.

```tsx
import {
  FluentWidget,
  useFluentWidget,
  useLinkX,
  type FluentAuthError,
  type FluentWidgetConfig,
} from "@fluent.xyz/connect";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

function describeLinkXError(error: FluentAuthError): string {
  switch (error.code) {
    case "user_rejected":
      return "Linking was cancelled.";
    case "linked_to_another_user":
      return "That X account is already linked to another person.";
    case "not_authenticated":
      return "Connect first, then try again.";
    case "bad_request":
      return "Linking X failed. Please report it.";
    case "link_failed":
      return "Linking X failed. Try again.";
    default:
      return `Linking X failed (${error.code}).`;
  }
}

function LinkXButton() {
  const { status: widgetStatus } = useFluentWidget();
  const { linkX, status, x, error } = useLinkX();
  if (widgetStatus !== "connected") return null;
  if (x) return <p>Linked as @{x.handle}</p>;
  return (
    <div>
      <button
        // The error is also kept in `error`, so the rejection needs no handling here.
        onClick={() => void linkX().catch(() => undefined)}
        disabled={status === "pending" || status === "redirecting"}
      >
        Link X
      </button>
      {error ? <p>{describeLinkXError(error)}</p> : null}
    </div>
  );
}

export function App() {
  return <FluentWidget config={config} mode="page" renderPage={() => <LinkXButton />} />;
}
```

## The return from X

Linking X needs a round trip to X that leaves the page. `useLinkX()` finishes the link after
the return on its own: when a component using the hook mounts in the tab that started the link,
the hook calls `linkX()` without waiting for the widget's `status`: on mount for a Fluent ID,
once the wallet is connected for an External wallet. The call waits, with `status`
`"pending"`, until the person's Widget account is connected again, and `status` then moves to
`"linked"` with `x` set.

With the render context's `linkX()`, nothing public tells your page that it is a return from X,
so use `useLinkX()` for a link that leaves the page.

A link started in this tab by someone else, or a stale record of one, is discarded rather than
resumed. The render context's `linkX()` then does no work and rejects with `link_failed`; call
it again to start a link for the connected person. `useLinkX()` resuming on mount goes back to
`"idle"` with no error instead.

## An External wallet signs first

A Fluent ID already holds what the link needs. An External wallet can be asked for two
signatures, never an on-chain transaction: a message that logs it in to the provider behind
Direct login, unless that login is still live on the page, and the Sign-in challenge, when no
Service session is open for the wallet (see [backend-auth.md](backend-auth.md#renewal)). Both
come before the page leaves for X. The connected account, its kind and the wallet's Auth token
are unchanged by the link.

## The sequence

What happens for one link, and what your backend sees of it:

1. The person clicks, and your code calls `linkX()`.
2. For an External wallet only: the signatures of the previous section.
3. A person who already has X: the widget asks Fluent's service and resolves `linked`. Done.
4. Otherwise the call resolves `redirecting`, the browser leaves for X, and the person approves
   the link there.
5. The browser comes back. Once the person's Widget account is connected again, `useLinkX()`
   runs `linkX()` again; the widget sends the link to Fluent's service, authenticated with the
   person's Auth token, and the call resolves `linked`.

Your backend receives none of the link's requests, and there is nothing for it to verify.

## What to ask Fluent for

Some of what linking X needs is configured for your App by Fluent, not by you. Ask Fluent to:

- **Enable Auth tokens for the App.** The request that finishes the link carries the person's
  Auth token. When none can be obtained, for example because Auth tokens are not enabled for the
  App or the page's origin is not registered, `linkX()` rejects with `link_failed` and keeps the
  message of the Auth token's refusal.
- **Register every origin your page is served from**, for the App's Auth tokens and for Direct
  login with the login client Fluent issued you (the experimental
  [`privyClientId`](../experimental.md#privyclientid)).

## Rejections

`linkX()`, on the render context and from `useLinkX()`, rejects with a `FluentAuthError`. The
five codes it throws today are `user_rejected`, `linked_to_another_user`, `not_authenticated`,
`bad_request` and `link_failed`; what each means and what to do is in
[errors.md](../errors.md#fluentautherror). Keep a `default` branch in your `switch` over `code`:
a later release may add one.

- `user_rejected` covers the person saying no at X or closing the flow, and an External wallet
  declining either signature when the wallet reports the refusal as one; a wallet error that
  does not say so arrives as `link_failed`.
- `not_authenticated` covers an External wallet whose client is not ready yet: wait for
  `widget.account.executionReady` to be `true` and call again.

`useLinkX()`'s `linkX` both rejects and keeps the error: `status` becomes `"error"` and `error`
holds the same `FluentAuthError`, so a component can render from state and ignore the rejection.
