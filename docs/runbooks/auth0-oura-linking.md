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
| Auth0 link app client ID | `<AUTH0_LINK_CLIENT_ID>` | Dedicated first-party Regular Web Application for `/connect/oura`. |
| Auth0 link app secret | `<SET_IN_SECRET_MANAGER>` | Confidential server-side code exchange for the link page only. |
| Auth0 link callback | `https://<PUBLIC_MCP_HOST>/oauth/auth0/callback` | First-party Auth0 sign-in callback; distinct from ChatGPT and Oura callbacks. |
| ChatGPT callback | `<COPY_EXACT_URI_FROM_MCP_MANAGEMENT_PAGE>` | Auth0 client callback. Use the callback shown for the selected issuer-identification mode. |
| ChatGPT CIMD URL | `<COPY_EXACT_CIMD_URL_FROM_MCP_MANAGEMENT_PAGE>` | Exact ChatGPT client metadata URL to import into Auth0. Do not reconstruct or edit it. |
| Oura callback | `https://<PUBLIC_MCP_HOST>/oauth/oura/callback` | Oura API application callback; this future route is distinct from ChatGPT's callback. |
| Oura authorization client | `<OURA_CLIENT_ID>` | Oura OAuth authorize/token requests. Keep the secret in a secret manager. |
| Oura client secret | `<SET_IN_SECRET_MANAGER>` | Server-side code exchange and refresh only; never commit or put it in chat/logs. |

Do not put live values in this document. Keep client IDs and secrets in an approved secret manager when available; the client secret and per-user tokens must not appear in Git, support messages, browser URLs, or logs.

## Auth0 tenant setup for the spike

1. Create a dedicated Auth0 development tenant with a named technical owner. Configure the custom API identifier as `https://<PUBLIC_MCP_HOST>/mcp`, RS256 signing, and the app-defined permission `oura:daily.read`.
2. In Auth0 tenant **Settings → Advanced → Settings**, enable **Resource Parameter Compatibility Profile**, **Include Issuer in Authorization Responses**, and **Client ID Metadata Document Registration**. The resource profile maps `resource` to the API audience only when an `audience` value is not also supplied; `audience` takes priority if both are present. The issuer toggle does not replace testing success and error authorization responses.
3. Add the MCP server to ChatGPT's development connection setup and copy its exact callback URI and CIMD URL from the management page into the placeholders above. OpenAI documents the stable callback `https://chatgpt.com/connector_platform_oauth_redirect` only when RFC 9207 `iss` is advertised and returned correctly on both success and error authorization responses; otherwise use the callback-ID-specific URI shown by ChatGPT. Never guess or normalize the callback string.
4. Prefer manual CIMD registration for this spike: in Auth0 Dashboard, go to **Applications → Applications → Create Application → Import from URL**, enter the exact ChatGPT CIMD URL, select **Preview**, inspect the returned metadata/redirect URI and validation results, then select **Create**. CIMD clients are strict third-party applications. Before creating one, confirm that the tenant has no active Auth0 Rules that would prevent strict third-party login, or migrate those Rules to Actions.
5. For the created ChatGPT client, configure the API's **Application Access Policy** for per-application **User-Delegated Access**. Under **Application Access**, grant only the MCP API permission `oura:daily.read` to this client; do not enable Client Access or broader default grants for this CIMD client. Promote only the required user authentication connection to domain level after confirming that making it available to tenant third-party clients is acceptable.
6. Fetch `https://<AUTH0_DOMAIN>/.well-known/openid-configuration`. Copy its exact `issuer` to the MCP protected-resource metadata `authorization_servers` list, then validate token `iss`, exact `aud`, expiry, and permission on every request.
7. For ChatGPT/MCP authorization requests, keep one canonical `resource=https://<PUBLIC_MCP_HOST>/mcp`; do not also send an `audience` parameter or configure any client/action to inject a conflicting audience. In the disposable tenant's gated spike, use a test client to send a deliberately different `audience` alongside `resource` and confirm that the resource server rejects the resulting token by exact audience validation. The ChatGPT client must pass when only the canonical `resource` is present and the token `aud` exactly matches.
8. If the exact ChatGPT CIMD URL cannot be manually imported or its token-endpoint method does not match the live ChatGPT flow, treat DCR as a separately gated fallback only in a disposable tenant. Auth0's DCR is open registration when enabled; it requires third-party API default permissions, so limit those to `oura:daily.read` and evaluate an ACL/monitoring control before enabling. Do not enable it in a shared or production tenant as a workaround.
9. Create a separate **Regular Web Application** in Auth0 for the connector's first-party `/connect/oura` sign-in. Configure its Allowed Callback URLs to exactly `https://<PUBLIC_MCP_HOST>/oauth/auth0/callback` and its web origin only if required by the server-side implementation. Keep the link client ID/secret in the secret manager. Use its server-side authorization-code flow with `openid` and PKCE S256; validate the returned ID token's signature, exact `iss` match to discovery, non-empty `sub` (preserved byte-for-byte without normalization), `aud` equal to this link client's ID, expiry, and nonce before creating a session keyed by the exact `(issuer, subject)`.
10. The MCP third-party client remains independent of OIDC scopes, ID tokens, UserInfo, and `id_token_hint` in Auth0 strict mode. The first-party Regular Web Application may use its separately configured OIDC sign-in; never infer the MCP caller's identity from email or a ChatGPT client ID. Prove `sub` stability across both Auth0 clients before associating a link.

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

