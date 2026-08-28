# RooQuiz MCP Listing Status & Submission Copy

Companion doc: [`PUBLISHING.md`](PUBLISHING.md) — step-by-step for the official Registry and Glama.
This file tracks **status per channel** and holds **ready-to-paste submission copy**.

Last updated: 2026-08-28

## Does it pass link equity?

Measured 2026-08-28 by fetching a competitor's listing page and reading the `rel` on the link that
points at the vendor's own site. Re-run it like this (swap the slug):

```bash
curl -sL -A 'Mozilla/5.0' 'https://www.saashub.com/typeform' \
  | grep -oE '<a[^>]+href="https?://[^"]*typeform\.com[^"]*"[^>]*>'
```

| Channel | `rel` on outbound vendor links | Passes equity |
| --- | --- | --- |
| PulseMCP | `noopener` | ✅ |
| Smithery | `noopener noreferrer` | ✅ |
| Slack App Directory | no `rel` attribute at all | ✅ |
| GitHub (README body **and** the repo Website field) | `nofollow` | ❌ |
| Glama | `ugc nofollow` | ❌ |
| mcp.so | `nofollow ugc noopener noreferrer` | ❌ |
| AlternativeTo | `nofollow noopener` | ❌ |
| Product Hunt | `noreferrer noopener ugc` | ❓ see note |

**Isolate the vendor link before reading a `rel`** — do not grep a whole page for `nofollow`.
These pages are full of social, analytics and navigation links; a page-wide grep picks up somebody
else's attribute. The Product Hunt row was recorded as `nofollow` that way and was wrong.

The one `ugc`: Google has treated `nofollow` / `ugc` / `sponsored` as hints since March 2020, so
for ranking purposes `ugc` behaves like `nofollow` and Product Hunt buys no authority. Majestic is
a different crawler with its own rules — it drops `nofollow` from its flow metrics, but **how it
treats `ugc` is unverified**, so Product Hunt may contribute something to Trust Flow. Treat it as
unknown rather than zero, and do not relabel it `nofollow`.

Almost the entire MCP directory surface is `nofollow`. **Do these channels for discovery, LLM
citation, and mirror-repo reach — not for SEO authority.** Of everything on this page only PulseMCP
and Smithery pass equity, so those two deserve the earliest manual nudge. The web repo's
`docs/seo/backlinks.md` §2 carries the same table from the SEO side.

## Status

