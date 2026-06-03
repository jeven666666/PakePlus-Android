#!/bin/bash
# ==============================================
# Agnes AI Studio - 生产环境部署脚本
# ==============================================

set -e  # 遇到错误立即退出

echo "=============================================="
echo "  Agnes AI Studio - 生产环境部署脚本"
echo "=============================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Node.js 版本
check_node_version() {
    log_info "检查 Node.js 版本..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 版本过低，需要 18+，当前版本: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js 版本检查通过: $(node -v)"
}

# 创建必要目录
create_directories() {
    log_info "创建必要目录..."
    mkdir -p uploads
    mkdir -p logs
    mkdir -p nginx
    log_success "目录创建完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装前端依赖..."
    npm ci
    log_success "前端依赖安装完成"
    
    log_info "安装后端依赖..."
    cd server
    npm ci
    cd ..
    log_success "后端依赖安装完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    npm run build
    log_success "前端构建完成"
}

# 构建后端
build_backend() {
    log_info "构建后端..."
    cd server
    npm run build
    cd ..
    log_success "后端构建完成"
}

# 配置环境变量
setup_env() {
    if [ ! -f ".env" ]; then
        log_warning ".env 文件不存在，正在从 .env.example 创建..."
        cp .env.example .env
        log_info "请编辑 .env 文件配置生产环境变量"
    fi
    
    if [ ! -f "server/.env" ]; then
        log_warning "server/.env 文件不存在，正在从 .env.example 创建..."
        cd server
        cp .env.example .env
        cd ..
        log_info "请编辑 server/.env 文件配置生产环境变量"
    fi
}

# 检查 PM2
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_info "PM2 未安装，正在安装..."
        npm install -g pm2
        log_success "PM2 安装完成"
    else
        log_success "PM2 已安装"
    fi
}

# 启动服务
start_services() {
    log_info "启动后端服务..."
    cd server
    pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
    cd ..
    log_success "后端服务启动完成"
    
    log_info "服务状态："
    pm2 status
}

# 主部署流程
main() {
    echo ""
    log_info "开始部署..."
    echo ""
    
    # 执行各个步骤
    check_node_version
    create_directories
    setup_env
    install_dependencies
    build_frontend
    build_backend
    check_pm2
    start_services
    
    echo ""
    echo "=============================================="
    log_success "部署完成！"
    echo ""
    log_info "访问地址："
    log_info "  前端: http://your-domain.com"
    log_info "  后端: http://your-domain.com/api"
    echo ""
    log_info "管理命令："
    log_info "  pm2 status          - 查看服务状态"
    log_info "  pm2 logs            - 查看日志"
    log_info "  pm2 restart all     - 重启所有服务"
    log_info "  pm2 stop all        - 停止所有服务"
    echo "=============================================="
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help    显示此帮助信息"
    echo "  -s, --start   仅启动服务"
    echo "  -b, --build   仅构建项目"
    echo "  -u, --update  更新项目并重新部署"
}

# 参数处理
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -s|--start)
        check_pm2
        start_services
        ;;
    -b|--build)
        build_frontend
        build_backend
        ;;
    -u|--update)
        log_info "更新项目..."
        git pull
        main
        ;;
    *)
        main
        ;;
esac
