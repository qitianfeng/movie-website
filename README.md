# 🎬 MovieHub - 电影网站全栈项目

一个现代化的电影信息网站，包含 H5 移动端和后台管理系统。

![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![License](https://img.shields.io/badge/License-MIT-green)

## 📸 项目截图

### H5 移动端
- 首页轮播 + 热门电影推荐
- 电影列表 + 分类筛选
- 电影详情 + 演员表 + 预告片

### 管理后台
- 数据统计仪表盘 (ECharts)
- 电影管理 + TMDB 数据同步
- 轮播管理
- RBAC 角色权限系统

---

## 📁 项目结构

```
movie-website/
├── backend/                # Node.js + Express API
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── middleware/    # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API 路由
│   │   └── utils/         # 工具函数
│   └── .env.example       # 环境变量模板
├── frontend-h5/           # Vue 3 H5 移动端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── views/         # 页面
│   │   ├── stores/        # Pinia 状态管理
│   │   └── router/        # 路由配置
│   └── vite.config.js
├── frontend-admin/        # Vue 3 后台管理
│   ├── src/
│   │   └── views/         # 页面组件
│   └── vite.config.js
├── docs/                  # 文档
│   ├── api-documentation.md
│   └── database-schema.md
└── docker-compose.yml     # Docker 部署配置
```

---

## 🛠 技术栈

### 后端
- **Node.js 18+** - 运行时
- **Express** - Web 框架
- **MySQL 8.0** - 数据库
- **mysql2** - MySQL 驱动
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

### H5 前端
- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **Pinia** - 状态管理
- **Vue Router** - 路由
- **Axios** - HTTP 请求

### 管理后台
- **Vue 3** - 前端框架
- **Element Plus** - UI 组件库
- **ECharts** - 图表库
- **Vite** - 构建工具

### 数据源
- **TMDB API** - 电影数据来源

---

## 🚀 快速开始

### 环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| MySQL | 8.0+ | 数据库 |
| npm / yarn | 最新 | 包管理器 |

### 1. 克隆项目

```bash
git clone https://github.com/qitianfeng/movie-website.git
cd movie-website
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
```

编辑 `backend/.env`：

```env
# 服务配置
NODE_ENV=development
PORT=3001

# MySQL 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=movie_db

# JWT 配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d

# TMDB API (从 https://www.themoviedb.org/settings/api 获取)
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_PROXY=http://127.0.0.1:7890
```

### 3. 安装依赖

```bash
# 后端
cd backend && npm install

# H5 前端 (新终端)
cd frontend-h5 && npm install

# 管理后台 (新终端)
cd frontend-admin && npm install
```

### 4. 创建数据库

```bash
# 方式一：自动创建（推荐）
# 后端启动时会自动创建数据库表和默认数据

# 方式二：手动创建
mysql -u root -p
CREATE DATABASE movie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 启动服务

```bash
# 1. 启动后端 (端口 3001)
cd backend
npm start

# 2. 启动 H5 前端 (端口 5173)
cd frontend-h5
npm run dev

# 3. 启动管理后台 (端口 5174)
cd frontend-admin
npm run dev -- --port 5174
```

### 6. 访问应用

| 应用 | 地址 | 说明 |
|------|------|------|
| H5 移动端 | http://localhost:5173 | 手机端界面 |
| 管理后台 | http://localhost:5174 | 后台管理系统 |
| API 服务 | http://localhost:3001/api/v1 | REST API |

---

## 📊 功能特性

### H5 移动端

| 功能 | 说明 |
|------|------|
| 🎠 首页轮播 | 可后台管理，支持触摸滑动 |
| 🔥 热门电影 | 从 TMDB 同步的热门数据 |
| 📈 趋势电影 | 实时趋势电影展示 |
| 🎯 分类筛选 | 按电影类型筛选 |
| 🔍 电影搜索 | 支持标题搜索 |
| 📱 响应式设计 | 适配各种手机屏幕 |
| 💬 用户评论 | 登录用户可发表评论 |
| ❤️ 收藏功能 | 收藏喜欢的电影 |

### 管理后台

| 功能 | 说明 |
|------|------|
| 📈 数据统计 | ECharts 图表展示 |
| 🎬 电影管理 | CRUD + TMDB 搜索导入 |
| 🖼️ 轮播管理 | 管理首页轮播电影 |
| 📂 分类管理 | 电影分类 CRUD |
| 👥 用户管理 | 用户列表与角色分配 |
| 🔐 角色管理 | RBAC 权限系统 |
| 💬 评论审核 | 审核用户评论 |
| 📝 系统日志 | 操作日志记录 |
| ⚙️ 系统设置 | 系统配置管理 |

---

## 🔌 API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/movies` | 电影列表 |
| GET | `/api/v1/movies/:id` | 电影详情 |
| GET | `/api/v1/movies/popular` | 热门电影 |
| GET | `/api/v1/movies/trending` | 趋势电影 |
| GET | `/api/v1/movies/search` | 搜索电影 |
| GET | `/api/v1/movies/banners` | 轮播电影 |
| GET | `/api/v1/genres` | 分类列表 |
| POST | `/api/v1/auth/register` | 用户注册 |
| POST | `/api/v1/auth/login` | 用户登录 |

### 需要认证的接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/users/profile` | 用户资料 |
| POST | `/api/v1/users/favorites` | 添加收藏 |
| DELETE | `/api/v1/users/favorites/:id` | 取消收藏 |
| POST | `/api/v1/reviews` | 发表评论 |

### 管理接口 (需要管理员权限)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/admin/sync` | 同步 TMDB 数据 |
| GET | `/api/v1/admin/stats` | 统计数据 |
| GET | `/api/v1/admin/banners` | 获取轮播列表 |
| POST | `/api/v1/admin/banners/:id` | 添加轮播 |
| DELETE | `/api/v1/admin/banners/:id` | 移除轮播 |

---

## 🗄️ 数据库

### 主要表结构

| 表名 | 说明 |
|------|------|
| `movies` | 电影主表 |
| `genres` | 分类表 |
| `movie_genres` | 电影-分类关联 |
| `users` | 用户表 |
| `reviews` | 评论表 |
| `user_favorites` | 用户收藏 |
| `user_watchlist` | 用户待看 |
| `movie_cast` | 演员表 |
| `movie_videos` | 视频表 |
| `roles` | 角色表 (RBAC) |
| `permissions` | 权限表 (RBAC) |
| `role_permissions` | 角色-权限关联 |

详细的 DDL 请参考 [`docs/database-schema.md`](docs/database-schema.md)

---

## 📝 默认账号

### 管理员账号

```
邮箱: admin@moviehub.com
密码: admin123
角色: 超级管理员 (所有权限)
```

### RBAC 角色权限

| 角色 | 权限范围 |
|------|----------|
| 超级管理员 | 所有权限 |
| 管理员 | 电影、分类、用户、评论管理 |
| 编辑 | 电影、评论管理 |
| 访客 | 仅查看数据 |

---

## 🐳 Docker 部署

```bash
# 使用 Docker Compose 一键部署
docker-compose up -d
```

服务启动后：
- 后端 API: http://localhost:3001
- H5 前端: http://localhost:5173
- 管理后台: http://localhost:5174

---

## 🔧 开发指南

### 获取 TMDB API Key

1. 访问 https://www.themoviedb.org
2. 注册/登录账号
3. 进入 Settings -> API
4. 申请 API Key (Request an API Key)
5. 复制 API Key 到 `.env` 文件

### 同步电影数据

1. 登录管理后台
2. 进入仪表盘
3. 点击"同步电影数据"按钮
4. 等待同步完成

### 添加轮播电影

方式一：从 TMDB 同步
1. 管理后台 -> 仪表盘
2. 点击"同步轮播图"

方式二：手动选择
1. 管理后台 -> 轮播管理
2. 点击"添加轮播"
3. 搜索并选择电影

---

## 📄 License

[MIT License](LICENSE)

---

## 🙏 致谢

- [TMDB](https://www.themoviedb.org/) - 电影数据来源
- [Vue.js](https://vuejs.org/) - 前端框架
- [Element Plus](https://element-plus.org/) - UI 组件库
- [ECharts](https://echarts.apache.org/) - 图表库
