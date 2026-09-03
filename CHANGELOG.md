# Changelog

Versions here are versions of **this bridge**, not of the hosted server it talks to. The
version the bridge reports during a tokenless handshake comes from `bin/introspection.json`,
which mirrors what `https://payload.rooquiz.com/api/mcp` answers `initialize` with and moves
on its own schedule — see `scripts/snapshot-tools.mjs`.

## 1.0.1 — 2026-09-03

### Fixed

- **Handshake survives a token the server refuses**, not only a token that is absent.
  Registry crawlers fill every declared environment variable with a placeholder, so
  `ROOQUIZ_TOKEN` arrives looking like a credential and gets a 401 — and the snapshot
  fallback was gated on the variable being *empty*, so it could never fire for the crawler
  it was written for. `initialize`, `tools/list` and `ping` now fall back to
  `bin/introspection.json` whenever upstream rejects the credential (HTTP 401 or 403, or
  JSON-RPC `-32001`).

  A working token is unaffected: the fallback is reachable only through a rejection, so a
  stale snapshot can never shadow live data. `tools/call` has no local answer either way, so
  an unusable token still surfaces its 401 where an operator will notice it.

- **Responses are no longer relayed with an id that does not match the request.** The server
  answers an auth failure with `id: null` whatever the request asked for, which is not a
  legal id on a JSON-RPC response. Passing it through failed strict clients' schema
  validation *and* left nothing answering the id they were waiting on, so a one-line auth
  error became a full client timeout — for a registry crawler, a failed build.

### Removed

- `ROOQUIZ_MCP_URL`. The hosted server lives at one URL and always will, so the override
  only added a way to misconfigure the bridge. The endpoint is compiled in.

  Removing a documented variable would normally be more than a patch bump, but 1.0.0 was
  never published to npm and never released on Glama, so nothing could depend on it.

## 1.0.0

Initial stdio ↔ Streamable HTTP bridge: 48 tools across quizzes, leads, respondents,
submissions and bookings, with no dependencies beyond Node >= 18 built-ins.

Never tagged, never published to npm, never released on Glama — it existed only as a version
string in `package.json`. 1.0.1 is the first artifact anyone can actually install.
