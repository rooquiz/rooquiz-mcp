# RooQuiz MCP Listing Status & Submission Copy

Companion doc: [`PUBLISHING.md`](PUBLISHING.md) — step-by-step for the official Registry and Glama.
This file tracks **status per channel** and holds **ready-to-paste submission copy**.

Last updated: 2026-09-06

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
| M8ven | `noopener` — but the only outbound link is the **GitHub repo**; the page never links `rooquiz.com` | ➖ n/a |
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
| Official MCP Registry | Metadata source | ✅ active as `com.rooquiz/rooquiz-mcp`. First published 2026-08-20 (v1.0.0); **v1.1.0 published 2026-09-22** and is now `isLatest`. The registry keeps both versions; 1.0.0 stays `active` with `isLatest: false` | Re-publish on every version change — see `PUBLISHING.md` §Releasing. Note the registry had sat at 1.0.0 for three weeks while `server.json` already said 1.1.0, so the bump is easy to forget |
| VS Code / Cursor one-click install | Client | ✅ in README (2026-08-22) | Recompute links from the formula below if the endpoint changes |
| `/.well-known/glama.json` | Claim route | ✅ **deployed** — `https://payload.rooquiz.com/.well-known/glama.json` returns 200 with the right JSON (verified 2026-08-28) | — |
| Smithery | Aggregator | 🟡 Listing ownership unconfirmed, and **the badge is broken**: `https://smithery.ai/badge/rooquiz/rooquiz-mcp` answers HTTP 500 at the origin as of 2026-09-22, so the README shows a broken image (GitHub's camo proxy returns 502 for it). `/servers/rooquiz/rooquiz-mcp` itself is 200, so the listing is alive — this is Smithery's badge service, not our config | **Passes equity — do this early.** Sign in to smithery.ai and confirm the listing is claimed. For the badge, either wait for the origin to recover or swap the README line for a static shields.io badge |
| PulseMCP | Aggregator | ⬜ **Confirmed not listed** 2026-09-22: `/servers?q=rooquiz` renders "No servers found", 0 results. The automatic-ingest window closed 2026-09-05 and nothing landed. `v0beta` is fully sunset (`API_SUNSET` on every call) and `v0.1` needs an `X-API-Key` | **Passes equity — do this early.** Submit manually at https://www.pulsemcp.com/submit. **Checking it from a terminal:** every `www.pulsemcp.com` path — including `robots.txt` — answers 403 to curl whatever the user-agent, but a fetch through an agent's web-fetch tool goes straight through. That is how the 2026-09-22 reading was taken. An API key from hello@pulsemcp.com also works |
| Glama **servers directory** | Aggregator | ✅ **Claimed** (re-checked 2026-09-22): `/mcp/servers/rooquiz/rooquiz-mcp` returns 200 as `RooQuiz by rooquiz` and the "Unclaimed servers have limited discoverability" warning is gone. `/badges/score.svg` serves 200, but the score **value** could not be read from outside — the badge draws its text as glyph paths and `/score` renders the number client-side, so the server HTML carries only the description. `/api/mcp/v1/servers/rooquiz/rooquiz-mcp` needs an API key | Read the score in a browser, or with a key from `https://glama.ai/settings/api-keys` (the API Data License demands visible Glama attribution wherever the data is shown). Note this stays a **separate listing** from the connector |
| Glama **connector** | Aggregator | ✅ **Claimed and healthy** (verified 2026-08-28). `/mcp/connectors/com.rooquiz/rooquiz-mcp` shows "Ownership verified" (`isVerified: 2026-08-28T08:35:51Z`) and status **Healthy**. The `.well-known/glama.json` route did the whole job — the PAT-to-support@glama.ai workaround was never needed | Done. Note this is a **different listing** from the servers directory above; claiming one does not claim the other |
| awesome-mcp-servers | GitHub list | ✅ **Merged** — [PR #12649](https://github.com/punkpeye/awesome-mcp-servers/pull/12649) landed and the entry is live on `main` under `### 🎯 Marketing`, carrying the Glama score badge and the 🎖️ 📇 ☁️ legend icons (verified 2026-09-22 against the raw README) | Done. Re-check the line if the endpoint, the Glama slug or the description ever changes |
| M8ven Trust Index | Aggregator / security scanner | ✅ **Verified** 2026-09-05 via `git_commits` against commit `4666dad`. Listing: `https://m8ven.ai/mcp/rooquiz-rooquiz-mcp-14mq8p`. Grade **C · Emerging, 74/100** — M8ven caps new projects at C until adoption is earned, and it grades the *manifest repo* since the server itself is closed source ("we have no way to read this server ourselves"). Verified-only badge (no grade) is in the README | Two open findings, both about this repo, not the hosted server: (1) "secret credentials may flow to a network call" — `ROOQUIZ_TOKEN` read from `process.env`, destination unprovable to a scanner; (2) no test files. Claiming the listing unlocks the per-finding dispute flow and the "1 concrete improvement". Re-check the grade after PulseMCP/mcp.so land |
| LobeHub Market | Aggregator | ✅ **Claimed and updated** 2026-09-22. The listing was already auto-crawled as `rooquiz-rooquiz-mcp` (v1.0.0, category `gaming-entertainment`, all capabilities `false`), so this was a **claim + update**, not a fresh publish. Now v1.1.0, category `business`, 48 tools declared, and owner-updated versions are trusted — the "Unvalidated" badge is gone. Page: `https://lobehub.com/mcp/rooquiz-rooquiz-mcp` | Re-run `lhm plugin update` on every release; regenerate the `tools` array first (see below) |
| mcp.so | Aggregator | ⬜ **Confirmed not listed** 2026-09-22. The site serves two URL shapes and both 404 for us: `/server/<repo>/<owner>` and `/servers/<repo>-<owner>` (the form its sitemap uses). Known servers answer 200 on both — `/server/filesystem/modelcontextprotocol`, `/servers/playwright-microsoft` — so the shapes are right, we are simply absent | Open a GitHub issue on `chatmcp/mcpso` with a `[Submit]` title prefix; copy below |
| Claude Connectors Directory | Client directory | 🔴 Blocked | Needs a Team/Enterprise org plus the prerequisites below |
| ChatGPT Apps Directory | Client directory | 🔴 Blocked | Needs identity + domain verification plus the prerequisites below |

Suggested order (equity first, then discovery): **Smithery → PulseMCP → mcp.so**.

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

**Merged 2026-09-22** — everything below is the record of how the entry was built and what the CI
gates on; keep it for the next edit to that line, not as an open task.

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

Its submission page states that publishing to the official MCP Registry is the best first step, and we are already on the registry. We waited for automatic ingest from 2026-08-22; the window closed 2026-09-05 with no listing observed, so **submit manually** at https://www.pulsemcp.com/submit. The old check command is dead — `v0beta` was fully sunset in September 2026 and `v0.1` needs an `X-API-Key` (request one from hello@pulsemcp.com).

### LobeHub Market

Managed with the `lhm` CLI (`@lobehub/market-cli`, needs Node >= 22). `login` and `github connect` are
browser flows that cannot be automated; everything else is scriptable.

```bash
npx -y @lobehub/market-cli auth status --output json   # probe first
npx -y @lobehub/market-cli login                       # browser, human required
npx -y @lobehub/market-cli github connect              # browser, needs push access to rooquiz/rooquiz-mcp
npx -y @lobehub/market-cli plugin update --dir /absolute/path/to/rooquiz-mcp
npx -y @lobehub/market-cli plugin list --output json    # verify
```

The owner declaration is `lhm.plugin.json` in this repo. Reusing the same `version` merges in place;
a new `version` cuts a release. Omitted fields keep their current value, which is why `icon` is absent
— the listing keeps the GitHub avatar.

`en-US` is the source locale and is stored verbatim. Every other locale is machine-translated from it
in the background, except the ones declared in `localizations`: **zh-CN and zh-TW are hand-written**
and owner-provided locales are authoritative — neither the translator nor a re-crawl overwrites them.
The other 12 locales are LobeHub's translations. Edit a locale without touching the manifest with
`lhm plugin i18n set <identifier> --locale <locale> --name ... --description ...`, and inspect the
current state with `lhm plugin i18n list rooquiz-rooquiz-mcp --output json`.

`lhm plugin init` cannot generate the manifest for us: it introspects the endpoint directly and
`https://payload.rooquiz.com/api/mcp` answers `Missing Bearer token`. The `tools` array is dumped from
the payload repo instead, which is fresher than `bin/introspection.json` (that snapshot needs a live
token, so it lags). Two traps in that dump: `tsx -e` does not resolve the `@/` path alias — it exits 0
and writes nothing — so it has to go through a real script file, and the script must write to a file
rather than stdout, because i18next prints a banner to stdout and corrupts the JSON.

```bash
cd ../rooquiz-payload
cat > /tmp/dump-tools.mts <<'EOF'
import { writeFileSync } from 'node:fs'
import { MCP_TOOLS } from '@/integrations/mcp/tools'
writeFileSync(
  process.argv[2],
  JSON.stringify(MCP_TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))),
)
EOF
npx tsx --tsconfig tsconfig.json /tmp/dump-tools.mts /tmp/tools.json
```

Then splice `/tmp/tools.json` into `lhm.plugin.json` as `tools` and bump `version`. Category must be
one of the 15 slugs in `https://lobehub.com/sitemap/mcp-category.xml`.

## Prerequisites for the client directories

Claude Connectors and the ChatGPT Apps Directory share this material. Any missing item means
rejection. Each line below was re-verified on 2026-08-28.

- [x] **Tool annotations** — all 48 tools carry annotations
  (`rooquiz-payload/src/integrations/mcp/annotations.ts`). Every `delete_*` tool is
  `destructiveHint: true`. Note the deviation from what this list used to say: `update_*` is
  **not** blanket-destructive. The file draws the line at "deletes or irreversibly overwrites
  the user's content", so a pure config replacement stays `WRITE` and only `update_examinee`
  is destructive. That reading matches the spec better than a name prefix would.
  ⚠️ One worth revisiting: `update_form_translation` is `WRITE`, but replacing
  `report.outcomes` wipes the other translations in that field — which is exactly an
  irreversible overwrite by the file's own rule.
- [x] **Public privacy policy page** — https://rooquiz.com/privacy. Section 4 carries an
  "AI Assistants and MCP Clients" clause: what is sent (quiz content, responses, leads,
  bookings), that it lands with the client's provider under their policy, that respondent
  names / emails / phones are masked before leaving our systems, and how to revoke. Section 10
  covers retention.
- [x] **Public documentation page** — https://docs.rooquiz.com/en/integrations/mcp (zh at
  `/zh/...`). Covers both auth paths, per-client config, the full tool list, limits and rate
  limits.
- [x] **At least 3 example prompts** — four, in the README and both documentation pages, each
  labelled with the tools it exercises: templates → create → add question; leads → tag →
  assign; forms → stats → funnel; translations. Added 2026-08-28.
- [x] **Origin header validation** — `handleMcpRequest` refuses a present-but-unlisted
  `Origin` with 403 before authenticating; an absent header passes, because no MCP client in
  the production audit log is a browser. Added 2026-08-28.
- [x] **`serverInfo.version` aligned with `server.json`'s `version`** — both `1.0.0`.
- [ ] **Claude side**: confirm the rooquiz claude.ai account is a Team or Enterprise org —
  individual plans do not show the submission entry point
- [ ] **ChatGPT side**: complete publisher identity verification in the OpenAI Platform
  Dashboard, and verify control of `payload.rooquiz.com`

Everything we control is done. The two open boxes are account actions that need a real person.
