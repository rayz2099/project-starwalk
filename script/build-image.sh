#!/usr/bin/env bash
set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 为什么把镜像名和仓库地址收敛到这里：
# 版本号已经统一来自 package.json，镜像目标也需要只有一个入口，避免 justfile 和手工命令漂移。
readonly LOCAL_IMAGE="project-starwalk:local"
readonly REMOTE_IMAGE_REPOSITORY="registry.cn-shanghai.aliyuncs.com/linran-pub/project-starwalk"

resolve_version() {
  node -e 'const fs = require("node:fs"); const pkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (typeof pkg.version !== "string" || pkg.version.trim().length === 0) { throw new Error("package.json version is required"); } process.stdout.write(pkg.version.trim());' \
    "${ROOT_DIR}/package.json"
}

main() {
  local version
  local remote_image
  local latest_image

  version="$(resolve_version)"
  remote_image="${REMOTE_IMAGE_REPOSITORY}:${version}"
  latest_image="${REMOTE_IMAGE_REPOSITORY}:latest"

  printf '[build-image] version=%s\n' "${version}"
  printf '[build-image] local_image=%s\n' "${LOCAL_IMAGE}"
  printf '[build-image] remote_image=%s\n' "${remote_image}"
  printf '[build-image] latest_image=%s\n' "${latest_image}"

  cd "${ROOT_DIR}"

  docker build -t "${LOCAL_IMAGE}" .
  docker tag "${LOCAL_IMAGE}" "${remote_image}"
  docker tag "${LOCAL_IMAGE}" "${latest_image}"
  docker push "${remote_image}"
  # latest 默认随版本一起推：方便运维直接 pull :latest，避免每次手工同步
  docker push "${latest_image}"
}

main "$@"
