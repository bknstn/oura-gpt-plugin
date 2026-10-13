# Auth0 and Oura linking runbook (preparation only)

**Checked:** 2026-10-13 (Europe/Warsaw).
**Status:** documented setup template; no accounts, credentials, domain, or provider configuration exist yet.
**Related decision:** [ADR 0002](../adr/0002-auth-intermediary-and-oura-linking.md).

This runbook records the candidate setup for a future controlled integration spike. Do not use it to connect real Oura data until the terms route below is clarified and the OAuth gates in ADR 0002 pass.

## Values to fill outside Git

| Name | Placeholder | Where it is used |
| --- | --- | --- |
| Public MCP host | `<PUBLIC_MCP_HOST>` | HTTPS hostname that will serve `/mcp` and OAuth metadata. |
| Canonical MCP resource | `https://<PUBLIC_MCP_HOST>/mcp` | Protected-resource `resource`, Auth0 API identifier, and expected token `aud`. Keep exact spelling consistent. |
| Auth0 issuer/domain | `<AUTH0_ISSUER>` / `<AUTH0_DOMAIN>` | Auth0 discovery, token issuer validation, and account-link identity. Use the exact `issuer` published by discovery. |
| Auth0 MCP permission | `oura:daily.read` | Connector-defined permission for the T2 daily-metrics tool. This is not an Oura scope. |
| ChatGPT callback | `<COPY_EXACT_URI_FROM_MCP_MANAGEMENT_PAGE>` | Auth0 client callback. Use the callback shown for the selected issuer-identification mode. |
| Oura callback | `https://<PUBLIC_MCP_HOST>/oauth/oura/callback` | Oura API application callback; this future route is distinct from ChatGPT's callback. |
| Oura authorization client | `<OURA_CLIENT_ID>` | Oura OAuth authorize/token requests. Keep the secret in a secret manager. |
| Oura client secret | `<SET_IN_SECRET_MANAGER>` | Server-side code exchange and refresh only; never commit or put it in chat/logs. |

Do not put live values in this document. Keep client IDs and secrets in an approved secret manager when available; the client secret and per-user tokens must not appear in Git, support messages, browser URLs, or logs.

## Auth0 tenant setup for the spike

1. Create a dedicated Auth0 development tenant with a named technical owner. Configure the custom API identifier as `https://<PUBLIC_MCP_HOST>/mcp`, RS256 signing, and the app-defined permission `oura:daily.read`.
2. In Auth0 tenant **Settings → Advanced → Settings**, enable **Resource Parameter Compatibility Profile** and **Include Issuer in Authorization Responses**. The first setting lets `resource` define the audience; the second adds RFC 9207 `iss`. These settings are not a substitute for testing both success and error redirects.
3. Select one OAuth client registration path in the ChatGPT MCP connection setup. Prefer a verified CIMD flow when the tenant accepts the exact ChatGPT metadata and endpoint-auth method. Auth0 documents DCR as available but open registration; if DCR is used for a disposable spike, enable it only there, configure API default permissions, set an ACL/monitoring limit, and use PKCE. Do not enable open DCR in a shared or production tenant as a casual workaround.
4. Fetch `https://<AUTH0_DOMAIN>/.well-known/openid-configuration`. Copy its exact `issuer` to the MCP protected-resource metadata `authorization_servers` list, then validate token `iss` and `aud` exactly in the resource server.
5. When a reachable MCP server is later added to ChatGPT, copy the exact callback URI and CIMD URL shown in its management page into the Auth0 client allowlist/configuration. OpenAI documents the stable callback `https://chatgpt.com/connector_platform_oauth_redirect` only when RFC 9207 `iss` is advertised and returned correctly on both success and error authorization responses; otherwise use the callback-ID-specific URI shown by ChatGPT. Never guess or normalize the callback string.
6. Auth0 third-party clients do not support OIDC scopes, ID tokens, UserInfo, or `id_token_hint` in strict mode. Keep the MCP token flow independent of email/ID-token lookup. Test that `sub` is stable for the link design before using it for association.

