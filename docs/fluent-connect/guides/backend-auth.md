---
sidebar_position: 4
---

# Backend auth

How an App's backend learns who the connected person is: the page asks the widget for an Auth
token, sends it to the backend, and the backend verifies it once and issues its own session from
it. The Widget session the render context carries (`session`) is not a credential: anyone can
put an address in a request. Only an Auth token proves who the person is. The terms used here are
defined in [concepts.md](../concepts.md).

## Get an Auth token

`getAuthToken()` is on the render context that `renderHome` and `renderPage` receive, and on the
object `useFluentWidget()` returns, in any component rendered inside `<FluentWidget>`. It takes
no arguments and resolves a string. Call it once `widget.account.executionReady` is `true`, for
a Fluent ID and for an External wallet alike.

```tsx
import {
  FluentAuthError,
  FluentWidget,
  useFluentWidget,
  type FluentWidgetConfig,
} from "@fluent.xyz/connect";
import { useState } from "react";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

function BackendSignIn() {
  const { widget, getAuthToken } = useFluentWidget();
  const [message, setMessage] = useState("");
  if (!widget.account.executionReady) return null;

  const signIn = async () => {
    try {
      const token = await getAuthToken();
      // Your backend verifies the token and answers with its own session cookie.
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      setMessage(response.ok ? "Signed in." : "The backend refused the token.");
    } catch (error) {
      if (!(error instanceof FluentAuthError)) throw error;
      switch (error.code) {
        case "request_failed":
          setMessage("Could not get a token. Try again.");
          break;
        case "origin_not_allowed":
          setMessage("This page's origin is not registered for the App.");
          break;
        default:
          setMessage(`Sign-in failed (${error.code}).`);
      }
    }
  };

  return (
    <div>
      <button onClick={() => void signIn()}>Sign in to the backend</button>
      <p>{message}</p>
    </div>
  );
}

export function App() {
  return <FluentWidget config={config} mode="page" renderPage={() => <BackendSignIn />} />;
}
```

## What the token says

The Auth token is a JSON Web Token ([RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)) that
Fluent signs with ES256, valid for five minutes. Its fields:

| Field | What it holds |
|---|---|
| `iss` | The issuer that signed the token. Pin the value Fluent gives you for each Network. |
| `aud` | The App's `appId`, the same string the widget's `config` carries. |
| `exp` | When the token stops verifying, in Unix seconds. |
| `sub` | The Client subject: the name the token gives the person, one per person per App and stable across logins. Key your user records on it. |

A verified token proves that Fluent issued it, at most five minutes ago, for this person and your
App. It is not a session: verify it once, at sign-in, and issue your own session from it.

## Renewal

Call `getAuthToken()` each time you need a token instead of keeping one. The widget keeps the
token it last obtained and returns it while it is more than `authTokenRenewalOffsetSeconds`
(default 30) from its `exp`; a call after that gets a new token. Calls made while a request for a
token is still out share that request.

A new token comes from the Service session, the sign-in the service holds for the person in this
browser for up to thirty days. A renewal the service accepts asks the person nothing, for a
Fluent ID and for an External wallet alike:

- A Fluent ID's Service session opens from its Direct login, with no prompt.
- An External wallet signs a Sign-in challenge when the Service session opens, and the
  renewals that follow ask it for nothing. A challenge the service refuses as used, expired or
  signed with a prefix it refuses is retried once with a fresh one, which is a second prompt.
  The wallet is asked to sign again when the thirty days run out, when the service refuses the
  stored refresh credential, or when there is none (the person disconnected, cleared site data,
  or opened another browser).

When the service refuses the refresh credential, `getAuthToken()` does not reject for it: it
forgets the credential and opens a new Service session within the same call, which for an
External wallet means a Sign-in challenge prompt. The call then resolves or rejects with the
outcome of that new Service session.

An External wallet can sign the Sign-in challenge if it is an ordinary key-held account or a
deployed smart-contract wallet; a smart account that is not deployed yet cannot sign it.

Disconnecting through the widget (its account drawer, or `disconnect()` from the render context)
asks the service to end the Service session. When that request fails, the disconnect completes
anyway and the Service session can stay open at the service. An External wallet disconnected
from the wallet itself does not ask. A token already issued is not recalled: it keeps verifying
until its `exp`.

## Sponsorship uses the same token

When a Fluent ID's Batch operation asks for Sponsorship, the widget authenticates it to Fluent's
sponsorship service with an Auth token for the person and the App, from the same Service session
as the one `getAuthToken()` returns. You do not pass it yourself. An External wallet is never
sponsored, so Sponsorship never asks it to sign a Sign-in challenge. What happens when no token
can be obtained or the service refuses it is in [sponsorship.md](sponsorship.md).

## Verify the token on a backend

Verify every token before you trust it:

1. **The signature**, ES256, against the keys the issuer publishes at
   `<iss>/.well-known/jwks.json`. Fetch the key set from there rather than copying a key into
   your backend.
2. **`iss`**, equal to the issuer you pinned. Ask Fluent for the issuer of each Network your App
   runs on and pin it in your backend's configuration; never build the key URL from the `iss` of
   a token you have not verified yet.
3. **`aud`**, equal to your `appId`.
4. **`exp`**, in the future.

Then read `sub` and look up or create the person's record by it. The example below is a Node
backend using the [`jose`](https://github.com/panva/jose) library:

```ts skip-check
// A Node backend: it needs `jose`, which this repository does not install.
import { createRemoteJWKSet, jwtVerify } from "jose";

const APP_ID = "app_0123456789abcdef0123456789abcdef";
// The issuer Fluent gave you for the Network this backend serves.
const ISSUER = "https://issuer-from-fluent.example";

const keys = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

/** The Client subject of a verified Auth token; throws when the token does not verify. */
export async function verifyAuthToken(token: string): Promise<string> {
  // Checks the ES256 signature, `iss`, `aud` and `exp`.
  const { payload } = await jwtVerify(token, keys, {
    issuer: ISSUER,
    audience: APP_ID,
    algorithms: ["ES256"],
  });
  if (!payload.sub) throw new Error("The Auth token names no person.");
  return payload.sub;
}
```

## When `getAuthToken()` rejects

It rejects with a `FluentAuthError` for every refusal the service or the External wallet gives;
every code it throws today, what each means and what to do is in
[errors.md](../errors.md#fluentautherror). Keep a `default` branch in your `switch` over `code`:
a later release may add one. Keep a fallback for other errors too: a failure to read a Fluent
ID's Direct-login credential arrives as it was thrown. A refused refresh credential is not among
the rejections, as [Renewal](#renewal) describes.
