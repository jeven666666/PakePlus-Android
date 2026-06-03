#!/bin/bash
# ==============================================
# Agnes AI Studio - 一键部署脚本（本地/服务器）
# ==============================================

set -e

echo "=============================================="
echo "  Agnes AI Studio - 快速部署脚本"
echo "=============================================="
echo ""

# 检查命令
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查依赖
check_dependencies() {
    echo "检查依赖..."
    
    if ! command_exists node; then
        echo "❌ Node.js 未安装"
        echo "请先安装 Node.js 18+: https://nodejs.org/"
        exit 1
    fi
    
    if ! command_exists npm; then
        echo "❌ npm 未安装"
        exit 1
    fi
    
    echo "✅ 依赖检查通过"
    echo "  Node.js: $(node -v)"
    echo "  npm: $(npm -v)"
    echo ""
}

# 安装依赖
install_dependencies() {
    echo "安装前端依赖..."
    npm install
    echo "✅ 前端依赖安装完成"
    echo ""
    
    echo "安装后端依赖..."
    cd server
    npm install
    cd ..
    echo "✅ 后端依赖安装完成"
    echo ""
}

# 配置环境变量
setup_environment() {
    echo "配置环境变量..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ 已创建 .env 文件"
        echo "⚠️  请编辑 .env 文件配置生产环境变量"
    fi
    
    if [ ! -f "server/.env" ]; then
        cp server/.env.example server/.env
        echo "✅ 已创建 server/.env 文件"
        echo "⚠️  请编辑 server/.env 文件配置生产环境变量"
    fi
    echo ""
}

# 构建项目
build_project() {
    echo "构建前端..."
    npm run build
    echo "✅ 前端构建完成"
    echo ""
    
    echo "构建后端..."
    cd server
    npm run build
    cd ..
    echo "✅ 后端构建完成"
    echo ""
}

# 创建目录
create_directories() {
    echo "创建必要目录..."
    mkdir -p uploads logs server/data
    echo "✅ 目录创建完成"
    echo ""
}

# 启动服务
start_service() {
    echo "启动后端服务..."
    cd server
    PORT=3001 node dist/index.js &
    cd ..
    echo "✅ 后端服务已启动 (端口 3001)"
    echo ""
    
    echo "=============================================="
    echo "  🎉 部署完成！"
    echo ""
    echo "  访问地址："
    echo "  前端: http://localhost:5175"
    echo "  后端: http://localhost:3001"
    echo ""
    echo "  管理员创建命令："
    echo "  cd server && npm run create-admin"
    echo ""
    echo "  停止服务命令："
    echo "  pkill -f 'node dist/index.js'"
    echo "=============================================="
}

# 主函数
main() {
    check_dependencies
    create_directories
    setup_environment
    install_dependencies
    build_project
    start_service
}

# 显示帮助
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help    显示帮助信息"
    echo "  --skip-build  跳过构建步骤"
    echo "  --only-build  仅构建，不启动"
    exit 0
fi

# 执行
main
