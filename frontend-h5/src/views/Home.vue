<template>
  <div class="home">
    <!-- Header -->
    <header class="header">
      <h1 class="logo">
        <span class="logo-movie">Movie</span><span class="logo-hub">Hub</span>
      </h1>
      <router-link to="/search" class="search-btn">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </router-link>
    </header>

    <!-- Banner Carousel -->
    <div class="banner-section" v-if="!loading && displayBannerMovies.length > 0"
         @touchstart="handleTouchStart"
         @touchend="handleTouchEnd">
      <div class="banner-carousel">
        <div 
          class="banner-slide" 
          v-for="(movie, index) in displayBannerMovies" 
          :key="movie.id"
          :class="{ active: currentSlide === index }"
          @click="goToMovie(movie.id)"
        >
          <img 
            :src="`https://image.tmdb.org/t/p/w780${movie.backdrop_path || movie.poster_path}`" 
            :alt="movie.title"
            class="banner-image"
            loading="lazy"
          >
          <div class="banner-overlay">
            <div class="banner-content">
              <div class="banner-badge">正在热映</div>
              <h2 class="banner-title">{{ movie.title }}</h2>
              <p class="banner-overview">{{ movie.overview?.slice(0, 100) }}...</p>
              <div class="banner-meta">
                <span class="rating">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  {{ Number(movie.vote_average || movie.voteAverage).toFixed(1) }}
                </span>
                <span class="year">{{ getYear(movie.release_date || movie.releaseDate) }}</span>
              </div>
              <button class="banner-btn">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                立即观看
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="banner-dots">
        <span 
          v-for="(_, index) in bannerCount" 
          :key="index"
          class="dot"
          :class="{ active: currentSlide === index }"
          @click="currentSlide = index"
        ></span>
      </div>
    </div>

    <!-- Skeleton Banner -->
    <div class="banner-skeleton" v-if="loading">
      <div class="skeleton-shimmer"></div>
    </div>

    <!-- Genres - 移到 Banner 之后，方便用户快速筛选 -->
    <section class="section genres-section">
      <div class="section-header">
        <h3 class="section-title">
          <span class="title-icon">🎬</span>
          电影分类
        </h3>
      </div>
      <div class="genre-scroll">
        <router-link 
          v-for="(genre, index) in genres" 
          :key="genre.id" 
          :to="`/movies?genre=${genre.tmdbId || genre.id}`"
          class="genre-chip"
          :style="{ animationDelay: `${index * 0.03}s` }"
        >
          <span class="genre-icon">{{ getGenreEmoji(genre.name) }}</span>
          <span class="genre-name">{{ genre.name }}</span>
        </router-link>
      </div>
    </section>

    <!-- Popular Movies -->
    <section class="section" v-if="popularMovies.length > 0">
      <div class="section-header">
        <h3 class="section-title">
          <span class="title-icon">🔥</span>
          热门电影
        </h3>
        <router-link to="/movies" class="see-all">
          查看全部
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </router-link>
      </div>
      <div class="movie-scroll">
        <div 
          v-for="(movie, index) in popularMovies" 
          :key="movie.id" 
          class="movie-card-wrapper"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <MovieCard :movie="movie" />
        </div>
      </div>
    </section>

    <!-- Recommendations -->
    <section class="section" v-if="recommendations.length > 0">
      <div class="section-header">
        <h3 class="section-title">
          <span class="title-icon">✨</span>
          为你推荐
        </h3>
      </div>
      <div class="movie-scroll">
        <div 
          v-for="(movie, index) in recommendations" 
          :key="movie.id" 
          class="movie-card-wrapper"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <MovieCard :movie="movie" />
        </div>
      </div>
    </section>

    <!-- Trending Movies -->
    <section class="section" v-if="trendingMovies.length > 0">
      <div class="section-header">
        <h3 class="section-title">
          <span class="title-icon">📈</span>
          趋势电影
        </h3>
        <router-link to="/movies" class="see-all">
          查看全部
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
          </svg>
        </router-link>
      </div>
      <div class="movie-scroll">
        <div 
          v-for="(movie, index) in trendingMovies" 
          :key="movie.id" 
          class="movie-card-wrapper"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <MovieCard :movie="movie" />
        </div>
      </div>
    </section>

    <!-- Loading -->
    <div class="loading-overlay" v-if="loading">
      <div class="loader">
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
        <div class="loader-ring"></div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span>首页</span>
      </router-link>
      <router-link to="/movies" class="nav-item" :class="{ active: $route.path === '/movies' }">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
        <span>电影</span>
      </router-link>
      <router-link to="/search" class="nav-item" :class="{ active: $route.path === '/search' }">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span>搜索</span>
      </router-link>
      <router-link to="/profile" class="nav-item" :class="{ active: $route.path === '/profile' }">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMovieStore } from '../stores/movie'
