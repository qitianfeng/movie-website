<template>
  <div class="search-page">
    <!-- Header -->
    <header class="header">
      <router-link to="/" class="back-btn">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </router-link>
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" class="search-icon">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索电影..."
          class="search-input"
          @keyup.enter="search"
        >
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <button class="search-btn" @click="search">搜索</button>
    </header>

    <!-- Search History -->
    <div class="history-section" v-if="!hasSearched && searchHistory.length > 0">
      <div class="section-header">
        <h3 class="section-title">搜索历史</h3>
        <button class="clear-history" @click="clearHistory">清空</button>
      </div>
      <div class="history-list">
        <span 
          v-for="(item, index) in searchHistory" 
          :key="index"
          class="history-item"
          @click="searchFromHistory(item)"
        >
          {{ item }}
        </span>
      </div>
    </div>

    <!-- Hot Searches -->
    <div class="hot-section" v-if="!hasSearched">
      <h3 class="section-title">热门搜索</h3>
      <div class="hot-list">
        <span 
          v-for="(item, index) in hotSearches" 
          :key="index"
          class="hot-item"
          @click="searchFromHistory(item)"
        >
          {{ item }}
        </span>
      </div>
    </div>

    <!-- Search Results -->
    <div class="results-section" v-if="hasSearched">
      <div class="results-header" v-if="searchResults.length > 0">
        <span class="results-count">找到 {{ searchResults.length }} 部电影</span>
      </div>

      <div class="results-grid" v-if="searchResults.length > 0">
        <div v-for="movie in searchResults" :key="movie.id" class="result-item">
          <MovieCard :movie="movie" />
        </div>
      </div>

      <div class="loading" v-if="loading">
        <div class="spinner-small"></div>
        <span>搜索中...</span>
      </div>

      <div class="no-results" v-if="!loading && searchResults.length === 0">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="rgba(255,255,255,0.3)">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <p>未找到相关电影</p>
        <p class="hint">试试其他关键词</p>
      </div>
    </div>

    <!-- Bottom Nav -->
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>首页</span>
      </router-link>
      <router-link to="/movies" class="nav-item">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
        <span>电影</span>
      </router-link>
      <router-link to="/search" class="nav-item active">
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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import MovieCard from '../components/MovieCard.vue'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const searchQuery = ref('')
const searchResults = ref([])
const searchHistory = ref([])
const hasSearched = ref(false)
const loading = ref(false)
const hotSearches = ref(['复仇者联盟', '星际穿越', '泰坦尼克号', '肖申克的救赎', '盗梦空间'])

const loadHistory = () => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
}

const saveHistory = (query) => {
  const history = searchHistory.value.filter(h => h !== query)
  history.unshift(query)
  searchHistory.value = history.slice(0, 10)
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

const search = async () => {
  if (!searchQuery.value.trim()) return

  loading.value = true
  hasSearched.value = true
  saveHistory(searchQuery.value.trim())

  try {
    const res = await axios.get(`${API_BASE_URL}/movies/search`, {
      params: { q: searchQuery.value.trim() }
    })
    searchResults.value = res.data.data.movies || []
  } catch (e) {
    console.error('Search failed:', e)
  } finally {
    loading.value = false
  }
}

const searchFromHistory = (query) => {
  searchQuery.value = query
  search()
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  hasSearched.value = false
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background: #0f0f0f;
  color: #fff;
  padding-bottom: 70px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #0f0f0f;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  color: #fff;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #2a2a2a;
  border-radius: 20px;
  padding: 8px 16px;
}

.search-icon {
  color: rgba(255,255,255,0.5);
  margin-right: 8px;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: rgba(255,255,255,0.4);
}

.clear-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  padding: 0;
  cursor: pointer;
}

.search-btn {
  background: none;
  border: none;
  color: #e50914;
  font-size: 14px;
  cursor: pointer;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.clear-history {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  cursor: pointer;
}

.history-section, .hot-section {
  padding: 20px 0;
}

.history-list, .hot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0 16px;
}

.history-item, .hot-item {
  padding: 6px 14px;
  background: #2a2a2a;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.history-item:hover, .hot-item:hover {
  background: #3a3a3a;
}

.results-section {
  padding: 16px;
}

.results-header {
  margin-bottom: 16px;
}

.results-count {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
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

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: rgba(255,255,255,0.5);
}

.no-results p {
  margin-top: 16px;
  font-size: 14px;
}

.no-results .hint {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
  margin-top: 8px;
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
