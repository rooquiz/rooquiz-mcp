# RooQuiz MCP 上架操作手册

两条并行通道：**A. Glama Connector**（远程连接器目录）与 **B. 官方 MCP Registry**（一次发布，Glama 等聚合目录都从这里收录元数据）。建议先做 B，再做 A。

服务端事实（均已在生产验证，2026-08-20）：

| 项 | 值 |
| --- | --- |
| MCP 端点 | `https://payload.rooquiz.com/api/mcp`（Streamable HTTP，stateless） |
| 鉴权 | OAuth 2.1：authorization code + PKCE，支持动态客户端注册（RFC 7591） |
| 发现元数据 | `/.well-known/oauth-protected-resource/api/mcp`、`/.well-known/oauth-authorization-server/api/mcp` 均正常返回 |
| 未鉴权行为 | 401 + `WWW-Authenticate: Bearer resource_metadata=...`（符合 RFC 9728 发现链路） |
| serverInfo | `rooquiz-mcp` / `1.0.0`（与 registry 发布名 `com.rooquiz/rooquiz-mcp` 不同——对齐只是规范建议，不影响上架与健康检查） |

---

## B. 发布到官方 MCP Registry

发布名 `com.rooquiz/rooquiz-mcp`（registry 强制 `命名空间/名字` 格式，名字部分保留 `rooquiz-mcp`），靠证明对 `rooquiz.com` 的控制权获得 `com.rooquiz` 命名空间的发布资格。清单文件就是本仓库根目录的 [`server.json`](server.json)。

### 前置：安装 mcp-publisher

```bash
brew install mcp-publisher
# 或从 https://github.com/modelcontextprotocol/registry/releases 下载二进制
```

### 1. 生成域名验证密钥

```bash
./scripts/generate-keypair.sh
```

脚本生成 Ed25519 密钥对（macOS 需 `brew install openssl@3`，脚本会自动探测），并打印后续所有命令。**私钥 `key.pem` 立即存入密码管理器，不要提交**（`.gitignore` 已忽略）。

### 2. 添加 DNS TXT 记录

在 Cloudflare DNS 给 `rooquiz.com` 的 **apex**（名称填 `@`）添加 TXT 记录，值为脚本打印的：

```
v=MCPv1; k=ed25519; p=<BASE64_PUBLIC_KEY>
```

注意事项（官方文档明确强调）：

- 必须放 apex，**不要**放 `_mcp-auth.rooquiz.com` 之类的 selector 子域——放错位置会报笼统的签名错误
- 轮换密钥时必须**删掉旧 TXT 记录**，残留的旧记录会被优先尝试导致验证失败

### 3. 登录并发布

```bash
# 私钥 hex 由脚本打印；TXT 传播通常几分钟
mcp-publisher login dns --domain "rooquiz.com" --private-key "<HEX_PRIVATE_KEY>"

# 在本仓库根目录执行（读取 ./server.json）
mcp-publisher publish
```

### 4. 验证与后续更新

```bash
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=com.rooquiz/rooquiz-mcp"
```

- 更新元数据 / 发新版：改 `server.json`（`version` 递增）后重新 `login` + `publish`
- `server.json` 的 `version` 与代码里 `SERVER_INFO.version`（`rooquiz-payload/src/app/api/mcp/route.ts`）保持同步
- `description` 有 **100 字符**上限，改文案时注意

### 备选：HTTP 验证

不想动 DNS 的话，可在 `https://rooquiz.com/.well-known/mcp-registry-auth` 提供纯文本 `v=MCPv1; k=ed25519; p=<BASE64_PUBLIC_KEY>`（需要在 rooquiz-web 加一条静态路由），然后 `mcp-publisher login http --domain "rooquiz.com" ...`。DNS 方式不用改代码，优先 DNS。

---

## A. 提交 Glama Connector

Glama 对「已部署的远程 MCP」走 connectors 通道，不要求开源。

提交清单：

1. 用能代表 rooquiz org 的 GitHub 账号登录 [glama.ai](https://glama.ai)（提交账号即 listing 归属）
2. 到 [glama.ai/mcp/connectors](https://glama.ai/mcp/connectors) → **Add MCP Server → Connector**
3. 表单填写：
   - **Name**: `RooQuiz`
   - **Endpoint**: `https://payload.rooquiz.com/api/mcp`
   - **Description**（可比 server.json 更长，参考）：
     > Create and manage quizzes, question banks, and translations; capture and manage leads, respondents, and bookings; and pull stats and funnel analytics on RooQuiz — a lightweight assessment platform for lead capture and viral sharing.
   - **测试凭证：留空**——服务端支持 OAuth 2.1 动态客户端注册，Glama 会自动注册客户端做健康检查
4. 提交后等自动健康检查：**只有 healthy 的 connector 会被索引**，不健康会停在 pending

关于 [`glama.json`](glama.json)：connector 通道用不到它（归属 = 提交账号）。它的作用是认领 Glama **开源 servers 目录**里的 listing——本仓库在 org 名下，org 仓库无法靠 GitHub 登录自动关联，只能靠根目录的 `glama.json`（`maintainers` 填 GitHub 用户名）。改动后需在 Glama 上重走一次 Claim ownership 流程才会被拾取。

排障提示：

- 若长期 pending，先检查 Glama 探测是否被限流挡掉（`enforceRateLimits`，KV 限流）——DCR 注册 + initialize 频率不高，正常不会触发，但被 429 会直接判不健康
- 发现链路自查（本手册顶部表格的三个 URL）：401 必须带 `WWW-Authenticate`，两个 well-known 必须可匿名访问

---

## 安全注意

- `key.pem` / 私钥 hex 只进密码管理器，不进 git、不进 CI 日志
- 域名验证私钥泄露 = 任何人可以用 `com.rooquiz/*` 命名空间发布假服务，泄露后立即轮换（删旧 TXT → 重新生成 → 加新 TXT）
