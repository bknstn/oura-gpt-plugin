# Oura AI Connector

This repository is at T1: it contains an OAuth architecture decision and a local-only MCP protocol scaffold. The scaffold does not connect to Oura, accept user credentials, or return real health data.

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

`npm test` builds the server, starts it on an ephemeral loopback port, calls `/health`, then uses the MCP SDK client to list and call the synthetic tool through Streamable HTTP. It checks the `initialize` handshake and the current 2026-07-28 discovery flow, and closes both clients and the child server even on failure.

The sole tool, `get_synthetic_sleep_demo`, returns an explicitly synthetic record. It contains no personal information and is not an Oura fixture or evidence of a real Oura integration. The server uses the SDK's localhost Host and Origin checks to reduce DNS-rebinding risk. It has no OAuth, upstream API client, or production bind mode.

## Authentication decision and continuation

See [ADR 0001](docs/adr/0001-oauth-boundary.md) for the verified OAuth boundary, Oura scopes, reviewer requirements, and the exact external checks that remain. Directly passing an Oura API token as the MCP request token is not permitted by the current MCP security contract. T2 must select and validate an authorization intermediary before any user-data tool is implemented.

No Oura application credentials, user health payloads, OAuth tokens, or ChatGPT reviewer credentials belong in this repository. External OAuth, ChatGPT, and reviewer checks are not represented as completed by local smoke success.
