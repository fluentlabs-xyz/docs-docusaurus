---
sidebar_position: 6
---

# Iframe bridge

How a page the App embeds in an `<iframe>` uses the Widget account as its wallet. The Iframe
bridge answers the embedded page's wallet requests with the widget: the same Widget account, the
same Review and the same Batch operations as the App's own requests. The terms used here are
defined in [concepts.md](../concepts.md).

## Set it up

Call `useFluentIframeBridge(iframeRef, { allowedOrigin })` in a component rendered inside
`<FluentWidget>`:

- `iframeRef` is a ref to the `<iframe>`, typed `RefObject<FluentIframeElement | null>`. A
  `useRef<HTMLIFrameElement>(null)` fits it. `FluentIframeElement` is the element reduced to the
  window the bridge replies to; the bridge reads it on every message, so an element swapped in
  after mount is still answered.
- `allowedOrigin` is the exact origin the embedded page is served from, such as
  `"https://market.example"`. It must be an `http:` or `https:` origin: `"*"` and a bare host are
  refused, with an `Error` thrown from the effect that builds the bridge, so the nearest error
  boundary catches it. Messages from any other origin, or from any window other than the
  iframe's, are dropped without a reply: this is the only origin check in the exchange.

The bridge lives while the component is mounted. A request the embedded page sent before the
component unmounts is still answered, as long as the `<iframe>` element is still mounted.

```tsx
import {
  FluentWidget,
  useFluentIframeBridge,
  type FluentWidgetConfig,
} from "@fluent.xyz/connect";
import { useRef } from "react";

const config: FluentWidgetConfig = {
  appId: "app_0123456789abcdef0123456789abcdef",
  privyClientId: "client-0123456789abcdef",
  network: "testnet",
};

function Marketplace() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  useFluentIframeBridge(iframeRef, { allowedOrigin: "https://market.example" });
  return (
    <iframe
      ref={iframeRef}
      src="https://market.example/collection/cards"
      title="Marketplace"
      style={{ width: "100%", height: 640, border: 0 }}
    />
  );
}

export function App() {
  return <FluentWidget config={config} mode="page" renderPage={() => <Marketplace />} />;
}
```

## What the embedded page sends

The embedded page speaks JSON-RPC 2.0 over `postMessage`, the protocol of
`@ledgerhq/iframe-provider`: it posts a request to `window.parent`, and the bridge posts the
reply back with the same `id`, holding `result` or `error`. Events carry no `id`. A message
without an `id` gets no reply.

```json
{ "jsonrpc": "2.0", "id": 1, "method": "eth_requestAccounts", "params": [] }
```

Before its first reply the bridge posts `chainChanged` with the Network's chain id and
`accountsChanged` with the connected Widget account. After that, connecting and disconnecting
reach the iframe as `accountsChanged` (an empty list on disconnect).

## What the bridge answers

| Method | Answer |
|---|---|
| `eth_accounts`, `eth_requestAccounts`, `enable` | `widget.account.address` in a list, or `[]` when it is empty. It does not open the connect dialog. |
| `eth_chainId` | The chain id of the widget's Network. |
| `personal_sign` | `widget.signMessage(…)`; a hex message is signed as raw bytes. |
| `eth_signTypedData_v4`, `eth_signTypedData_v3`, `eth_signTypedData` | `widget.signTypedData(…)`. |
| `eth_sendTransaction` | One Batch operation with one call, `widget.createBatchOp({ calls }).execute()`, answered with the operation's `hash` once it is included. `to` is required; `data` and `value` are passed on; gas fields are ignored, because the widget prices the operation itself. |
| `eth_blockNumber`, `eth_call`, `eth_estimateGas`, `eth_feeHistory`, `eth_gasPrice`, `eth_getBalance`, `eth_getBlockByHash`, `eth_getBlockByNumber`, `eth_getCode`, `eth_getLogs`, `eth_getStorageAt`, `eth_getTransactionByHash`, `eth_getTransactionCount`, `eth_getTransactionReceipt`, `eth_maxPriorityFeePerGas`, `net_version` | Forwarded to the Network's chain as they are. |

The signing and sending methods must name the connected Widget account (`from`, or the address
parameter of a signature); the bridge never acts for any other address. Every other method is
refused. The bridge reads the account from `widget.account.address`, which can hold the address of
a Widget session from an earlier visit while `status` is not `"connected"`
([getting-started.md](../getting-started.md)).

A signature shows the Review as `widget.signMessage` and `widget.signTypedData` do, and an
`eth_sendTransaction` as the App's own Batch operations do: see
[concepts.md](../concepts.md#prompt-mode-and-silent-mode).

## Errors the embedded page receives

The bridge answers a failed request with an EIP-1193 or JSON-RPC error `{ code, message }`:

| `code` | When |
|---|---|
| `4001` | The person dismissed the Review of the signature or the Batch operation. |
| `4100` | `widget.account.address` is empty, or the request names another address. |
| `4200` | The method is not one of those above. |
| `-32602` | The parameters are malformed: a missing address, typed data, message, recipient or transaction object, or a value that is not hex. |
| `-32603` | Any other failure, with its message. A `FluentAuthError` arrives as `"<code>: <message>"`. |

An External wallet's refusal in its own prompt is the wallet's error, not a dismissed Review, so
it reaches the iframe as `-32603` with the wallet's message. On the App's side, the codes of the
errors the widget throws are in [errors.md](../errors.md#how-to-branch).
