#!/usr/bin/env bash
# 生成官方 MCP Registry 域名验证用的 Ed25519 密钥对。
#
# 输出三样东西：
#   1. 写入 key.pem（已被 .gitignore 忽略，生成后立即存入密码管理器）
#   2. 要加到 rooquiz.com apex 的 DNS TXT 记录原文
#   3. mcp-publisher login / publish 命令
#
# 注意：macOS 系统自带的 openssl 是 LibreSSL，genpkey 不支持 Ed25519，
# 需要 `brew install openssl@3`；本脚本会自动探测 Homebrew 的 OpenSSL 3。
set -euo pipefail

DOMAIN="rooquiz.com"
KEY_FILE="${1:-key.pem}"

if [ -f "$KEY_FILE" ]; then
  echo "错误：$KEY_FILE 已存在。密钥轮换请先删除旧 DNS TXT 记录，再删除旧文件重跑。" >&2
  exit 1
fi

# 优先使用 Homebrew 的 OpenSSL 3（Apple Silicon / Intel 两个路径）
OPENSSL=openssl
for candidate in /opt/homebrew/opt/openssl@3/bin/openssl /usr/local/opt/openssl@3/bin/openssl; do
  if [ -x "$candidate" ]; then
    OPENSSL="$candidate"
    break
  fi
done

if ! "$OPENSSL" genpkey -algorithm Ed25519 -out "$KEY_FILE" 2>/dev/null; then
  rm -f "$KEY_FILE"
  echo "错误：当前 openssl 不支持 Ed25519。macOS 请先 brew install openssl@3 再重跑。" >&2
  exit 1
fi
chmod 600 "$KEY_FILE"

PUBLIC_KEY="$("$OPENSSL" pkey -in "$KEY_FILE" -pubout -outform DER | tail -c 32 | base64)"
PRIVATE_KEY_HEX="$("$OPENSSL" pkey -in "$KEY_FILE" -noout -text | grep -A3 'priv:' | tail -n +2 | tr -d ' :\n')"

cat <<EOF

私钥已写入 ${KEY_FILE}（权限 600，已被 .gitignore 忽略）。
>>> 立即把它存入团队密码管理器，本地文件用完即删，绝不提交。

── 第 1 步：DNS TXT 记录 ─────────────────────────────────────
在 Cloudflare DNS 给 ${DOMAIN} 的 apex（@，不是任何子域/selector）添加：

  ${DOMAIN}. IN TXT "v=MCPv1; k=ed25519; p=${PUBLIC_KEY}"

── 第 2 步：等 TXT 生效后登录（通常几分钟）──────────────────
  mcp-publisher login dns --domain "${DOMAIN}" --private-key "${PRIVATE_KEY_HEX}"

── 第 3 步：在本仓库根目录发布 ──────────────────────────────
  mcp-publisher publish

EOF
