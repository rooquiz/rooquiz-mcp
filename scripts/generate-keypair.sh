#!/usr/bin/env bash
# Generate the Ed25519 keypair used for domain verification on the official MCP Registry.
#
# It emits three things:
#   1. key.pem (gitignored — move it into your password manager right away)
#   2. the literal DNS TXT record to add on the rooquiz.com apex
#   3. the mcp-publisher login / publish commands
#
# Note: the openssl shipped with macOS is LibreSSL, whose genpkey does not support
# Ed25519. You need `brew install openssl@3`; this script auto-detects Homebrew's OpenSSL 3.
set -euo pipefail

DOMAIN="rooquiz.com"
KEY_FILE="${1:-key.pem}"

if [ -f "$KEY_FILE" ]; then
  echo "Error: $KEY_FILE already exists. To rotate, delete the old DNS TXT record first, then remove this file and re-run." >&2
  exit 1
fi

# Prefer Homebrew's OpenSSL 3 (Apple Silicon and Intel paths)
OPENSSL=openssl
for candidate in /opt/homebrew/opt/openssl@3/bin/openssl /usr/local/opt/openssl@3/bin/openssl; do
  if [ -x "$candidate" ]; then
    OPENSSL="$candidate"
    break
  fi
done

if ! "$OPENSSL" genpkey -algorithm Ed25519 -out "$KEY_FILE" 2>/dev/null; then
  rm -f "$KEY_FILE"
  echo "Error: this openssl does not support Ed25519. On macOS, run brew install openssl@3 and try again." >&2
  exit 1
fi
chmod 600 "$KEY_FILE"

PUBLIC_KEY="$("$OPENSSL" pkey -in "$KEY_FILE" -pubout -outform DER | tail -c 32 | base64)"
PRIVATE_KEY_HEX="$("$OPENSSL" pkey -in "$KEY_FILE" -noout -text | grep -A3 'priv:' | tail -n +2 | tr -d ' :\n')"

cat <<EOF

Private key written to ${KEY_FILE} (mode 600, gitignored).
>>> Move it into the team password manager now. Delete the local file when done, never commit it.

── Step 1: DNS TXT record ───────────────────────────────────
In Cloudflare DNS, add this on the apex of ${DOMAIN} (name "@", not a subdomain or selector):

  ${DOMAIN}. IN TXT "v=MCPv1; k=ed25519; p=${PUBLIC_KEY}"

── Step 2: log in once the TXT record propagates (usually minutes) ──
  mcp-publisher login dns --domain "${DOMAIN}" --private-key "${PRIVATE_KEY_HEX}"

── Step 3: publish from this repo's root ────────────────────
  mcp-publisher publish

EOF
