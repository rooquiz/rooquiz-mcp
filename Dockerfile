# stdio bridge to the hosted RooQuiz MCP server. Used by MCP registries that build a
# container and pipe JSON-RPC over stdin/stdout, and by clients without native HTTP
# transport. Everything the bridge needs is in bin/ — no install step, no dependencies.
FROM node:22-alpine

WORKDIR /app
COPY bin/ ./bin/
COPY package.json ./

# Override to point at a different deployment; leave unset for production.
ENV ROOQUIZ_MCP_URL=https://payload.rooquiz.com/api/mcp

# Needed to call any tool — the hosted server 401s every method without it, initialize
# included. Left empty, or filled with the placeholder a registry crawler injects, the
# bridge still completes a handshake and lists its tools from bin/introspection.json, so
# this image introspects with no credentials. Pass a real token at run time (docker run
# -e / the registry's env-var field); never bake one into this file.
ENV ROOQUIZ_TOKEN=""

ENTRYPOINT ["node", "bin/rooquiz-mcp.mjs"]
