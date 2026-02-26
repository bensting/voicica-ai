# Neon PostgreSQL → Cloudflare D1 迁移方案

> 目标：将数据库从 Neon PostgreSQL 迁移到 Cloudflare D1，消除 CF Worker 到 Neon 的跨网络延迟。

## 一、现状

```
用户 → CF Worker（边缘） ──跨公网──→ Neon PostgreSQL（单区域）
                           ↑ 瓶颈：每次查询 50-200ms
```

- **部署平台**：Cloudflare Workers（OpenNext 适配器）
- **ORM**：Drizzle ORM（`drizzle-orm/neon-http`）
- **数据库**：Neon Serverless PostgreSQL
- **表数量**：28 张
- **Schema 文件**：`src/db/schema.ts`（889 行）
- **DB 客户端**：`src/lib/db.ts`

## 二、迁移后架构

```
用户 → CF Worker（边缘） → D1 读副本（同机房） → 响应
                              ↑ 延迟 < 10ms
```

## 三、需要改动的内容清单

### 3.1 Schema 类型转换（`src/db/schema.ts`）

| PostgreSQL 类型 | 涉及字段 | D1/SQLite 方案 |
|---|---|---|
| `creditsNumeric` (numeric 12,4) | credits、monthlyCredits、amount 等 8 处 | `real` — 精度够用（积分不需要极高精度） |
| `numeric(18,6)` | usdtBalance、usdtAmount、rate、fee 等 6 处 | `text` — 存为字符串，应用层用 JS 计算 |
| `jsonb()` | subscriptionHistory.metadata、userEvents.data | `text` — 存 JSON 字符串 |
| `json()` | voices.tags/styleList、taskQueue.payload 等 | `text` — 存 JSON 字符串 |
| `timestamp(withTimezone)` | 全部表的 created_at、updated_at | `text` — 存 ISO 字符串（已经是 `mode: 'string'`） |
| `doublePrecision` | speed、duration 等 | `real` |
| `bigint` | fileSize、blockNumber | `integer` |
| `serial` | 自增 ID | `integer` + `primaryKey({ autoIncrement: true })` |

**核心改动**：

```typescript
// Before (pg-core)
import { pgTable, serial, varchar, ... } from "drizzle-orm/pg-core"

// After (sqlite-core)
import { sqliteTable, integer, text, real, ... } from "drizzle-orm/sqlite-core"
```

自定义类型改动：
```typescript
// Before — creditsNumeric
const creditsNumeric = customType<{ data: number; driverData: string }>({
  dataType() { return 'numeric(12,4)'; },
  fromDriver(value: string): number { return Number(value); },
});

// After — 直接用 real
// 积分字段改为 real("credits")
```

USDT 金额字段改动：
```typescript
// Before
usdtBalance: numeric("usdt_balance", { precision: 18, scale: 6 })

// After — 存为文本，保留完整精度
usdtBalance: text("usdt_balance").default('0').notNull()
```

### 3.2 DB 客户端（`src/lib/db.ts`）

```typescript
// Before
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// After
import { drizzle } from 'drizzle-orm/d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    const { env } = await getCloudflareContext();
    _db = drizzle(env.DB, { schema });
  }
  return _db;
}
```

### 3.3 Drizzle 配置（`drizzle.config.ts`）

```typescript
// Before
export default defineConfig({
  dialect: 'postgresql',
  ...
});

// After
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
```

### 3.4 Wrangler D1 绑定（`wrangler.jsonc`）

```jsonc
{
  // 现有配置...
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "voicica-db",
      "database_id": "<创建后填入>"
    }
  ]
}
```

### 3.5 依赖变更（`package.json`）

```diff
- "@neondatabase/serverless": "^1.0.2"
+ // 不需要额外安装，drizzle-orm 已内置 d1 支持
```

## 四、需要手动改写的 SQL 查询

### 4.1 `::numeric` 类型转换（3 处）

**文件：`src/actions/conversion.ts:62`**
```typescript
// Before
usdtBalance: sql`${users.usdtBalance}::numeric + ${usdtReceived}::numeric`

// After — USDT 改为 text 存储，用 CAST
usdtBalance: sql`CAST(CAST(${users.usdtBalance} AS REAL) + CAST(${usdtReceived} AS REAL) AS TEXT)`
```

