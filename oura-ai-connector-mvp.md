# Oura AI Connector — MVP Launch Plan

**Status:** MVP / public plugin candidate  
**Goal:** ship the smallest useful Oura → ChatGPT connector as quickly as possible  
**Primary success criterion:** a user installs the plugin, connects Oura, and can ask natural-language questions about their sleep, readiness, HRV, activity, and workouts.

---

## 1. Product thesis

Build the Oura equivalent of the Garmin/Fitness AI Connector:

> **Connect your Oura Ring and ask ChatGPT questions about your own health and recovery data.**

Examples:

- How did I sleep this week?
- Why has my HRV been lower recently?
- Compare my recovery this month with last month.
- What changed in my resting heart rate?
- How consistent is my bedtime?
- Show my readiness trend for the last 30 days.
- Did I recover differently after workout days?

For MVP, **do not build another AI chat application**. ChatGPT is the interface and reasoning layer.

The plugin should be primarily a **secure data-access + normalization layer** over the Oura API.

---

## 2. MVP architecture

Keep the first version almost stateless.

```text
User
  ↓
ChatGPT
  ↓
Oura AI Connector plugin
  ↓
Remote MCP server
  ↓
Oura Cloud API V2
```

Recommended MVP:

```text
ChatGPT
  │
  │ MCP tool call
  ▼
https://api.<domain>/mcp
  │
  │ Oura OAuth access token
  ▼
Oura API V2
```

### Important simplification

Avoid these in V1:

- user database
- historical ingestion pipeline
- scheduled sync
- embeddings/vector DB
- separate AI model
- mobile/web application
- dashboards
- custom analytics engine
- payments
- Apple Health / Garmin / Whoop
- background jobs

Fetch Oura data on demand and return compact normalized data to ChatGPT.

This dramatically reduces the surface area of the MVP.

---

# 3. Authentication strategy

## Preferred MVP path: ChatGPT → Oura OAuth directly

Investigate this first because it can remove an entire authentication/account system.

Oura supports OAuth2 with:

- Authorization endpoint
- Token endpoint
- refresh tokens
- PKCE
- granular scopes

OpenAI plugins support OAuth authentication for remote MCP servers and allow a registered OAuth client with explicit authorization/token URLs.

Conceptually:

```text
Install plugin
     ↓
Connect
     ↓
Oura authorization screen
     ↓
User approves scopes
     ↓
ChatGPT obtains Oura token
     ↓
ChatGPT sends Bearer token to MCP
     ↓
MCP uses token to call Oura
```

If this works cleanly with the current OpenAI plugin submission flow, **use it**.

### Fallback

If direct Oura OAuth cannot satisfy the MCP authentication/review requirements:

```text
ChatGPT
   ↓ OAuth
Our Auth service
   ↓
Our user/session
   ↓ OAuth
Oura
```

That requires:

- our own OAuth authorization server / identity layer
- encrypted Oura token storage
- account linking
- token refresh
- disconnect/revoke flow

Do **not** implement this unless necessary.

---

# 4. Oura scopes for MVP

Request the minimum permissions needed.

Suggested scopes:

```text
daily
heartrate
workout
```

Potentially add:

```text
spo2
tag
session
```

later.

Avoid requesting:

```text
email
personal
```

unless they are genuinely required.

Less access means:

- simpler privacy story
- less sensitive data
- easier review
- clearer consent screen

---

# 5. MCP tools

Keep the tool set small.

## Tool 1 — `get_daily_metrics`

Purpose: answer most everyday questions.

Input:

```json
{
  "start_date": "2026-10-01",
  "end_date": "2026-10-11"
}
```

Return normalized daily data such as:

```json
{
  "days": [
    {
      "date": "2026-10-10",
      "sleep_score": 82,
      "readiness_score": 76,
      "activity_score": 88,
      "total_sleep_minutes": 442,
      "resting_heart_rate": 53,
      "average_hrv_ms": 37,
      "bedtime_start": "...",
      "bedtime_end": "..."
    }
  ]
}
```

