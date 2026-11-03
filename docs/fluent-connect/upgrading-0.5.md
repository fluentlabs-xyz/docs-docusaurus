---
sidebar_position: 8
---

# Upgrading from 0.5

`@fluent.xyz/connect` 0.6.0 publishes only the API it keeps. This file lists everything 0.5.3
exported that 0.6.0 does not, every member of a kept type that 0.6.0 removes or renames, and the
behaviour that changes under code that still compiles. It is the one document of the package
that names the removed exports; every other guide uses the 0.6.0 names only. The kept API is in
[the API reference](api.md).

## How to read this file

Every row of the tables below is exactly one of three kinds:

| Kind | Meaning | What the row gives |
|---|---|---|
| **rename** | Every use of the old name works after replacing it with the new one: the same inputs, the same result, the same effect; for a type, assignable both ways. | The new name. |
| **recipe** | The kept API reaches the same result another way. | A link to a short checked example using kept names only, with the condition under which the result is not always the same. |
| **none** | There is no public way. | The reason, in one line. |

A name that is not a rename is never a drop-in replacement, even when a kept name looks alike.
A removed export your code still imports is a compile error in TypeScript. The package is ESM
only, so in JavaScript a named import of it fails when the module is linked, before any of its
code runs. Code that compiles against 0.6.0 but behaves differently is listed under
[Behaviour changes](#behaviour-changes), not in a row.

## Behaviour changes

- **`network` is required and has no default.** 0.5 fell back to the `VITE_FLUENT_WIDGET_NETWORK` or `FLUENT_NETWORK` environment variable (with the aliases `dev`, `development`, `prod` and `production`), then to `"testnet"`. 0.6.0 reads no environment variable: a JavaScript host that omits `network` or passes `null` gets a `FluentWidgetConfigError` with `missing_option` when `<FluentWidget>` renders, and any other value than `"testnet"` and `"mainnet"` gets `invalid_option`. A host that set only the environment variable reads it itself and passes the Network.
- **`confirmation` fails closed.** A `confirmation` that is passed is Silent mode only when it is exactly `"silent"`; every other value, `null` and the 0.5 values `"always"` and `"session"` included, is Prompt mode. A 0.5 host that passed `"session"` to skip the Review gets the Review on a Fluent ID's Batch operations; it passes `"silent"` instead. An omitted `confirmation` follows Quick sign: see [Prompt mode and Silent mode](concepts.md#prompt-mode-and-silent-mode).
- **`FluentExecuteResult.sponsored` can be `null`.** It is `null` when a Fluent ID operation in
  ETH made a sponsored submission and the receipt names no paymaster; 0.5 reported the send's
  guess. It is `false` for a Gas token payment, for a Fluent ID operation in ETH that made no
  sponsored submission and whose receipt names no paymaster, such as the fallback, and for every
  External wallet operation.
- **The Widget session is a projection.** `onSessionChange`, the render context's `session` and `useFluentWidget().session` hand out `{ account: { address, type }, issuedAt }` and nothing else; a JavaScript host reading `session.user`, `session.idToken` or `session.wallet` gets `undefined`. A session stored by 0.5 is still restored, unless its address or `issuedAt` is malformed: the widget then discards it when it loads.
- **Config errors are `FluentWidgetConfigError` with a `code`.** Outside `execution`, a config the widget refused threw a plain `Error` in 0.5; 0.6.0 throws a `FluentWidgetConfigError` (still an `Error`) with `missing_option`, `invalid_option` or `removed_option`, its message naming the option. A host that compared a message switches on `code`.
- **Error codes change at runtime.** A `FluentAuthError` carries `invalid_login_credential`, `login_credential_missing`, `no_signer`, `challenge_unknown`, `challenge_used` and `challenge_expired` where 0.5 carried `invalid_privy_token`, `privy_token_missing`, `no_embedded_wallet`, `nonce_unknown`, `nonce_used` and `nonce_expired`, and a service refusal whose code the SDK does not name arrives as `service_refused`, where 0.5 passed the service's code through. `FluentReviewRejectedError` and `FluentSponsorshipFallbackError` gain a `code`.
- **`FluentSponsorshipFallbackError` carries summaries, not the vendor errors.** In 0.5, `cause` and `fallbackError` were the errors the sponsored and own-gas submissions threw, with their request URLs, request bodies and addresses. In 0.6.0 each is a plain `{ name, message, status? }` object whose `message` has those identifiers replaced by placeholders, and the error's own `message` is redacted the same way; see [errors.md](errors.md#fluentsponsorshipfallbackerror). A host that read `details`, `shortMessage`, `url`, `walk()` or `instanceof` on either reads `message` and `status` instead.
- **Debug logs carry no Privy DID nor Signer address.** With `debugLogging` on, the console no longer shows either value.
- **Removed options and members in JavaScript.** A `config.scopes`, a `showDebugPayload` prop or an `AccountAvatar` `userLogoUrl` that a JavaScript host still passes has no effect, so an Account avatar given only `userLogoUrl` shows its `defaultLogoUrl` or the Fluent mark; an executor passed to `execute()` is read as options, none of which it sets, so the widget sends the Batch operation itself; and a call with `functionName` but no `method` makes `widget.createBatchOp` throw, where 0.5 encoded `functionName`.
- **The debug panel follows `debugLogging`.** In `mode="home"`, 0.5 showed the debug panel unless `showDebugPayload` was `false`; 0.6.0 shows it only while `debugLogging` is on.

## Removed exports

### UI primitives

| Removed | Kind | Use instead |
|---|---|---|
| `Button`, `buttonVariants`, `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`, `Icon`, `IconName`, `Label`, `Separator`, `Switch`, `WIDGET_STYLE_SCOPE`, `FluentPortalContainerProvider` | none | Internal UI: the widget's own building blocks and styling scope are not public. |

### Widget components

| Removed | Kind | Use instead |
|---|---|---|
| `FluentAccountDrawer`, `WalletMenuActionCard` | none | Internal UI; `openAccount` opens the widget's own account drawer. |
| `FluentWidgetConnectButton`, `FluentWidgetConnectButtonProps` | none | Internal UI; `renderConnectButton` replaces the connect button, and its `DefaultButton` draws the widget's own. |
| `useWidget` | recipe | [Recipe: `useWidget`](#recipe-usewidget) |

#### Recipe: `useWidget`

0.5's `useWidget()` returned `useFluentWidget().widget`, and so does this hook, throwing in the
same way outside `<FluentWidget>`; the Widget API it returns has 0.6.0's members, listed under
[Removed or renamed members](#removed-or-renamed-members).

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";

export function useWidgetApi() {
  return useFluentWidget().widget;
}
```

### Batch operations and signing

| Removed | Kind | Use instead |
|---|---|---|
| `createFluentBatchOp`, `FluentBatchOperationExecutor` | none | The feature is removed: a Batch operation with an executor the App builds. A Batch operation is built by `widget.createBatchOp` and sent by the widget. |
| `FluentBatchConfirmationMode` | recipe | [Recipe: `confirmation` values](#recipe-confirmation-values) |
| `FluentBatchOperationReview`, `FluentSignatureReview` | none | Internal UI: the Review is the widget's own screen. |
| `FluentTypedDataRequest` | recipe | [Recipe: `FluentTypedDataRequest`](#recipe-fluenttypeddatarequest) |

#### Recipe: `FluentTypedDataRequest`

The parameter of `widget.signTypedData`, with its generics at their constraints, is the same type
as 0.5's `FluentTypedDataRequest`, assignable both ways.

```ts
import type { FluentSignApi } from "@fluent.xyz/connect";

export type TypedDataRequest = Parameters<FluentSignApi["signTypedData"]>[0];
```

### Permission sessions

| Removed | Kind | Use instead |
|---|---|---|
| `CallType`, `ParamCondition`, `createFluentPermissionApi`, `createFluentPermissionClient`, `createFluentPermissionPolicyBuilders`, `createFluentPermissionSession`, `createFluentZeroDevPermissionSession`, `FluentCallPermission`, `FluentPermissionApi`, `FluentPermissionArgConstraint`, `FluentPermissionArgs`, `FluentPermissionBatchPolicy`, `FluentPermissionBatchPolicyInput`, `FluentPermissionCallInput`, `FluentPermissionCallPolicy`, `FluentPermissionClient`, `FluentPermissionClientConfig`, `FluentPermissionGrant`, `FluentPermissionGrantRequest`, `FluentPermissionPolicy`, `FluentPermissionPolicyBuilders`, `FluentPermissionPreview`, `FluentPermissionSession`, `FluentPermissionSessionExecutor`, `FluentPermissionSessionInput`, `FluentPermissionStatus`, `FluentSpendPeriod`, `FluentSpendPermission`, `FluentZeroDevPermissionCall`, `FluentZeroDevPermissionSession` | none | The feature is removed: permission sessions and their policies. |

### ZeroDev and paymaster plumbing

| Removed | Kind | Use instead |
|---|---|---|
| `FLUENT_ZERODEV_ERC20_PAYMASTER_QUERY`, `FLUENT_ZERODEV_PAYMASTER_DEMO_RECIPIENT`, `createFluentSponsorshipRpcUrl`, `createFluentZeroDevErc20Paymaster`, `createFluentZeroDevErc20PaymasterApprovalCall`, `createFluentZeroDevErc20PaymasterClient`, `createFluentZeroDevErc20PaymasterRpcUrl`, `createFluentZeroDevRpcUrl`, `createFluentZeroDevSponsoredPaymaster`, `fluentIntegrations`, `fluentZeroDevChainIds`, `getFluentZeroDevErc20PaymasterTokens`, `getZeroDevRpcUrl`, `getZerodevIntegration`, `isFluentZeroDevChain`, `resolveFluentZeroDevErc20PaymasterToken`, `sendFluentZeroDevErc20PaymasterDemo`, `useFluentZeroDevAccount`, `FluentZeroDevErc20PaymasterToken`, `FluentZeroDevErc20PaymasterTokenInfo`, `FluentZeroDevKernel`, `FluentZeroDevPaymasterDemoResult`, `FluentZeroDevPaymasterKernel`, `FluentZeroDevSignerMode`, `FluentZeroDevSponsorshipTokenSource`, `ZerodevIntegration` | none | The widget does this itself: it prepares the Fluent ID's account and pays gas through `execute()`, with `gasPayment` choosing how. |

### Chains and registry

| Removed | Kind | Use instead |
|---|---|---|
| `fluentChain` | recipe | [Recipe: `fluentChain`](#recipe-fluentchain) |
| `fluentChains` | recipe | [Recipe: `fluentChains`](#recipe-fluentchains) |
| `getFluentChain` | recipe | [Recipe: `getFluentChain`](#recipe-getfluentchain) |
| `getFluentExplorerBaseUrl` | recipe | [Recipe: `getFluentExplorerBaseUrl`](#recipe-getfluentexplorerbaseurl) |
| `fluentDefinitionToViemChain` | none | 0.6.0 converts no chain definition to a viem chain. |
| `fluentL1Chains`, `getL1Chain`, `getL1ForFluentChain`, `l1DefinitionToViemChain`, `resolveL1Definition`, `L1ChainDefinition` | none | The registry's L1 chains are not public. |
| `fluentApps`, `getApp`, `AppDefinition`, `registryVersion` | none | The registry's app entries and version are not public. |
| `fluentBridgeAbi`, `BridgeAddresses`, `resolveBridgeAddresses`, `getContractAddressFromChain` | none | The bridge contracts' ABI and address helpers are not public. |

#### Recipe: `fluentChain`

0.5's `fluentChain` was the object `{ testnet: fluentTestnet, mainnet: fluentMainnet }`; this one
holds the same two viem chains.

```ts
import { fluentMainnet, fluentTestnet } from "@fluent.xyz/connect";

export const chainsByNetwork = { testnet: fluentTestnet, mainnet: fluentMainnet } as const;
```

#### Recipe: `fluentChains`

0.5's `fluentChains` held the registry's two chain definitions by Network; this record holds the
same definitions, found by the chain ids of `fluentTestnet` and `fluentMainnet`. Each value is
typed `FluentChainDefinition | undefined`, though both ids are always found.

```ts
import { fluentMainnet, fluentTestnet, getFluentChainByChainId } from "@fluent.xyz/connect";

export const chainDefinitions = {
  testnet: getFluentChainByChainId(fluentTestnet.id),
  mainnet: getFluentChainByChainId(fluentMainnet.id),
};
```

#### Recipe: `getFluentChain`

0.5's `getFluentChain(network)` returned the registry's definition of `"testnet"` or `"mainnet"`;
this function returns the same definition. Its result is typed `FluentChainDefinition |
undefined`: it is defined for `"testnet"` and `"mainnet"`, and `undefined` for any other value a
JavaScript caller passes, as 0.5's was.

```ts
import {
  fluentMainnet,
  fluentTestnet,
  getFluentChainByChainId,
  type FluentWidgetNetwork,
} from "@fluent.xyz/connect";

const chainIds = { testnet: fluentTestnet.id, mainnet: fluentMainnet.id } as const;

export function chainDefinitionOf(network: FluentWidgetNetwork) {
  return getFluentChainByChainId(chainIds[network]);
}
```

#### Recipe: `getFluentExplorerBaseUrl`

0.5's `getFluentExplorerBaseUrl(network)` was this expression. Like it, it returns testnet's
explorer for any value other than `"mainnet"`.

```ts
import { getFluentChainForNetwork, type FluentWidgetNetwork } from "@fluent.xyz/connect";

export function explorerBaseUrlOf(network: FluentWidgetNetwork): string | undefined {
  return getFluentChainForNetwork(network).blockExplorers?.default.url;
}
```

### Network and config

| Removed | Kind | Use instead |
|---|---|---|
| `normalizeFluentWidgetNetwork` | none | The widget takes only `"testnet"` or `"mainnet"`; the App maps its own value and passes it as `network`. |
| `resolveFluentWidgetNetworkFromEnv` | none | The widget reads no environment variable; the App passes `network`. |
| `FluentWidgetNetworkProvider`, `useFluentWidgetNetwork`, `isFaucetNetwork` | none | Internal: the App passes `network` itself, so it already knows it. |
| `ResolvedFluentWidgetConfig`, `ResolvedFluentWidgetExecution` | none | There is no public resolved config. |
| `FLUENT_CONNECT_DEFAULT_ASSETS` | none | The widget's default images are internal. |

### Storage keys and session

| Removed | Kind | Use instead |
|---|---|---|
| `FLUENT_WIDGET_SESSION_STORAGE_KEY` | none | The widget's storage is internal. Read the render context's `session`, which holds a restored session, and `onSessionChange` for later Direct-login changes. |
| `FLUENT_WIDGET_USER_TOKENS_STORAGE_KEY`, `FLUENT_WIDGET_USER_TOKENS_IMPORT_MARKER_KEY` | none | The widget's storage is internal. |
| `FluentSession` | none | The 0.5 session shape is not public; the Widget session is `FluentWidgetSession`, a different shape. |
| `clearPrivyRecentLoginMethod` | none | The widget does this itself. |

### Fluent client and families

| Removed | Kind | Use instead |
|---|---|---|
| `fluent`, `createFluentClient`, `FluentClient`, `FluentClientConfig`, `createFluentFamiliesClient`, `FluentFamilies`, `FluentFamiliesClient`, `FluentFamiliesClientConfig`, `FluentFamily`, `FluentFamilyTier`, `FluentFamilyType` | none | The feature is removed: the standalone client and the families lookup. |

### Tokens and balances

| Removed | Kind | Use instead |
|---|---|---|
| `fluentMainnetTokenDefaults`, `fluentTestnetTokenDefaults`, `getFluentTokenDefaults`, `getFluentTokenDefaultsForNetwork`, `getFluentDefaultWidgetDisplayTokens`, `getFluentDefaultWidgetGasTokens`, `isFluentDefaultToken`, `isFluentNativeToken`, `fluentTokenIdentity`, `mergeFluentDisplayTokens`, `findFluentSymbolCollisions` | none | The widget does this itself: it lists its Default tokens beside the App's `tokens`. |
| `readFluentTokenBalances`, `readFluentTokenMetadata`, `FluentTokenBalance` | none | The widget reads balances itself; `refreshBalances` refetches them. |
| `FLUENT_USER_TOKEN_LIMIT`, `createFluentUserTokenStore`, `createFluentBackendUserTokenStore`, `useFluentUserTokens`, `UserTokenStore`, `BackendUserTokenStore`, `FluentUserTokenAddResult` | none | The widget keeps the person's User tokens itself. |

### Gas payment

| Removed | Kind | Use instead |
|---|---|---|
| `FLUENT_WIDGET_DEFAULT_GAS_TOKEN`, `resolveDefaultGasToken` | none | The widget does this itself; `config.gasPayment.defaultToken` sets the Gas token it starts with. |
| `FLUENT_GAS_PAYMENT_DEFAULT_ETH_RATES`, `deriveFluentGasEthRates`, `getFluentGasPaymentEthValue`, `getFluentGasPaymentTokens`, `getFluentGasPaymentValueTier`, `getFluentGasTokenAddress`, `selectFluentGasPaymentToken`, `sortFluentGasTokens`, `FluentGasPaymentSelection`, `FluentGasPaymentValueTier` | none | The widget does this itself: `widget.gasPayment` is the Gas payment chosen in the widget. |

### Token transfer

| Removed | Kind | Use instead |
|---|---|---|
| `buildFluentTransferCall`, `checkFluentTransferFee`, `fluentTransferAbi`, `parseFluentTransferAmount`, `parseFluentTransferRecipient`, `FluentTokenTransferOutcome`, `FluentTokenTransferRequest`, `FluentTokenTransferSender`, `FluentTransferAmount`, `FluentTransferFee`, `FluentTransferRecipient` | none | Internal to the widget's Send form. |

### User settings

| Removed | Kind | Use instead |
|---|---|---|
| `createFluentSettingsClient`, `FluentSettingsClient`, `FluentSettingsError`, `FluentSettingsErrorCode`, `FluentUserSettings`, `FluentUserSettingsPatch`, `FluentProfile` | none | The widget keeps User settings itself. |

### Iframe

| Removed | Kind | Use instead |
|---|---|---|
| `createFluentIframeBridge`, `createFluentIframeRpcHandler`, `FluentIframeBridge`, `FluentIframeBridgeOptions`, `FluentIframeRpcExecutor`, `FluentIframeRpcHandler`, `FluentIframeRpcRequest` | none | The feature is removed: a bridge with an executor the App builds. `useFluentIframeBridge` bridges an iframe to the Widget account. |
| `FluentIframeRpcError` | none | Numeric RPC errors are internal; a dismissed Review reaches the iframe as `4001`. |

## Removed or renamed members

### `AccountAvatarProps`

| Member | Kind | Use instead |
|---|---|---|
| `AccountAvatarProps.userLogoUrl` | rename | `AccountAvatarProps.userAvatarUrl` |

### `FluentBatchApi`

| Member | Kind | Use instead |
|---|---|---|
| `FluentBatchApi.confirmationMode` | recipe | [Recipe: `FluentBatchApi.confirmationMode`](#recipe-fluentbatchapiconfirmationmode) |
| `FluentBatchApi.createPermissionSession`, `FluentBatchApi.policies` | none | The feature is removed: permission sessions and their policies. |

#### Recipe: `FluentBatchApi.confirmationMode`

0.5's `widget.confirmationMode` was `"session"` while the person's Quick sign was on and
`"always"` otherwise; 0.6.0's `widget.signingMode` is `"silent"` and `"prompt"` in the same
states, and this hook gives back the 0.5 value.

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";

export function useConfirmationMode(): "always" | "session" {
  return useFluentWidget().widget.signingMode === "silent" ? "session" : "always";
}
```

### `FluentBatchCallInput`

| Member | Kind | Use instead |
|---|---|---|
| `FluentBatchCallInput.functionName` | rename | `FluentBatchCallInput.method` |

### `FluentBatchOperation`

| Member | Kind | Use instead |
|---|---|---|
| `FluentBatchOperation.execute` | none | Its executor argument is removed: `execute(options)` takes the options only and sends through the widget. |

### `FluentBatchOperationExecuteOptions`

| Member | Kind | Use instead |
|---|---|---|
| `FluentBatchOperationExecuteOptions.confirmation` | recipe | [Recipe: `confirmation` values](#recipe-confirmation-values) |
| `FluentSigningMode` `"always"` | recipe | [Recipe: `confirmation` values](#recipe-confirmation-values) |
| `FluentSigningMode` `"session"` | recipe | [Recipe: `confirmation` values](#recipe-confirmation-values) |

#### Recipe: `confirmation` values

`confirmation` is kept, and its values changed: 0.5's `"session"` signed as Silent mode and
`"always"` as Prompt mode. This function gives the 0.6.0 value with the same effect for every 0.5
value. A 0.5 value passed unchanged is read as [Behaviour changes](#behaviour-changes) says.

```ts
import type { FluentSigningMode } from "@fluent.xyz/connect";

export function signingModeOf(confirmation: "always" | "session"): FluentSigningMode {
  return confirmation === "session" ? "silent" : "prompt";
}
```

### `FluentTokenDefinition`

| Member | Kind | Use instead |
|---|---|---|
| `FluentTokenDefinition.gasPriority`, `FluentTokenDefinition.native` | none | The widget already ignored both on a token the App passed: only a Default token can be a Gas token or the chain's own currency. |

### `FluentWidgetAccount`

| Member | Kind | Use instead |
|---|---|---|
| `FluentWidgetAccount.signerAddress` | none | The Signer's address is not part of the Widget API. |

### `FluentWidgetConfig`

| Member | Kind | Use instead |
|---|---|---|
| `FluentWidgetConfig.scopes` | none | The option is removed; it only filled the 0.5 session's `scopes`. |

### `FluentWidgetProps`

| Member | Kind | Use instead |
|---|---|---|
| `FluentWidgetProps.showDebugPayload` | none | The prop is removed; the debug panel follows `debugLogging`. |

### `FluentWidgetRenderContext`

| Member | Kind | Use instead |
|---|---|---|
| `FluentWidgetRenderContext.connecting` | recipe | [Recipe: `FluentWidgetRenderContext.connecting`](#recipe-fluentwidgetrendercontextconnecting) |
| `FluentWidgetRenderContext.connectedAddress` | none | No member holds the same value in every state: `connectedAddress` preferred a Fluent ID's address, and `widget.account.address` is a connected External wallet's until the Fluent ID's account is ready. |

#### Recipe: `FluentWidgetRenderContext.connecting`

0.5's `connecting` was `true` exactly when `status` was `"connecting"`, in every state; this hook
reads the same.

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";

export function useConnecting(): boolean {
  return useFluentWidget().status === "connecting";
}
```

### `FluentWidgetSession`

| Member | Kind | Use instead |
|---|---|---|
| `FluentWidgetSession.wallet` | recipe | [Recipe: `FluentWidgetSession.wallet`](#recipe-fluentwidgetsessionwallet) |
| `FluentWidgetSession.app`, `FluentWidgetSession.appId`, `FluentWidgetSession.expiresAt`, `FluentWidgetSession.idToken`, `FluentWidgetSession.metadata`, `FluentWidgetSession.scopes`, `FluentWidgetSession.user` | none | The Widget session is `{ account, issuedAt }` only; an App proves who the person is with an Auth token from `getAuthToken()`. |

#### Recipe: `FluentWidgetSession.wallet`

0.5's `session.wallet.smartAccountAddress` is `session.account.address`, the same address copied
from the same stored session. Only that field has a replacement: `wallet.signerAddress` and
`wallet.authorizationSession` have none.

```tsx
import { useFluentWidget } from "@fluent.xyz/connect";

export function useSessionAddress() {
  return useFluentWidget().session?.account.address;
}
```

### `FluentAuthErrorCode`

Each 0.6.0 code is raised exactly where 0.5 raised the old one.

| Member | Kind | Use instead |
|---|---|---|
| `FluentAuthErrorCode` `"invalid_privy_token"` | rename | `"invalid_login_credential"` |
| `FluentAuthErrorCode` `"privy_token_missing"` | rename | `"login_credential_missing"` |
| `FluentAuthErrorCode` `"no_embedded_wallet"` | rename | `"no_signer"` |
| `FluentAuthErrorCode` `"nonce_unknown"` | rename | `"challenge_unknown"` |
| `FluentAuthErrorCode` `"nonce_used"` | rename | `"challenge_used"` |
| `FluentAuthErrorCode` `"nonce_expired"` | rename | `"challenge_expired"` |
