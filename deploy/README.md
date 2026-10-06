# report.pepehub.top：GitHub Actions + 现有 Docker Caddy

网站与报告接口：`https://report.pepehub.top`、`https://report.pepehub.top/api/report-client`。
仓库：`https://github.com/uAvicii/talent-report`。

## 分步选择题

生成入口已改为 10 题问卷：6 道单选各 8 项、4 道多选各 12 项，共 96 个选项。多选最多 3 项，“其他 / 暂不确定”类最后一项单独选择；可返回上一题、在核对页修改任意答案。昵称和最多 500 字的具体经历均为选填，无长文本必填。

未提交的回答存于当前域名、当前浏览器的 localStorage，刷新或重新打开表单可以继续；不同浏览器不共享。提交成功后清除问卷暂存。同意提交的勾选不会保存，恢复问卷时仍需主动确认。提交失败保留回答，不会自动重发；同一次表单内重试保留原 clientRequestId。

选择结果映射为原有六项资料，继续使用原生成接口和队列。提示词区分真实经历、自述优势、兴趣和工作偏好，未知选项作为信息缺口，不生成 MBTI 类型或心理分数；原八章报告、四周计划和 PDF 下载继续使用。只需发布本项目完整静态构建，无需更新执行插件或共享工作台后端。问卷暂存不是已生成报告的历史记录。

验证：20 项测试、新增模块 ESLint、TypeScript 与腾讯云生产构建通过。隔离浏览器验证逐题选择、多选上限与互斥、刷新恢复、核对修改、显式同意、提交失败后重试、成功清除暂存及原 PDF 下载；375px 和 320px 下问卷无横向溢出且可滚动选择。禁止 localStorage 时显示提示，仍可完成点选和提交。所有接口使用本地测试响应，没有提交真实生成任务。代码尚未发布线上。

## PDF 报告下载

报告下载直接生成 A4 纵向 PDF，包含完整画像、八个章节、四周行动及限制说明；未结构化结果保留全文导出。中文字体内嵌，文字可搜索、复制，页眉页码与正文分开排版；章节标题避免孤立在页尾，短周计划与验证标准保持在同页。完成及异常任务的会话查看链接已移除，恢复原会话读取功能保留。

此项修改只需发布本项目完整静态构建。发布时必须包含 `dist/tencent/fonts/` 的两个 WOFF2 文件及许可，不能只替换 index.html/assets。PDF 引擎与字体仅在点击下载时加载；字体请求限时 30 秒，失败可重试，正常打开报告不下载字体。报告内容在当前浏览器内生成 PDF，没有新的上传、生成或任务创建请求。

本地验证：13 项前端测试、TypeScript 与腾讯云生产构建通过；隔离浏览器完成正常报告、重复下载、长报告、原文回退、字体失败后重试共 6 次下载，验证字体按需加载、复用与会话入口移除。已逐页渲染正常、长篇和原文 PDF，核对正文完整性和分页；验证资料为虚构示例，未访问用户真实任务。当前尚未发布线上。

## 原项目的实际部署方式

image-bridge 的 GitHub Action 通过 SSH 上传代码，deploy/install.sh 管理 /root/image-bridge 的 Python 服务，端口 8765。该脚本写明保留既有反向代理，没有配置域名、DNS 或证书。

服务器截图显示 /opt/qkw-pd/Caddyfile 中的 img.pepehub.top 代理到 http://43.139.241.178:8765。主站与测试站也使用同一份 Caddyfile。本项目因此复用现有 Docker Caddy：报告页面由 Caddy 提供，报告 API 代理到共享队列。

## 1. DNS 解析

2026-10-06 实测 report.pepehub.top 和 img.pepehub.top 均解析到 43.139.241.178。DNS 控制台对应记录如下，已有记录不要重复添加：

| 主机记录 | 类型 | 记录值 |
| --- | --- | --- |
| report | A | 43.139.241.178 |

DNS 负责将请求送到服务器，Caddyfile 负责按域名选择网站。原 Caddy 的 80/443 端口和证书持久化卷保留。DNS 正确、端口可达、证书存储可写时，Caddy 自动申请和续期 HTTPS。

