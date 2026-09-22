# Changelog

Versions here are versions of **this bridge**, not of the hosted server it talks to. The
version the bridge reports during a tokenless handshake comes from `bin/introspection.json`,
which mirrors what `https://payload.rooquiz.com/api/mcp` answers `initialize` with and moves
on its own schedule — see `scripts/snapshot-tools.mjs`.

## Unreleased

### Changed

- **Snapshot regenerated against the hosted server.** `bin/introspection.json` now mirrors
  what `payload.rooquiz.com` answers as of 2026-09-09: every tool carries a human-readable
  `title` (top level *and* `annotations.title`, since clients read one position or the
  other) and a `securitySchemes` declaration of `oauth2` with the `mcp` scope, duplicated
  into `_meta` because older OpenAI clients read only that copy. `prepare_image_upload`
  stopped presenting itself as read-only — it signs an upload URL, which is not a read.
  Corrected output schemas for `get_examinee`, `update_examinee`, `invite_member` and
  `list_bookings` ride along, as do reworded descriptions on a dozen tools and the server
  `instructions` served during a tokenless handshake.

- **The preview tools declare the same metadata.** `title` alongside `annotations.title`,
  and `securitySchemes: [{ "type": "noauth" }]` with the matching `_meta` mirror. On the
  tokenless path the two halves of `tools/list` now say plainly which is which: the 48
  hosted tools want OAuth, the four preview tools want nothing.

- **`MCP-Protocol-Version` is sent on every request after the handshake.** Streamable HTTP
  has carried the header since 2025-03-26 and the hosted server now answers HTTP 400 for a
  version it does not support. The bridge replays the version the server itself negotiated,
  never the one the stdio client asked for — the server may have declined that one.

- **A notification ack is `202`, not `204`.** The hosted server moved to the status
  Streamable HTTP requires. Both are read as an empty ack, so the bridge keeps working
  against either deployment.

## 1.1.0 — 2026-09-03

### Added

- **Preview mode: four tools that work with no token and no account.** Without a usable
  credential the bridge used to complete a handshake, list 48 tools, and then `401` every
  single one of them — technically introspectable, practically inert. It now also serves
  `preview_quiz`, `preview_scorecard`, `preview_outcome` and `preview_guide`, which build a
  temporary (~1 hour) shareable assessment and hand back a `quizster.app` link.

  They cost nothing to run locally because they target RooQuiz's *public* preview endpoint,
  `POST https://preview.rooquiz.com/api/preview-forms`, which takes no credentials by
  design. `scene` is forced per tool, so a caller cannot ask `preview_quiz` for a scorecard
  and never has to remember the value.

  The instructions behind them are the [rooquiz-skills](https://github.com/rooquiz/rooquiz-skills)
  `SKILL.md` files, vendored into `bin/skills.json` by `scripts/sync-skills.mjs`. Only the
  frontmatter description of each rides in `tools/list`; the ~12KB of field schema, scoring
  rules and examples is fetched on demand through `preview_guide`, and a rejected assessment
  gets the whole guide attached to the error so the model can fix and retry in one round
  trip.

  Nothing was taken away to make room: `tools/list` leads with the four preview tools and
  keeps all 48 snapshot tools behind them, so registry crawlers still see the full catalog.
  `initialize` now says in its `instructions` which of the two groups can actually run.

  A working token is unaffected: the preview tools are not offered and not answered, so
  "with a token, every message is forwarded" still holds exactly.

### Changed

- **A refusal from upstream is now latched.** The first `401`/`403`/`-32001` puts the bridge
  into the tokenless path for the rest of the process instead of re-learning it one wasted
  round trip per message. This is what a registry crawler's placeholder token hits, and it
  is what lets the preview tools answer immediately rather than after a pointless `POST`.

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
