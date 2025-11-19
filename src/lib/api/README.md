# API 模块组织结构

统一的 API 调用模块，使用 `apiClient` 进行统一管理。

## 文件结构

```
src/lib/api/
├── client.ts          # API 客户端基础配置（拦截器、认证）
├── user.ts            # 用户相关 API
├── voice.ts           # 语音相关 API
├── subscription.ts    # 订阅相关 API
├── tts.ts            # TTS 相关 API
├── enums.ts          # 枚举值 API
├── index.ts          # 统一导出
└── README.md         # 本文档
```

## 使用方式

### 方式一：按模块导入（推荐）

```typescript
import { userAPI, voiceAPI, subscriptionAPI, ttsAPI, enumsAPI } from '@/lib/api';

// 用户 API
const user = await userAPI.getCurrentUser();
await userAPI.updateProfile({ name: 'John' });

// 语音 API
const voices = await voiceAPI.getVoices({ provider: 'openai' });

// 订阅 API
const subscription = await subscriptionAPI.getSubscription();
const plans = await subscriptionAPI.getPlans();

// TTS API
const records = await ttsAPI.queryTtsRecords({ page: 1 });
await ttsAPI.deleteTtsRecord('record-id');

// 枚举 API
const countries = await enumsAPI.getCountries();
```

### 方式二：直接导入函数

```typescript
import { getCurrentUser, updateProfile } from '@/lib/api/user';
import { getVoices } from '@/lib/api/voice';
import { queryTtsRecords, deleteTtsRecord } from '@/lib/api/tts';

const user = await getCurrentUser();
const voices = await getVoices();
const records = await queryTtsRecords();
```

### 方式三：使用 apiClient（低级 API）

```typescript
import { apiClient } from '@/lib/api';

// 自定义请求
const data = await apiClient.get('/api/v1/custom-endpoint');
await apiClient.post('/api/v1/custom-endpoint', { data: 'value' });
```

## API 客户端特性

### 自动认证
所有请求自动添加 Firebase ID Token：
```typescript
Authorization: Bearer <firebase-id-token>
```

### 统一错误处理
- **401 未授权**：自动跳转到登录页
- **其他错误**：统一日志记录

### 请求拦截器
自动为所有请求添加认证头。

### 响应拦截器
处理常见的 HTTP 错误状态码。

## 各模块 API 列表

### User API (`@/lib/api/user`)
- `getCurrentUser()` - 获取当前用户资料
- `updateProfile(data)` - 更新用户资料
- `getCredits()` - 获取用户积分

### Voice API (`@/lib/api/voice`)
- `getVoices(params)` - 获取语音列表
- `createVoice(data)` - 创建语音模型

### Subscription API (`@/lib/api/subscription`)
- `getSubscription()` - 获取订阅信息
- `createSubscription(data)` - 创建订阅
- `getPlans(params)` - 获取订阅计划列表
- `createStripeCheckout(data)` - 创建 Stripe Checkout 会话
- `verifyStripePayment(data)` - 验证 Stripe 支付
- `getStripePrices(productId)` - 获取 Stripe 产品价格
- `getMySubscriptions(params)` - 获取用户订阅列表
- `cancelSubscription(subscriptionId, data)` - 取消订阅

### TTS API (`@/lib/api/tts`)
- `queryTtsRecords(params)` - 查询 TTS 记录
- `deleteTtsRecord(recordId)` - 删除 TTS 记录
- `batchDeleteTtsRecords(recordIds)` - 批量删除 TTS 记录
- `downloadAudio(audioUrl, filename)` - 下载音频文件
- `convertTtsRecordToGeneration(record)` - 转换记录格式
- `getStatusLabel(status)` - 获取状态标签
- `getStatusColor(status)` - 获取状态颜色

### Enums API (`@/lib/api/enums`)
- `getCountries()` - 获取国家代码列表

## 迁移指南

如果你的代码使用了旧的 `@/services/api`，请按以下方式迁移：

```typescript
// 旧代码
import { apiClient, userAPI } from '@/services/api';

// 新代码
import { apiClient, userAPI } from '@/lib/api';
```

旧的 `@/services/api` 已被标记为 `@deprecated`，但仍然可用以保持向后兼容。

## 添加新的 API

### 1. 创建新的 API 模块文件

```typescript
// src/lib/api/example.ts
import { apiClient } from './client';

export const getExample = () => {
  return apiClient.get('/api/v1/example');
};

export const createExample = (data: unknown) => {
  return apiClient.post('/api/v1/example', data);
};
```

### 2. 在 index.ts 中导出

```typescript
// src/lib/api/index.ts
export * as exampleAPI from './example';
```

### 3. 使用新的 API

```typescript
import { exampleAPI } from '@/lib/api';

const example = await exampleAPI.getExample();
```

## 最佳实践

1. **使用模块化导入**：优先使用 `import { userAPI } from '@/lib/api'` 而不是直接导入函数
2. **类型安全**：为所有 API 函数添加 TypeScript 类型
3. **错误处理**：使用 try-catch 捕获 API 错误
4. **避免重复代码**：使用 apiClient 封装通用的请求逻辑
5. **按功能模块组织**：相关的 API 放在同一个文件中

## 环境变量

API 基础 URL 通过环境变量配置：

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

如果未设置，默认使用 `http://localhost:8000`。