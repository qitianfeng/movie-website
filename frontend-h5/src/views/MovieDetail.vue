<template>
  <div class="detail-page" v-if="movie">
    <!-- Backdrop -->
    <div class="backdrop">
      <img 
        :src="`https://image.tmdb.org/t/p/w780${movie.backdrop_path || movie.backdropPath || movie.poster_path || movie.posterPath}`" 
        :alt="movie.title"
        class="backdrop-image"
      >
      <div class="backdrop-gradient"></div>
      <button class="back-btn" @click="$router.back()">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <div class="share-btn" @click="shareMovie">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
        </svg>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content">
      <!-- Poster & Actions -->
      <div class="poster-section">
        <div class="poster-wrapper">
          <img 
            :src="`https://image.tmdb.org/t/p/w342${movie.poster_path || movie.posterPath}`" 
            :alt="movie.title"
            class="poster"
          >
          <div class="poster-glow"></div>
        </div>
        <div class="actions">
          <button class="action-btn favorite" :class="{ active: isFavorite }" @click="toggleFavorite">
            <svg viewBox="0 0 24 24" width="20" height="20" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>{{ isFavorite ? '已收藏' : '收藏' }}</span>
          </button>
          <button class="action-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <span>分享</span>
          </button>
        </div>
      </div>

      <!-- Info Section -->
      <div class="info-section">
        <h1 class="title">{{ movie.title }}</h1>
        
        <div class="rating-row">
          <div class="rating-badge">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          <span>{{ Number(movie.vote_average || movie.voteAverage).toFixed(1) }}</span>
          </div>
          <div class="meta-info">
            <span class="year">{{ getYear(movie.release_date || movie.releaseDate) }}</span>
            <span class="dot">·</span>
            <span class="runtime" v-if="movie.runtime">{{ movie.runtime }}分钟</span>
            <span class="dot" v-if="movie.runtime">·</span>
            <span class="status">HD</span>
          </div>
        </div>

        <div class="genres">
          <span v-for="genre in movie.genres" :key="genre.id" class="genre-tag">
            {{ genre.name }}
          </span>
        </div>

        <p class="tagline" v-if="movie.tagline">"{{ movie.tagline }}"</p>
        
        <div class="overview-section">
          <h3>剧情简介</h3>
          <p class="overview">{{ movie.overview || '暂无简介' }}</p>
        </div>
      </div>

      <!-- Cast -->
      <div class="cast-section" v-if="movie.cast && movie.cast.length > 0">
        <h3 class="section-title">
          <span class="title-icon">🎭</span>
          演员表
        </h3>
        <div class="cast-list">
          <div v-for="person in movie.cast.slice(0, 10)" :key="person.id" class="cast-item">
            <div class="cast-photo-wrapper">
              <img 
                :src="person.profilePath ? `https://image.tmdb.org/t/p/w185${person.profilePath}` : '/no-avatar.jpg'"
                :alt="person.name"
                class="cast-photo"
              >
            </div>
            <span class="cast-name">{{ person.name }}</span>
            <span class="cast-character">{{ person.character }}</span>
          </div>
        </div>
      </div>

      <!-- Videos -->
      <div class="videos-section" v-if="movie.videos && movie.videos.length > 0">
        <h3 class="section-title">
          <span class="title-icon">🎬</span>
          预告片
        </h3>
        <div class="video-list">
          <div v-for="video in movie.videos.filter(v => v.site === 'YouTube').slice(0, 2)" :key="video.key" class="video-item">
            <div class="video-wrapper">
              <iframe 
                :src="getVideoUrl(video.key)"
                frameborder="0"
                allowfullscreen
                class="video-frame"
                referrerpolicy="no-referrer"
              ></iframe>
            </div>
            <span class="video-name">{{ video.name }}</span>
          </div>
        </div>
      </div>

      <!-- Reviews -->
      <div class="reviews-section">
        <h3 class="section-title">
          <span class="title-icon">💬</span>
          用户评论
          <span class="review-count">{{ reviews.length }}</span>
        </h3>
        
        <div class="review-form" v-if="isLoggedIn">
          <div class="rating-input">
            <span 
              v-for="i in 10" 
              :key="i" 
              class="star" 
              :class="{ active: i <= newReview.rating }"
              @click="newReview.rating = i"
            >★</span>
            <span class="rating-text">{{ newReview.rating }}/10</span>
          </div>
          <textarea 
            v-model="newReview.content" 
            placeholder="分享你对这部电影的看法..."
            class="review-textarea"
          ></textarea>
          <button class="submit-btn" @click="submitReview" :disabled="submitting">
            {{ submitting ? '提交中...' : '发布评论' }}
          </button>
        </div>
        
        <div class="login-hint" v-else>
          <router-link to="/profile">登录后发表评论</router-link>
        </div>
        
        <div class="review-list">
          <transition-group name="review">
            <div v-for="review in reviews" :key="review.id" class="review-item">
              <div class="review-header">
                <div class="reviewer-info">
                  <div class="reviewer-avatar">{{ review.username?.charAt(0)?.toUpperCase() }}</div>
                  <div class="reviewer-meta">
                    <span class="reviewer">{{ review.username }}</span>
                    <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                  </div>
                </div>
                <div class="review-rating">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="#ffd700">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                  {{ review.rating }}/10
                </div>
              </div>
              <p class="review-content">{{ review.content }}</p>
            </div>
          </transition-group>
        </div>
        <div class="no-reviews" v-if="reviews.length === 0">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="rgba(255,255,255,0.2)">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <p>暂无评论</p>
          <p class="hint">快来发表第一条评论吧！</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading-page" v-else>
    <div class="loader">
      <div class="loader-ring"></div>
      <div class="loader-ring"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'