This should cover roughly 70–80% of prompts.

---

## Tool 2 — `get_sleep`

Purpose: detailed sleep analysis.

Return useful fields only:

- total sleep
- time in bed
- awake time
- sleep efficiency
- REM
- deep sleep
- latency
- bedtime
- wake time
- average HRV
- lowest resting HR
- relevant Oura contributors if available

Do not blindly return the entire Oura response.

---

## Tool 3 — `get_workouts`

Return:

- date/time
- activity
- duration
- calories
- intensity
- distance
- heart-rate summary where available

This enables questions like:

> Did hard workouts affect my recovery?

---

## Tool 4 — `get_heart_rate`

Use only when detailed HR time series is actually needed.

Inputs:

```json
{
  "start_datetime": "...",
  "end_datetime": "..."
}
```

Guardrails:

- cap maximum range
- downsample long ranges
- return summaries instead of thousands of samples whenever possible

---

# 6. Do not build analytics yet

For MVP, ChatGPT can perform:

- averages
- period comparisons
- trend interpretation
- correlations
- anomaly explanations

from normalized data.

Example:

```text
get_daily_metrics(90 days)
        ↓
ChatGPT
        ↓
"Your HRV is ~12% below your 90-day baseline..."
```

Only move calculations server-side when:

1. token usage becomes excessive,
2. time series become too large,
3. calculations need deterministic accuracy,
4. latency becomes a problem.

That is V2.

---

# 7. Safety / health positioning

Position the product as:

> Personal health and fitness insights based on your Oura data.

Not:

> medical diagnosis

The MCP instructions should explicitly tell ChatGPT:

- metrics are informational
- do not present correlations as causation
- distinguish Oura scores from raw physiological measurements
- avoid diagnosing diseases
- mention uncertainty when explaining changes
- recommend professional medical help for concerning symptoms

This matters both for users and review.

---

# 8. Plugin instructions / skill

Add a tiny skill/instruction layer.

Example behavior:

```text
When answering questions using Oura data:

1. Use the user's personal baseline whenever possible.
2. Compare trends across meaningful periods rather than interpreting one day in isolation.
3. Clearly distinguish observed data from hypotheses.
4. Prefer concise explanations.
5. Never diagnose medical conditions.
6. Mention missing data when relevant.
7. Use dates explicitly when comparing periods.
```

This is enough for MVP.

---

# 9. Plugin metadata

Working name:

## `Oura AI Connector`

Alternative names if Oura trademark usage becomes problematic:

- Ring Data Connector
- Wearable Insights for Oura
- Oura Data Insights
- Ring Health Connector

Suggested description:

> Connect your Oura Ring to ChatGPT and explore your sleep, readiness, HRV, resting heart rate, activity, and workout trends in natural language.

Starter prompts:

```text
How did I sleep this week?
```

```text
Show my HRV and resting heart rate trend for the last 30 days.
```

```text
Compare my recovery this month with last month.
```

No custom UI is required for V1.

---

# 10. Repository structure

Suggested minimal structure:

```text
oura-ai-connector/
├── README.md
├── plugin.json
├── mcp.json
├── src/
│   ├── server.ts
│   ├── oura/
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── normalize.ts
│   └── tools/
│       ├── dailyMetrics.ts
│       ├── sleep.ts
│       ├── workouts.ts
│       └── heartRate.ts
├── tests/
│   ├── tools.test.ts
│   └── fixtures/
├── assets/
│   └── logo.png
└── package.json
```

TypeScript is probably the fastest path.

Use a lightweight MCP SDK and avoid framework complexity.

---

# 11. Infrastructure

For MVP, one service is enough.

Examples:

- Fly.io
- Railway
- Render
- Cloud Run
- a small VPS

Requirements for public OpenAI submission:

- public HTTPS endpoint
- stable domain
- MCP Streamable HTTP transport
- production endpoint (not localhost/tunnel)
- logging
- reasonable uptime
- authentication boundaries preserved

Example:

