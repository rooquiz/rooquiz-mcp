# RooQuiz MCP Server

[![smithery badge](https://smithery.ai/badge/rooquiz/rooquiz-mcp)](https://smithery.ai/servers/rooquiz/rooquiz-mcp)
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=rooquiz&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fpayload.rooquiz.com%2Fapi%2Fmcp%22%7D)
[![Install in Cursor](https://img.shields.io/badge/Cursor-Install_Server-000000?style=flat-square&logo=cursor&logoColor=white)](https://cursor.com/install-mcp?name=rooquiz&config=eyJ1cmwiOiJodHRwczovL3BheWxvYWQucm9vcXVpei5jb20vYXBpL21jcCJ9)

Remote [MCP](https://modelcontextprotocol.io) server for [RooQuiz](https://rooquiz.com) — a lightweight assessment platform for lead capture and viral sharing. Build quizzes with AI-assisted authoring, capture leads from results pages, and analyze funnel conversion — straight from Claude, ChatGPT, Cursor, or any MCP client.

- **Endpoint:** `https://payload.rooquiz.com/api/mcp` (Streamable HTTP)
- **Auth:** OAuth 2.1 — authorization code + PKCE with dynamic client registration. Sign in with your RooQuiz account when your client prompts you; no API key needed.
- **Registry name:** [`com.rooquiz/rooquiz-mcp`](https://registry.modelcontextprotocol.io/v0/servers?search=com.rooquiz/rooquiz-mcp)

## Connect

One-click: [VS Code](https://insiders.vscode.dev/redirect/mcp/install?name=rooquiz&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fpayload.rooquiz.com%2Fapi%2Fmcp%22%7D) · [VS Code Insiders](https://insiders.vscode.dev/redirect/mcp/install?name=rooquiz&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fpayload.rooquiz.com%2Fapi%2Fmcp%22%7D&quality=insiders) · [Cursor](https://cursor.com/install-mcp?name=rooquiz&config=eyJ1cmwiOiJodHRwczovL3BheWxvYWQucm9vcXVpei5jb20vYXBpL21jcCJ9)

**Claude Code**

```bash
claude mcp add --transport http rooquiz https://payload.rooquiz.com/api/mcp
```

**claude.ai / ChatGPT** — add a custom connector and paste the endpoint URL.

**Cursor** (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "rooquiz": {
      "url": "https://payload.rooquiz.com/api/mcp"
    }
  }
}
```

**VS Code / GitHub Copilot** (`.vscode/mcp.json`)

```json
{
  "servers": {
    "rooquiz": {
      "type": "http",
      "url": "https://payload.rooquiz.com/api/mcp"
    }
  }
}
```

## Example prompts

Once connected, talk to it in plain language. Each of these exercises a different
part of the server:

**Build from a template**

> Show me the coaching templates, create a scored quiz from the readiness one, then add
> two questions about budget.

*Exercises `list_templates` → `create_form_from_template` → `add_question`.*

**Work the leads**

> List the leads my Wheel of Life quiz captured this week, tag everyone who scored under
> 40 as follow-up, and assign them to me.

*Exercises `list_leads` → `set_lead_tags` → `assign_leads`.*

**Diagnose the funnel**

> Which of my quizzes has the worst completion rate, and where exactly do people drop off?

*Exercises `list_forms` → `get_form_stats` → `get_form_funnel`.*

**Go multilingual**

> Translate my promotion-readiness quiz into Spanish and German, keeping the question codes.

*Exercises `list_form_translations` → `create_form_translation`.*

Respondent names, email addresses and phone numbers come back masked (`j***g@example.com`),
so address a respondent by id rather than pasting a masked value back in.

## What you can do

- **Quizzes** — create knowledge quizzes, scored quizzes, and "which X are you" outcome quizzes; edit questions, scoring formulas, and dimension analysis; start from templates
- **Translations** — one source form, mirrored translations in any language
- **Leads** — list, tag, assign, and comment on leads captured from quiz results pages
- **Respondents & records** — look up respondents, submissions, stats, and funnel analytics
- **Bookings** — review and reschedule bookings made through quiz results pages
- **Team** — switch active team, invite members, manage question banks and categories

All tools act within the team your session is bound to.

## stdio bridge

Hosts without native HTTP transport (Claude Desktop, older MCP clients) and registry
crawlers that build a container can go through the bridge in [`bin/rooquiz-mcp.mjs`](bin/rooquiz-mcp.mjs)
— dependency-free, Node 18+. Everything above is a better path if your client speaks HTTP.

```bash
node bin/rooquiz-mcp.mjs           # or: docker build -t rooquiz-mcp . && docker run -i --rm rooquiz-mcp
```

| Env | Default | Purpose |
| --- | --- | --- |
| `ROOQUIZ_TOKEN` | *(unset)* | Bearer token — **required for every hosted tool** |
| `ROOQUIZ_PREVIEW_BASE` | `https://preview.rooquiz.com` | Preview API host; override only for a self-hosted deployment |
| `ROOQUIZ_QUIZ_BASE` | `https://quizster.app` | Host preview links are built on; likewise |

Every method needs a token, `initialize` included: without one the server answers `401` with
a `WWW-Authenticate` header pointing at the resource metadata. Clients with native HTTP
transport get this for free through OAuth; the bridge has nowhere to run a browser flow, so
give it a personal access token.

With no usable token the bridge still completes a handshake and answers `tools/list`, reading
both from [`bin/introspection.json`](bin/introspection.json) — a snapshot of what the hosted
server returns. That is there for registry crawlers, which build this container with no
credentials and judge the server by whether it introspects. Calling a hosted tool still goes
upstream and still `401`s. Once a working token is set nothing is served locally: every
message is forwarded, so a stale file can never shadow live data. Refresh it after changing
tools:

```bash
ROOQUIZ_TOKEN=rqp_live_xxx node scripts/snapshot-tools.mjs
```

### Preview mode — no token, no account

A bridge with no usable token is not useless. It also serves four tools that need no
credentials at all, because they target RooQuiz's **public** preview endpoint:

| Tool | What it builds |
| --- | --- |
| `preview_quiz` | Right/wrong quiz — correct answers earn points and the taker gets a graded score |
| `preview_scorecard` | Scored questionnaire — every option adds points toward a total that buckets into a level |
| `preview_outcome` | Personality / type test — options vote for result types and the most-voted type wins |
| `preview_guide` | The full authoring guide for one of the three: field schema, scoring rules, themes, examples |

Ask in plain language — *"make me a 5-question personality quiz about coffee and give me a
link"* — and you get back something like `https://quizster.app/b/7k3m9q2p`, openable and
shareable straight away. Previews self-destruct after about an hour and anonymous creation is
capped at roughly 10 per hour per IP; sign in and use `create_form` to keep an assessment.

These tools are the [rooquiz-skills](https://github.com/rooquiz/rooquiz-skills) `SKILL.md`
files vendored into [`bin/skills.json`](bin/skills.json) — the same instructions that repo
ships as a Claude Code plugin, served here over MCP instead. That repo is their source of
truth; re-vendor after editing one:

```bash
ROOQUIZ_SKILLS_DIR=../rooquiz-skills node scripts/sync-skills.mjs
```

They disappear once a working token is set: with an account, `create_form` builds a permanent
form rather than a link that expires.

## Support

Questions or issues: [support@rooquiz.com](mailto:support@rooquiz.com)

---

This repository carries the [`server.json`](server.json) manifest published to the official
MCP Registry, plus the MIT-licensed stdio bridge. The hosted server implementation itself is
closed source.