1. Authenticate `/connect/oura` with the separate first-party Regular Web Application configured above. The `/oauth/auth0/callback` handler creates a server-side session only after validating the ID token's issuer, subject, audience, signature, expiry, and nonce. Store the exact `(issuer, subject)` in that session; do not use email as an identity key.
2. When starting Oura authorization, require that authenticated session and create a short-lived, single-use server-side transaction bound to the same `(issuer, subject)`, the session ID, current link generation, random `state`, exact callback, and PKCE verifier. Put only opaque state in the browser redirect; never put identity, client secrets, or tokens in URLs.
3. On `/oauth/oura/callback`, consume `state` once and require the browser session to still be authenticated as the same exact `(issuer, subject)` and session ID captured by the transaction. Reject expired/mismatched sessions, stale link generations, Oura errors, or malformed callbacks, and exchange a valid code server-to-server. Do not log callback query strings, codes, tokens, or health responses.
4. Persist only Oura credentials and required grant metadata in a managed encrypted credential store. Key the record by `(Auth0 issuer, Auth0 subject, provider=oura)` with a uniqueness constraint and durable monotonically increasing `link_generation` and `token_version` metadata. Increment `link_generation` on each disconnect and each successful new link; increment `token_version` on each committed token refresh. Commit the callback only if its captured generation still matches and the record has not been disconnected or replaced.
5. On disconnect, first increment the link generation and mark the association disconnected, then remove/revoke Oura credentials while retaining the minimal version tombstone. A relink starts a new transaction against the current generation. Any callback, refresh, or API request started under an older generation must fail a conditional state/version check and must never restore credentials, overwrite the newer link, or return data.
6. On an MCP tool call, validate the separate Auth0 bearer token and use its exact issuer/subject to resolve the Oura credential. Never accept an account ID from the model. If there is no matching active connection, return an authentication/link-required error without calling Oura.
7. Refresh Oura tokens with one serialized refresh per linked record. Snapshot its `link_generation` and `token_version` before calling Oura. Persist a replacement only with a compare-and-swap that confirms the record remains linked at that same generation and token version; if stale, discard the response and do not call a data endpoint. Oura refresh tokens are single-use, so never retry a token after successful rotation. Test refresh-vs-disconnect and refresh-vs-relink races before considering the design safe.

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