## Oura application setup template

1. Sign in to the [Oura developer portal](https://developer.ouraring.com/) with the Oura developer account and create a new application there, with a descriptive name and the eventual public website URL. Oura's [current support article](https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API) (updated 2026-10-01) identifies this as the newest portal; `cloud.ouraring.com` is the previous portal and remains available to edit existing applications.
2. Add the exact Oura callback `https://<PUBLIC_MCP_HOST>/oauth/oura/callback` to the application's redirect URI allowlist. The app must implement this route before it is used. Send the same `redirect_uri` on authorization and code exchange; Oura compares it exactly.
3. For the first `get_daily_metrics` iteration request only `daily`. This Oura scope covers daily sleep, activity, and readiness summaries. The eventual full MVP adds `heartrate` for time-series heart rate and `workout` for workout summaries. Do not request `email`, `personal`, `tag`, `session`, or `spo2` without a separately accepted need.
4. Use Oura's server-side authorization-code flow: authorization endpoint `https://cloud.ouraring.com/oauth/authorize`, token endpoint `https://api.ouraring.com/oauth/token`, `response_type=code`, explicit `client_id`, exact callback, random one-time `state`, requested scope, and PKCE `S256`. Store the PKCE verifier server-side for the pending transaction. Oura documents PKCE as recommended and requires `S256` when a challenge is supplied.
5. Store the client secret in the deployment secret manager under a name such as `OURA_CLIENT_SECRET`; store the client ID as `OURA_CLIENT_ID`. Use an environment-to-secret-manager mapping outside Git. Do not add either value to `.env.example`, this runbook, shell history, or logs.
6. The legacy [Getting started page](https://cloud.ouraring.com/docs/) describes a default 10-user application limit and approval for wider release. The current support article points new apps to the developer portal, so verify any current user limit, review requirement, and app permissions in the actual application portal before planning beyond a controlled spike; do not treat the legacy page as current confirmation.

Oura permits users to disable individual requested scopes. Its current docs say the server-side authorization callback's `scope` parameter is deprecated and may be omitted; the documented server-side token response lists access token, expiry, and refresh token but does not document an authoritative granted-scope field. Do not infer effective grant from requested scopes or the callback. A later permitted integration must call only the required endpoint, treat Oura's missing-scope `403` as a closed failure, and request reauthorization rather than returning partial data as complete.

## Separate account-link flow

The ChatGPT OAuth callback and Oura OAuth callback are separate flows. The user links Oura at the connector's minimal `/connect/oura` page before adding/using the ChatGPT MCP connection:

1. Authenticate `/connect/oura` with a separate first-party web client in the same Auth0 tenant. Create a server-side session from the validated Auth0 `(issuer, subject)`; do not use an email address as an identity key.
2. Start an Oura authorization transaction bound to that pair, with a short expiry, one-time random `state`, exact callback, and stored PKCE verifier. The browser receives only the redirect and non-secret state; it never receives an Oura client secret or token.
3. On `/oauth/oura/callback`, validate and consume the stored state, reject Oura errors or malformed callbacks, and exchange the code server-to-server. Do not log callback query strings, codes, tokens, or health responses.
4. Persist only Oura credentials and grant metadata required for operation in a managed encrypted credential store. Key the record by `(Auth0 issuer, Auth0 subject, provider=oura)`, with a uniqueness constraint. Keep no health payloads/history.
5. On an MCP tool call, validate the separate Auth0 bearer token and use its exact issuer/subject to resolve the Oura credential. Never accept an account ID from the model. If there is no matching active connection, return an authentication/link-required error without calling Oura.
6. Refresh Oura tokens with one serialized refresh per linked record. Oura refresh tokens are single-use: persist the replacement immediately after success, and never retry an old refresh token after rotation. On revocation or disconnect, stop calls, remove credentials and association, and revoke the Oura access token where supported.

The planned Auth0 implementation does not store the Oura token in its Token Vault unless a future official integration and live test prove support for Oura and single-use replacement-token handling. Auth0's current Token Vault documentation says the refresh-token-exchange path does not support refresh-token rotation; this does not itself prove incompatibility with Oura's upstream rotation. The reviewed documents do not establish Oura support or safe replacement-token handling.

## Oura terms review required before real-data testing

Oura's [current API and MCP Agreement](https://cloud.ouraring.com/legal/api-agreement), effective 2026-06-08, contains a material terms question for the planned API path:

- §2(a)(i) describes authorized-purpose access through a Collaborator Application to the Oura API, including processing through another technology such as an AI Platform, subject to the Agreement and user consent.
- §4(d) says a non-Aggregator's LLM use may access/process Oura data solely through the contract-defined MCP Server, and separately prohibits using the Oura API to provide input or data to an AI Model or AI Platform.
- §§2(c–d) separately restrict an `Aggregator` to pass-through for End Customers, prohibit AI transfer/use, and reserve any additional authorization to a separate written agreement. §§3(e–f) require separate API registration/credentials and prior written approval for each End Customer if the service is an Aggregator, and require a customer list.
- §3(a) defines the agreement's “MCP Server” as infrastructure operated by Oura. The connector's custom MCP endpoint is not that Oura-operated server under the wording of §3(a).

The product plan calls for an Oura API → custom connector MCP → ChatGPT flow. Reading that path as covered by §4(d)'s API-to-AI restriction is our inference from the published text, not a legal conclusion. Project gate: do not run a real-data test while this route is unresolved; ask Oura whether this route is permitted and whether the Oura-operated MCP path is required. The separate question of whether the connector meets the Agreement's Aggregator definition also remains open; if it does, §§2(c–d) and 3(e–f) state additional restrictions and steps. This runbook does not assume that user consent overrides those terms or create an approval requirement from the uncertainty alone.

**Unsent clarification draft — do not send from this repository:**

> Subject: Clarification on Oura API and MCP Agreement §§2 and 4 for a user-directed MCP integration
>
> We are evaluating a connector in which an individual Oura user authorizes our registered application through Oura's server-side OAuth flow. Our remote MCP server would fetch that user's data on demand from the Oura API and return only the requested result to that same user through ChatGPT. We do not plan to retain health payloads, train/evaluate models with Oura data, or use the data for other customers.
>
> Could you clarify whether this API → our custom MCP server → ChatGPT flow is permitted under §4(d), given §2(a)(i)'s description of processing through an AI Platform? Does §4(d) require use of the MCP Server operated by Oura, or is there a permitted API route or written exception for this flow? Also, would our service be an “Aggregator” under §2(c–d), and if so, do §§3(e–f) require separate Oura API registrations/credentials and prior approval for each individual end customer? Please point us to the applicable registration, approval, and consent requirements before we test with real user data.

This text is only prepared for review. No email, support case, or application was submitted.

## External conditions before a permitted real-data test

- The team resolves the terms question and documents the permitted route before a real-data test; if the route is not permitted, stop and change the architecture only after a separate product decision.
- Oura developer application is registered with the exact callback and has active `daily` access; the secret is available only to the runtime secret manager.
- Any current Oura application user limit or review/approval requirement is checked in the newest developer portal; the legacy ten-user claim is not treated as current until verified.
- Auth0 tenant is configured with resource/issuer settings and the ChatGPT callback/client-registration flow has passed the gates in ADR 0002.
- A public HTTPS deployment and Auth0/Oura account-link route exist. No real health data is used against the current loopback-only server.
- Account isolation, access-denied/partial-scope behavior, token refresh races, disconnect/revoke, and sanitized logging are tested before calling the vertical scenario complete.
