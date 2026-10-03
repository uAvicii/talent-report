# 知途 · 天赋事业报告

参考用户提供的宣传图复刻业务介绍与预约逻辑，UI 重新设计。临时品牌「知途」可在配置中更换。

## 技术与运行

- React 19 + TypeScript，采用 Vinext / Vite 构建，兼容 Next.js App Router 文件结构。
- 原生 CSS 自定义主题；Radix Dialog 处理弹窗、焦点约束与 Escape 关闭。
- Cloudflare D1 保存预约意向，服务端验证字段与信息使用同意；UUID 用于重复提交去重。
- 环境：Node.js 22.13+（建议 Node.js 24）。

```bash
npm ci
npm run dev
```

本地默认打开 http://127.0.0.1:5173/ 。

## 后续维护

| 要修改的内容 | 文件 |
| --- | --- |
| 品牌、价格、问题、FAQ、示例内容 | `lib/site-content.ts` |
| 页面结构、预约弹窗、状态 | `app/page.tsx` |
| 配色、字号、间距、响应式 | `app/globals.css` |
| 网页标题、描述与语言 | `app/layout.tsx` |
| 浏览器图标 | `public/favicon.svg` |
| 预约数据字段 | `db/schema.ts` |
| 预约接口及校验 | `app/api/reservations/route.ts` |

主题变量位于 CSS 顶部：`--ink` 深墨绿、`--accent` 亮青绿、`--muted` 次要文字、`--line` 分隔线、`--surface` 区块底色。
价格与主要时长集中配置；修改交付天数、咨询时长后，也同步调整 steps / faqs 中的流程说明和页面元信息。

## 数据库与本地验证

生产数据库由 Sites 根据 `.openai/hosting.json` 中的 `d1: "DB"` 配置提供。已生成的迁移在 `drizzle/`，发布时应用。

先构建，再初始化本地数据库：

```bash
npm run build
npx wrangler d1 execute DB --local --persist-to .wrangler/state --config dist/server/wrangler.json --file drizzle/0000_nervous_impossible_man.sql
npm run dev
```

修改 schema 后运行 `npm run db:generate`，检查新迁移后再发布。已应用的迁移不要重写。
生产预约可通过 Sites 数据库工具查看 `reservations` 表，暂未添加公开管理后台或列表接口。字段包括称呼、联系方式、阶段、问题、登记时间、处理状态。状态初始值 `pending_contact` 表示待人工联系。

## 已完成的体验

- 桌面与手机响应式布局，手机底部预约入口。
- 8 个问题展开阅读、3 类报告示例切换、FAQ。
- 预约填写、必填校验、保存中、失败重试、成功编号。
- 对无同意、无效字段、跨域来源的请求进行验证；重复 UUID 不重复新增。

## 当前业务边界

这是业务展示与预约登记系统，不包含自动生成真实个人报告、在线支付、短信通知、微信通知或人员分配。预约成功代表资料保存，不代表付款完成或工作人员已收到通知。
商户信息未提供，因此采用「预约 → 人工确认服务与付款 → 收集个人资料 → 人工出具报告与咨询」的流程。要启用实际购买，需要接入自己的支付商户并验证支付回调。
报告示例为结构演示，不是个人测评结果。原图中关于样本规模、预测时期等宣传无法验证，没有作为事实承诺发布。服务文案、交付时间与内测政策上线经营前应按实际情况确认。

## 验证记录

- TypeScript 检查通过，生产构建通过。
- 本地页面返回 200，报告示例切换正常。
- 本地表单保存成功，返回登记编号；未勾选同意的接口请求返回 400。
- 检查桌面与 390px 手机视口，未发现水平溢出。
- 在线版本默认私有，仅账户所有者可访问；本地测试数据没有上传到生产库。
