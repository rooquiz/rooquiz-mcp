#!/usr/bin/env node
/**
 * stdio ↔ Streamable HTTP bridge for the hosted RooQuiz MCP server.
 *
 * The server itself runs at https://payload.rooquiz.com/api/mcp and speaks Streamable
 * HTTP. Clients that only support stdio (Claude Desktop, older MCP hosts) and registry
 * crawlers that build a container and pipe JSON-RPC over stdin/stdout need this shim.
 * Clients with native HTTP support (Claude Code, Cursor, VS Code, claude.ai, ChatGPT)
 * should point at the URL directly — see the README.
 *
 * No dependencies on purpose: Node >= 18 built-ins only, so the container is one COPY
 * and there is no supply chain to audit.
 *
 * Env:
 *   ROOQUIZ_MCP_URL  endpoint override (default https://payload.rooquiz.com/api/mcp)
 *   ROOQUIZ_TOKEN    optional bearer token. Without it, discovery (initialize,
 *                    tools/list, ping) still works; tools/call returns 401.
 */

const ENDPOINT = process.env.ROOQUIZ_MCP_URL || 'https://payload.rooquiz.com/api/mcp'
const TOKEN = process.env.ROOQUIZ_TOKEN || ''

// JSON-RPC 2.0 error codes we synthesize locally (the server owns the rest).
const ERR_PARSE = -32700
const ERR_INTERNAL = -32603

/** stdout writes must not interleave — every message goes through here. */
function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n')
}

function errorResponse(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

async function forward(message) {
  const headers = {
    'Content-Type': 'application/json',
    // Streamable HTTP servers may answer with either; ours always returns JSON.
    Accept: 'application/json, text/event-stream',
  }
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(message),
  })

  // 204 (notification ack) and empty bodies carry nothing to relay.
  if (response.status === 204) {
    return null
  }
  const text = await response.text()
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    // Non-JSON body (proxy error page, WAF block). Surface it as a JSON-RPC error
    // instead of letting the client hang waiting for a response to its id.
    return errorResponse(
      message.id,
      ERR_INTERNAL,
      `Upstream returned HTTP ${response.status} with a non-JSON body`
    )
  }
}

async function handle(line) {
  let message
  try {
    message = JSON.parse(line)
  } catch {
    send(errorResponse(null, ERR_PARSE, 'Invalid JSON'))
    return
  }

  const isNotification = message.id === undefined || message.id === null
  try {
    const result = await forward(message)
    // Notifications get no reply even if the server answered with a body.
    if (result && !isNotification) {
      send(result)
    }
  } catch (error) {
    if (!isNotification) {
      send(errorResponse(message.id, ERR_INTERNAL, `Request to ${ENDPOINT} failed: ${error.message}`))
    }
  }
}

/**
 * Requests are forwarded concurrently (MCP allows it), so stdin closing does not mean
 * the work is done — exiting there would drop replies for anything still in flight.
 * That is exactly what a `printf ... | rooquiz-mcp` probe does.
 */
const inFlight = new Set()
let stdinEnded = false

function exitWhenDrained() {
  if (stdinEnded && inFlight.size === 0) {
    process.exit(0)
  }
}

function track(promise) {
  inFlight.add(promise)
  promise.finally(() => {
    inFlight.delete(promise)
    exitWhenDrained()
  })
}

// MCP stdio framing is newline-delimited JSON (no Content-Length headers).
let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  buffer += chunk
  let newline
  while ((newline = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newline).trim()
    buffer = buffer.slice(newline + 1)
    if (line) {
      track(handle(line))
    }
  }
})
process.stdin.on('end', () => {
  stdinEnded = true
  exitWhenDrained()
})
