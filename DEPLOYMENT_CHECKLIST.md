# Agnes AI Studio - 免费部署检查清单

## 📋 部署前准备

### 必需的工具和账号

- [ ] **GitHub 账号** - 用于代码管理和自动部署
- [ ] **Node.js 18+** - 本地开发/构建
- [ ] **Railway 账号** - 免费后端部署（可选）
- [ ] **Vercel 账号** - 免费前端部署（可选）

### 代码准备

- [ ] 将代码推送到 GitHub 仓库
- [ ] 确认代码包含以下文件：
  - [ ] `package.json` - 前端依赖
  - [ ] `server/package.json` - 后端依赖
  - [ ] `vercel.json` - Vercel 配置
  - [ ] `netlify.toml` - Netlify 配置
  - [ ] `docker-compose.yml` - Docker 配置
  - [ ] `.env.example` - 环境变量示例

---

## 🚀 部署步骤

### 方案一：Railway + Vercel（推荐）

#### 后端部署 (Railway)

- [ ] 登录 Railway (railway.app)
- [ ] 创建新项目
- [ ] 连接到 GitHub 仓库
- [ ] 设置根目录为 `server`
- [ ] 配置环境变量：
  - [ ] `JWT_SECRET` = 随机密钥
  - [ ] `NODE_ENV` = production
  - [ ] `PORT` = 3001
  - [ ] `CORS_ORIGIN` = Vercel 域名
- [ ] 等待部署完成
- [ ] 记录后端 URL（例如：`api.xxx.up.railway.app`）

#### 前端部署 (Vercel)

- [ ] 登录 Vercel (vercel.com)
- [ ] 从 GitHub 导入项目
- [ ] 配置框架为 Vite
- [ ] 设置构建命令：`npm run build`
- [ ] 设置输出目录：`dist`
- [ ] 添加环境变量：
  - [ ] `VITE_API_URL` = 后端URL/api
- [ ] 部署并记录前端 URL

#### 验证部署

- [ ] 访问前端 URL
- [ ] 尝试注册新账户
- [ ] 尝试登录
- [ ] 创建第一个任务
- [ ] 检查任务是否成功创建

---

### 方案二：Render + Netlify

#### 后端部署 (Render)

- [ ] 登录 Render (render.com)
- [ ] 创建 Web Service
- [ ] 连接 GitHub 仓库
- [ ] 设置根目录为 `server`
- [ ] 配置环境变量（同上）
- [ ] 启用自动部署
- [ ] 记录后端 URL

#### 前端部署 (Netlify)

- [ ] 登录 Netlify (netlify.com)
- [ ] 添加新站点
- [ ] 从 GitHub 导入
- [ ] 配置构建命令
- [ ] 添加环境变量
- [ ] 部署并记录 URL

---

### 方案三：本地部署

- [ ] 克隆代码到本地
- [ ] 运行 `./quick-deploy.sh`
- [ ] 或手动执行：
  - [ ] `npm install`
  - [ ] `cd server && npm install`
  - [ ] `cp .env.example .env` 并编辑
  - [ ] `npm run build`
  - [ ] `cd server && npm run build`
  - [ ] `cd server && node dist/index.js`
- [ ] 访问 http://localhost:5175

---

## 🔐 管理员配置

### 创建管理员账户

部署完成后，必须创建管理员：

```bash
# 如果在本地
cd server
npm run create-admin

# 如果在 Railway/Render
# 使用 Railway Shell 或 Render Shell
npm run create-admin
```

按照提示输入：
- [ ] 管理员邮箱
- [ ] 管理员密码
- [ ] 显示名称（可选）

### 验证管理员

- [ ] 使用管理员账户登录
- [ ] 在用户菜单中看到"管理后台"选项
- [ ] 点击进入管理后台
- [ ] 检查用户列表和统计数据

---

## ✅ 功能测试清单

### 用户功能

- [ ] 注册新账户
- [ ] 登录/退出
- [ ] 修改个人资料
- [ ] 修改密码
- [ ] 忘记密码/重置密码

### 创作功能

- [ ] 文生图模式
- [ ] 图生图模式
- [ ] 视频生成模式
- [ ] AI 对话模式
- [ ] 语音合成模式
- [ ] 批量生成模式
- [ ] 图片编辑模式

### 资产功能

- [ ] 查看最近作品
- [ ] 收藏/取消收藏
- [ ] 下载资产
- [ ] 搜索资产
- [ ] 上传素材

### 积分和会员

- [ ] 查看当前积分
- [ ] 积分充值
- [ ] 兑换码兑换
- [ ] 查看会员方案
- [ ] 升级会员

### 管理后台

- [ ] 查看平台统计
- [ ] 查看用户列表
- [ ] 搜索用户
- [ ] 编辑用户信息
- [ ] 调整用户积分
- [ ] 禁用/启用用户
- [ ] 查看任务列表

---

## 🔧 故障排查

### 后端无法启动

- [ ] 检查 Node.js 版本 (18+)
- [ ] 检查依赖是否安装成功
- [ ] 检查环境变量是否配置
- [ ] 检查端口是否被占用

### 前端无法连接后端

- [ ] 检查后端是否运行
- [ ] 检查 `VITE_API_URL` 是否正确
- [ ] 检查 CORS 配置
- [ ] 检查浏览器控制台错误

### 数据库错误

- [ ] 检查数据库文件是否存在
- [ ] 检查目录权限
- [ ] 检查磁盘空间

---

## 📞 获取帮助

如果遇到问题：

1. **查看日志** - 错误信息通常包含具体原因
2. **检查环境变量** - 确认所有必需变量已设置
3. **重启服务** - 有时候重启可以解决临时问题
4. **提交 Issue** - 在 GitHub 仓库提交问题报告

---

## 🎉 部署成功！

完成所有检查项后，你的 Agnes AI Studio 就成功部署了！

**记得：**
- 保护好管理员账户
- 定期备份数据库
- 关注平台使用情况

**享受你的 AI 创作平台！** 🚀
