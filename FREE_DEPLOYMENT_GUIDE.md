# Agnes AI Studio - 免费部署指南

## 🌟 完全免费部署方案

本指南详细介绍如何使用免费平台部署 Agnes AI Studio。

### 推荐方案：Railway + Vercel

**为什么推荐这个方案？**

| 平台 | 免费额度 | 优点 |
|------|---------|------|
| Railway | 500小时/月 | 托管 Node.js 应用，支持数据库 |
| Vercel | 无限次部署 | 部署极快，自动 HTTPS，全球 CDN |

---

## 📋 部署前准备

### 1. 创建 GitHub 仓库

```bash
# 在 GitHub 上创建新仓库
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/agnes-ai-studio.git
git push -u origin main
```

### 2. 获取必要的 API Keys

**Railway:**
1. 访问 https://railway.app
2. 使用 GitHub 登录
3. 创建新项目
4. 获取 Project ID 和 API Token

**Vercel:**
1. 访问 https://vercel.com
2. 使用 GitHub 登录
3. 从 GitHub 导入项目

---

## 🚀 方案一：Railway 后端 + Vercel 前端（推荐）

### 第一步：部署后端到 Railway

1. 访问 https://railway.app
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. Railway 会自动检测为 Node.js 项目

**配置环境变量：**

在 Railway 项目设置中添加：

```
JWT_SECRET=your-super-secret-key-change-this
NODE_ENV=production
PORT=3001
DB_PATH=./data/agnes.db
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://your-app.vercel.app
```

**等待部署完成，获取后端 URL：**
- 格式：`https://api.你的项目名.up.railway.app`

### 第二步：部署前端到 Vercel

1. 访问 https://vercel.com
2. 点击 "Import Project"
3. 选择你的 GitHub 仓库
4. 配置构建命令：
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

5. 添加环境变量：
   ```
   VITE_API_URL=https://api.你的项目名.up.railway.app/api
   ```

6. 点击 "Deploy"

**等待部署完成，你的网站就可以访问了！**

---

## 🚀 方案二：Render 后端 + Netlify 前端

### 第一步：部署后端到 Render

1. 访问 https://render.com
2. 点击 "New +" → "Web Service"
3. 连接你的 GitHub 仓库
4. 配置：
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. 添加环境变量（同上）

6. 点击 "Create Web Service"

### 第二步：部署前端到 Netlify

1. 访问 https://netlify.com
2. 点击 "Add new site" → "Import an existing project"
3. 连接你的 GitHub 仓库
4. 配置：
   - **Base directory:** `/` (留空)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

5. 添加环境变量：
   ```
   VITE_API_URL=https://你的-render-url.onrender.com/api
   ```

6. 点击 "Deploy site"

---

## 🚀 方案三：Cloudflare Pages + Workers（100% 免费边缘部署）

### 第一步：部署前端到 Cloudflare Pages

1. 访问 https://pages.cloudflare.com
2. 点击 "Create a project"
3. 连接你的 GitHub 仓库
4. 配置：
   - **Production branch:** `main`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

5. 添加环境变量：
   ```
   VITE_API_URL=https://agnes-api.你的用户名.workers.dev/api
   ```

6. 点击 "Save and Deploy"

### 第二步：部署后端到 Cloudflare Workers

创建 `server/wrangler.toml`:

```toml
name = "agnes-api"
main = "dist/index.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./uploads"

[[env]]
name = "production"
routes = [
  { pattern = "agnes-api.你的用户名.workers.dev", zone_name = "你的用户名.workers.dev" }
]
```

部署命令：

```bash
cd server
npx wrangler login
npx wrangler deploy
```

---

## 🔧 部署后配置

### 创建管理员账户

部署完成后，SSH 到服务器或使用 Railway/Render 的 Shell：

```bash
cd server
npm run create-admin
```

按照提示输入管理员邮箱、密码和名称。

### 更新前端 API 地址

如果使用了不同的后端地址，需要更新：

**Vercel:** 在项目设置中修改 `VITE_API_URL`

**Netlify:** 在环境变量中修改 `VITE_API_URL`

**Cloudflare:** 在 Pages 设置中修改 `VITE_API_URL`

---

## 🎯 验证部署

### 检查后端健康状态

访问：`https://你的后端URL/api/health`

应该返回：
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": 1234567890
}
```

### 检查前端连接

1. 打开前端网站
2. 尝试注册/登录
3. 如果登录成功，说明前后端连接正常

### 创建第一个任务

1. 登录后选择"文生图"
2. 输入提示词
3. 点击生成
4. 观察任务是否创建成功

---

## 📊 免费平台对比

| 平台 | 内存 | 存储 | 月流量 | 数据库 | 备注 |
|------|------|------|--------|--------|------|
| Railway | 512MB | 1GB | 100GB | SQLite 免费 | 500小时/月 |
| Render | 512MB | - | - | SQLite | 750小时/月 |
| Vercel | - | - | 100GB | - | 无限部署 |
| Netlify | - | - | 100GB | - | 无限部署 |
| Cloudflare | 128MB | - | 无限 | - | Workers 100k请求/天 |

---

## ⚠️ 注意事项

### 数据持久化

**Railway:** 提供持久化磁盘，确保数据不丢失

**Render:** 需要额外挂载磁盘存储数据库

**Cloudflare Workers:** 无持久化存储，需要使用 D1 数据库或外部存储

### 安全建议

1. **JWT_SECRET** - 务必使用强密钥
2. **CORS_ORIGIN** - 仅允许你的前端域名
3. **HTTPS** - 所有平台都自动提供

### 扩展建议

当免费额度不够时：

1. **Railway → Railway Pro** - $5/月，5000小时
2. **Vercel Pro** - $20/月，无限项目
3. **自建 VPS** - DigitalOcean $4/月起

---

## 🆘 常见问题

### Q: 数据库无法访问？

A: 检查 `DB_PATH` 是否正确，确保目录存在并有写入权限。

### Q: 前端显示 "Failed to fetch"？

A: 
1. 检查后端是否正常运行
2. 检查 `VITE_API_URL` 是否正确
3. 检查 CORS 配置是否包含前端域名

### Q: 上传文件失败？

A: 
1. 检查 `UPLOAD_DIR` 权限
2. 检查平台是否支持文件写入
3. 考虑使用云存储（S3/Cloudflare R2）

### Q: 如何备份数据？

A: 
1. **Railway:** 自动每日备份
2. **Render:** 手动下载数据库文件
3. **自建:** 使用 `scripts/backup.sh`

---

## 📞 获取帮助

- **项目 Issues:** https://github.com/你的用户名/agnes-ai-studio/issues
- **Railway 文档:** https://docs.railway.app
- **Vercel 文档:** https://vercel.com/docs
- **Cloudflare 文档:** https://developers.cloudflare.com

---

**祝你部署顺利！** 🎉
