#!/usr/bin/env node
/**
 * Regenerates bin/introspection.json — the handshake and tool list the bridge serves to
 * registry crawlers that have no bearer token. See the long comment in bin/rooquiz-mcp.mjs
 * for why that path exists.
 *
 * Run it after any change to the hosted server's tools, descriptions, or schemas:
 *
 *   ROOQUIZ_TOKEN=rqp_live_xxx node scripts/snapshot-tools.mjs
 *
 * The snapshot is only ever served to callers without a token, so a stale file degrades
 * how the server looks in a directory listing — it can never give a real client wrong
 * tools, since a real client has a token and gets forwarded upstream.
 *
 * Env:
 *   ROOQUIZ_TOKEN    bearer token (required)
 *   ROOQUIZ_MCP_URL  endpoint override (default https://payload.rooquiz.com/api/mcp)
 */

import { writeFileSync } from 'node:fs'

const ENDPOINT = process.env.ROOQUIZ_MCP_URL || 'https://payload.rooquiz.com/api/mcp'
const TOKEN = process.env.ROOQUIZ_TOKEN || ''
const OUTPUT = new URL('../bin/introspection.json', import.meta.url)

/**
 * Versions to ask about. The server answers `initialize` with one negotiated version, not
 * its whole list, so support is probed one candidate at a time — a version missing here is
 * simply never discovered. Add new spec revisions as they ship.
 */
const CANDIDATE_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']

// Not a real revision — the server falls back to its latest supported version for anything
// it does not recognize, which is how we learn what that latest version is.
const UNSUPPORTED_PROBE = '1970-01-01'

if (!TOKEN) {
  console.error('ROOQUIZ_TOKEN is required — mint a personal access token in RooQuiz settings.')
  process.exit(1)
}

async function call(method, params) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`${method} → HTTP ${response.status}: ${text.slice(0, 200)}`)
  }
  const body = JSON.parse(text)
  if (body.error) {
    throw new Error(`${method} → JSON-RPC ${body.error.code}: ${body.error.message}`)
  }
  return body.result
}

const initialize = protocolVersion =>
  call('initialize', {
    protocolVersion,
    capabilities: {},
    clientInfo: { name: 'rooquiz-mcp-snapshot', version: '1.0.0' },
  })

const latest = await initialize(UNSUPPORTED_PROBE)

// Keep the order the server prefers: newest first, latest at the head, which is what the
// bridge offers when a client asks for something it cannot honour.
const supported = []
for (const version of CANDIDATE_PROTOCOL_VERSIONS) {
  const answer = await initialize(version)
  if (answer.protocolVersion === version) {
    supported.push(version)
  }
}
const protocolVersions = supported.includes(latest.protocolVersion)
  ? supported
  : [latest.protocolVersion, ...supported]

const { tools } = await call('tools/list', {})

const snapshot = {
  protocolVersions,
  serverInfo: latest.serverInfo,
  capabilities: latest.capabilities,
  instructions: latest.instructions,
  tools,
}

writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2) + '\n')
console.log(`Wrote ${tools.length} tools to bin/introspection.json`)
console.log(`Protocol versions: ${protocolVersions.join(', ')}`)
