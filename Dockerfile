# stdio bridge to the hosted RooQuiz MCP server. Used by MCP registries that build a
# container and pipe JSON-RPC over stdin/stdout, and by clients without native HTTP
# transport. Everything the bridge needs is in bin/ — no install step, no dependencies.
FROM node:22-alpine

WORKDIR /app
COPY bin/ ./bin/
COPY package.json ./

# Needed to reach the hosted tools — the server 401s every method without it, initialize
# included. Left empty, or filled with the placeholder a registry crawler injects, the
# bridge runs in preview mode: it completes a handshake, lists its tools from
# bin/introspection.json, and serves the preview_* tools from bin/skills.json, which build
# shareable assessments through a public endpoint and need no credentials at all. Pass a
# real token at run time (docker run -e / the registry's env-var field); never bake one
# into this file.
ENV ROOQUIZ_TOKEN=""

ENTRYPOINT ["node", "bin/rooquiz-mcp.mjs"]
