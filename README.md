# Oura AI Connector

**Implementation work archived by the project owner on 2026-10-22.** T1 was accepted with a synthetic-only local scaffold; T2 is blocked and not done, and T3–T5 remain queued. No real Oura-to-ChatGPT route has been confirmed or tested. Resume only after a new explicit project-owner instruction and a concrete official route with applicable approval and technical access. See the [project closure record](docs/project-closure.md).

This repository contains an OAuth architecture decision and a local-only MCP protocol scaffold. The scaffold does not connect to Oura, accept user credentials, or return real health data.

## Requirements

- Node.js 20 or newer
- npm

The MCP TypeScript SDK v2 line is pinned in `package.json`; the v2 server and client follow the current `2026-07-28` MCP specification. SDK v2 supports the prior `initialize` handshake as well as the current discovery path.

## Local development

```sh
npm ci
npm run dev
```

The server binds to `127.0.0.1:8787` by default. Set `HOST` only to `127.0.0.1`, `localhost`, or `::1`; the server rejects other addresses. `PORT` can select a local port. `.env.example` contains only these non-secret settings; the process reads environment variables and does not load `.env` automatically.

In another terminal, check the health endpoint:

```sh
curl http://127.0.0.1:8787/health
```

Useful checks:

```sh
npm run build
npm run typecheck
npm test
```

`npm test` builds the server, starts it on an ephemeral loopback port, checks `/health`, confirms hostile `Host` and `Origin` headers receive 403, and confirms `HOST=0.0.0.0` fails before listening. MCP SDK clients then list and call the synthetic tool through both the legacy `initialize` handshake and a pinned 2026-07-28 discovery negotiation (pinning has no legacy fallback). The smoke closes clients and the child server even on failure.

The sole tool, `get_synthetic_sleep_demo`, returns an explicitly synthetic record. It contains no personal information and is not an Oura fixture or evidence of a real Oura integration. The server uses the SDK's localhost Host and Origin checks to reduce DNS-rebinding risk. It has no OAuth, upstream API client, or production bind mode.

## Authentication decision and continuation

See [ADR 0001](docs/adr/0001-oauth-boundary.md) for the OAuth token boundary, [ADR 0002](docs/adr/0002-auth-intermediary-and-oura-linking.md) for the conditional Auth0 candidate and account-link design, and [ADR 0003](docs/adr/0003-oura-operated-mcp-route.md) for the unresolved Oura-operated MCP access and product-fit gate. Directly passing an Oura API token as the MCP request token is not permitted by the current MCP security contract. Neither the Auth0 candidate nor an Oura data route is verified; see the [preparation runbook](docs/runbooks/auth0-oura-linking.md).

No Oura application credentials, user health payloads, OAuth tokens, or ChatGPT reviewer credentials belong in this repository. External OAuth, ChatGPT, Oura MCP, and reviewer checks are not represented as completed by local smoke success. No real Oura data should be used until the Oura route gate in ADR 0003 and OAuth compatibility gates in ADR 0002 are resolved.
