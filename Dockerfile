# stdio bridge to the hosted RooQuiz MCP server. Used by MCP registries that build a
# container and pipe JSON-RPC over stdin/stdout, and by clients without native HTTP
# transport. Everything the bridge needs is in bin/ — no install step, no dependencies.
FROM node:22-alpine

WORKDIR /app
COPY bin/ ./bin/
COPY package.json ./

# Override to point at a different deployment; leave unset for production.
ENV ROOQUIZ_MCP_URL=https://payload.rooquiz.com/api/mcp

# Optional. Without a token the server still answers initialize / tools/list / ping,
# which is all an introspection probe needs; tools/call requires OAuth.
ENV ROOQUIZ_TOKEN=""

ENTRYPOINT ["node", "bin/rooquiz-mcp.mjs"]
