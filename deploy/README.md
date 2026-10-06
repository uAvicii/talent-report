# report.pepehub.top：GitHub Actions + 现有 Docker Caddy

网站与报告接口：`https://report.pepehub.top`、`https://report.pepehub.top/api/report-client`。
仓库：`https://github.com/uAvicii/talent-report`。

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

image-bridge/server.py 已加入 https://report.pepehub.top 精确来源。将后端修改提交到 image-bridge 仓库并等待原 Action 成功。Chrome 插件继续连接原线上工作台及其配对码，保持 ChatGPT 登录与自动领取任务。

打开 report 网站，在表单检查连接后提交虚构资料验证回传。主页打开仅代表静态页面可用，不能证明 API 和插件链路已经成功。

## 发布与回退

旧版本保留在 /var/www/talent-report/releases。current 使用相对链接，回退也使用 releases/上一版目录名作为目标，避免容器内链接指向宿主机路径。发布脚本不修改原 image-bridge 服务、数据或运行中的 Caddy 配置。

## 验证范围

静态构建、TypeScript、9 项前端测试、33 项服务端测试此前通过，发布脚本语法通过。本次 Caddy 片段依据服务器截图与官方文档准备。当前电脑 Docker 引擎未运行，未执行 Caddy validate，也未在腾讯云重建容器或重载配置。现有容器挂载仍待核对。
