# AI 素材箱 V0.1

一个本地运行的 AI 知识卡片生成 MVP。支持文本、图片、链接三类输入，经过 Provider 抽象后的 OCR / LLM 流程生成草稿卡片，用户确认后保存到自己的知识库。

## 功能

- 邮箱密码注册、登录、退出
- 首次登录 onboarding
- 文本输入、图片上传、链接抓取
- Mock OCR / Mock LLM / Local Storage
- 草稿确认、保存、编辑、软删除
- 知识库搜索、筛选、排序
- UsageLedger 用量记录
- 模型路由、Prompt 模板、zod 校验与 JSON 修复兜底

## 技术栈

- Next.js 14
- React + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Docker Compose

## 本地启动

1. 复制环境变量：

```bash
cp .env.example .env
```

2. 将 `.env` 中 `DATABASE_URL` 设置为：

```bash
postgresql://postgres:postgres@localhost:5432/ai_material_box
```

并设置一个本地 `NEXTAUTH_SECRET`。

3. 启动 PostgreSQL：

```bash
docker compose up -d
```

4. 安装依赖：

```bash
npm install
```

5. 生成 Prisma Client 并执行迁移：

```bash
npm run db:generate
npm run db:migrate
```

6. 可选：写入演示账号：

```bash
npm run db:seed
```

演示账号：`demo@example.com` / `demo123456`

7. 启动开发服务：

```bash
npm run dev
```

访问 `http://localhost:3000`

## 目录结构

```text
src/
  app/
  components/
  lib/
    auth/
    db/
    providers/
    services/
    prompts/
    validators/
prisma/
uploads/temp/
```

## Provider 设计

- OCR：`MockOCRProvider`、预留 `TencentOCRProvider`
- LLM：`MockLLMProvider`、`OpenAICompatibleProvider`
- Storage：`LocalStorageProvider`

所有业务流程通过 Provider 接口调用，不直接绑定某个厂商实现。

## 接入 DeepSeek V4

当前项目已经可以通过 `OpenAICompatibleProvider` 接 DeepSeek API。将 `.env` 中相关变量改为：

```bash
LLM_PROVIDER=openai-compatible
LLM_API_KEY=你的_DeepSeek_API_Key
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-v4-flash

LLM_SMALL_MODEL=deepseek-v4-flash
LLM_MEDIUM_MODEL=deepseek-v4-flash
LLM_LARGE_MODEL=deepseek-v4-pro
LLM_VISION_MODEL=deepseek-v4-pro
```

推荐起步配置：

- `small / medium` 用 `deepseek-v4-flash`
- `large` 用 `deepseek-v4-pro`
- 当前图片流程默认先 OCR 再走文本模型；只有后续显式启用视觉任务时才会走 `vision`

## 接入腾讯云 OCR

将 `.env` 改为：

```bash
OCR_PROVIDER=tencent
TENCENT_OCR_SECRET_ID=你的_SecretId
TENCENT_OCR_SECRET_KEY=你的_SecretKey
TENCENT_OCR_REGION=ap-guangzhou
OCR_MONTHLY_FREE_QUOTA=1000
OCR_USAGE_WARNING_THRESHOLD=800
OCR_USAGE_CRITICAL_THRESHOLD=950
IMAGE_OCR_MIN_CONFIDENCE=0.55
IMAGE_OCR_MIN_CHARS=20
```

当前实现使用腾讯云 `GeneralBasicOCR`。每次成功调用后都会写入 `UsageLedger`，并在 `/usage` 与 `/settings` 展示本月 OCR 已用量、剩余额度和提醒状态。

## 微信公众号链接策略

公众号链接会按以下顺序处理：

1. 优先使用本地 `wechat-article-for-ai` 工具将文章转换为 Markdown
2. Markdown 抽取失败时，自动渲染整页截图并交给 OCR 识别
3. 如果截图 OCR 也失败，则生成待读链接卡，并提示用户使用公众号自带的下载截图功能后上传图片

本地工具路径可通过以下环境变量配置：

```bash
WECHAT_ARTICLE_PYTHON=/path/to/python
WECHAT_ARTICLE_TOOL_DIR=/path/to/wechat-article-for-ai
WECHAT_SCREENSHOT_OCR_MIN_CONFIDENCE=0.85
WECHAT_SCREENSHOT_OCR_ATTEMPTS=2
```

截图 OCR 会做质量门槛判断；当页面渲染出乱码字形、OCR 置信度不足或文本质量过低时，不会生成低质量卡片，而会继续退化为待读链接卡。

## 个人微信实验入口

个人微信自动化不适合作为正式产品依赖，但可以先用本地桥接方式试效果。任何个人微信 bot / 桌面自动化脚本只要把收到的消息 POST 到接口即可：

```text
POST /api/inbox/wechat-personal
Authorization: Bearer <WECHAT_PERSONAL_WEBHOOK_TOKEN>
Content-Type: application/json

{
  "sender": "微信昵称或备注",
  "text": "用户发来的文本或公众号链接",
  "receivedAt": "2026-05-19T00:00:00.000Z"
}
```

本地配置：

```bash
WECHAT_PERSONAL_WEBHOOK_TOKEN=本地共享密钥
WECHAT_PERSONAL_DEFAULT_USER_EMAIL=demo@example.com
WECHAT_PERSONAL_ENDPOINT=http://127.0.0.1:3000/api/inbox/wechat-personal
```

本地模拟一条个人微信消息：

```bash
npm run wechat:personal:test -- "这是一条从个人微信入口转发来的测试消息"
```

如果消息里包含 URL，系统会按链接素材处理；没有 URL 时会按文本素材处理。后续接真实个人微信时，只需要让适配器调用这个接口。

## 当前边界

- 图片默认只做临时存储，不转永久文件
- 链接类仅保存 URL 与 AI 总结，不保存全文
- 第一版仅使用 `draft / saved / deleted`
- 微信、小程序、支付、会员、分享、市场等能力只保留数据结构与扩展位，暂未实现