const route = useRoute()
const router = useRouter()

const movie = ref(null)
const reviews = ref([])
const isFavorite = ref(false)
const isLoggedIn = ref(false)
const submitting = ref(false)
const newReview = ref({ rating: 5, content: '' })

const getYear = (date) => date ? new Date(date).getFullYear() : ''
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// YouTube 代理配置
// 支持多个代理源，默认使用 Piped
const VIDEO_PROXIES = {
  piped: 'https://piped.video',           // Piped 官方 (推荐)
  invidious: 'https://yewtu.be',          // Invidious 实例
  youtube: 'https://www.youtube-nocookie.com' // YouTube (需代理)
}

// 从 localStorage 获取用户选择的代理，默认 piped
const getVideoProxy = () => {
  return localStorage.getItem('video_proxy') || 'piped'
}

const getVideoUrl = (videoKey) => {
  const proxyType = getVideoProxy()
  const proxyBase = VIDEO_PROXIES[proxyType] || VIDEO_PROXIES.piped
  return `${proxyBase}/embed/${videoKey}`
}

const checkAuth = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
  return token
}

const loadMovie = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/movies/${route.params.id}`)
    movie.value = res.data.data
  } catch (e) {
    console.error('Failed to load movie:', e)
  }
}

const loadReviews = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/reviews/movie/${route.params.id}`)
    reviews.value = res.data.data.reviews || []
  } catch (e) {
    console.error('Failed to load reviews:', e)
  }
}