**文件：`src/actions/withdrawal.ts:84,89`**
```typescript
// Before
usdtBalance: sql`${users.usdtBalance}::numeric - ${amount}::numeric`
sql`${users.usdtBalance}::numeric >= ${amount}::numeric`

// After
usdtBalance: sql`CAST(CAST(${users.usdtBalance} AS REAL) - CAST(${amount} AS REAL) AS TEXT)`
sql`CAST(${users.usdtBalance} AS REAL) >= CAST(${amount} AS REAL)`
```

### 4.2 递归 CTE + FILTER（1 处）

**文件：`src/actions/referral.ts:129-142`**
```sql
-- Before (PostgreSQL)
WITH RECURSIVE team AS (
  SELECT user_id, 1 as depth FROM users WHERE referred_by = ${userId}
  UNION ALL
  SELECT u.user_id, t.depth + 1 FROM users u
  INNER JOIN team t ON u.referred_by = t.user_id
  WHERE t.depth < 10
)
SELECT
  COUNT(*) FILTER (WHERE depth = 1)::text AS l1,
  COUNT(*) FILTER (WHERE depth = 2)::text AS l2,
  COUNT(*) FILTER (WHERE depth >= 3)::text AS l3_plus
FROM team

-- After (SQLite) — CTE 本身支持，FILTER 改为 SUM(CASE)
WITH RECURSIVE team AS (
  SELECT user_id, 1 as depth FROM users WHERE referred_by = ${userId}
  UNION ALL
  SELECT u.user_id, t.depth + 1 FROM users u
  INNER JOIN team t ON u.referred_by = t.user_id
  WHERE t.depth < 10
)
SELECT
  CAST(SUM(CASE WHEN depth = 1 THEN 1 ELSE 0 END) AS TEXT) AS l1,
  CAST(SUM(CASE WHEN depth = 2 THEN 1 ELSE 0 END) AS TEXT) AS l2,
  CAST(SUM(CASE WHEN depth >= 3 THEN 1 ELSE 0 END) AS TEXT) AS l3_plus
FROM team
```

### 4.3 `sql.raw()` 动态表名（7 处）

**文件：`src/actions/admin/stats.ts:91-96`**
```typescript
// Before — sql.raw() 拼接表名
db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`))
db.execute(sql`SELECT DATE(created_at) as date, COUNT(*) ...`)

// After — 白名单校验 + sql.raw()（D1 的 drizzle 也支持 sql.raw）
// sql.raw() 在 D1 驱动下依然可用，保持不变
// DATE() 改为 date()（SQLite 原生支持）
db.execute(sql`... date(created_at) as date ...`)
```

### 4.4 `ilike` 搜索（~20 处，全在 admin 后台）

```typescript
// Before — PostgreSQL ilike
ilike(users.email, `%${search}%`)

// After — Drizzle 的 SQLite 适配器会自动将 ilike 映射为 LIKE
// SQLite 的 LIKE 对 ASCII 默认不区分大小写，大部分场景兼容
// 改为用 like 即可
like(users.email, `%${search}%`)
```

**涉及文件**（批量替换 `ilike` → `like`）：
- `src/actions/native-payment.ts` (1 处)
- `src/actions/admin/conversions.ts` (1 处)
- `src/actions/admin/dialogue-records.ts` (3 处)
- `src/actions/admin/image-records.ts` (3 处)
- `src/actions/admin/music-records.ts` (4 处)
- `src/actions/admin/tts-records.ts` (3 处)
- `src/actions/admin/users.ts` (5 处)
- `src/actions/admin/video-records.ts` (2 处)
- `src/actions/admin/video-download-records.ts` (3 处)
- `src/actions/admin/voices.ts` (2 处)
- `src/actions/admin/withdrawals.ts` (3 处)

### 4.5 索引定义调整

```typescript
// Before — PostgreSQL 特有的 .nullsLast().op("text_ops")
index("ix_xxx").using("btree", table.userId, table.createdAt.asc().nullsLast().op("text_ops"))

// After — SQLite 简化
index("ix_xxx").on(table.userId, table.createdAt)
```

## 五、DB 调用方式变更

当前所有 action 文件直接 `import db from '@/lib/db'` 同步获取。
迁移后需要改为异步获取（因为 CF 环境需要 `getCloudflareContext()`）。

**两种方案**：

### 方案 A：全局异步函数（推荐）

```typescript
// src/lib/db.ts
export async function getDb() { ... }

// 每个 action 文件
import { getDb } from '@/lib/db';

