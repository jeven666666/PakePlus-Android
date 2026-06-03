#!/bin/bash
# ==============================================
# Agnes AI Studio - 快速启动脚本
# ==============================================

set -e

echo "=============================================="
echo "  Agnes AI Studio - 快速启动"
echo "=============================================="
echo ""

# 创建必要目录
mkdir -p uploads
mkdir -p logs

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "创建 .env 文件..."
    cp .env.example .env
fi

if [ ! -f "server/.env" ]; then
    echo "创建 server/.env 文件..."
    cd server
    cp .env.example .env
    cd ..
fi

echo ""
echo "请选择启动方式："
echo "1) 开发模式（前后端分离）"
echo "2) 生产模式（PM2）"
echo "3) Docker 模式"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "启动开发模式..."
        echo ""
        
        # 检查依赖
        if [ ! -d "node_modules" ]; then
            echo "安装前端依赖..."
            npm install
        fi
        
        if [ ! -d "server/node_modules" ]; then
            echo "安装后端依赖..."
            cd server
            npm install
            cd ..
        fi
        
        # 启动后端
        echo "启动后端服务 (端口 3001)..."
        cd server
        npm run dev &
        BACKEND_PID=$!
        cd ..
        
        # 等待一下
        sleep 3
        
        # 启动前端
        echo "启动前端服务 (端口 5175)..."
        npm run dev &
        FRONTEND_PID=$!
        
        echo ""
        echo "=============================================="
        echo "  服务已启动！"
        echo "  前端: http://localhost:5175"
        echo "  后端: http://localhost:3001"
        echo ""
        echo "  按 Ctrl+C 停止所有服务"
        echo "=============================================="
        
        # 清理函数
        cleanup() {
            echo ""
            echo "正在停止服务..."
            kill $BACKEND_PID 2>/dev/null || true
            kill $FRONTEND_PID 2>/dev/null || true
            echo "服务已停止"
            exit 0
        }
        
        trap cleanup INT TERM
        wait
        ;;
        
    2)
        echo ""
        echo "启动生产模式..."
        ./deploy.sh
        ;;
        
    3)
        echo ""
        echo "启动 Docker 模式..."
        docker-compose up -d
        echo ""
        echo "=============================================="
        echo "  Docker 服务已启动！"
        echo "  访问: http://localhost"
        echo "=============================================="
        ;;
        
    *)
        echo "无效选项"
        exit 1
        ;;
esac
