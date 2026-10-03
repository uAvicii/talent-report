# 知途 · 即时天赋事业报告

React + TypeScript 前端（Vinext / Vite，兼容 Next.js App Router），原生 CSS 主题。流程为：任意浏览器提交资料 → 本地 image-bridge 服务队列 → 原有 Image Bridge 插件操作已登录 ChatGPT → 回传本地服务 → 当前页面显示报告。

## 日常使用

报告页面可在 Edge、Chrome 或 Codex 内置浏览器中打开，不需要安装插件。执行 ChatGPT 的浏览器保留原 Image Bridge 插件并保持登录即可。它们通过同一台电脑的本地工作台通信。

1. 启动 `C:/Users/Lenovo/Documents/demo/image-bridge/server.py`。要求 Python 3.9+。
2. 在 `chrome://extensions` 重新加载原来的 `C:/Users/Lenovo/Documents/demo/image-bridge/extension`，确认版本 0.1.5。保留原 `data/` 和配对码。
3. 打开 http://127.0.0.1:8765 ，复制配对码。插件选择「本地」，填配对码，开启「自动领取任务」，保存并连接。
4. 确认执行插件所在浏览器中 ChatGPT 已登录。在任意浏览器打开报告页面并刷新，点击「生成我的报告」，会自动检查本地服务和执行插件状态。填写资料，确认资料会提交给 ChatGPT 后提交。
5. 页面自动显示任务状态；完成后展示优势画像、8 个事业分析章节、4 周行动计划和需要验证的判断，可下载原文。

已部署页面：https://talent-path-studio.pepe0523pepe.chatgpt.site （访问权限保持原来的私有设置）。即使前端已部署，生成仍需要这台电脑上的桥接服务、插件与已登录的 ChatGPT。电脑离线时不会由云端自动执行。

## 本地开发

使用 Node.js 22.13+，建议 Node.js 24。

Windows 可直接双击项目根目录的 `start-local.cmd`。启动器会检查 Node.js 版本；如果系统默认版本过旧，会使用本机已有的 Codex Node.js 运行时。检测到关键依赖缺失时，会按锁文件重新安装依赖，然后启动 5173 端口。没有兼容运行时或 npm 时，会显示明确提示。启动窗口需保持运行。

```bash
npm ci
npm run dev
```

默认地址 http://127.0.0.1:5173 。桥接服务单独启动：

```bash
cd C:/Users/Lenovo/Documents/demo/image-bridge
python server.py
```

## 维护入口

| 修改内容 | 文件 |
| --- | --- |
| 品牌、原服务价格、问题、FAQ、流程说明 | `lib/site-content.ts` |
| 主页面结构与弹窗入口 | `app/page.tsx` |
| 资料表单、队列状态与报告展示 | `components/report-workflow.tsx` |
| 报告提示词、JSON 结构校验 | `lib/report-domain.mjs` |
| 前端与插件通信协议 | `lib/browser-bridge.ts` |
| 主题变量、排版、手机布局 | `app/globals.css` |
| 网页标题、描述、语言 | `app/layout.tsx` |

配色变量在 CSS 顶部：`--ink` 深墨绿、`--accent` 亮青绿、`--muted` 次要文字、`--line` 分隔线、`--surface` 区块底色。

## 共用插件的改动

原 image-bridge 文件已在原路径更新，不需要安装第二个扩展。其详细说明见原项目 `TALENT-REPORT.md`。

- `server.py` 的 `/api/report-client/*`：页面直接通过 HTTP 连接本地队列，创建/查询/取消其自身文本报告。
- `extension/report-page.js` 与 `extension/report-client.js`：保留旧版网页通信兼容；当前页面不再依赖它们。
- `extension/text-dom.js`：读取新助手回答，排除旧轮次及已标记的思考区，文字稳定后回传。
- `extension/content.js`：按 `outputType` 分别执行生图或文本任务。
- `server.py`：增加文本完成回传、客户端请求去重、协议能力与单任务心跳检测。

保留旧 `mode: text` 的「文生图」含义；新增 `outputType: text` 才代表文本报告。旧生图默认 `outputType: image`。两种输出共享同一个本地串行队列，同时只执行一个任务。原线上生图服务本次没有部署；报告功能要求选择本地。

任务保存在 image-bridge 的 `data/tasks.json`，结果来源于真实回传的 `text` 字段。网页的 sessionStorage 记住当前任务编号和随机客户端标识，刷新后只读取原任务。服务端签发绑定页面来源与客户端的报告凭据，仅允许创建文本任务及读取/取消自身任务，不能读取全局配对码、其他客户端报告或图片任务，也不能领取任务。全局配对码仍只在原工作台与插件之间使用。旧版直接插件创建的任务保留在工作台，其结果不会自动迁移到新的页面客户端。

本地服务明确允许 `http://127.0.0.1:5173`、`http://localhost:5173` 和当前部署域名访问报告接口。浏览器若弹出本地网络访问提示，需允许当前报告页面访问本机服务。跨浏览器使用指同一台电脑；其他电脑的 `127.0.0.1` 不指向这台机器。

断线后不会自动重新发送提示词。重试相同资料使用同一请求标识，防止重复建任务。取消停止结果回传，已提交给 ChatGPT 的生成可能继续。返回 JSON 与约定不同时，页面保留并显示原文，不伪造报告。内容以 React 文本方式渲染，不执行模型输出的 HTML 或脚本。

## 验证与限制

- TypeScript 检查及生产构建通过。
- 报告领域校验 2 项测试通过。
- image-bridge 服务端 28 项测试通过，覆盖跨浏览器 HTTP 完整回传、请求去重、页面来源和客户端隔离；报告 HTTP 客户端 5 项测试通过。
- 原项目完整 JS 测试有 1 项既有复古未来主义提示词长度失败，本次未修改相关网页代码。
- 已在未安装插件的 Codex 浏览器中验证直接 HTTP 连接及由另一浏览器的插件领取任务。

网站保留原服务报价作为展示信息，当前生成体验不收费，没有真实支付接口。30 分钟商业咨询需另行安排；即时执行仅指 AI 报告生成。报告根据用户自述提供探索建议，不是验证过的心理测评，也不能预测收入、运势或成功日期。

## 验证命令

```bash
node node_modules/typescript/bin/tsc --noEmit
node --test tests/report-domain.test.mjs
node --test tests/browser-bridge.test.mjs
npm run build
```

需要增加新部署域名时，在本地服务 `REPORT_ORIGINS` 中加入精确来源并重启服务。当前页面无需给扩展新增域名配置。不要将工作台配对码放进前端源码或公开环境变量。
