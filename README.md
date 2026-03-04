# apifox-mcp（私有接口版）

基于 TypeScript + MCP SDK 的 Apifox 私有部署 MCP Server（stdio），支持：
1. `get_api_by_id`
2. `get_api_by_path`
3. `create_api`（默认 dry-run）
4. `update_api`（全量对象更新，默认 dry-run）

## 设计约束

1. 仅私有接口适配器（不使用官方 OpenAPI adapter）。
2. 鉴权使用邮箱密码自动登录（请求体使用 `account + password`），不处理 SSO-only。
3. 默认分支 `APIFOX_BRANCH_ID=0`，支持环境变量覆盖。
4. MCP 传输仅 `stdio`。

## 环境变量

参考 `.env.example`：

```bash
APIFOX_BASE_URL=https://api.dev.longbridge-inc.com
APIFOX_PROJECT_ID=345101
APIFOX_EMAIL=your-email@example.com
APIFOX_PASSWORD=your-password
APIFOX_LOCALE=zh-CN
APIFOX_BRANCH_ID=0
APIFOX_CLIENT_VERSION=2.7.2
APIFOX_CLIENT_MODE=web
APIFOX_LOGIN_USE_LDAP=false
```

## 本地运行

```bash
pnpm install
pnpm test
pnpm dev
```

## 构建

```bash
pnpm build
pnpm start
```

## Tool 说明

### 1) get_api_by_id

输入：

```json
{
  "apiId": 123,
  "includeRaw": false
}
```

### 2) get_api_by_path

输入：

```json
{
  "path": "/users/{id}",
  "method": "GET",
  "strict": true
}
```

### 3) create_api

输入：

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

执行规则：仅当 `dryRun=false` 且 `confirm=true` 才真实写入。

### 4) update_api

输入：

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

执行规则：仅当 `dryRun=false` 且 `confirm=true` 才真实写入。

## 安全策略

1. 写操作默认 dry-run。
2. `confirm=true` 且 `dryRun=false` 双条件才执行。
3. 登录失败、接口失败会返回 MCP `isError` 结果。

## 测试覆盖

当前测试覆盖：
1. 环境变量解析与默认值。
2. payload 序列化。
3. 响应标准化映射。
4. service 查询/创建/更新（含 dry-run）。
5. 登录缓存与强制刷新。
6. 客户端头注入与 401 重试。

## 风险说明

1. 私有接口字段可能随部署版本变化。
2. 登录接口参数可能因组织登录策略调整而变化。
3. 当前方案假设邮箱密码登录可用。