import MovieCard from '../components/MovieCard.vue'
import axios from 'axios'

const router = useRouter()
const movieStore = useMovieStore()

const popularMovies = ref([])
const trendingMovies = ref([])
const bannerMovies = ref([])
const genres = ref([])
const recommendations = ref([])
const loading = ref(true)
const currentSlide = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)

let slideInterval = null

const API_BASE_URL = 'http://localhost:3001/api/v1'

// 计算要显示的轮播电影（优先使用后台设置的轮播，否则使用热门电影）
const displayBannerMovies = computed(() => {
  if (bannerMovies.value.length > 0) {
    return bannerMovies.value.slice(0, 5)
  }
  return popularMovies.value.slice(0, 5)
})

// 计算轮播总数
const bannerCount = computed(() => displayBannerMovies.value.length)

const getYear = (date) => {
  if (!date) return ''
  return new Date(date).getFullYear()
}

const getGenreEmoji = (name) => {
  const emojis = {
    // 中文分类名
    '动作': '💥',
    '冒险': '🗺️',
    '动画': '🎨',
    '喜剧': '😂',
    '犯罪': '🔫',
    '纪录': '📹',
    '剧情': '🎭',
    '家庭': '👨‍👩‍👧‍👦',
    '奇幻': '🧙',
    '历史': '📜',
    '恐怖': '👻',
    '音乐': '🎵',
    '悬疑': '🔮',
    '爱情': '❤️',
    '科幻': '🚀',
    '电视电影': '📺',
    '惊悚': '😱',
    '战争': '⚔️',
    '西部': '🤠',
    // 英文分类名 (备用)
    'Action': '💥',
    'Adventure': '🗺️',
    'Animation': '🎨',
    'Comedy': '😂',
    'Crime': '🔫',
    'Documentary': '📹',
    'Drama': '🎭',
    'Family': '👨‍👩‍👧‍👦',
    'Fantasy': '🧙',
    'History': '📜',
    'Horror': '👻',
    'Music': '🎵',
    'Mystery': '🔮',
    'Romance': '❤️',
    'Science Fiction': '🚀',
    'TV Movie': '📺',
    'Thriller': '😱',
    'War': '⚔️',
    'Western': '🤠'
  }
  return emojis[name] || '🎬'
}

const goToMovie = (id) => {
  router.push(`/movie/${id}`)
}

// 触摸滑动处理
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
}

const handleTouchEnd = (e) => {
  touchEndX.value = e.changedTouches[0].clientX
  const diff = touchStartX.value - touchEndX.value
  
  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      // 向左滑 - 下一张
      currentSlide.value = (currentSlide.value + 1) % bannerCount.value
    } else {
      // 向右滑 - 上一张
      currentSlide.value = (currentSlide.value - 1 + bannerCount.value) % bannerCount.value
    }
    // 重置自动播放计时器
    if (slideInterval) {
      clearInterval(slideInterval)
    }
    slideInterval = setInterval(() => {
      currentSlide.value = (currentSlide.value + 1) % bannerCount.value
    }, 5000)
  }
}

