---
sidebar_position: 3
---

# Signing messages and typed data

The Widget API signs for the Widget account: `widget.signMessage` produces an EIP-191 signature,
`widget.signTypedData` an EIP-712 one. This guide covers the two calls, when the widget shows its
Review, how to verify a signature and the rejections. The terms
are defined in [concepts.md](../concepts.md); the declarations are in
[api.md](../api.md#fluentsignapi).

## The two calls

Both resolve with the signature as a `Hex` string, for the address in `widget.account.address`:

- `widget.signMessage({ message })` signs a message, a string or viem's `{ raw }` form.
- `widget.signTypedData({ domain, types, primaryType, message })` signs EIP-712 typed data, with
  viem's types, so `message` is checked against `types`.

A Fluent ID is a smart account: its signature is an ERC-1271 signature, wrapped as ERC-6492
while the account is not yet deployed. An External wallet signs with its own key, an ECDSA
signature for an ordinary key-held account.

```tsx
import { FluentReviewRejectedError, fluentTestnet, useFluentWidget } from "@fluent.xyz/connect";
import { useState } from "react";
import type { Address } from "viem";

const exchange: Address = "0x4444444444444444444444444444444444444444";

export function SignOrder() {
  const { widget } = useFluentWidget();
  const [note, setNote] = useState("");

  async function sign() {
    const maker = widget.account.address;
    if (!maker) return;
    try {
      const signature = await widget.signTypedData({
        domain: {
          name: "Marketplace",
          version: "1",
          chainId: fluentTestnet.id,
          verifyingContract: exchange,
        },
        types: {
          Order: [
            { name: "maker", type: "address" },
            { name: "price", type: "uint256" },
          ],
        },
        primaryType: "Order",
        message: { maker, price: 100n },
      });
      setNote(signature);
    } catch (error) {
      if (error instanceof FluentReviewRejectedError) return; // the person said no
      setNote(error instanceof Error ? error.message : "Signing failed.");
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void sign()}>
        Sign the order
      </button>
      <p>{note}</p>
    </div>
  );
}
```

## When the Review is shown

The Review is the widget's own screen that shows what will be signed, with the page that asks,
and waits for the person to confirm or dismiss it.

| Widget account | `signMessage`, `signTypedData` | A Batch operation's `execute()` |
|---|---|---|
| Fluent ID, Quick sign off | The Review, then the signature. | The Review (Prompt mode), unless `confirmation` asks for Silent mode and `quickSign.whitelistAddresses` allows it. |
| Fluent ID, Quick sign on | No Review (Silent mode). | No Review, unless `confirmation` or `quickSign.whitelistAddresses` asks for one. |
| External wallet | The Review, then the wallet's own prompt. | No widget Review: the wallet's own prompt. |

Signatures take no option. Quick sign, `confirmation` and `quickSign.whitelistAddresses` are
described in [concepts.md](../concepts.md#prompt-mode-and-silent-mode); Batch operations
themselves in the [transactions guide](transactions.md).

## Verifying a signature

A Fluent ID's address belongs to a contract, and no private key stands behind it. Its signature
does not recover to its address with `ecrecover` (or viem's `recoverMessageAddress`), so a check
that compares a recovered address with the account fails. Verify with ERC-1271, and with
ERC-6492 for an account that is not yet deployed: viem's `verifyMessage` and `verifyTypedData` on
a public client of the Network handle both, and an External wallet's ECDSA signature too.

```ts
import { fluentTestnet } from "@fluent.xyz/connect";
import { createPublicClient, http, type Address, type Hex } from "viem";

const publicClient = createPublicClient({ chain: fluentTestnet, transport: http() });

export function isValidSignIn(address: Address, signature: Hex): Promise<boolean> {
  return publicClient.verifyMessage({ address, message: "Sign in to Marketplace", signature });
}
```

**EIP-2612 `permit` and a Fluent ID.** A token's `permit` accepts a signature only when the token
can verify it for the owner's address. Many tokens verify it with `ecrecover` alone (OpenZeppelin's
`ERC20Permit` does), which needs a private key behind the owner's address; a Fluent ID has none,
so those tokens refuse its permit. A token whose `permit` also accepts ERC-1271 signatures can
accept one; check the token's contract. For a Fluent ID, put the `approve` call in the same Batch
operation as the call that spends, where the two land atomically
([example](transactions.md#example-approve-and-deposit-in-one-batch-operation)). An External
wallet that is an ordinary key-held account can sign a `permit` as any such account does.

## Rejections

| Error | `code` | When |
|---|---|---|
| `FluentReviewRejectedError` | `"signature_review_rejected"` | The person dismissed the Review. |
| `FluentAuthError` | `"not_connected"` | No Widget account is connected, or an External wallet is connected but its client is not ready yet. |
| `FluentAuthError` | `"root_signer_required"` | A guard for a Fluent ID: no configuration of the widget reaches it today. |

When the person refuses in an External wallet's own prompt, after confirming the Review, the
call rejects with the wallet's error. A Review replaced by a newer one, or closed because the
widget unmounted, rejects with a plain `Error`. Branch on the class with `instanceof` and on
`code`, and keep a `default` branch in every `switch` over a `code`: a later release may add one.

```ts
import {
  FluentAuthError,
  FluentReviewRejectedError,
  type FluentBatchApi,
} from "@fluent.xyz/connect";
import type { Hex } from "viem";

export async function signOrExplain(
  widget: FluentBatchApi,
  message: string,
): Promise<Hex | string> {
  try {
    return await widget.signMessage({ message });
  } catch (error) {
    if (error instanceof FluentReviewRejectedError) return "You dismissed the signature.";
    if (error instanceof FluentAuthError) {
      switch (error.code) {
        case "not_connected":
          return "Connect first.";
        default:
          return `Signing failed (${error.code}).`;
      }
    }
    // A wallet's own refusal, or a failure of the Signer.
    return error instanceof Error ? error.message : "Something went wrong.";
  }
}
```

Every code and what to do about it: [errors.md](../errors.md#fluentautherror) and
[errors.md](../errors.md#fluentreviewrejectederror).
