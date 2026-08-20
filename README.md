# RooQuiz MCP Server

Remote [MCP](https://modelcontextprotocol.io) server for [RooQuiz](https://rooquiz.com) — a lightweight assessment platform for lead capture and viral sharing. Build quizzes with AI-assisted authoring, capture leads from results pages, and analyze funnel conversion — straight from Claude, ChatGPT, Cursor, or any MCP client.

- **Endpoint:** `https://payload.rooquiz.com/api/mcp` (Streamable HTTP)
- **Auth:** OAuth 2.1 — authorization code + PKCE with dynamic client registration. Sign in with your RooQuiz account when your client prompts you; no API key needed.
- **Registry name:** [`com.rooquiz/rooquiz-mcp`](https://registry.modelcontextprotocol.io/v0/servers?search=com.rooquiz/rooquiz-mcp)

## Connect

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

## What you can do

- **Quizzes** — create knowledge quizzes, scored quizzes, and "which X are you" outcome quizzes; edit questions, scoring formulas, and dimension analysis; start from templates
- **Translations** — one source form, mirrored translations in any language
- **Leads** — list, tag, assign, and comment on leads captured from quiz results pages
- **Respondents & records** — look up respondents, submissions, stats, and funnel analytics
- **Bookings** — review and reschedule bookings made through quiz results pages
- **Team** — switch active team, invite members, manage question banks and categories

All tools act within the team your session is bound to.

## Support

Questions or issues: [support@rooquiz.com](mailto:support@rooquiz.com)

---

This repository carries the [`server.json`](server.json) manifest published to the official MCP Registry. The server implementation itself is closed source.
