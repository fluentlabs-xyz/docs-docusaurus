---
title: Fluent Connect SDK
---

# Fluent Connect SDK

This section documents `@fluent.xyz/connect` 0.6.1, the React widget that connects a person's Widget account, a Fluent ID smart account or an External wallet, to your App and executes Batch operations and signatures with it. The source is the [fluent-connect-sdk](https://github.com/fluentlabs-xyz/fluent-connect-sdk) repository.

An App needs an `appId` and a login client from Fluent before it can mount the widget. To request access, fill in the [access request form](https://tally.so/r/5XbrAE).

| Page | Covers |
|---|---|
| [Getting started](./getting-started.md) | What to ask Fluent for, the install, mounting `<FluentWidget>`, reading the account |
| [Concepts](./concepts.md) | Fluent ID, External wallet, Widget account, Prompt and Silent mode |
| [Configuration](./configuration.md) | Every option of `FluentWidgetConfig` and the widget props |
| [Executing Batch operations](./guides/transactions.md) | `createBatchOp` and `execute` |
| [Sponsorship](./guides/sponsorship.md) | Sponsored gas and its fallback |
| [Signing messages and typed data](./guides/signing.md) | EIP-191 and EIP-712 signatures |
| [Backend auth](./guides/backend-auth.md) | `getAuthToken()` and verifying the Auth token on your backend |
| [Link X](./guides/link-x.md) | `linkX()` and `useLinkX()` |
| [Iframe bridge](./guides/iframe.md) | A page embedded in an `<iframe>` using the Widget account as its wallet |
| [Errors](./errors.md) | Error classes, their codes and how to branch on them |
| [Experimental API](./experimental.md) | Names that may change or be removed in a minor release |
| [API reference](./api.md) | Every export of the package |
| [Upgrading from 0.5](./upgrading-0.5.md) | Migration from 0.5 to 0.6 |