```text
https://api.ouraconnector.example/mcp
```

---

# 12. Minimal website

Public submission needs proper public-facing URLs.

Create a tiny static site:

```text
/
  product landing page

/privacy
  privacy policy

/terms
  terms of service

/support
  support/contact
```

Landing page can be extremely simple:

```text
Oura AI Connector

Ask ChatGPT questions about your Oura data.

[Install in ChatGPT]
```

No dashboard/login UI needed for V1.

---

# 13. Privacy requirements

Health/wearable data is sensitive.

For the stateless MVP:

**ideal policy:**

> The service processes Oura data only to fulfill the current request and does not persist health data.

Persist only operational logs that do not contain health payloads.

Do not log:

- OAuth access tokens
- raw Oura API responses
- heart-rate samples
- sleep records

If debugging payloads becomes necessary, make explicit development-only tooling and never enable it in production by default.

---

# 14. Oura developer setup

Create an Oura API application.

Oura API apps currently have a **10-user default limit**.

That is actually useful for the first beta.

### Phase A

Use those 10 slots for:

- yourself
- friends / Oura users
- early testers

Validate the plugin before requesting broader access.

### Phase B

Submit the Oura application for approval to expand beyond the default user limit.

Do this early because external approval time is outside our control.

---

# 15. OpenAI plugin submission

Current OpenAI plugins are built around:

- plugin package
- MCP server
- optional skills
- optional UI

For public submission, expect to need:

- verified developer identity
- public MCP endpoint
- plugin name/logo/description
- website
- privacy policy
- support URL
- terms URL
- test prompts
- expected tool calls/results
- domain verification
- reviewer test access

The current MCP review flow asks for **5 positive and 3 negative test cases**.

No custom UI is needed.

---

# 16. Important launch blocker to investigate immediately

## Reviewer authentication

OpenAI requires authenticated MCP submissions to provide reviewer access to a working demo account with usable sample data.

This needs to be validated early for an Oura-only OAuth flow.

Potential solutions:

### Option A — dedicated Oura test account

Best if feasible.

### Option B — demo mode with synthetic fixture data

Example:

```text
demo=true
```

or a separate reviewer identity returning realistic synthetic Oura data.

Production users still authenticate through Oura.

### Option C — our own authentication/account layer

Most flexible but also most work.

**Do not discover this problem at submission time. Test the intended review flow before polishing the product.**

---

# 17. Test prompts

The MVP must reliably answer these.

### Positive

1. `How did I sleep over the last 7 days?`
2. `Show my readiness trend for the last month.`
3. `Has my HRV improved compared with the previous month?`
4. `What happened to my resting heart rate this week?`
5. `Compare recovery on workout days versus non-workout days.`

### Negative / edge cases

1. Date range has no data.
2. User declined the required Oura scope.
3. User asks for a medical diagnosis.

Expected behavior should be deterministic and graceful.

---

# 18. Development order

## Day 0 — validate the risky parts first

Before coding the full plugin:

- create Oura developer application
- confirm OAuth callback behavior
- create minimal MCP server
- connect it to ChatGPT
- confirm an Oura bearer token can be used safely by the MCP service
- confirm OpenAI public submission/auth requirements
- decide how reviewer test data will work

**Outcome:** prove the architecture.

---

## Day 1 — vertical slice

Implement:

```text
Oura OAuth
     ↓
MCP
     ↓
get_daily_metrics
     ↓
ChatGPT answer
```

Nothing else.

Target prompt:

> How did I sleep this week?

If this works end-to-end, the product exists.

---

## Day 2 — useful MVP

Add:

- `get_sleep`
- `get_workouts`
- `get_heart_rate`
- range validation
- normalized responses
- errors
- token-safe logging

Test with real Oura history.

---

## Day 3 — launch plumbing

Add:

- domain
- production deployment
- landing page
- privacy
- terms
- support
- logo
- plugin metadata
- starter prompts
- test cases

Deploy production MCP.

---

## Day 4 — beta

Invite a few Oura users.

Observe:

