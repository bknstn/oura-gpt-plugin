# ADR 0001: OAuth boundary between ChatGPT, MCP, and Oura

- **Status:** documentation-checked decision for T1; real OAuth compatibility remains unverified.
- **Checked:** 2026-10-13 (Europe/Warsaw).
- **Decision owner:** project reviewer; this ADR is prepared by the T1 implementer for review.

## Context

The plan proposes that ChatGPT obtain an Oura token and send it to the MCP server, which would then call Oura. The current published MCP authorization contract (`2026-07-28`) requires the MCP endpoint to be a protected resource: the client sends the canonical MCP resource URI during authorization and token requests, and the MCP server validates that each incoming token was issued for that resource. MCP security guidance explicitly forbids accepting a token issued for another service and forwarding it unchanged to an upstream API.

OpenAI's MCP authorization documentation describes a protected-resource metadata endpoint, authorization-server discovery, authorization-code flow with PKCE `S256`, and a `resource` parameter that is echoed into a token audience the MCP server can verify. The current MCP specification prefers CIMD or a pre-registered client; DCR remains for backward compatibility but is deprecated. Authorization responses should identify their issuer with `iss`; clients must compare a present `iss` with the issuer they discovered, and must reject a missing or mismatched value when the authorization-server metadata advertises issuer identification. The MCP server must validate token signature, issuer, audience/resource, expiry, and scopes before a protected tool runs.

Oura documents its own OAuth authorization-code flow, recommends PKCE, requires `S256` when PKCE is used, and issues bearer tokens for the Oura API. Its server-side token exchange uses the Oura application's `client_id` and `client_secret`. Oura refresh tokens are single-use: each successful refresh returns a replacement. The reviewed Oura documentation does not establish support for MCP protected-resource metadata, the RFC 8707 `resource` parameter, or issuing a token whose audience is this MCP service. This is an absence of documentation, not proof that Oura cannot support those extensions.

## Decision

**Do not implement the plan's direct ChatGPT → Oura OAuth → MCP bearer-token path. Do not accept or forward Oura access tokens as inbound MCP credentials.** A token issued for the Oura API is not evidence of a token issued specifically for this MCP resource, and passing it through would violate MCP's token audience boundary.

Before any user-data tool is added, choose and configure an authorization intermediary. No provider is selected by this ADR. The minimum compatible contract is:

1. ChatGPT discovers MCP protected-resource metadata for the canonical deployed MCP URI (for example `https://api.example.com/mcp`) and OAuth authorization-server metadata from the configured issuer.
2. The authorization server supports authorization-code flow with PKCE `S256`, preferably CIMD or pre-registration, and `resource` on both authorization and token requests. It issues an access token explicitly audience-bound to the MCP URI and conveys the granted MCP scopes. It returns an issuer-identifying `iss` parameter consistently so ChatGPT can validate the authorization response against discovery; if a provider requires another redirect mode, verify the exact callback requirements against current OpenAI documentation.
3. The MCP resource server verifies issuer, signature, audience/resource, expiry, and required scope on every user-data tool request. Missing or invalid credentials are rejected; no real health-data tool is anonymously callable.
4. Oura authorization is a separate upstream OAuth relationship. The intermediary/application securely maps the authenticated MCP user to their Oura connection and uses a separate Oura-issued token when calling Oura. Oura credentials never become MCP bearer tokens.
5. Because Oura refresh tokens are single-use, future refresh handling must serialize concurrent refreshes and atomically replace the stored refresh token with the newly issued one. A failed or racing refresh must not allow the old token to be reused or expose health data to another account.

The provider may offer upstream OAuth linking itself or the application may provide a separate Oura-link step; the supported ChatGPT user flow and account association need a real integration test before choosing between them. Do not build a custom identity system until the smallest compatible hosted option is evaluated.

For the first Oura connection, request only Oura scopes `daily`, `heartrate`, and `workout`: Oura documents `daily` as summaries for sleep, activity, and readiness; `heartrate` as time-series heart rate for Gen 3 users; and `workout` as workout summaries. Do not request `email`, `personal`, `tag`, `session`, or `spo2` unless a later accepted feature proves it needs them. The external authorization layer should map its MCP permissions to these Oura grants without claiming that its own scopes are Oura scopes.

For authenticated OpenAI review, prepare a dedicated reviewer account with usable sample data and no extra setup or inaccessible MFA. Keep credentials outside the public package and provide them only through the review portal's private reviewer fields. The safest candidate is a dedicated demo identity backed by explicitly synthetic sample data, but official OpenAI documentation does not confirm that synthetic upstream data alone will satisfy review of Oura authorization. Confirm the review path with an actual reviewer-ready integration; do not use a real user's Oura health data or mark this condition complete based on fixtures.

## Consequences and verification boundary

- The product is not stateless once it supports Oura accounts: an intermediary must maintain the user-to-Oura relationship and safely retain/rotate upstream credentials, or delegate that securely to an established provider.
- Local T1 work will expose only a loopback HTTP MCP endpoint, a health check, and one explicitly synthetic smoke tool. It has no Oura client, auth system, real health data, or production-ready exposure.
- Documentation review confirms the protocol requirements and Oura's documented flow/scopes. It does not confirm actual OAuth discovery, `resource` handling, token audience behavior, ChatGPT connection behavior, refresh concurrency, or the reviewer demo path. Those require an Oura application, selected provider, configured HTTPS domain, ChatGPT connection, and reviewer access.
- T2 must select/evaluate the intermediary contract, confirm Oura app settings and callback behavior, and test connect, denied/partial scopes, refresh rotation, disconnect/revoke, and account isolation before implementing user-data access.

## Sources checked 2026-10-13

- OpenAI, [Authentication for plugins and remote MCP servers](https://developers.openai.com/plugins/build/auth): MCP OAuth discovery, protected-resource metadata, `resource`, PKCE, token validation, client registration, and identity-provider guidance.
- OpenAI, [Build an MCP server](https://developers.openai.com/plugins/build/mcp-server): remote MCP server expectations.
- OpenAI, [Remote MCP server review requirements](https://developers.openai.com/plugins/deploy/app-review): public HTTPS endpoint and reviewer connection requirements.
- OpenAI, [Upload and submit your plugin](https://developers.openai.com/plugins/deploy/submission): reviewer credentials and sample data requirements; credentials stay outside the package.
- Oura, [OAuth 2.0 authentication](https://cloud.ouraring.com/docs/authentication): authorization/token URLs, PKCE, scopes, server-side flow, and single-use refresh tokens.
- MCP, [Authorization specification, 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization): current published authorization contract, including protected-resource/discovery, client registration priority, issuer validation, resource parameter, PKCE, audience validation, and separate upstream tokens.
- MCP, [Security best practices, 2026-07-28](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices): token passthrough is forbidden; only accept tokens issued for the MCP server.
- MCP SDK, [TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) and [release history](https://github.com/modelcontextprotocol/typescript-sdk/releases): v2 is the stable line for the 2026-07-28 protocol; version and API are to be pinned in the local skeleton after install validation.
