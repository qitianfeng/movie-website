<template>
  <div class="settings-page">
    <!-- Site Settings -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>网站设置</span>
        </div>
      </template>
      <el-form :model="siteSettings" label-width="120px">
        <el-form-item label="网站名称">
          <el-input v-model="siteSettings.siteName" placeholder="MovieHub" />
        </el-form-item>
        <el-form-item label="网站描述">
          <el-input v-model="siteSettings.siteDescription" type="textarea" :rows="3" placeholder="网站简介..." />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="siteSettings.contactEmail" placeholder="contact@moviehub.com" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSiteSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- TMDB Settings -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>TMDB 配置</span>
          <el-tag type="info">数据源</el-tag>
        </div>
      </template>
      <el-form :model="tmdbSettings" label-width="120px">
        <el-form-item label="API Key">
          <el-input v-model="tmdbSettings.apiKey" type="password" show-password placeholder="TMDB API Key" />
          <div class="form-tip">
            申请地址: <a href="https://www.themoviedb.org/settings/api" target="_blank">https://www.themoviedb.org/settings/api</a>
          </div>
        </el-form-item>
        <el-form-item label="API 状态">
          <el-tag :type="tmdbConnected ? 'success' : 'danger'">
            {{ tmdbConnected ? '已连接' : '未连接' }}
          </el-tag>
          <el-button size="small" @click="testTmdbConnection" :loading="testingTmdb" style="margin-left: 10px">
            测试连接
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveTmdbSettings">保存配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Data Sync Settings -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>数据同步</span>
          <el-tag type="warning">批量操作</el-tag>
        </div>
      </template>
      <div class="sync-options">
        <div class="sync-item">
          <div class="sync-info">
            <h4>同步电影分类</h4>
            <p>从 TMDB 同步所有电影分类数据</p>
          </div>
          <el-button type="primary" @click="syncGenres" :loading="syncingGenres">
            {{ syncingGenres ? '同步中...' : '同步分类' }}
          </el-button>
        </div>
        <el-divider />
        <div class="sync-item">
          <div class="sync-info">
            <h4>同步热门电影</h4>
            <p>同步 TMDB 热门电影数据</p>
          </div>
          <div class="sync-controls">
            <el-input-number v-model="syncConfig.popularCount" :min="10" :max="200" :step="10" />
            <span>部</span>
            <el-button type="primary" @click="syncPopularMovies" :loading="syncingPopular">
              {{ syncingPopular ? '同步中...' : '开始同步' }}
            </el-button>
          </div>
        </div>
        <el-divider />
        <div class="sync-item">
          <div class="sync-info">
            <h4>同步最新电影</h4>
            <p>同步 TMDB 最新上映电影数据</p>
          </div>
          <div class="sync-controls">
            <el-input-number v-model="syncConfig.latestCount" :min="10" :max="200" :step="10" />
            <span>部</span>
            <el-button type="primary" @click="syncLatestMovies" :loading="syncingLatest">
              {{ syncingLatest ? '同步中...' : '开始同步' }}
            </el-button>
          </div>
        </div>
      </div>
      <!-- Sync Progress -->
      <div class="sync-progress" v-if="syncProgress.show">
        <el-progress 
          :percentage="syncProgress.percentage" 
          :status="syncProgress.status"
          :format="() => syncProgress.text"
        />
      </div>
    </el-card>

    <!-- System Info -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>系统信息</span>
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
        <el-descriptions-item label="Node.js">{{ nodeVersion }}</el-descriptions-item>
        <el-descriptions-item label="数据库">MySQL 8.0</el-descriptions-item>
        <el-descriptions-item label="数据库状态">
          <el-tag type="success">正常</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="后端框架">Express.js</el-descriptions-item>
        <el-descriptions-item label="前端框架">Vue 3 + Element Plus</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Danger Zone -->
    <el-card class="settings-card danger-card">
      <template #header>
        <div class="card-header">
          <span style="color: #f56c6c">危险操作</span>
        </div>
      </template>
      <el-alert type="warning" :closable="false" style="margin-bottom: 20px">
        以下操作不可恢复，请谨慎操作
      </el-alert>
      <div class="danger-actions">
        <div class="danger-item">
          <span>清空所有电影数据</span>
          <el-button type="danger" @click="clearAllMovies">清空电影</el-button>
        </div>
        <div class="danger-item">
          <span>清空所有评论数据</span>
          <el-button type="danger" @click="clearAllReviews">清空评论</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const siteSettings = ref({
  siteName: 'MovieHub',
  siteDescription: '您的专属电影平台',
  contactEmail: ''
})

const tmdbSettings = ref({
  apiKey: ''
})