- which questions they ask
- which tool calls fail
- missing fields
- latency
- confusing answers
- date/timezone bugs

Do **not** add features unless beta exposes a real gap.

---

# 19. Definition of MVP

MVP is complete when:

- [ ] plugin installs in ChatGPT
- [ ] user can connect an Oura account
- [ ] no manual token copying is required
- [ ] ChatGPT can read at least 30 days of daily metrics
- [ ] sleep questions work
- [ ] readiness questions work
- [ ] HRV/RHR trend questions work
- [ ] workout comparison works
- [ ] missing scopes are handled cleanly
- [ ] no health data is unnecessarily persisted
- [ ] production MCP runs over HTTPS
- [ ] privacy/terms/support pages exist
- [ ] 5 positive plugin review cases pass
- [ ] 3 negative review cases pass
- [ ] Oura broader-access request is prepared/submitted
- [ ] OpenAI submission package is ready

---

# 20. Explicitly out of scope

Do not implement before first users:

- dashboards
- account profile
- custom charts
- native app
- Oura web clone
- nutrition tracking
- gym program generation
- long-term memory
- proactive notifications
- correlation engine
- AI recommendations engine
- Garmin
- Whoop
- Apple Health
- Strava
- paid plans
- team/family sharing

Every one of these can wait.

---

# 21. V1.1 after launch

Only after real usage:

```text
server-side baselines
rolling averages
period comparison
anomaly detection
correlation helpers
```

Possible tools:

```text
compare_periods()
calculate_baseline()
find_anomalies()
analyze_recovery_after_workouts()
```

These reduce token usage and make answers more deterministic.

---

# 22. Longer-term product direction

If the Oura plugin gets traction, stop thinking of it as merely an Oura connector.

Possible architecture:

```text
Oura ───────┐
Garmin ─────┤
Whoop ──────┤
Apple Health├──► Normalized Health Data Layer
Strava ─────┘            │
                         ▼
                  Analytics Layer
                         │
                         ▼
                  ChatGPT / Agents
```

Then the product becomes:

> **Give your AI access to your health and fitness data.**

That is a much larger product than an Oura wrapper.

But **do not build this now**.

---

# 23. MVP north star

The first version should feel almost embarrassingly small:

```text
Oura OAuth
+
4 MCP tools
+
normalization
+
plugin metadata
+
static legal pages
=
launch
```

The key experiment is not:

> Can we build sophisticated health analytics?

It is:

> **Do Oura users want to explore their personal wearable data through ChatGPT often enough that installing a dedicated connector is useful?**

Everything else comes after that.

---

# 24. Current market check — 2026-10-11

A search of the ChatGPT plugin directory for:

```text
Oura
Oura Ring
health wearable
sleep
HRV
```

did **not surface a dedicated Oura plugin**.

The search did surface alternatives such as COROS, but not an Oura-specific connector.

This is encouraging, but should **not** be treated as proof that no Oura integration exists anywhere in the directory: plugin search results are not guaranteed to be exhaustive and availability can vary by account, plan, region, and workspace.

For now the working assumption should be:

> **No obvious dedicated Oura plugin is discoverable, so there is a plausible first-mover window.**

Re-check immediately before naming/submitting the public plugin.

---

# 25. References

OpenAI Plugins documentation  
https://developers.openai.com/plugins

OpenAI MCP server quickstart  
https://developers.openai.com/plugins/build/app-quickstart

OpenAI MCP server requirements  
https://developers.openai.com/plugins/build/mcp-server

OpenAI authentication  
https://developers.openai.com/plugins/build/auth

OpenAI plugin packaging  
https://developers.openai.com/plugins/build/plugins

OpenAI submission flow  
https://developers.openai.com/plugins/deploy/submission

OpenAI remote MCP review requirements  
https://developers.openai.com/plugins/deploy/app-review

Oura API documentation  
https://cloud.ouraring.com/docs/

Oura OAuth documentation  
https://cloud.ouraring.com/docs/authentication

Oura API support article  
https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API
