# 数据库 Schema 设计 (MySQL 8.0)

## 📋 表结构概览

| 表名 | 说明 |
|------|------|
| `movies` | 电影主表 |
| `genres` | 分类表 |
| `movie_genres` | 电影-分类关联表 |
| `users` | 用户表 |
| `reviews` | 评论表 |
| `user_favorites` | 用户收藏表 |
| `user_watchlist` | 用户待看表 |
| `movie_cast` | 演员表 |
| `movie_videos` | 视频表 |
| `roles` | 角色表 (RBAC) |
| `permissions` | 权限表 (RBAC) |
| `role_permissions` | 角色-权限关联表 |

---

## 🗄️ 完整 DDL

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS movie_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE movie_db;

-- ==================== 电影相关表 ====================

-- 电影表
CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT UNIQUE NOT NULL COMMENT 'TMDB ID',
  title VARCHAR(255) NOT NULL COMMENT '电影标题',
  original_title VARCHAR(255) COMMENT '原标题',
  overview TEXT COMMENT '剧情简介',
  poster_path VARCHAR(255) COMMENT '海报路径',
  backdrop_path VARCHAR(255) COMMENT '背景图路径',
  release_date DATE COMMENT '上映日期',
  runtime INT COMMENT '时长(分钟)',
  vote_average DECIMAL(3,1) DEFAULT 0 COMMENT '评分(0-10)',
  vote_count INT DEFAULT 0 COMMENT '评分人数',
  popularity DECIMAL(10,2) DEFAULT 0 COMMENT '热度',
  original_language VARCHAR(10) COMMENT '原语言',
  status VARCHAR(50) COMMENT '状态',
  tagline VARCHAR(255) COMMENT '标语',
  is_popular BOOLEAN DEFAULT FALSE COMMENT '是否热门',
  is_trending BOOLEAN DEFAULT FALSE COMMENT '是否趋势',
  is_banner BOOLEAN DEFAULT FALSE COMMENT '是否轮播',
  banner_order INT DEFAULT 0 COMMENT '轮播排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT INDEX idx_title_overview (title, overview),
  INDEX idx_popularity (popularity),
  INDEX idx_release_date (release_date),
  INDEX idx_tmdb_id (tmdb_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 分类表
CREATE TABLE IF NOT EXISTS genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tmdb_id INT UNIQUE NOT NULL COMMENT 'TMDB 分类ID',
  name VARCHAR(100) NOT NULL COMMENT '分类名称(中文)',
  name_en VARCHAR(100) COMMENT '分类名称(英文)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 电影-分类关联表
CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id INT NOT NULL,
  genre_id INT NOT NULL,
  PRIMARY KEY (movie_id, genre_id),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 演员表
CREATE TABLE IF NOT EXISTS movie_cast (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  tmdb_id INT COMMENT '演员 TMDB ID',
  name VARCHAR(255) COMMENT '演员名称',
  character_name VARCHAR(255) COMMENT '角色名称',
  profile_path VARCHAR(255) COMMENT '头像路径',
  `order` INT COMMENT '排序',
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  INDEX idx_movie_id (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 视频表
CREATE TABLE IF NOT EXISTS movie_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  video_key VARCHAR(100) COMMENT '视频Key(YouTube)',
  name VARCHAR(255) COMMENT '视频名称',
  site VARCHAR(50) COMMENT '平台(YouTube)',
  type VARCHAR(50) COMMENT '类型(Trailer/Teaser)',
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  INDEX idx_movie_id (movie_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 用户相关表 ====================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL COMMENT '用户名',
  email VARCHAR(255) UNIQUE NOT NULL COMMENT '邮箱',
  password VARCHAR(255) NOT NULL COMMENT '密码(hash)',
  avatar VARCHAR(255) DEFAULT '' COMMENT '头像',
  role ENUM('user', 'admin') DEFAULT 'user' COMMENT '角色(旧)',
  role_id INT NULL COMMENT '角色ID(RBAC)',
  last_login TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, movie_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户待看表
CREATE TABLE IF NOT EXISTS user_watchlist (
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, movie_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== 评论表 ====================

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  movie_id INT NOT NULL,
  rating DECIMAL(2,1) NOT NULL COMMENT '评分(1-10)',
  content TEXT COMMENT '评论内容',
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT '审核状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_movie (user_id, movie_id),
  INDEX idx_movie_id (movie_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==================== RBAC 权限系统表 ====================

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL COMMENT '角色标识',
  display_name VARCHAR(100) NOT NULL COMMENT '角色名称',
  description VARCHAR(255) COMMENT '角色描述',
  is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统角色',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL COMMENT '权限标识',
  display_name VARCHAR(100) NOT NULL COMMENT '权限名称',
  module VARCHAR(50) NOT NULL COMMENT '所属模块',
  description VARCHAR(255) COMMENT '权限描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色-权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 📊 默认数据

### 角色数据

| ID | name | display_name | description |
|----|------|--------------|-------------|
| 1 | super_admin | 超级管理员 | 拥有所有权限 |
| 2 | admin | 管理员 | 管理电影、评论、用户 |
| 3 | editor | 编辑 | 管理电影和评论 |
| 4 | viewer | 访客 | 只能查看数据 |

### 权限数据

| 模块 | 权限 | 说明 |
|------|------|------|
| movie | movie:view | 查看电影 |
| movie | movie:create | 创建电影 |
| movie | movie:edit | 编辑电影 |
| movie | movie:delete | 删除电影 |
| movie | movie:sync | 同步电影 |
| genre | genre:view | 查看分类 |
| genre | genre:create | 创建分类 |
| genre | genre:edit | 编辑分类 |
| genre | genre:delete | 删除分类 |
| user | user:view | 查看用户 |
| user | user:edit | 编辑用户 |
| user | user:delete | 删除用户 |
| review | review:view | 查看评论 |
| review | review:audit | 审核评论 |
| review | review:delete | 删除评论 |
| system | system:settings | 系统设置 |
| system | system:logs | 查看日志 |
| system | system:role | 角色管理 |

---

## 🔗 表关系图

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   movies    │────<│ movie_genres │>────│   genres    │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │         ┌─────────────┐
       ├────────<│ movie_cast  │
       │         └─────────────┘
       │
       │         ┌──────────────┐
       ├────────<│ movie_videos │
       │         └──────────────┘
       │
       │         ┌─────────────┐     ┌─────────────┐
       ├────────<│  reviews    │>────│    users   │
       │         └─────────────┘     └─────────────┘
       │                                    │
       │         ┌────────────────┐         │
       ├────────<│user_favorites  │>───────┤
       │         └────────────────┘         │
       │                                    │
       │         ┌────────────────┐         │
       └────────<│user_watchlist  │>───────┘
                 └────────────────┘

┌─────────────┐     ┌───────────────────┐     ┌─────────────┐
│   roles     │────<│ role_permissions  │>────│ permissions │
└─────────────┘     └───────────────────┘     └─────────────┘
       │
       │
       ▼
┌─────────────┐
│    users    │ (role_id)
└─────────────┘
```

---

## 📝 注意事项

1. **字符集**: 所有表使用 `utf8mb4` 支持 emoji 和特殊字符
2. **自动初始化**: 后端启动时会自动创建表和默认数据
3. **外键约束**: 使用 `ON DELETE CASCADE` 保证数据一致性
4. **全文索引**: `movies` 表的 `title` 和 `overview` 支持全文搜索

## 🚀 初始化数据库

### 方式一：自动初始化（推荐）

配置好 `.env` 后启动后端，会自动创建表和默认数据：

```bash
cd backend
npm install
npm start
```

### 方式二：手动执行 SQL

```bash
mysql -u root -p < docs/database-schema.sql
```