const fetchRecommendations = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/movies/recommendations?limit=10`)
    const data = await res.json()
    if (data.success) {
      recommendations.value = data.data.recommendations || []
    }
  } catch (e) {
    console.error('Failed to fetch recommendations:', e)
  }
}

const fetchBannerMovies = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/movies/banners`)
    if (res.data.success) {
      bannerMovies.value = res.data.data || []
    }
  } catch (e) {
    console.error('Failed to fetch banner movies:', e)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      movieStore.fetchPopularMovies(),
      movieStore.fetchTrendingMovies(),
      movieStore.fetchGenres(),
      fetchRecommendations(),
      fetchBannerMovies()
    ])
    popularMovies.value = movieStore.popularMovies
    trendingMovies.value = movieStore.trendingMovies
    genres.value = movieStore.genres
    
    // Auto slide - 使用 bannerCount 而不是固定的 5
    slideInterval = setInterval(() => {
      if (bannerCount.value > 0) {
        currentSlide.value = (currentSlide.value + 1) % bannerCount.value
      }
    }, 5000)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (slideInterval) {
    clearInterval(slideInterval)
  }
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: #0f0f0f;
  color: #fff;
  padding-bottom: 70px;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(15,15,15,0.98) 0%, rgba(15,15,15,0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.logo {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -1px;
  display: flex;
}

.logo-movie {
  color: #fff;
}

.logo-hub {
  color: #e50914;
}

.search-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
  transition: all 0.3s ease;
}

.search-btn:active {
  transform: scale(0.95);
  background: rgba(255,255,255,0.2);
}

/* Banner */
.banner-section {
  position: relative;
  height: 320px;
  overflow: hidden;
}

.banner-carousel {
  position: relative;
  height: 100%;
}

.banner-slide {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.05);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.banner-slide.active {
  opacity: 1;
  transform: scale(1);
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(15,15,15,1) 0%,
    rgba(15,15,15,0.8) 30%,
    rgba(15,15,15,0.4) 60%,
    transparent 100%
  );
  display: flex;
  align-items: flex-end;
  padding: 24px 20px;
}

.banner-content {
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.banner-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e50914;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.banner-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.banner-overview {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 12px;
  line-height: 1.5;
  max-width: 90%;
}

.banner-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 14px;
}

.banner-meta .rating {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffd700;
  font-weight: 600;
}

.banner-meta .year {
  color: rgba(255,255,255,0.6);
}

.banner-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fff;
  color: #000;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.banner-btn:active {
  transform: scale(0.98);
}

.banner-dots {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: rgba(255,255,255,0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  width: 24px;
  background: #e50914;
}

/* Skeleton */
.banner-skeleton {
  height: 320px;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Sections */
.section {
  padding: 24px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 16px;
}

.see-all {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #e50914;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.see-all:active {
  opacity: 0.7;
}

.movie-scroll {
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 0 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  white-space: nowrap;
  flex-wrap: nowrap;
}

.movie-scroll::-webkit-scrollbar {
  display: none;
}

.movie-card-wrapper {
  flex-shrink: 0;
  width: 120px;
  scroll-snap-align: start;
  animation: fadeInUp 0.5s ease-out both;
}

/* 响应式电影卡片宽度 */
@media (max-width: 360px) {
  .movie-card-wrapper {
    width: 100px;
  }
}

@media (min-width: 500px) {
  .movie-card-wrapper {
    width: 140px;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Genres - 横向滚动的分类 chips */
.genre-scroll {
  display: flex;
  gap: 10px;
  padding: 0 16px 16px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
  flex-wrap: nowrap;
}

.genre-scroll::-webkit-scrollbar {
  display: none;
}

.genre-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.08);
  flex-shrink: 0;
  animation: fadeInUp 0.4s ease-out both;
}

.genre-chip:active {
  transform: scale(0.97);
  background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
  border-color: #e50914;
}

.genre-chip .genre-icon {
  font-size: 16px;
}

.genre-chip .genre-name {
  font-size: 13px;
  color: #fff;
  font-weight: 500;
}

/* Loading */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,15,15,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loader {
  position: relative;
  width: 60px;
  height: 60px;
}

.loader-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: #e50914;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader-ring:nth-child(2) {
  inset: 8px;
  border-top-color: #fff;
  animation-duration: 1.5s;
  animation-direction: reverse;
}

.loader-ring:nth-child(3) {
  inset: 16px;
  border-top-color: #e50914;
  animation-duration: 2s;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Bottom Nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  background: rgba(15,15,15,0.98);
  backdrop-filter: blur(20px);
  padding: 10px 0 8px;
  border-top: 1px solid rgba(255,255,255,0.08);
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
  transition: all 0.3s ease;
  padding: 4px 12px;
}

.nav-item.active {
  color: #e50914;
}

.nav-item svg {
  transition: transform 0.3s ease;
}

.nav-item.active svg {
  transform: scale(1.1);
}
</style>
