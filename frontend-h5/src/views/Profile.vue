<template>
  <div class="profile-page">
    <!-- Header -->
    <header class="header">
      <h1 class="header-title">{{ isLoggedIn ? '我的' : '登录' }}</h1>
    </header>

    <!-- Not Logged In -->
    <div class="auth-section" v-if="!isLoggedIn">
      <div class="auth-tabs">
        <button :class="{ active: authMode === 'login' }" @click="authMode = 'login'">登录</button>
        <button :class="{ active: authMode === 'register' }" @click="authMode = 'register'">注册</button>
      </div>
      
      <form @submit.prevent="handleAuth" class="auth-form">
        <div class="form-group" v-if="authMode === 'register'">
          <label>用户名</label>
          <input v-model="form.username" type="text" placeholder="请输入用户名" required>
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input v-model="form.email" type="email" placeholder="请输入邮箱" required>
        </div>
        <div class="form-group">
          <label>密码</label>
          <input v-model="form.password" type="password" placeholder="请输入密码" required>
        </div>
        <button type="submit" class="submit-btn" :disabled="authLoading">
          {{ authLoading ? '处理中...' : (authMode === 'login' ? '登录' : '注册') }}
        </button>
      </form>

      <p class="auth-hint" v-if="authError">{{ authError }}</p>
    </div>

    <!-- Logged In -->
    <div class="profile-section" v-else>
      <div class="user-card">
        <div class="avatar-wrapper" @click="showAvatarUpload = true">
          <img v-if="user?.avatar && user.avatar.startsWith('/')" :src="`http://localhost:3001${user.avatar}`" class="avatar-img">
          <img v-else-if="user?.avatar" :src="user.avatar" class="avatar-img">
          <div v-else class="avatar">
            {{ user?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </div>
          <div class="avatar-overlay">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
        <div class="user-info">
          <h2 class="username">{{ user?.username }}</h2>
          <p class="email">{{ user?.email }}</p>
        </div>
        <button class="logout-btn" @click="logout">退出登录</button>
      </div>

      <!-- Avatar Upload Modal -->
      <div class="avatar-modal" v-if="showAvatarUpload" @click.self="showAvatarUpload = false">
        <div class="modal-content">
          <h3>更换头像</h3>
          <div class="upload-area" @click="$refs.avatarInput.click()">
            <input type="file" ref="avatarInput" accept="image/*" @change="handleAvatarUpload" hidden>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="rgba(255,255,255,0.3)">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <p>{{ uploadingAvatar ? '上传中...' : '点击上传图片' }}</p>
          </div>
          <button class="modal-close" @click="showAvatarUpload = false">取消</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-card">
        <div class="stat-item">
          <span class="stat-value">{{ favorites.length }}</span>
          <span class="stat-label">收藏</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ watchlist.length }}</span>
          <span class="stat-label">待看</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">0</span>
          <span class="stat-label">评论</span>
        </div>
      </div>

      <!-- Settings -->
      <div class="section">
        <h3 class="section-title">播放设置</h3>
        <div class="settings-card">
          <div class="setting-item">
            <span class="setting-label">视频源</span>
            <select v-model="videoProxy" @change="saveVideoProxy" class="setting-select">
              <option value="piped">Piped (推荐)</option>
              <option value="invidious">Invidious</option>
              <option value="youtube">YouTube直连</option>
            </select>
          </div>
          <p class="setting-hint">
            {{ videoProxy === 'piped' ? '使用Piped代理，无需翻墙' : 
               videoProxy === 'invidious' ? '使用Invidious代理，无需翻墙' : 
               '直连YouTube，需要科学上网' }}
          </p>
        </div>
      </div>

      <!-- Favorites -->
      <div class="section">
        <h3 class="section-title">我的收藏</h3>
        <div class="favorites-list" v-if="favorites.length > 0">
          <div v-for="movie in favorites" :key="movie.id" class="favorite-item" @click="goToMovie(movie.id)">
            <img :src="`https://image.tmdb.org/t/p/w92${movie.posterPath}`" :alt="movie.title">
            <div class="movie-info">
              <span class="movie-title">{{ movie.title }}</span>
              <span class="movie-rating">{{ Number(movie.voteAverage).toFixed(1) }}</span>
            </div>
            <button class="remove-btn" @click.stop="removeFavorite(movie.id)">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="empty-state" v-else>
          <p>暂无收藏</p>
          <router-link to="/movies" class="link">去浏览电影</router-link>
        </div>
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
      <router-link to="/search" class="nav-item">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span>搜索</span>
      </router-link>
      <router-link to="/profile" class="nav-item active">
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
import { useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'
const router = useRouter()

const isLoggedIn = ref(false)
const user = ref(null)
const favorites = ref([])
const watchlist = ref([])
const authMode = ref('login')
const form = ref({ username: '', email: '', password: '' })
const authLoading = ref(false)
const authError = ref('')
const showAvatarUpload = ref(false)
const uploadingAvatar = ref(false)
const videoProxy = ref('piped')

const checkAuth = () => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  
  // Load video proxy setting
  videoProxy.value = localStorage.getItem('video_proxy') || 'piped'
  
  if (token && userData) {
    isLoggedIn.value = true
    user.value = JSON.parse(userData)
    loadProfile()
  }
}