| Channel | Type | Status | Next step |
| --- | --- | --- | --- |
| Official MCP Registry | Metadata source | ✅ active (published 2026-08-20 as `com.rooquiz/rooquiz-mcp`, v1.0.0 — reverified 2026-08-28) | Re-publish on version changes |
| VS Code / Cursor one-click install | Client | ✅ in README (2026-08-22) | Recompute links from the formula below if the endpoint changes |
| `/.well-known/glama.json` | Claim route | ✅ **deployed** — `https://payload.rooquiz.com/.well-known/glama.json` returns 200 with the right JSON (verified 2026-08-28) | — |
| Smithery | Aggregator | 🟡 Badge is up; listing ownership unconfirmed | **Passes equity — do this early.** Sign in to smithery.ai and confirm the listing is claimed |
| PulseMCP | Aggregator | ⬜ Still not indexed (API query for `rooquiz` returned 0 again on 2026-08-28) | **Passes equity — do this early.** The two-week wait from 2026-08-22 expires **2026-09-05**; if `curl 'https://api.pulsemcp.com/v0beta/servers?query=rooquiz'` is still empty then, submit manually at https://www.pulsemcp.com/submit |
| Glama **servers directory** | Aggregator | 🟡 **Now live** (was 404 on 2026-08-23): `/mcp/servers/rooquiz/rooquiz-mcp` returns 200 as `RooQuiz by rooquiz`, and `/badges/score.svg` serves 200. Still **unclaimed** — the page itself warns "Unclaimed servers have limited discoverability" | Claim it — **separate flow from the connector**, which is already verified. Signed in as `rooquizteam@gmail.com`, use "claim this server" on that page (§A2 of PUBLISHING.md: submit the repo, paste the Dockerfile, set `ROOQUIZ_TOKEN`). Then confirm a quality score appears at `/mcp/servers/rooquiz/rooquiz-mcp/score` |
| Glama **connector** | Aggregator | ✅ **Claimed and healthy** (verified 2026-08-28). `/mcp/connectors/com.rooquiz/rooquiz-mcp` shows "Ownership verified" (`isVerified: 2026-08-28T08:35:51Z`) and status **Healthy**. The `.well-known/glama.json` route did the whole job — the PAT-to-support@glama.ai workaround was never needed | Done. Note this is a **different listing** from the servers directory above; claiming one does not claim the other |
| awesome-mcp-servers | GitHub list | 🟡 [PR #12649](https://github.com/punkpeye/awesome-mcp-servers/pull/12649) open. Labels flipped to `has-glama` / `has-emoji` / `valid-name`; badge added 2026-08-24 | **Blocker is now the Glama quality score**, not the badge. The bot's 2026-08-24 comment asks a human to confirm the server has been evaluated. Claim the Glama listing first, then reply on the PR pointing at the score page |
| mcp.so | Aggregator | ⬜ Not submitted (`/server/rooquiz-mcp` still 404 on 2026-08-28) | Open a GitHub issue; copy below |
| Claude Connectors Directory | Client directory | 🔴 Blocked | Needs a Team/Enterprise org plus the prerequisites below |
| ChatGPT Apps Directory | Client directory | 🔴 Blocked | Needs identity + domain verification plus the prerequisites below |

Suggested order (equity first, then discovery): **Smithery → PulseMCP → claim the Glama *servers* listing → PR #12649 → mcp.so**.

## One-click install links

Already in the README. If the endpoint changes, recompute them:

```bash
# Cursor: config is base64(JSON)
printf '%s' '{"url":"https://payload.rooquiz.com/api/mcp"}' | base64
# → https://cursor.com/install-mcp?name=rooquiz&config=<BASE64>

# VS Code: config is urlencode(JSON), and the JSON must carry "type":"http"
python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' \
  '{"type":"http","url":"https://payload.rooquiz.com/api/mcp"}'
# → https://insiders.vscode.dev/redirect/mcp/install?name=rooquiz&config=<ENCODED>
# Append &quality=insiders for Insiders. Despite the insiders.vscode.dev hostname,
# the link opens VS Code Stable when that parameter is absent.
```

Verified 2026-08-22: the Cursor link returns 200; the VS Code link 302-redirects to
`vscode:mcp/install?{"type":"http","url":"https://payload.rooquiz.com/api/mcp","name":"rooquiz"}`.

## Submission copy

### mcp.so

How to submit: open an issue on [chatmcp/mcpso](https://github.com/chatmcp/mcpso/issues) with a `[Submit]` title prefix.

**Title**

```
[Submit] RooQuiz — remote MCP for quiz building and lead capture (Streamable HTTP)
```

**Body**

````markdown
## RooQuiz (`com.rooquiz/rooquiz-mcp`)

Remote MCP server for [RooQuiz](https://rooquiz.com), a lightweight assessment platform for lead
capture and viral sharing. Build quizzes with AI-assisted authoring, capture leads from results
pages, and analyze funnel conversion from any MCP client.

- **Name:** RooQuiz
- **Website:** https://rooquiz.com
- **Repository:** https://github.com/rooquiz/rooquiz-mcp (manifest; server implementation is closed source)
- **Endpoint:** `https://payload.rooquiz.com/api/mcp`
- **Transport:** Streamable HTTP (remote, hosted)
- **Auth:** OAuth 2.1 — authorization code + PKCE with dynamic client registration (RFC 7591). No API key.
- **Registry name:** `com.rooquiz/rooquiz-mcp` (listed on the official MCP registry)

### What it does
- **Quizzes** — knowledge quizzes, scored quizzes, and outcome ("which X are you") quizzes; edit
  questions, scoring formulas, and dimension analysis; start from templates
- **Translations** — one source form, mirrored translations in any language
- **Leads** — list, tag, assign, and comment on leads captured from quiz results pages
- **Respondents & records** — respondents, submissions, stats, and funnel analytics
- **Bookings** — review and reschedule bookings made through quiz results pages
- **Team** — switch active team, invite members, manage question banks and categories

### Install
```json
{
  "mcpServers": {
    "rooquiz": {
      "url": "https://payload.rooquiz.com/api/mcp"
    }
  }
}
```

Category suggestion: Marketing / Lead generation / Forms & surveys.
````

### punkpeye/awesome-mcp-servers

Target section: `### 🎯 Marketing`, inserted at the `r` position in that section's alphabetical order by GitHub handle.
Legend icons (see that README's Legend): 🎖️ official implementation, 📇 TypeScript, ☁️ cloud service.

**Entry** — the score badge goes right after the repo link, before the emoji. The bot's
comment says "after the server description", but all ~2000 badged entries in that README use
this position, and `check-glama.yml` only string-matches the line.

```markdown
- [rooquiz/rooquiz-mcp](https://github.com/rooquiz/rooquiz-mcp) [![rooquiz/rooquiz-mcp MCP server](https://glama.ai/mcp/servers/rooquiz/rooquiz-mcp/badges/score.svg)](https://glama.ai/mcp/servers/rooquiz/rooquiz-mcp) 🎖️ 📇 ☁️ - Build and run assessments on [RooQuiz](https://rooquiz.com) — knowledge quizzes, scored quizzes, and outcome ("which X are you") quizzes with AI-assisted authoring and mirrored translations — then work the funnel: leads captured from results pages (tag, assign, comment), respondents, submissions, bookings, and conversion stats. Hosted Streamable HTTP endpoint at `https://payload.rooquiz.com/api/mcp`, OAuth 2.1 with dynamic client registration, no API key.
```

**Do not push the badge before the Glama servers listing exists** — it renders as a broken
image, and punkpeye (who maintains the list) is Glama's author. What the CI actually gates on:

```js
// .github/workflows/check-glama.yml
const hasGlama = newAddedLines.some(line =>
  line.includes('glama.ai/mcp/servers/') && line.includes('/badges/score.svg'))
```

That flips `missing-glama` → `has-glama` on the string alone; the follow-up bot comment then
asks a human to confirm the server actually has a quality score.

**Opening the PR**

```bash
gh auth login                      # use an account that represents rooquiz
gh repo fork punkpeye/awesome-mcp-servers --clone --remote
cd awesome-mcp-servers
git switch -c add-rooquiz
# insert the entry above into ### 🎯 Marketing
git commit -am "Add RooQuiz MCP server to Marketing"
gh pr create --title "Add RooQuiz MCP server" \
  --body "Adds RooQuiz — a hosted remote MCP server for quiz building and lead capture. Listed on the official MCP registry as com.rooquiz/rooquiz-mcp."
```

### Glama

Both channels are covered in section A of [`PUBLISHING.md`](PUBLISHING.md). Key point:
**The two channels are separate listings with separate claim flows** — as of 2026-08-28 the
connector is claimed and Healthy while the servers directory is still unclaimed. Claiming one
does nothing for the other.

- **Connector** — resolved by the `/.well-known/glama.json` route alone (§A1). No PAT was needed
  in the end; Glama fetched the file, matched `rooquizteam@gmail.com`, and flipped the listing to
  "Ownership verified" + **Healthy** on its own.
- **Servers directory** — still needs the §A2 flow (submit the repo, paste the Dockerfile, set
  `ROOQUIZ_TOKEN`). Here **DCR is not enough for the health check**: it yields a `client_id`,
  never an access token, because our authorization server only supports `authorization_code`.
  The unblock is a PAT bound to a throwaway empty team, handed to Glama as an env var.

Opening up anonymous discovery was considered and rejected — Codex has no lazy 401 trigger, so it
would show a connected server whose every tool call fails.

### PulseMCP

Its submission page states that publishing to the official MCP Registry is the best first step, and we are already on the registry. Wait for automatic ingest first. If `curl 'https://api.pulsemcp.com/v0beta/servers?query=rooquiz'` is still empty in two weeks, submit manually at https://www.pulsemcp.com/submit.

## Prerequisites for the client directories

Claude Connectors and the ChatGPT Apps Directory share this material. Any missing item means rejection:

- [ ] **Tool annotations** — annotate every tool in `rooquiz-payload/src/app/api/mcp/route.ts` with `readOnlyHint` / `destructiveHint`; `delete_*` and `update_*` tools must be marked destructive
- [ ] **Public privacy policy page** — including a data-handling summary (what is collected, retention, who it is shared with). Anthropic is explicit: missing or incomplete means immediate rejection
- [ ] **Public documentation page** — a single help page or blog post is enough, covering setup and auth steps
- [ ] **At least 3 example prompts** — must exercise different tools. Suggested: (1) create an outcome quiz, (2) list recent leads and tag them, (3) pull funnel conversion stats for a form
- [ ] **Origin header validation** — guards against DNS rebinding; required by Anthropic
- [ ] **`serverInfo.version` aligned with `server.json`'s `version`**
- [ ] **Claude side**: confirm the rooquiz claude.ai account is a Team or Enterprise org — individual plans do not show the submission entry point
- [ ] **ChatGPT side**: complete publisher identity verification in the OpenAI Platform Dashboard, and verify control of `payload.rooquiz.com`
