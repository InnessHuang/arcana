# DeepSeek 初始解读

需要 Node.js 24 和 npm。现有首页、抽牌与两个演示探索入口保持原有结构。

## Windows 本地配置

在项目目录的 PowerShell 中执行：

```powershell
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
notepad .env.local
```

仅在本地编辑器中为 `DEEPSEEK_API_KEY` 填入从 DeepSeek 控制台取得的密钥。不要在聊天、提示词、截图或 Git 中分享密钥。不要添加 `NEXT_PUBLIC_` 前缀。`.env.local` 已被 `.gitignore` 的 `.env*` 规则忽略；可用 `git check-ignore .env.local` 确认。

默认 `DEEPSEEK_MODEL=deepseek-chat`，`DEEPSEEK_BASE_URL=https://api.deepseek.com`。支持官方 HTTPS `/v1` 路径，不允许跳转或第三方地址。若供应商更改模型可用性，按账户支持情况调整模型名称。配置改动后重启 Next.js：

```powershell
npm ci --cache "$env:LOCALAPPDATA\npm-cache"
npm run dev
```

生产运行使用 `npm run build` 后 `npm run start`。环境变量同样只在服务端设置；密钥不参与前端编译。不要覆盖已有 `.env.local`。

## 调用与数据

`POST /api/reading` → 验证原问题、背景、风格、牌阵及牌库 → 服务端原生 fetch 请求 `/chat/completions` → 验证 JSON 及逐牌对应 → 返回安全的结构化解读。

用户先抽牌，再点击“生成 AI 初始解读”。默认由 AI 推荐风格；明确选择优先。生成后切换风格会发起新的付费 API 请求，保留原问题、背景和牌面。自动重试关闭，避免重复计费。刷新保留牌面但不自动发起 API 请求，也不持久保存 AI 输出。

问题、明确背景、牌面与牌义会发送给 DeepSeek。本站没有数据库，不记录请求正文、密钥或上游错误；运营平台及供应商的数据处理政策需单独确认。结果为 AI 生成的象征性解读，不是事实证明或预测。深入探索和现实探索仍使用本地演示模板，不调用模型。

服务端集中参数：45 秒超时、temperature 0.6、max_tokens 4000、非流式、JSON object 模式。模型输出仍须通过 Zod Schema，并核对所有 cardId、正逆位、牌位、顺序与选择风格。错误分为输入、配置、认证/余额、限流、超时、服务异常及格式异常；均不静默回退到模板。响应 no-store，上游错误正文不暴露。

接口目前没有账号或持久化配额控制，仅用于本地 MVP；未部署。向公网开放前需单独设计访问控制和费用配额，不应直接公开携带服务端付费凭据的匿名接口。

## 无额度测试

```powershell
npm run lint
npm run typecheck
npm run build
npm exec --yes --package=tsx -- tsx --test tests/*.test.ts
```

API 测试全部注入模拟 fetch，不使用真实密钥，不访问 DeepSeek。首次真实验证需在本地安全配置环境变量后手动执行。没有配置密钥时返回 503，页面明确提示，绝不显示伪造成功。
