#!/usr/bin/env bash
set -euo pipefail
missing=0
for name in TENCENT_HOST TENCENT_SSH_KEY TENCENT_KNOWN_HOSTS; do
  value="${!name-}"
  if [[ -z "${value//[[:space:]]/}" ]]; then
    echo "::error::请在 talent-report 仓库的 Actions Secrets 中添加 ${name}。原仓库的 Repository secrets 不会自动共享。"
    missing=1
  fi
done
if (( missing )); then exit 1; fi
if [[ "$TENCENT_HOST" == *[[:space:]/@]* || "$TENCENT_HOST" == -* ]]; then
  echo '::error::TENCENT_HOST 只能填写服务器 IP 或主机名。' >&2
  exit 1
fi
port="${TENCENT_SSH_PORT:-22}"
if [[ ! "$port" =~ ^[0-9]{1,5}$ ]] || (( 10#$port < 1 || 10#$port > 65535 )); then
  echo '::error::TENCENT_SSH_PORT 应为 1–65535，留空默认 22。' >&2
  exit 1
fi
echo '部署配置检查通过。'
