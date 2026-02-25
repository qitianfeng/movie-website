<template>
  <div class="movies-page">
    <!-- Header -->
    <header class="header">
      <router-link to="/" class="back-btn">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </router-link>
      <h1 class="header-title">电影</h1>
    </header>

    <!-- Genre Filter -->
    <div class="genre-filter">
      <button 
        class="genre-btn" 
        :class="{ active: !selectedGenre }"
        @click="selectGenre(null)"
      >
        全部
      </button>
      <button 
        v-for="genre in genres" 
        :key="genre.id"
        class="genre-btn"
        :class="{ active: selectedGenre === genre.tmdbId || selectedGenre === genre.id }"
        @click="selectGenre(genre.tmdbId || genre.id)"
      >
        {{ genre.name }}
      </button>
    </div>

    <!-- Sort Options -->
    <div class="sort-bar">
      <select v-model="sortBy" class="sort-select" @change="loadMovies(true)">
        <option value="popularity">按热度</option>
        <option value="release_date">按时间</option>
        <option value="vote_average">按评分</option>
      </select>
    </div>

    <!-- Movie Grid -->
    <div class="movie-grid">
      <div v-for="movie in movies" :key="movie.id" class="grid-item">
        <MovieCard :movie="movie" />
      </div>
    </div>

    <!-- Loading More -->
    <div class="loading-more" v-if="loading">
      <div class="spinner-small"></div>
      <span>加载中...</span>
    </div>

    <!-- No More -->
    <div class="no-more" v-if="!loading && !hasMore && movies.length > 0">
      没有更多了
    </div>

    <!-- Empty -->
    <div class="empty-state" v-if="!loading && movies.length === 0">
      <svg viewBox="0 0 24 24" width="64" height="64" fill="rgba(255,255,255,0.3)">
        <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
      </svg>
      <p>暂无电影数据</p>
    </div>

    <!-- Bottom Nav -->
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>首页</span>
      </router-link>
      <router-link to="/movies" class="nav-item active">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
        <span>电影</span>
      </router-link>
      <router-link to="/search" class="nav-item">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span>搜索</span>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import MovieCard from '../components/MovieCard.vue'

const API_BASE_URL = 'http://localhost:3001/api/v1'
const route = useRoute()

const movies = ref([])
const genres = ref([])
const selectedGenre = ref(null)
const sortBy = ref('popularity')
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const loadGenres = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/genres`)
    genres.value = res.data.data || []
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
}

const loadMovies = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  if (reset) {
    page.value = 1
    movies.value = []
    hasMore.value = true
  }

  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: 20,
      sort: sortBy.value
    }
    if (selectedGenre.value) {
      params.genre = selectedGenre.value
    }

    const res = await axios.get(`${API_BASE_URL}/movies`, { params })
    const newMovies = res.data.data.movies || []
    
    if (reset) {
      movies.value = newMovies
    } else {
      movies.value = [...movies.value, ...newMovies]
    }
    
    const pagination = res.data.data.pagination
    hasMore.value = pagination.page < pagination.totalPages
    page.value++
  } catch (e) {
    console.error('Failed to load movies:', e)
  } finally {
    loading.value = false
  }
}

const selectGenre = (genreId) => {
  selectedGenre.value = genreId
  loadMovies(true)
}

const handleScroll = () => {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    loadMovies()
  }
}

onMounted(async () => {
  await loadGenres()
  if (route.query.genre) {
    selectedGenre.value = parseInt(route.query.genre)
  }
  await loadMovies(true)
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.movies-page {
  min-height: 100vh;
  background: #0f0f0f;
  color: #fff;
  padding-bottom: 70px;
}

.header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #0f0f0f;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  color: #fff;
  margin-right: 12px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
}

.genre-filter {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  background: #1a1a1a;
}

.genre-filter::-webkit-scrollbar {
  display: none;
}

.genre-btn {
  flex-shrink: 0;
  padding: 6px 16px;
  background: #2a2a2a;
  border: none;
  border-radius: 20px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.genre-btn.active {
  background: #e50914;
}

.sort-bar {
  padding: 8px 16px;
  background: #0f0f0f;
}

.sort-select {
  padding: 8px 12px;
  background: #2a2a2a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 12px;
}

/* 响应式布局 - 小屏幕 2 列 */
@media (max-width: 360px) {
  .movie-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 8px;
  }
}

/* 响应式布局 - 大屏幕 4 列 */
@media (min-width: 500px) {
  .movie-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

/* 响应式布局 - 平板 5 列 */
@media (min-width: 768px) {
  .movie-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    padding: 16px;
  }
}

.grid-item {
  aspect-ratio: 2/3;
  min-width: 0; /* 防止内容溢出 */
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: rgba(255,255,255,0.6);
  font-size: 13px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.1);
  border-top-color: #e50914;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-more {
  text-align: center;
  padding: 20px;
  color: rgba(255,255,255,0.4);
  font-size: 13px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.5);
}

.empty-state p {
  margin-top: 16px;
  font-size: 14px;
}

/* Bottom Nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: rgba(15,15,15,0.95);
  backdrop-filter: blur(10px);
  padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-size: 10px;
  transition: color 0.3s;
}

.nav-item.active {
  color: #e50914;
}
</style>