const tmdbConnected = ref(false)
const testingTmdb = ref(false)
const syncingGenres = ref(false)
const syncingPopular = ref(false)
const syncingLatest = ref(false)

const syncConfig = ref({
  popularCount: 50,
  latestCount: 50
})

const syncProgress = ref({
  show: false,
  percentage: 0,
  status: '',
  text: ''
})

const nodeVersion = ref('')

const getToken = () => localStorage.getItem('admin_token')

const saveSiteSettings = () => {
  localStorage.setItem('siteSettings', JSON.stringify(siteSettings.value))
  ElMessage.success('网站设置已保存')
}

const saveTmdbSettings = () => {
  localStorage.setItem('tmdbSettings', JSON.stringify(tmdbSettings.value))
  ElMessage.success('TMDB 配置已保存')
}

const testTmdbConnection = async () => {
  testingTmdb.value = true
  try {
    const res = await axios.get('https://api.themoviedb.org/3/configuration', {
      params: { api_key: tmdbSettings.value.apiKey || 'demo' }
    })
    tmdbConnected.value = true
    ElMessage.success('TMDB API 连接成功')
  } catch (e) {
    tmdbConnected.value = false
    ElMessage.error('TMDB API 连接失败，请检查 API Key')
  } finally {
    testingTmdb.value = false
  }
}

const showProgress = (text, percentage) => {
  syncProgress.value = { show: true, percentage, status: '', text }
}

const hideProgress = () => {
  syncProgress.value.show = false
}

const syncGenres = async () => {
  syncingGenres.value = true
  showProgress('正在同步分类...', 50)
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/sync`, 
      { type: 'genres' },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
    showProgress('同步完成', 100)
    ElMessage.success(`成功同步 ${res.data.data.synced} 个分类`)
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '同步失败')
  } finally {
    syncingGenres.value = false
    setTimeout(hideProgress, 2000)
  }
}

const syncPopularMovies = async () => {
  syncingPopular.value = true
  showProgress('正在同步热门电影...', 10)
  try {
    const count = syncConfig.value.popularCount
    const pages = Math.ceil(count / 20)
    let synced = 0
    
    for (let i = 1; i <= pages; i++) {
      const res = await axios.post(`${API_BASE_URL}/admin/sync`,
        { type: 'movies', page: i, limit: 20 },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      synced += res.data.data.synced
      showProgress(`已同步 ${synced} 部电影...`, Math.round((i / pages) * 100))
    }
    
    showProgress('同步完成', 100)
    ElMessage.success(`成功同步 ${synced} 部热门电影`)
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '同步失败')
  } finally {
    syncingPopular.value = false
    setTimeout(hideProgress, 2000)
  }
}

const syncLatestMovies = async () => {
  syncingLatest.value = true
  showProgress('正在同步最新电影...', 10)
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/sync`,
      { type: 'movies', page: 1, limit: syncConfig.value.latestCount },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
    showProgress('同步完成', 100)
    ElMessage.success(`成功同步 ${res.data.data.synced} 部最新电影`)
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '同步失败')
  } finally {
    syncingLatest.value = false
    setTimeout(hideProgress, 2000)
  }
}

const clearAllMovies = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有电影数据吗？此操作不可恢复！', '危险操作', {
      type: 'error',
      confirmButtonText: '确定清空',
      cancelButtonText: '取消'
    })
    ElMessage.info('功能开发中...')
  } catch (e) {
    // cancelled
  }
}

const clearAllReviews = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有评论数据吗？此操作不可恢复！', '危险操作', {
      type: 'error',
      confirmButtonText: '确定清空',
      cancelButtonText: '取消'
    })
    ElMessage.info('功能开发中...')
  } catch (e) {
    // cancelled
  }
}

onMounted(() => {
  nodeVersion.value = navigator.userAgent.match(/Node\.js\/([\d.]+)/)?.[1] || 'N/A'
  
  const savedSiteSettings = localStorage.getItem('siteSettings')
  if (savedSiteSettings) {
    siteSettings.value = JSON.parse(savedSiteSettings)
  }
  
  const savedTmdbSettings = localStorage.getItem('tmdbSettings')
  if (savedTmdbSettings) {
    tmdbSettings.value = JSON.parse(savedTmdbSettings)
  }
})
</script>

<style scoped>
.settings-page {
  max-width: 800px;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-tip a {
  color: #409EFF;
}

.sync-options {
  padding: 10px 0;
}

.sync-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.sync-info h4 {
  margin: 0 0 5px;
  font-size: 14px;
}

.sync-info p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.sync-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sync-progress {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.danger-card {
  border-color: #f56c6c;
}

.danger-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #fef0f0;
  border-radius: 4px;
}
</style>
