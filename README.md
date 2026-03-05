# selfhost-apifox-mcp

基于 TypeScript + MCP SDK 的 Apifox MCP Server（`stdio`）。

支持能力：

1. `get_api_by_id`：按 API ID 查询详情。
2. `get_api_by_path`：按 `path + method` 查询详情。
3. `create_api`：创建 API（默认 `dry-run`）。
4. `update_api`：全量对象更新 API（默认 `dry-run`）。

## MCP Server

### Using stdio Transport (Default)

以下配置方式适用于本地被宿主进程拉起的 MCP（Cursor / Claude Desktop / Claude Code），统一使用 `npx` 启动 npm 包。

### Cursor 配置

Cursor 官方文档支持项目级和全局级 MCP 配置：

1. 项目级：`.cursor/mcp.json`
2. 全局级：`~/.cursor/mcp.json`

可直接粘贴：

```json
{
  "mcpServers": {
    "selfhost-apifox-mcp": {
      "command": "npx",
      "args": ["-y", "selfhost-apifox-mcp@latest"],
      "env": {
        "APIFOX_BASE_URL": "{your-apifox-base-url}",
        "APIFOX_PROJECT_ID": "{your-apifox-project-id}",
        "APIFOX_EMAIL": "{your-apifox-email}",
        "APIFOX_PASSWORD": "{your-apifox-password}"
      }
    }
  }
}
```

### Claude Code 快捷安装

Claude Code 官方支持命令行直接添加 MCP。

```bash
claude mcp add selfhost-apifox-mcp \
  --transport stdio \
  --env APIFOX_BASE_URL={your-apifox-base-url} \
  --env APIFOX_PROJECT_ID={your-apifox-project-id} \
  --env APIFOX_EMAIL={your-apifox-email} \
  --env APIFOX_PASSWORD={your-apifox-password} \
  -- npx -y selfhost-apifox-mcp@latest
```

### Claude Desktop 配置

`claude_desktop_config.json` 示例：

```json
{
  "mcpServers": {
    "selfhost-apifox-mcp": {
      "command": "npx",
      "args": ["-y", "selfhost-apifox-mcp@latest"],
      "env": {
        "APIFOX_BASE_URL": "{your-apifox-base-url}",
        "APIFOX_PROJECT_ID": "{your-apifox-project-id}",
        "APIFOX_EMAIL": "{your-apifox-email}",
        "APIFOX_PASSWORD": "{your-apifox-password}"
      }
    }
  }
}
```

### 支持的环境变量参数

- APIFOX_BASE_URL: Apifox 基础 URL（必填）
- APIFOX_PROJECT_ID: Apifox 项目 ID（必填）
- APIFOX_EMAIL: Apifox 邮箱（必填）
- APIFOX_PASSWORD: Apifox 密码（必填）
- APIFOX_LOCALE: Apifox 语言（可选，默认 `zh-CN`）
- APIFOX_BRANCH_ID: Apifox 分支 ID（可选，默认 `0`）
- APIFOX_CLIENT_VERSION: Apifox 客户端版本（可选，默认 `2.7.2`）
- APIFOX_CLIENT_MODE: Apifox 客户端模式（可选，默认 `web`）
- APIFOX_LOGIN_USE_LDAP: Apifox 登录使用 LDAP（可选，默认 `false`）

## 设计

1. 仅私有接口适配器（不走官方 OpenAPI adapter）。
2. 鉴权使用邮箱密码自动登录。

## 本地开发

```bash
git clone https://github.com/Dearest/selfhost-apifox-mcp.git
cd selfhost-apifox-mcp
pnpm install
pnpm build
```

## 运行与验证

开发运行：

```bash
pnpm dev
```

质量检查：

```bash
pnpm check
pnpm test
pnpm build
```

## Tool 入参示例

### 1) get_api_by_id

```json
{
  "apiId": 123,
  "includeRaw": false
}
```

### 2) get_api_by_path

```json
{
  "path": "/users/{id}",
  "method": "GET",
  "strict": true
}
```

### 3) create_api

```json
{
  "payload": {
    "name": "创建用户",
    "path": "/users",
    "method": "POST",
    "parameters": [],
    "responses": []
  },
  "dryRun": true,
  "confirm": false
}
```

### 4) update_api

```json
{
  "apiId": 123,
  "payload": {
    "name": "查询用户",
    "path": "/users/{id}",
    "method": "GET",
    "parameters": [],
    "responses": []
  },
  "dryRun": true,
  "confirm": false
}
```

执行规则：

1. 写操作默认 `dry-run`。
2. 仅 `dryRun=false` 且 `confirm=true` 才会真实写入。

## 常见问题

1. 登录失败：确认账号可密码登录（非 SSO-only），并检查 `APIFOX_EMAIL/APIFOX_PASSWORD`。
2. 查询为空：确认 `APIFOX_PROJECT_ID`、`APIFOX_BRANCH_ID` 对应正确项目和分支。
3. 401 重试失败：检查账号是否失效或网络是否拦截私有域名。

## 参考文档

1. Cursor MCP 配置文档：[Cursor MCP](https://docs.cursor.com/context/model-context-protocol)
2. Claude Code MCP 配置文档：[Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp)
3. Claude Desktop + MCP 配置文档：[Connect local MCP servers](https://docs.claude.com/en/docs/claude-desktop/connect-local-mcp-servers)
