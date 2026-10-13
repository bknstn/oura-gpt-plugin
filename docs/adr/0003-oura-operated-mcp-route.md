# ADR 0003: Oura-operated MCP route and product fit

- **Status:** unresolved external blocker; no Oura data route is approved for implementation or real-data testing.
- **Checked:** 2026-10-13 (Europe/Warsaw).
- **Decision owner:** project reviewer; prepared by the T2 implementer for review.
- **Scope:** assess publicly documented Oura-operated MCP access and compare it with the four-tool ChatGPT connector plan. This ADR does not change `TASKS.md` acceptance criteria.

## Decision

Keep T2 `in_progress` and stop before Oura auth or user-data runtime work. The public material reviewed defines an Oura-operated MCP Server in the current Agreement, but does not publish a connectable endpoint, client onboarding procedure, protocol/auth contract, tool catalog or schemas, MCP scopes, history/pagination limits, or reviewer path. The developer portal's application area is login-gated. This bounded documentation review does not establish that an Oura MCP service is unavailable; it establishes that its suitability cannot be verified from the public sources available for this iteration.

Do not implement the existing API → custom MCP → ChatGPT data path while §4(d) remains unresolved. Do not assume that replacing the Oura API with Oura's MCP Server makes either direct ChatGPT access or a custom adapter permitted. Obtain Oura's written clarification and the applicable technical documentation before choosing a data route. Keep the user-data server synthetic-only until both the Oura terms and the independent MCP OAuth/resource-audience gates pass.

## What the sources establish

The current Oura API and MCP Agreement, effective 2026-06-08, defines the MCP Server as technical infrastructure operated by Oura (§1) and describes an Oura-operated MCP Server plus a developer-operated MCP Client (§3(a)). It allows Oura to change or discontinue MCP functionality (§3(c)), requires secure authentication, access controls and data minimization (§3(d)), and says MCP data may not be cached without separate written authorization (§3(m)). It does not publish a usable endpoint, transport, authorization/resource-audience contract, tool schemas, scopes, history window, pagination details, pricing, availability commitment, or third-party reviewer workflow.

The Agreement defines an `Aggregator` broadly as a person or entity, including a User, that gets Oura data by any means and supplies it or derived data to a third party for that third party's products or services (§1). If that definition applies, §§2(c–d) limit handling to pass-through and bar AI transfer/use absent a separate written agreement; §§3(e–f) require separate API credentials and prior written approval per End Customer and a current customer list. Section 2(b) also requires written terms binding any third-party AI provider that processes the data to protections no less protective than the Oura Agreement. Whether this connector, any proposed adapter, or the intended ChatGPT arrangement meets those requirements is not established here.

Oura's public API authentication documentation lists API OAuth scopes such as `daily`, `heartrate`, and `workout`, but does not say those scopes apply to its MCP Server. Oura's October 2026 support article directs new API applications to the new developer portal, and the previous portal is retained for existing applications. The application area at `developer.ouraring.com/applications` requires sign-in. Public search and the public API documentation reviewed surfaced the Agreement and API docs, but not Oura MCP access instructions. Search results are not evidence that a service does not exist or that an account-gated route is unavailable.

OpenAI Docs establishes that ChatGPT can be configured with a custom remote MCP server using OAuth and supported remote MCP transports. That is generic client capability only: it does not provide an Oura endpoint, make Oura authorization available, or resolve Oura's contractual conditions.

## Architecture fit

| Route | Current assessment |
| --- | --- |
| **Existing plan: Oura API → our custom MCP → ChatGPT** | Technically consistent with a custom remote MCP connector, but Oura Agreement §4(d) expressly bars using the Oura API to provide data to an AI Model/AI Platform and directs a non-Aggregator's LLM use through the Oura-operated MCP Server. Applying this clause to our planned flow is an inference, not a legal conclusion. Do not implement or test it with real data unless Oura confirms it in writing or provides a written exception. |
| **Direct Oura MCP → ChatGPT** | OpenAI's generic custom MCP capability could support a remote Oura server if Oura exposes a compatible endpoint and OAuth contract. Neither the endpoint nor an Oura-to-ChatGPT setup is publicly documented in the sources reviewed. This route would expose Oura's own tool choices and output directly; it does not establish that our custom normalization, four named tools, packaging, or reviewer flow can be delivered. |
| **Oura MCP → our MCP adapter → ChatGPT** | Would preserve a custom ChatGPT connector but introduces a developer-operated MCP client and another server that receives and transforms/forwards Oura data. Public docs do not establish upstream MCP OAuth/resource audience, identity binding, tool outputs, allowed normalization, history, or whether this arrangement is an Aggregator. It needs Oura's written permission and technical contract; an Oura-issued token must never be passed through as the bearer token for our separate MCP resource. |

The product plan and `TASKS.md` require four project tools: `get_daily_metrics`, `get_sleep`, `get_workouts`, and `get_heart_rate`. T2 also requires at least 30 days of history. No public Oura MCP schemas or history policy were found, so there is no evidence that an Oura MCP route supplies the required daily sleep/readiness/activity summaries, sleep records for HRV/RHR, workouts, and heart-rate series across that period. Nor is there evidence that the outputs may be normalized into the project's compact schemas. This is an unresolved compatibility check, not a finding that the data is absent.

## External blocker and next step

The blocker is an Oura decision and access package, not a local code gap. Before any Oura client, auth integration, deployment, or real-data request, ask Oura for a written response covering:

1. Whether a third-party developer can use the Oura-operated MCP Server; the eligibility, application/registration, approval, and pricing process; the official endpoint and docs; supported transport and OAuth/resource-audience requirements; and whether ChatGPT is an allowed MCP Client.
2. The published tool list and input/output schemas, scopes or consent grants, pagination and available-history limits, and refresh/revocation behavior. Confirm whether the available tools can support the four project tools, including at least 30 days for `get_daily_metrics` and the planned sleep, workout, and heart-rate access.
3. Whether the direct Oura MCP → ChatGPT path is permitted for this product and which review/demo access process Oura supports without requiring a user's real health data.
4. Whether Oura permits the Oura MCP → custom MCP adapter → ChatGPT route, including compact normalization and aggregation; whether this service is an `Aggregator` under §1; whether §2(b)'s downstream written-terms requirement is satisfied by the intended ChatGPT arrangement; and, if not, which separate written agreement or customer approvals §§2(c–d) and 3(e–f) require.

If Oura cannot document a permitted route and required data capabilities, return to the product owner for a separate architecture decision. Do not silently replace the API route, weaken the four-tool/30-day criteria, or mark T2 complete.

## Sources checked 2026-10-13

- Oura, [API and MCP Agreement](https://cloud.ouraring.com/legal/api-agreement), effective 2026-06-08: §§1, 2(a–d), 3(a–f), 3(m), 4(d).
- Oura, [The Oura API](https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API), updated 2026-10-01: API application and current developer-portal routing.
- Oura, [OAuth 2.0 authentication](https://cloud.ouraring.com/docs/authentication): API OAuth scopes and flows; treated as API documentation, not MCP scope evidence.
- Oura, [new developer portal](https://developer.ouraring.com/applications): sign-in required to view application management; account-gated content was not inspected.
- OpenAI, [Add custom MCP server](https://developers.openai.com/api/docs/guides/custom-mcp-server): ChatGPT custom remote MCP setup and generic authentication/transport options.
- OpenAI, [MCP servers](https://developers.openai.com/api/docs/guides/tools-connectors-mcp): generic remote MCP support and trust/approval considerations.
