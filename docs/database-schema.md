# 数据库 Schema 设计

## MongoDB Collections

### 1. Movies (电影集合)

```javascript
{
  _id: ObjectId,
  tmdbId: Number,              // TMDB ID
  title: String,               // 标题
  originalTitle: String,       // 原标题
  overview: String,            // 简介
  posterPath: String,          // 海报路径
  backdropPath: String,        // 背景图路径
  releaseDate: Date,           // 上映日期
  runtime: Number,             // 时长（分钟）
  genres: [{
    id: Number,
    name: String
  }],
  voteAverage: Number,         // 评分
  voteCount: Number,           // 评分人数
  popularity: Number,          // 热度
  originalLanguage: String,    // 原语言
  spokenLanguages: [String],
  status: String,              // 状态
  tagline: String,             // 标语
  cast: [{                     // 演员
    id: Number,
    name: String,
    character: String,
    profilePath: String,
    order: Number
  }],
  crew: [{                     // 剧组
    id: Number,
    name: String,
    job: String,
    department: String
  }],
  videos: [{                   // 视频
    key: String,
    name: String,
    site: String,
    type: String
  }],
  images: {
    backdrops: [String],
    posters: [String]
  },
  isPopular: Boolean,          // 是否热门
  isTrending: Boolean,         // 是否趋势
  lastUpdated: Date,
  createdAt: Date
}

// Indexes
- tmdbId: unique
- title: text
- genres.id
- isPopular
- isTrending
- releaseDate
```

### 2. Genres (分类集合)

```javascript
{
  _id: ObjectId,
  id: Number,                  // TMDB Genre ID
  name: String,                // 分类名称
  nameEn: String,              // 英文名称
  description: String,         // 描述
  icon: String,                // 图标
  movieCount: Number,          // 电影数量
  createdAt: Date
}
```

### 3. Users (用户集合)

```javascript
{
  _id: ObjectId,
  username: String,            // 用户名
  email: String,               // 邮箱
  password: String,            // 密码（hash）
  avatar: String,              // 头像
  role: String,                // 角色: user/admin
  favorites: [ObjectId],       // 收藏的电影ID
  watchlist: [ObjectId],       // 想看列表
  ratings: [{                  // 评分记录
    movieId: ObjectId,
    rating: Number,
    createdAt: Date
  }],
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- email: unique
- username: unique
```

### 4. Reviews (评论集合)

```javascript
{
  _id: ObjectId,
  movieId: ObjectId,           // 电影ID
  userId: ObjectId,            // 用户ID
  rating: Number,              // 评分 1-10
  content: String,             // 评论内容
  isApproved: Boolean,         // 是否审核通过
  likes: Number,               // 点赞数
  createdAt: Date,
  updatedAt: Date
}

// Indexes
- movieId
- userId
```

### 5. Settings (系统设置)

```javascript
{
  _id: ObjectId,
  key: String,                 // 设置键
  value: Mixed,                // 设置值
  description: String,         // 描述
  updatedAt: Date
}
```

## 数据同步策略

### 从 TMDB 同步
1. **首次同步**
   - 同步所有分类（genres）
   - 同步热门电影（popular）
   - 同步趋势电影（trending）
   - 每部电影的详细信息、演员、视频

2. **增量同步**（每日）
   - 更新已有电影信息
   - 同步新上映电影
   - 更新评分和热度

3. **图片处理**
   - 使用 TMDB 图片 CDN
   - 图片路径: `https://image.tmdb.org/t/p/{size}/{path}`
   - 尺寸: w92, w154, w185, w342, w500, w780, original

## 缓存策略

### Redis 缓存
- 热门电影列表: 1小时
- 电影详情: 30分钟
- 分类列表: 24小时
- 搜索结果: 15分钟
