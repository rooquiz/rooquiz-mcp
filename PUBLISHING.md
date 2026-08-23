# RooQuiz MCP Publishing Runbook

Two parallel tracks: **A. Glama** (connector + servers directory) and **B. the official MCP Registry** (publish once; Glama and other aggregators pull metadata from there). Do B first, then A.

Server facts, all verified in production on 2026-08-20:

| Item | Value |
| --- | --- |
| MCP endpoint | `https://payload.rooquiz.com/api/mcp` (Streamable HTTP, stateless) |
| Auth | OAuth 2.1: authorization code + PKCE, with dynamic client registration (RFC 7591) |
| Discovery metadata | `/.well-known/oauth-protected-resource/api/mcp` and `/.well-known/oauth-authorization-server/api/mcp` both respond correctly |
| Unauthenticated behavior | `initialize` / `ping` / `tools/list` answer normally (anonymous discovery, see §A); everything else 401 + `WWW-Authenticate: Bearer resource_metadata=...` (RFC 9728 discovery chain) |
| serverInfo | `rooquiz-mcp` / `1.0.0` — differs from the registry name `com.rooquiz/rooquiz-mcp`; aligning them is only a spec recommendation and does not affect listing or health checks |

---

## B. Publish to the official MCP Registry

The published name is `com.rooquiz/rooquiz-mcp` (the registry enforces a `namespace/name` format; the name part stays `rooquiz-mcp`). Publishing rights for the `com.rooquiz` namespace come from proving control of `rooquiz.com`. The manifest is [`server.json`](server.json) in this repo's root.

### Prerequisite: install mcp-publisher

```bash
brew install mcp-publisher
# or download a binary from https://github.com/modelcontextprotocol/registry/releases
```

### 1. Generate the domain-verification key

```bash
./scripts/generate-keypair.sh
```

The script generates an Ed25519 keypair (on macOS this needs `brew install openssl@3`; the script auto-detects it) and prints every follow-up command. **Move the private key `key.pem` into your password manager immediately and never commit it** — it is already in `.gitignore`.

### 2. Add the DNS TXT record

In Cloudflare DNS, add a TXT record on the **apex** of `rooquiz.com` (name field: `@`) with the value the script prints:

```
v=MCPv1; k=ed25519; p=<BASE64_PUBLIC_KEY>
```

Two things the official docs call out explicitly:

- It must live on the apex. Do **not** put it on a selector subdomain like `_mcp-auth.rooquiz.com` — the wrong location produces a generic signature error.
- When rotating keys, **delete the old TXT record first**. A leftover record gets tried first and fails verification.

### 3. Log in and publish

```bash
# the script prints the private key in hex; TXT propagation usually takes a few minutes
mcp-publisher login dns --domain "rooquiz.com" --private-key "<HEX_PRIVATE_KEY>"

# run from this repo's root (it reads ./server.json)
mcp-publisher publish
```

### 4. Verify and update later

```bash
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=com.rooquiz/rooquiz-mcp"
```

- To update metadata or ship a new version: edit `server.json` (bump `version`), then `login` + `publish` again.
- Keep `server.json`'s `version` in sync with `SERVER_INFO.version` in the code (`rooquiz-payload/src/app/api/mcp/route.ts`).
- `description` has a **100-character limit** — watch it when rewriting copy.

### Alternative: HTTP verification

If you would rather not touch DNS, serve plain text at `https://rooquiz.com/.well-known/mcp-registry-auth`:

```
v=MCPv1; k=ed25519; p=<BASE64_PUBLIC_KEY>
```

This needs a static route added to rooquiz-web, then `mcp-publisher login http --domain "rooquiz.com" ...`. DNS requires no code change, so prefer DNS.

---

## A. Glama

Glama has **two separate channels**, and they are not interchangeable:

| Channel | URL shape | Source | Score badge? |
| --- | --- | --- | --- |
| Connectors | `/mcp/connectors/<registry-name>` | Auto-ingested from the official MCP Registry | **No** — `…/badges/score.svg` 404s |
| Servers | `/mcp/servers/<gh-owner>/<gh-repo>` | Submitted GitHub repo, built and introspected by Glama | **Yes** |