const toggleFavorite = async () => {
  const token = checkAuth()
  if (!token) {
    router.push('/profile')
    return
  }
  try {
    if (isFavorite.value) {
      await axios.delete(`${API_BASE_URL}/users/favorites/${route.params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } else {
      await axios.post(`${API_BASE_URL}/users/favorites`, 
        { movieId: route.params.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }
    isFavorite.value = !isFavorite.value
  } catch (e) {
    console.error('Failed to toggle favorite:', e)
  }
}

const shareMovie = () => {
  if (navigator.share) {
    navigator.share({
      title: movie.value.title,
      text: movie.value.overview?.slice(0, 100),
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    alert('链接已复制到剪贴板')
  }
}

const submitReview = async () => {
  const token = checkAuth()
  if (!token) return
  
  if (!newReview.value.content.trim()) {
    alert('请填写评论内容')
    return
  }

  submitting.value = true
  try {
    await axios.post(`${API_BASE_URL}/reviews`, {
      movieId: route.params.id,
      rating: newReview.value.rating,
      content: newReview.value.content
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    newReview.value = { rating: 5, content: '' }
    await loadReviews()
  } catch (e) {
    console.error('Failed to submit review:', e)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadMovie()
  await loadReviews()
  checkAuth()
})
</script>

<style scoped>
.detail-page {
  background: #0f0f0f;
  color: #fff;
  min-height: 100vh;
}

/* Backdrop */
.backdrop {
  position: relative;
  height: 300px;
  overflow: hidden;
}

.backdrop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: zoomIn 1s ease-out;
}

@keyframes zoomIn {
  from {
    transform: scale(1.1);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.backdrop-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(15,15,15,0.4) 0%,
    rgba(15,15,15,0.2) 40%,
    rgba(15,15,15,0.8) 80%,
    rgba(15,15,15,1) 100%
  );
}

.back-btn, .share-btn {
  position: absolute;
  top: 16px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.back-btn {
  left: 16px;
}

.share-btn {
  right: 16px;
}

.back-btn:active, .share-btn:active {
  transform: scale(0.95);
  background: rgba(0,0,0,0.8);
}

/* Content */
.content {
  padding: 0 16px 40px;
  margin-top: -100px;
  position: relative;
}

/* Poster Section */
.poster-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.poster-wrapper {
  position: relative;
}

.poster {
  width: 130px;
  height: 195px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}

.poster-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(ellipse at center, rgba(229,9,20,0.2) 0%, transparent 70%);
  filter: blur(20px);
  z-index: -1;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: flex-end;
  flex: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:active {
  transform: scale(0.98);
}

.action-btn.favorite {
  background: rgba(229,9,20,0.2);
  border-color: rgba(229,9,20,0.3);
}

.action-btn.favorite.active {
  background: #e50914;
  border-color: #e50914;
}

/* Info Section */
.info-section {
  animation: slideUp 0.6s ease-out 0.1s both;
}

.title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.2;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: 20px;
  color: #000;
  font-weight: 700;
  font-size: 14px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}

.dot {
  color: rgba(255,255,255,0.3);
}

.status {
  color: #4ade80;
  font-weight: 500;
}

.genres {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.genre-tag {
  padding: 6px 14px;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.tagline {
  font-style: italic;
  color: rgba(255,255,255,0.6);
  margin-bottom: 20px;
  font-size: 15px;
  padding-left: 12px;
  border-left: 3px solid #e50914;
}

.overview-section {
  margin-bottom: 24px;
}

.overview-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.overview {
  font-size: 15px;
  line-height: 1.7;
  color: rgba(255,255,255,0.8);
}

/* Section Titles */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.title-icon {
  font-size: 16px;
}

.review-count {
  margin-left: auto;
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  font-weight: 400;
}

/* Cast Section */
.cast-section, .videos-section, .reviews-section {
  margin-bottom: 32px;
  animation: slideUp 0.6s ease-out 0.2s both;
}

.cast-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.cast-list::-webkit-scrollbar {
  display: none;
}

.cast-item {
  flex-shrink: 0;
  width: 100px;
  text-align: center;
}

.cast-photo-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 10px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255,255,255,0.1);
}

.cast-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cast-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.cast-character {
  display: block;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
}

/* Videos */
.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-item {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
}

.video-wrapper {
  position: relative;
  padding-bottom: 56.25%;
}

.video-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.video-name {
  display: block;
  padding: 12px;
  font-size: 13px;
}

/* Reviews */
.review-form {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(255,255,255,0.05);
}

.rating-input {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}

.star {
  font-size: 28px;
  color: rgba(255,255,255,0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.star:hover, .star.active {
  color: #ffd700;
  transform: scale(1.1);
}

.rating-text {
  margin-left: 16px;
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  font-weight: 500;
}

.review-textarea {
  width: 100%;
  height: 100px;
  padding: 14px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  resize: none;
  margin-bottom: 16px;
  font-family: inherit;
}

.review-textarea::placeholder {
  color: rgba(255,255,255,0.4);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.5;
}

.login-hint {
  padding: 20px;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
}

.login-hint a {
  color: #e50914;
  text-decoration: none;
  font-weight: 500;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-item {
  background: #1a1a1a;
  padding: 16px;
  border-radius: 12px;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.review-enter-active, .review-leave-active {
  transition: all 0.3s ease;
}

.review-enter-from, .review-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reviewer-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.reviewer-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reviewer {
  font-weight: 500;
  font-size: 14px;
}

.review-date {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
}

.review-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
}

.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255,255,255,0.85);
}

.no-reviews {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255,255,255,0.4);
}

.no-reviews p {
  margin-top: 12px;
}

.no-reviews .hint {
  font-size: 13px;
  color: rgba(255,255,255,0.25);
}

/* Loading */
.loading-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0f0f0f;
}

.loader {
  position: relative;
  width: 50px;
  height: 50px;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
