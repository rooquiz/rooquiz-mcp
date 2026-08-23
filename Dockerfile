# stdio bridge to the hosted RooQuiz MCP server. Used by MCP registries that build a
# container and pipe JSON-RPC over stdin/stdout, and by clients without native HTTP
# transport. Everything the bridge needs is in bin/ — no install step, no dependencies.
FROM node:22-alpine

WORKDIR /app
COPY bin/ ./bin/
COPY package.json ./

# Override to point at a different deployment; leave unset for production.
ENV ROOQUIZ_MCP_URL=https://payload.rooquiz.com/api/mcp

# Required — the server 401s every method without it, initialize included. Pass it at run
# time (docker run -e / the registry's env-var field); never bake a token into this file.
ENV ROOQUIZ_TOKEN=""

ENTRYPOINT ["node", "bin/rooquiz-mcp.mjs"]