参考：https://caddyserver.com/docs/automatic-https

## 2. GitHub Actions 发布静态文件

在 talent-report 仓库 Settings → Secrets and variables → Actions 中配置原部署使用的值：

| Secret | 内容 |
| --- | --- |
| TENCENT_HOST | 43.139.241.178 |
| TENCENT_SSH_KEY | 允许 root 登录服务器的 SSH 私钥 |
| TENCENT_KNOWN_HOSTS | 可信的服务器 SSH 主机公钥记录 |
| TENCENT_SSH_PORT | 可选，默认 22 |

Repository secrets 不会跨仓库共享。GitHub 不能查看已有私钥明文，使用自己保存的原值填写，不要提交到代码。

生产接口已固定为 report 子域名，不需要 REPORT_SERVICE_URL Variable。本项目提交并推送后，等待 Deploy Talent Report to Tencent Cloud 成功。服务器上应出现 /var/www/talent-report/current/index.html 和 assets。

本地 npm run dev 保留 127.0.0.1 工作台；npm run build:tencent 生成 dist/tencent，复用现有 React 页面。

## 3. 给现有 Caddy 容器挂载网站目录

在 /opt/qkw-pd 下实际使用的 compose.yml 或 docker-compose.yml 中，找到 Caddy 服务，保留原 image、ports、networks 和 volumes，在原 volumes 列表增加：

```yaml
- /var/www/talent-report:/srv/talent-report:ro
```

deploy/compose-volume.example.yml 只是片段，不能覆盖原 Compose 文件。实际服务名、容器内 Caddyfile 路径和已有挂载仍需根据原文件确认。原 /data、/config 等证书与配置卷保留。

挂载整个父目录，不能只挂载 current。发布脚本使用相对链接 current → releases/版本号，容器内可以通过 /srv/talent-report/current 读取新版本。

## 4. 在原 Caddyfile 追加报告子域名

保留 /opt/qkw-pd/Caddyfile 原主站、测试站和 img 块，追加 deploy/Caddyfile.report 的配置：

```caddyfile
report.pepehub.top {
    encode zstd gzip

    handle /api/report-client/* {
        reverse_proxy http://43.139.241.178:8765 {
            header_up Host img.pepehub.top
        }
    }

    handle {
        root * /srv/talent-report/current
        file_server
    }
}
```

页面使用现有 Caddy，不需要新的 8766 服务或公网端口。API 保留完整路径与浏览器 Origin，上游 Host 用于通过原服务的 Host 校验。不要使用 handle_path，否则 API 前缀会被去掉；不要转发整个工作台 API。

容器的 127.0.0.1 指向容器本身，不能直接替代截图中原本可用的宿主机地址。以后改用内部 Docker 网络或宿主机网关时，需要先验证实际路由。

参考：https://caddyserver.com/docs/caddyfile/patterns

## 5. 核对和应用配置

先备份现有 Caddyfile 与 Compose 文件。命令中的“实际Caddy服务名”需要替换为原配置里的名称；/etc/caddy/Caddyfile 也需与 volumes 核对。

```sh
cd /opt/qkw-pd
docker compose config --services
docker compose ps
docker compose config -q
```

如果当前容器挂载的文件已反映新配置，先验证：

