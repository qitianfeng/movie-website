# API 接口文档

## Base URL
```
http://localhost:3001/api/v1
```

## 认证
使用 JWT Token
```
Authorization: Bearer <token>
```

---

## 1. 电影接口

### 1.1 获取电影列表
```http
GET /movies
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码，默认1 |
| limit | Number | 否 | 每页数量，默认20 |
| genre | Number | 否 | 分类ID |
| sort | String | 否 | 排序: popularity, release_date, vote_average |
| year | Number | 否 | 年份筛选 |
| keyword | String | 否 | 关键词搜索 |

**Response:**
```json
{
  "success": true,
  "data": {
    "movies": [
      {
        "id": "507f1f77bcf86cd799439011",
        "tmdbId": 550,
        "title": " Fight Club",
        "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        "voteAverage": 8.4,
        "releaseDate": "1999-10-15",
        "genres": ["Drama", "Thriller"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1000,
      "totalPages": 50
    }
  }
}
```

### 1.2 获取电影详情
```http
GET /movies/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "tmdbId": 550,
    "title": "Fight Club",
    "originalTitle": "Fight Club",
    "overview": "A ticking-time-bomb insomniac...",
    "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "backdropPath": "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
    "releaseDate": "1999-10-15",
    "runtime": 139,
    "genres": [
      {"id": 18, "name": "Drama"},
      {"id": 53, "name": "Thriller"}
    ],
    "voteAverage": 8.4,
    "voteCount": 24350,
    "cast": [
      {
        "id": 819,
        "name": "Edward Norton",
        "character": "The Narrator",
        "profilePath": "/5XBzD5WuTyVQZeS4VI25z2moMeY.jpg"
      }
    ],
    "videos": [
      {
        "key": "SUXWAEX2jlg",
        "name": "Fight Club Trailer",
        "site": "YouTube",
        "type": "Trailer"
      }
    ]
  }
}
```

### 1.3 获取热门电影
```http
GET /movies/popular
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| limit | Number | 否 | 数量，默认20 |

### 1.4 获取趋势电影
```http
GET /movies/trending
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeWindow | String | 否 | day/week，默认week |

### 1.5 搜索电影
```http
GET /movies/search
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | String | 是 | 搜索关键词 |
| page | Number | 否 | 页码 |

---

## 2. 分类接口

### 2.1 获取分类列表
```http
GET /genres
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 28,
      "name": "动作",
      "nameEn": "Action",
      "movieCount": 1500
    },
    {
      "id": 35,
      "name": "喜剧",
      "nameEn": "Comedy",
      "movieCount": 2300
    }
  ]
}
```

### 2.2 获取分类下的电影
```http
GET /genres/:id/movies
```

---

## 3. 用户接口

### 3.1 注册
```http
POST /auth/register
```

**Body:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
```

### 3.2 登录
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "user123",
      "email": "user@example.com",
      "avatar": "https://..."
    }
  }
}
```

### 3.3 获取用户信息
```http
GET /users/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

### 3.4 添加收藏
```http
POST /users/favorites
```

**Body:**
```json
{
  "movieId": "507f1f77bcf86cd799439011"
}
```

### 3.5 获取收藏列表
```http
GET /users/favorites
```

---

## 4. 评论接口

### 4.1 添加评论
```http
POST /reviews
```

**Body:**
```json
{
  "movieId": "507f1f77bcf86cd799439011",
  "rating": 9,
  "content": "这是一部很棒的电影！"
}
```

### 4.2 获取电影评论
```http
GET /movies/:id/reviews
```

**Query Parameters:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Number | 否 | 页码 |
| limit | Number | 否 | 数量 |

---

## 5. 管理接口

### 5.1 同步 TMDB 数据
```http
POST /admin/sync
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Body:**
```json
{
  "type": "movies",
  "page": 1,
  "limit": 100
}
```

### 5.2 获取系统统计
```http
GET /admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMovies": 5000,
    "totalUsers": 1200,
    "totalReviews": 3500,
    "todayViews": 5000
  }
}
```

---

## 错误响应

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "请求参数错误",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

## 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
