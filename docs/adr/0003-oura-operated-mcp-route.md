# ADR 0003: Oura-operated MCP route and product fit

- **Status:** unresolved external blocker; no Oura data route is approved for implementation or real-data testing.
- **Checked:** 2026-10-13 (Europe/Warsaw).
- **Decision owner:** project reviewer; prepared by the T2 implementer for review.
- **Scope:** assess publicly documented Oura-operated MCP access and compare it with the four-tool ChatGPT connector plan. This ADR does not change `TASKS.md` acceptance criteria.

## Decision

Keep T2 `in_progress` and stop before Oura auth or user-data runtime work. The public material reviewed defines an Oura-operated MCP Server in the current Agreement, but does not publish a connectable endpoint, client onboarding procedure, protocol/auth contract, tool catalog or schemas, MCP scopes, history/pagination limits, or reviewer path. The developer portal's application area is login-gated. This bounded documentation review does not establish that an Oura MCP service is unavailable; it establishes that its suitability cannot be verified from the public sources available for this iteration.

Do not implement the existing API → custom MCP → ChatGPT data path while §4(d) remains unresolved. Do not assume that replacing the Oura API with Oura's MCP Server makes either direct ChatGPT access or a custom adapter permitted. Obtain Oura's written clarification and the applicable technical documentation before choosing a data route. Keep the user-data server synthetic-only until both the Oura terms and the independent MCP OAuth/resource-audience gates pass.

## What the sources establish

The Oura API and MCP Agreement, effective 2026-06-08, defines Oura-operated MCP infrastructure and a developer-operated client (§§1, 3(a)); it requires secure access and minimization and restricts MCP caching (§§3(d,m)). It does not publish a public endpoint, protocol/auth contract, tool schemas, MCP scopes, history/pagination limits, or reviewer path.

The Agreement's Aggregator definition includes a User who supplies Oura or derived data to a third party (§1). If it applies, §§2(c–d) and 3(e–f) constrain use and require customer-level steps. Section 2(b) requires protective written terms for downstream AI providers. The connector's classification and ChatGPT arrangement are unresolved. Section 4(d)'s distinction between Oura API and Oura-operated MCP also needs Oura's decision for this product; its application to the existing flow is an inference, not a legal conclusion.

Oura's public API authentication documentation lists API OAuth scopes such as `daily`, `heartrate`, and `workout`, but does not say those scopes apply to its MCP Server. Oura's October 2026 support article directs new API applications to the new developer portal, and the previous portal is retained for existing applications. The application area at `developer.ouraring.com/applications` requires sign-in. Public search and the public API documentation reviewed surfaced the Agreement and API docs, but not Oura MCP access instructions. Search results are not evidence that a service does not exist or that an account-gated route is unavailable.

OpenAI Docs establishes that ChatGPT can be configured with a custom remote MCP server using OAuth and supported remote MCP transports. That is generic client capability only: it does not provide an Oura endpoint, make Oura authorization available, or resolve Oura's contractual conditions.

## Architecture fit

| Route | Current assessment |
| --- | --- |
| **Existing plan: Oura API → our custom MCP → ChatGPT** | Technically consistent with a custom remote MCP connector, but implementation remains paused at the Oura terms gate documented in [ADR 0002](0002-auth-intermediary-and-oura-linking.md) and the [runbook](../runbooks/auth0-oura-linking.md). Generic OpenAI support does not clear that gate. |
| **Direct Oura MCP → ChatGPT** | OpenAI's generic custom MCP capability could support a remote Oura server if Oura exposes a compatible endpoint and OAuth contract. Neither the endpoint nor an Oura-to-ChatGPT setup is publicly documented in the sources reviewed. This changes tool ownership and output; the four named tools, custom normalization, packaging, and reviewer flow are unproven. A product owner must approve that product change before choosing this route. |
| **Oura MCP → our MCP adapter → ChatGPT** | Preserves custom tools but adds an upstream MCP client and a data-transforming hop. Public docs do not establish upstream auth/audience, user isolation, tool outputs, normalization, history, or classification. Resolve both technical and terms gates; an Oura token cannot serve as the bearer token for our separate MCP resource. |

The product plan and `TASKS.md` require four project tools: `get_daily_metrics`, `get_sleep`, `get_workouts`, and `get_heart_rate`. T2 also requires at least 30 days of history. No public Oura MCP schemas or history policy were found, so there is no evidence that an Oura MCP route supplies the required daily sleep/readiness/activity summaries, sleep records for HRV/RHR, workouts, and heart-rate series across that period. Nor is there evidence that the outputs may be normalized into the project's compact schemas. This is an unresolved compatibility check, not a finding that the data is absent.

## External blocker and next step

The blocker is an Oura decision and access package, not a local code gap. Before any Oura client, auth integration, deployment, or real-data request, ask Oura for a written response covering:

1. Whether a third-party developer can use the Oura-operated MCP Server; the eligibility, application/registration, approval, and pricing process; the official endpoint and docs; supported transport and OAuth/resource-audience requirements; and whether ChatGPT is an allowed MCP Client.
2. The published tool list and input/output schemas, scopes or consent grants, pagination and available-history limits, and refresh/revocation behavior. Confirm whether the available tools can support the four project tools, including at least 30 days for `get_daily_metrics` and the planned sleep, workout, and heart-rate access.
3. Whether the direct Oura MCP → ChatGPT path is permitted for this product and which review/demo access process Oura supports without requiring a user's real health data.
4. Whether Oura permits an adapter that normalizes/forwards Oura MCP results; whether this service is an `Aggregator`; whether §2(b) is satisfied by the intended ChatGPT arrangement; and which written agreement or customer approvals, if any, are required.

If Oura cannot document a permitted route and required data capabilities, return to the product owner for a separate architecture decision. Do not silently replace the API route, weaken the four-tool/30-day criteria, or mark T2 complete.

## Sources checked 2026-10-13

- Oura, [API and MCP Agreement](https://cloud.ouraring.com/legal/api-agreement), effective 2026-06-08: §§1, 2(a–d), 3(a–f), 3(m), 4(d).
- Oura, [The Oura API](https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API), updated 2026-10-01: API application and current developer-portal routing.
- Oura, [OAuth 2.0 authentication](https://cloud.ouraring.com/docs/authentication): API OAuth scopes and flows; treated as API documentation, not MCP scope evidence.
- Oura, [new developer portal](https://developer.ouraring.com/applications): sign-in required to view application management; account-gated content was not inspected.
- OpenAI, [Add custom MCP server](https://developers.openai.com/api/docs/guides/custom-mcp-server): ChatGPT custom remote MCP setup and generic authentication/transport options.
- OpenAI, [MCP servers](https://developers.openai.com/api/docs/guides/tools-connectors-mcp): generic remote MCP support and trust/approval considerations.