```sh
docker compose exec -T 实际Caddy服务名 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

新增目录挂载需要重建该 Caddy 容器，reload 无法增加挂载。核对后执行：

```sh
docker compose up -d --no-deps 实际Caddy服务名
docker compose exec -T 实际Caddy服务名 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose exec -T 实际Caddy服务名 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
docker compose logs --tail 50 实际Caddy服务名
```

重建网关会短暂影响它提供的几个网站，应安排维护时间并保留证书卷。以后仅修改 Caddyfile 时验证后 reload；仅发布静态页面时无需重建或 reload。

参考：https://caddyserver.com/docs/running#docker-compose

## 6. 更新共享后端并验证报告

2026-10-06 当前修复需要 **image-bridge/server.py 与插件 0.1.11 同步更新**。后端按图片/文本能力分发，旧图片执行端不能误领报告；插件提交稳定安装标识及版本，后端在报告结果中保存 executor 领取记录。空闲轮询不再清空启动错误，连接旧后端时插件会明确提示更新服务。只安装 0.1.10 或只发布报告网页不能解决这一协议问题。先在没有执行中任务时更新并重启原后端（保留数据和配对码），再覆盖原 extension 目录并重新加载 0.1.11，继续连接原 img.pepehub.top，最后发布本次报告静态构建。重启共享后端会将执行中任务标记中断，应待生图任务完成。

报告页面本次仅增加连接提示：在线的生图执行端未声明文本能力时，提示更新并重新连接执行插件；报告提交、查询和解析逻辑保持原样。领取后的新报告应有 executor.version 为 0.1.11，workerId 与插件存储一致。旧中断任务没有保存执行端及会话地址，无法据此追溯历史领取者，也不能通过恢复读取找回。本次未重发原资料。

本地验证：41 项服务端、40 项插件相关、10 项前端测试通过，TypeScript 与腾讯云静态构建通过。后端完整 JS 测试 84/85 通过，唯一失败为未修改的复古未来主义提示词长度检查；原 Action 因此仍会停止在检查阶段，提交代码后须确认实际部署结果。本次尚未发布线上后端、插件或前端，新版真实浏览器回传仍待部署后核验。

image-bridge/server.py 已加入 https://report.pepehub.top 精确来源。将后端修改提交到 image-bridge 仓库并等待原 Action 成功。Chrome 插件继续连接原线上工作台及其配对码，保持 ChatGPT 登录与自动领取任务。

如果页面显示「报告页面来源未获授权」，但带 Origin 的 session/status 请求成功，应检查后端是否包含同源 GET 修复：浏览器访问同域 API 时，状态查询和结果读取通常不发送 Origin。新版后端仅对缺少 Origin 且 Sec-Fetch-Site 为 same-origin 的 GET，从 Referer 提取精确白名单来源，然后继续验证原有的来源签名和客户端任务权限。显式 Origin、POST 和跨域请求沿用原鉴权。代理需保留 Origin、Referer 和 Sec-Fetch-Site；不要通过伪造 Origin 或放开白名单解决。这项修复位于 image-bridge/server.py，只发布报告前端不会生效。

打开 report 网站，在表单检查连接后提交虚构资料验证回传。主页打开仅代表静态页面可用，不能证明 API 和插件链路已经成功。

## 发布与回退

旧版本保留在 /var/www/talent-report/releases。current 使用相对链接，回退也使用 releases/上一版目录名作为目标，避免容器内链接指向宿主机路径。发布脚本不修改原 image-bridge 服务、数据或运行中的 Caddy 配置。

## 验证范围

静态构建、TypeScript、9 项前端测试、33 项服务端测试此前通过，发布脚本语法通过。本次 Caddy 片段依据服务器截图与官方文档准备。当前电脑 Docker 引擎未运行，未执行 Caddy validate，也未在腾讯云重建容器或重载配置。现有容器挂载仍待核对。

2026-10-06 同源 GET 修复：线上复现 session 200、带 Origin 的 status 200、缺少 Origin 的同源 status 403；新增回归测试在修复前失败，修复后全部 36 项服务端测试、9 项前端测试及 TypeScript 检查通过。后端 JS 测试 74/75 通过，既有「复古未来主义提示词长度」检查失败，其相关源码与测试均未修改。本次未发布线上后端，待部署后再验证同源 status 和报告结果查询。

2026-10-06 后续线上核对：report 与 img 的报告 session 签名一致，两个入口的 status 均返回 200，report 不带 Origin 的同源 GET 已能通过。使用原页面提供的报告凭据读取任务 1815d0dcea74d25f98de329f，两个域名返回一致的 interrupted 状态、浏览器心跳中断详情、空会话地址和空报告；用户确认 report 页面也更新为「连接已中断」。因此该任务确实能从 img 入口读取，不能根据工作台界面没有找到记录就判断它进入另一队列。本次未新建报告任务、未重发原资料、未修改线上网关或正常生图流程；执行中断的具体浏览器原因仍未核实。扩展 0.1.10 的启动记录和超时修复需在执行浏览器重新加载后另行验证，空会话地址的原任务不能通过 read-result 接口恢复。