export async function someAction() {
  const db = await getDb();
  return db.select().from(users)...
}
```

**改动量**：所有 action 文件头部加一行 `const db = await getDb()`。
可以用脚本批量替换。

### 方案 B：中间件预初始化

在请求入口预初始化 db 实例，通过 AsyncLocalStorage 传递。
复杂度更高，不推荐。

## 六、数据迁移脚本

```bash
# 1. 创建 D1 数据库
wrangler d1 create voicica-db

# 2. 通过 Drizzle 生成 D1 表结构
npx drizzle-kit generate
npx drizzle-kit migrate

# 3. 运行数据迁移脚本（Node.js）
node scripts/migrate-neon-to-d1.js
```

迁移脚本核心逻辑：
```javascript
// scripts/migrate-neon-to-d1.js
// 1. 连接 Neon，逐表读取数据
// 2. 类型转换：
//    - numeric(18,6) 值保持字符串形式写入 D1 text 列
//    - jsonb 值 JSON.stringify 后写入 D1 text 列
//    - timestamp 值保持 ISO 字符串
// 3. 批量 INSERT 到 D1（每批 100 条，D1 限制）
// 4. 校验行数一致
```

## 七、执行步骤

### Phase 1：Schema + 驱动（第 1 天）
- [ ] 创建 D1 数据库，获取 database_id
- [ ] `wrangler.jsonc` 添加 D1 绑定
- [ ] `src/db/schema.ts`：`pgTable` → `sqliteTable`，类型全部转换
- [ ] `src/lib/db.ts`：neon-http → d1 驱动
- [ ] `drizzle.config.ts`：dialect 改为 sqlite
- [ ] `package.json`：移除 `@neondatabase/serverless`

### Phase 2：查询改写（第 2 天）
- [ ] 全局替换 `ilike` → `like`（~30 处）
- [ ] `conversion.ts`：去掉 `::numeric` 转换（2 处）
- [ ] `withdrawal.ts`：去掉 `::numeric` 转换（2 处）
- [ ] `referral.ts`：`FILTER` → `SUM(CASE WHEN)`（1 处）
- [ ] `admin/stats.ts`：`DATE()` → `date()`（2 处）
- [ ] 索引定义去掉 `.nullsLast().op()`

### Phase 3：异步 DB 适配（第 3 天）
- [ ] `src/lib/db.ts` 改为 `getDb()` 异步函数
- [ ] 所有 action 文件批量替换 `db` → `await getDb()`
- [ ] 编译通过，类型检查无误

### Phase 4：数据迁移（第 4 天）
- [ ] 编写 `scripts/migrate-neon-to-d1.js` 迁移脚本
- [ ] 本地测试迁移（小数据集）
- [ ] 执行正式迁移
- [ ] 校验数据完整性（行数、关键字段抽样对比）

### Phase 5：测试验证（第 5 天）
- [ ] 核心流程测试：登录 → TTS 生成 → 查看作品
- [ ] 金额流程测试：积分消耗 → 兑换 USDT → 提现
- [ ] 推荐系统测试：邀请码 → 团队层级 → 提成计算
- [ ] Admin 后台测试：搜索 → 统计 → 数据列表
- [ ] 性能对比：记录迁移前后的页面加载时间

### Phase 6：上线切换
- [ ] 部署到 CF Workers（D1 绑定）
- [ ] 观察监控，确认无异常
- [ ] 保留 Neon 数据库 7 天作为回滚备份
- [ ] 确认无误后关闭 Neon

## 八、风险点与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| USDT 精度丢失 | 金额计算不准确 | 改为 text 存储 + JS 层计算，不用 SQLite 浮点 |
| D1 写入并发限制 | 高并发写可能排队 | 目前用户量小，不构成问题；后续可加 Queue 缓冲 |
| D1 单库 10GB 上限 | 数据增长后可能触顶 | 定期清理过期数据（匿名用户、旧任务记录） |
| 递归 CTE 性能差异 | 团队层级查询变慢 | SQLite CTE 对小数据集性能OK，加深度限制已有 |
| ilike → like 行为差异 | Unicode 搜索可能不同 | Admin 后台搜索为主，影响有限 |

## 九、预期收益

| 指标 | 迁移前 (Neon) | 迁移后 (D1) |
|------|--------------|-------------|
| 读查询延迟 | 50-200ms | < 10ms |
| 冷启动连接 | 100-300ms | 0ms |
| 页面数据加载 | 300-600ms | 50-100ms |
| 全球访问一致性 | 取决于 Neon 区域 | 边缘节点就近读取 |
