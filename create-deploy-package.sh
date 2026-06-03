#!/bin/bash
# ==============================================
# Agnes AI Studio - 打包部署文件脚本
# ==============================================

echo "正在创建部署包..."

# 创建临时目录
DEPLOY_DIR="agnes-ai-studio-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# 复制前端文件
echo "复制前端文件..."
cp -r src $DEPLOY_DIR/
cp package.json package-lock.json vite.config.ts tailwind.config.js tsconfig.json tsconfig.node.json index.html postcss.config.js $DEPLOY_DIR/
cp -r dist $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/

# 复制后端文件
echo "复制后端文件..."
mkdir -p $DEPLOY_DIR/server
cp -r server/src $DEPLOY_DIR/server/
cp server/package.json server/package-lock.json server/tsconfig.json server/Dockerfile server/ecosystem.config.js server/railway.json server/render.yaml $DEPLOY_DIR/server/
cp -r server/dist $DEPLOY_DIR/server/
cp -r server/uploads $DEPLOY_DIR/server/
cp -r server/data $DEPLOY_DIR/server/
cp server/agnes.db $DEPLOY_DIR/server/ 2>/dev/null || true

# 复制部署配置文件
echo "复制部署配置文件..."
cp Dockerfile docker-compose.yml vercel.json netlify.toml wrangler.toml $DEPLOY_DIR/
cp -r nginx $DEPLOY_DIR/

# 复制文档和脚本
echo "复制文档和脚本..."
cp README.md FREE_DEPLOYMENT_GUIDE.md DEPLOYMENT_CHECKLIST.md ADMIN_GUIDE.md $DEPLOY_DIR/
cp deploy.sh start.sh quick-deploy.sh $DEPLOY_DIR/

# 复制环境变量模板
cp .env.example $DEPLOY_DIR/
cp server/.env.example $DEPLOY_DIR/server/

# 复制脚本
mkdir -p $DEPLOY_DIR/scripts
cp -r scripts $DEPLOY_DIR/

# 创建部署说明
cat > $DEPLOY_DIR/部署说明.txt << 'EOF'
Agnes AI Studio 部署包
========================================

包含内容：
1. 完整的前端代码和构建文件
2. 完整的后端代码和构建文件
3. 所有部署配置文件
4. 部署脚本和文档

快速开始：
1. 解压此文件
2. cd agnes-ai-studio-deploy
3. ./quick-deploy.sh  （Linux/Mac）
4. 或按照 FREE_DEPLOYMENT_GUIDE.md 部署到云平台

详细文档：
- README.md - 项目说明
- FREE_DEPLOYMENT_GUIDE.md - 免费部署指南
- DEPLOYMENT_CHECKLIST.md - 部署检查清单
- ADMIN_GUIDE.md - 管理员使用指南

如有问题，请查阅文档或提交 Issue。
========================================
EOF

# 创建 .gitignore
cat > $DEPLOY_DIR/.gitignore << 'EOF'
node_modules/
server/node_modules/
dist/
server/dist/
*.log
.env
.env.local
.env.*.local
server/.env
server/.env.local
*.db
*.db-shm
*.db-wal
uploads/
server/uploads/
data/
server/data/
*.tsbuildinfo
.DS_Store
EOF

echo "✅ 部署包创建完成！"
echo "📦 文件夹: $DEPLOY_DIR"
