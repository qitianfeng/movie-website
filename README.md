# 🎬 MovieHub - 电影网站全栈项目

一个现代化的电影信息网站，包含 H5 移动端和后台管理系统。

## 📁 项目结构

```
movie-website/
├── backend/           # Node.js + Express API (端口 3001)
├── frontend-h5/       # Vue 3 H5 移动端 (端口 5173)
├── frontend-admin/    # Vue 3 后台管理 (端口 5174)
├── docs/              # API文档 + 数据库设计
└── docker-compose.yml # Docker 一键部署
```

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| **后端** | Node.js + Express + MySQL |
| **H5前端** | Vue 3 + Vite + Pinia |
| **管理后台** | Vue 3 + Vite + Element Plus + ECharts |
| **数据源** | TMDB API (The Movie Database) |

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/your-username/movie-website.git
cd movie-website
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑 backend/.env，填入你的配置
# - 数据库连接信息
# - TMDB API Key (从 https://www.themoviedb.org/settings/api 获取)
```

### 3. 安装依赖

```bash
# 后端
cd backend && npm install

# H5 前端
cd ../frontend-h5 && npm install

# 管理后台
cd ../frontend-admin && npm install
```

### 4. 启动服务

```bash
# 启动后端 (在 backend 目录)
npm start

# 启动 H5 前端 (在 frontend-h5 目录)
npm run dev

# 启动管理后台 (在 frontend-admin 目录)
npm run dev -- --port 5174
```

### 5. 访问应用

- **H5 移动端**: http://localhost:5173
- **管理后台**: http://localhost:5174
- **API 文档**: http://localhost:3001/api/v1

## 📊 功能特性

### H5 移动端
- 🎠 首页轮播图（可后台管理）
- 🔥 热门电影 / 趋势电影
- 🎯 分类筛选
- 🔍 电影搜索
- 📱 响应式设计

### 管理后台
- 📈 数据统计仪表盘
- 🎬 电影管理 + TMDB 同步
- 🖼️ 轮播管理
- 👥 用户管理
- 🔐 RBAC 角色权限系统
- 💬 评论审核
- 📝 系统日志

## 🔌 API 接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 电影 | `/api/v1/movies` | 电影列表/详情/搜索 |
| 分类 | `/api/v1/genres` | 电影分类 |
| 认证 | `/api/v1/auth` | 登录/注册 |
| 用户 | `/api/v1/users` | 用户资料/收藏 |
| 评论 | `/api/v1/reviews` | 评论系统 |
| 管理 | `/api/v1/admin` | 后台管理 API |

## 🗄️ 数据库

项目使用 MySQL 数据库，主要表结构：

- `movies` - 电影主表
- `genres` - 分类表
- `users` - 用户表
- `reviews` - 评论表
- `roles` / `permissions` - RBAC 权限系统

详细的数据库设计请参考 `docs/` 目录。

## 📝 开发说明

### 默认管理员账号

```
邮箱: admin@moviehub.com
密码: admin123
```

### TMDB API

1. 访问 https://www.themoviedb.org/settings/api
2. 申请 API Key
3. 配置到 `backend/.env` 中的 `TMDB_API_KEY`

## 📄 License

MIT License
