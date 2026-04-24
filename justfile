# Stargazing Planner 任务入口
# 设计意图：本地开发与发布命令统一收敛，避免散落在 README/记忆里
set shell := ["bash", "-cu"]

default:
    @just --list

# 清理构建产物与依赖缓存
clean:
    rm -rf .next dist out node_modules/.cache .turbo

# 安装依赖
install:
    bun install

# 类型检查 + 测试 + 生产构建
build:
    bun run typecheck
    bun test
    bun run build

# 本地构建 + 推送镜像（使用 script/build-image.sh，版本号取自 package.json）
build-image:
    bash script/build-image.sh

# 起一个本地容器试跑
docker-up:
    docker compose up -d --build

docker-down:
    docker compose down
