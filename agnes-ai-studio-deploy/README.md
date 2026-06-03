# Agnes AI Studio - 多模态 AI 创作平台

一个功能完整的 AI 创作平台，支持文生图、图生图、视频生成、AI 聊天、语音合成、图片编辑等多种创作模式。

## 🚀 功能特性

- 🎨 **文生图** - 基于提示词生成精美图像
- 🖼️ **图生图** - 基于参考图进行创作
- 🎬 **视频生成** - 一键生成短视频
- 💬 **AI 聊天** - 智能对话与提示词优化
- 🎵 **语音合成** - 文字转语音，支持多种音色
- 🎯 **图片编辑** - AI 抠图、超分、重绘等强大功能
- 📦 **素材管理** - 作品收藏、批量操作、素材上传
- 💳 **会员系统** - 多档会员方案，功能升级
- 🎁 **积分系统** - 充值、兑换、消费记录

## 📦 项目结构

```
├── src/                 # 前端代码
│   ├── components/      # React 组件
│   ├── pages/          # 页面组件
│   ├── store/          # 状态管理
│   └── utils/          # 工具函数
├── server/             # 后端代码
│   ├── src/
│   │   ├── routes/     # API 路由
│   │   ├── models/     # 数据模型
│   │   └── middleware/ # 中间件
│   └── uploads/        # 文件上传目录
└── agnes.db            # SQLite 数据库文件
```

## 🛠️ 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn

### 开发环境运行

#### 1. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd server
npm install
cd ..
```

#### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
cd server
cp .env.example .env
cd ..
```

编辑 `.env` 文件，填入所需配置。

#### 3. 启动后端

```bash
cd server
npm run dev
```

后端服务将运行在 `http://localhost:3001`

#### 4. 启动前端

新开一个终端：

```bash
npm run dev
```

前端服务将运行在 `http://localhost:5175`

## 🐳 Docker 部署

### 使用 Docker Compose 一键部署

```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 手动构建

```bash
# 构建后端镜像
cd server
docker build -t agnes-ai-backend .

# 构建前端镜像
cd ..
docker build -t agnes-ai-frontend .
```

## 🌐 生产环境部署

### 使用 PM2 部署（推荐）

```bash
# 1. 全局安装 PM2
npm install -g pm2

# 2. 构建前端
npm run build

# 3. 构建后端
cd server
npm run build

# 4. 启动后端服务
pm2 start ecosystem.config.js

# 5. 配置 Nginx 反向代理
# 使用 nginx/agnes-ai.conf 配置
```

### 部署检查清单

- [ ] 环境变量已正确配置
- [ ] 数据库文件权限正确
- [ ] 上传目录有读写权限
- [ ] 防火墙开放端口（3001）
- [ ] 域名和 SSL 证书配置完成
- [ ] Nginx 反向代理配置完成
- [ ] 日志轮转配置
- [ ] 监控和告警配置

## 📊 数据库

项目使用 SQLite 数据库，数据文件为 `agnes.db`。

首次启动会自动创建数据库和所需表结构。

### 数据库备份

```bash
# 备份数据库
cp agnes.db agnes.db.backup.$(date +%Y%m%d)

# 恢复数据库
cp agnes.db.backup.20240101 agnes.db
```

## 🔧 环境变量

### 后端环境变量 (server/.env)

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT 密钥（生产环境请务必修改为复杂密钥）
JWT_SECRET=your-secret-key-here-change-in-production

# 数据库配置
DB_PATH=./agnes.db

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS 配置
CORS_ORIGIN=https://your-domain.com
```

### 前端环境变量 (.env)

```env
# API 地址
VITE_API_URL=https://your-domain.com/api

# 网站标题
VITE_APP_TITLE=Agnes AI Studio
```

## 📝 API 文档

所有 API 接口均已实现，包含：

- `/api/auth/*` - 认证相关
- `/api/tasks/*` - 任务管理
- `/api/assets/*` - 资产管理
- `/api/storage/*` - 存储空间
- `/api/credits/*` - 积分系统
- `/api/membership/*` - 会员系统
- `/api/editor/*` - 编辑功能
- `/api/tts/*` - 语音合成
- `/api/video/*` - 视频生成
- `/api/chat/*` - 聊天对话

## 🎯 默认用户

系统首次启动时会自动创建一个测试用户：

- 邮箱：`demo@example.com`
- 密码：`demo123`

**生产环境请务必修改此默认密码！**

## 🔐 安全建议

1. 修改 JWT_SECRET 为复杂的随机字符串
2. 使用 HTTPS 保护数据传输
3. 定期备份数据库
4. 配置防火墙规则
5. 启用日志监控
6. 使用强密码策略

## 📈 性能优化

- 启用 Gzip 压缩
- 配置 CDN 加速
- 使用 Redis 缓存
- 数据库索引优化
- 静态资源缓存

## 🐛 故障排查

### 常见问题

**1. 前端无法连接后端**
- 检查后端是否正常运行
- 检查 CORS 配置
- 检查防火墙设置

**2. 上传文件失败**
- 检查 UPLOAD_DIR 权限
- 检查文件大小限制
- 检查磁盘空间

**3. 数据库锁定**
- 检查是否有多个进程同时访问
- 确保文件权限正确
- 重启服务

### 查看日志

```bash
# PM2 日志
pm2 logs

# Docker 日志
docker-compose logs -f

# 系统日志
tail -f /var/log/syslog
```

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请提交 Issue 或联系我们。

---

**让 AI 创作更简单！** 🎨
