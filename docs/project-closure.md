# Project closure — Oura AI Connector

- **Decision date:** 2026-10-22 (Europe/Warsaw)
- **Decision:** The project owner archived implementation work pending a new explicit instruction.

This records the project decision and does not assert that the GitHub repository has been archived.

## Basis and evidence

The user provided the text of the latest Oura Member Care reply, dated 2026-10-22 01:45 PDT. The mailbox was not independently accessed. The reply says Member Care reviewed the question internally but could not confirm that a user-authorized, read-only Oura-to-ChatGPT connector is officially supported or approved. It could not confirm an official Oura MCP connection for individual members in ChatGPT or provide its endpoint, setup, or OAuth requirements. It says a service for multiple members may have additional requirements under the API and MCP Agreement, possibly including a separate written agreement; Member Care could not provide an official request link or contact for obtaining an agreement and could not grant written approval.

The reply linked Oura's [API V2 documentation](https://cloud.ouraring.com/v2/docs), [API and MCP Agreement](https://cloud.ouraring.com/legal/api-agreement), and [OAuth application portal](https://cloud.ouraring.com/oauth/applications). These links are recorded as sources supplied in the reply; this closure note does not treat API or OAuth documentation as approval for a ChatGPT integration.

This evidence does not establish that Oura has no MCP service or process, that the proposed integration is prohibited or illegal, that a separate agreement is mandatory, or why any particular app may or may not appear in a ChatGPT marketplace. The user chose to archive because there is no confirmed permitted and supported route and Member Care provided no accessible path for seeking the needed agreement or approval.

## Project status

- **T1 — done:** the architecture review and local MCP scaffold were accepted on 2026-10-13. The scaffold is local-only and synthetic; it is not a working Oura or ChatGPT integration.
- **T2 — blocked, not done:** the required real Oura-to-ChatGPT weekly sleep scenario, 30-day access, OAuth behavior, user isolation, and reviewer flow were not demonstrated. The original acceptance criteria remain in [TASKS.md](../TASKS.md).
- **T3–T5 — queued, not started:** their acceptance criteria remain unchanged.

No real Oura credentials or health data were used. The repo contains no production integration, deployment, beta, or public review result. See [ADR 0003](adr/0003-oura-operated-mcp-route.md) for the retained technical assessment and [PROGRESS.md](../PROGRESS.md) for the task history.

## Conditions for resuming

Resume only after a new explicit project-owner instruction and a concrete official route that is permitted and technically accessible, with any applicable written approval or agreement and the route's authoritative onboarding/authentication contract. The applicable T2 technical gates must then be reviewed and passed, including the required data/tools and history, ChatGPT connection, token audience/resource compatibility, account isolation, refresh/revocation, and reviewer access. Do not infer permission from API OAuth documentation or user consent alone, and do not change task acceptance criteria without a separate product decision.

The former [Member Care follow-up draft](runbooks/oura-member-care-follow-up-email.md) is historical and superseded by this closure decision; it was not sent by the assistant. No further project step is planned until the resumption conditions above are met.