`punkpeye/awesome-mcp-servers` requires the **servers** badge, so the connector alone does
not satisfy it. Do both.

### The health-check prerequisite (applies to both channels)

Glama's probe is unattended: it only does `initialize` → `notifications/initialized` →
`tools/list`. Our authorization server advertises `authorization_code` + `refresh_token`
only — **dynamic client registration gets Glama a `client_id` but never an access token**,
because the authorization-code step needs a human to click. An earlier revision of this
document said "leave test credentials blank, DCR is enough"; that was wrong, and it is why
the connector sat at *Unhealthy*.

The fix lives in rooquiz-payload: `handleMcpRequest` routes requests with **no**
`Authorization` header at all to an anonymous discovery branch that answers `initialize`,
`ping`, and `tools/list` (see `ANONYMOUS_DISCOVERY_METHODS` in
`src/integrations/mcp/server.ts`). It is opt-in per endpoint via `allowAnonymousDiscovery`
and is **off** for `/api/mcp/ops`. `tools/call` still requires a token and still returns 401
with `WWW-Authenticate`, so the OAuth discovery chain is intact.

Verify after deploying:

```bash
curl -s -X POST https://payload.rooquiz.com/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | head -c 200
# expect a tools array, not {"code":-32001,"message":"Missing Bearer token"}
```

### A1. Connector (already listed)

The registry entry is auto-ingested — the listing already exists at
[glama.ai/mcp/connectors/com.rooquiz/rooquiz-mcp](https://glama.ai/mcp/connectors/com.rooquiz/rooquiz-mcp).
Nothing to submit; it re-tests on its own and flips to *Healthy* once the deploy above is live.

To **claim** it, serve this at `https://payload.rooquiz.com/.well-known/glama.json`:

```json
{
  "$schema": "https://glama.ai/mcp/schemas/connector.json",
  "maintainers": [{ "email": "<the email on your Glama account>" }]
}
```

Glama detects it within a few minutes. Claiming unlocks editing the description, analytics,
and health alerts.

### A2. Servers directory (needed for the badge)

1. Sign in to [glama.ai](https://glama.ai) with the GitHub account listed in
   [`glama.json`](glama.json) `maintainers` (currently `reganfly`). Org repos cannot be
   auto-associated by login, so that file is the ownership hook — after editing it you must
   re-run the Claim ownership flow.
2. [glama.ai/mcp/servers](https://glama.ai/mcp/servers) → **Add MCP Server**, repository
   `https://github.com/rooquiz/rooquiz-mcp`.
3. Glama does not read a Dockerfile from the repo — **paste the contents of
   [`Dockerfile`](Dockerfile) into its form**. The image runs
   [`bin/rooquiz-mcp.mjs`](bin/rooquiz-mcp.mjs), a dependency-free stdio↔HTTP bridge; with
   anonymous discovery live it answers introspection with no credentials at all, so leave
   `ROOQUIZ_TOKEN` unset.
4. Verify locally first — this is the exact handshake Glama runs:

   ```bash
   docker build -t rooquiz-mcp .
   printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}' \
     | docker run -i --rm rooquiz-mcp
   ```

5. Once the listing is graded, the badge lives at
   `https://glama.ai/mcp/servers/rooquiz/rooquiz-mcp/badges/score.svg`. Add it to the
   awesome-mcp-servers PR (copy in [`LISTINGS.md`](LISTINGS.md)).

Troubleshooting:

- A `429` from `enforceRateLimits` is an immediate unhealthy verdict. Anonymous discovery is
  IP-keyed at 30 req/min; Glama's probe is nowhere near that, but a shared-IP crawler could be.
- Self-check the discovery chain (the three URLs in the table at the top): the 401 on
  `tools/call` must carry `WWW-Authenticate`, and both well-known endpoints must be
  anonymously accessible.

---

## Security notes

- The private key — `key.pem` and the hex form — goes into the password manager only. Never into git, never into CI logs.
- A leaked domain-verification key lets anyone publish fake servers under the `com.rooquiz/*` namespace. Rotate immediately if it leaks: delete the old TXT record, regenerate, add the new TXT record.