const saveVideoProxy = () => {
  localStorage.setItem('video_proxy', videoProxy.value)
}

const loadProfile = async () => {
  const token = localStorage.getItem('token')
  if (!token) return

  try {
    const res = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    favorites.value = res.data.data.favorites || []
    watchlist.value = res.data.data.watchlist || []
  } catch (e) {
    console.error('Failed to load profile:', e)
  }
}

const handleAuth = async () => {
  authLoading.value = true
  authError.value = ''

  try {
    const endpoint = authMode.value === 'login' ? '/auth/login' : '/auth/register'
    const payload = authMode.value === 'login' 
      ? { email: form.value.email, password: form.value.password }
      : form.value

    const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload)
    
    if (res.data.success) {
      localStorage.setItem('token', res.data.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.data.user))
      isLoggedIn.value = true
      user.value = res.data.data.user
      loadProfile()
    }
  } catch (e) {
    authError.value = e.response?.data?.error?.message || '操作失败，请重试'
  } finally {
    authLoading.value = false
  }
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  isLoggedIn.value = false
  user.value = null
  favorites.value = []
  watchlist.value = []
}

const goToMovie = (id) => {
  router.push(`/movie/${id}`)
}

const removeFavorite = async (movieId) => {
  const token = localStorage.getItem('token')
  try {
    await axios.delete(`${API_BASE_URL}/users/favorites/${movieId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    favorites.value = favorites.value.filter(f => f.id !== movieId)
  } catch (e) {
    console.error('Failed to remove favorite:', e)
  }
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const token = localStorage.getItem('token')
  if (!token) return

  uploadingAvatar.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const res = await axios.post(`${API_BASE_URL}/upload/avatar`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    if (res.data.success) {
      user.value = { ...user.value, avatar: res.data.data.avatar }
      localStorage.setItem('user', JSON.stringify(user.value))
      showAvatarUpload.value = false
    }
  } catch (e) {
    console.error('Failed to upload avatar:', e)
    alert('上传失败，请重试')
  } finally {
    uploadingAvatar.value = false
  }
}

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #0f0f0f;
  color: #fff;
  padding-bottom: 70px;
}

.header {
  padding: 16px;
  background: #0f0f0f;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
}

/* Auth Section */
.auth-section {
  padding: 20px 16px;
}

.auth-tabs {
  display: flex;
  margin-bottom: 24px;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 4px;
}

.auth-tabs button {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
}

.auth-tabs button.active {
  background: #e50914;
  color: #fff;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.form-group input {
  padding: 14px 16px;
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  outline: none;
}

.form-group input:focus {
  border-color: #e50914;
}

.submit-btn {
  padding: 14px;
  background: #e50914;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-hint {
  color: #e50914;
  font-size: 13px;
  text-align: center;
}

/* Profile Section */
.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  margin: 16px;
  border-radius: 12px;
}

.avatar {
  width: 60px;
  height: 60px;
  background: #e50914;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.avatar-wrapper {
  position: relative;
  cursor: pointer;
}

.avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 320px;
}

.modal-content h3 {
  margin: 0 0 16px;
  text-align: center;
}

.upload-area {
  border: 2px dashed rgba(255,255,255,0.2);
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
}

.upload-area p {
  margin: 10px 0 0;
  color: rgba(255,255,255,0.5);
}

.modal-close {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.email {
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.logout-btn {
  padding: 8px 16px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.stats-card {
  display: flex;
  margin: 0 16px 16px;
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #e50914;
}

.stat-label {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
}

.section {
  padding: 0 16px 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.settings-card {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-label {
  font-size: 14px;
  color: #fff;
}

.setting-select {
  padding: 8px 12px;
  background: #2a2a2a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.setting-select:focus {
  outline: none;
  border-color: #e50914;
}

.setting-hint {
  margin: 12px 0 0;
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.favorite-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #1a1a1a;
  border-radius: 8px;
  cursor: pointer;
}

.favorite-item img {
  width: 50px;
  height: 75px;
  object-fit: cover;
  border-radius: 4px;
}

.movie-info {
  flex: 1;
}

.movie-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.movie-rating {
  font-size: 12px;
  color: #e50914;
}

.remove-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 8px;
}

.remove-btn:hover {
  color: #e50914;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255,255,255,0.5);
}

.empty-state .link {
  display: inline-block;
  margin-top: 8px;
  color: #e50914;
  text-decoration: none;
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
