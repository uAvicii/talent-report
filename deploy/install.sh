#!/usr/bin/env bash
set -euo pipefail
source_dir="${1:?Usage: install.sh SOURCE_DIRECTORY RELEASE_ID}"
release_id="${2:?Missing RELEASE_ID}"
app=/var/www/talent-report
if [[ ! "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]]; then
  echo '发布编号格式不正确。' >&2
  exit 1
fi
if [[ ! -s "$source_dir/site/index.html" || ! -d "$source_dir/site/assets" ]]; then
  echo '缺少静态页面或构建资源。' >&2
  exit 1
fi
if [[ -e "$app/current" && ! -L "$app/current" ]]; then
  echo "$app/current 已存在且不是部署链接，请先核对该目录用途。" >&2
  exit 1
fi
release="$app/releases/$release_id"
if [[ -e "$release" ]]; then
  echo '同名版本已存在，请在 Actions 中重新运行以生成新的发布编号。' >&2
  exit 1
fi
mkdir -p "$release"
cp -a "$source_dir/site/." "$release/"
chmod -R u=rwX,go=rX "$release"
previous=$(readlink "$app/current" || true)
# A relative target also works inside the Caddy container's /srv mount.
ln -s "releases/$release_id" "$app/.current-$release_id"
mv -Tf "$app/.current-$release_id" "$app/current"
echo "静态文件已发布：$app/current"
echo "上一版路径：${previous:-首次发布}"
echo '目标网站：https://report.pepehub.top'
echo '首次部署需给现有 Caddy 容器挂载网站目录并添加子域名配置；参考 deploy/Caddyfile.report。'
