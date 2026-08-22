# RooQuiz MCP Publishing Runbook

Two parallel tracks: **A. Glama Connector** (remote connector directory) and **B. the official MCP Registry** (publish once; Glama and other aggregators pull metadata from there). Do B first, then A.

Server facts, all verified in production on 2026-08-20:

| Item | Value |
| --- | --- |
| MCP endpoint | `https://payload.rooquiz.com/api/mcp` (Streamable HTTP, stateless) |
| Auth | OAuth 2.1: authorization code + PKCE, with dynamic client registration (RFC 7591) |
| Discovery metadata | `/.well-known/oauth-protected-resource/api/mcp` and `/.well-known/oauth-authorization-server/api/mcp` both respond correctly |
| Unauthenticated behavior | 401 + `WWW-Authenticate: Bearer resource_metadata=...` (RFC 9728 discovery chain) |
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

## A. Submit the Glama connector

Glama routes already-deployed remote MCP servers through its connectors channel, which does not require open source.

Submission checklist:

1. Sign in to [glama.ai](https://glama.ai) with a GitHub account that represents the rooquiz org — the submitting account owns the listing.
2. Go to [glama.ai/mcp/connectors](https://glama.ai/mcp/connectors) → **Add MCP Server → Connector**.
3. Fill in the form:
   - **Name**: `RooQuiz`
   - **Endpoint**: `https://payload.rooquiz.com/api/mcp`
   - **Description** (can run longer than `server.json`; suggested text):
     > Create and manage quizzes, question banks, and translations; capture and manage leads, respondents, and bookings; and pull stats and funnel analytics on RooQuiz — a lightweight assessment platform for lead capture and viral sharing.
   - **Test credentials: leave blank.** The server supports OAuth 2.1 dynamic client registration, so Glama registers its own client for the health check.
4. Wait for the automated health check. **Only healthy connectors get indexed**; an unhealthy one stays stuck in pending.

On [`glama.json`](glama.json): the connector channel does not use it (ownership follows the submitting account). Its purpose is claiming a listing in Glama's **open-source servers directory** — this repo lives under an org, and org repos cannot be auto-associated by GitHub login, so the root `glama.json` (with GitHub usernames in `maintainers`) is the only hook. After changing it you must re-run the Claim ownership flow on Glama for the change to be picked up.

Troubleshooting:

- If it stays pending for a long time, first check whether Glama's probe is being blocked by rate limiting (`enforceRateLimits`, KV-backed). DCR registration plus `initialize` is low-frequency and should not trip it, but a 429 means an immediate unhealthy verdict.
- Self-check the discovery chain (the three URLs in the table at the top): the 401 must carry `WWW-Authenticate`, and both well-known endpoints must be anonymously accessible.

---

## Security notes

- The private key — `key.pem` and the hex form — goes into the password manager only. Never into git, never into CI logs.
- A leaked domain-verification key lets anyone publish fake servers under the `com.rooquiz/*` namespace. Rotate immediately if it leaks: delete the old TXT record, regenerate, add the new TXT record.
