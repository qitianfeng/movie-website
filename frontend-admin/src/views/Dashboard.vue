<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="(stat, index) in stats" :key="index">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-content">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="28"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Sync Section -->
    <el-card class="sync-card">
      <template #header>
        <div class="card-header">
          <span>数据同步</span>
          <div>
            <el-button type="warning" @click="syncData('banners')" :loading="syncingBanners" style="margin-right: 10px;">
              同步轮播图
            </el-button>
            <el-button type="primary" @click="syncData('movies')" :loading="syncing">
              同步电影数据
            </el-button>
          </div>
        </div>
      </template>
      <div class="sync-info">
        <p><strong>同步电影数据：</strong>从 TMDB 同步最新的电影数据到本地数据库</p>
        <p><strong>同步轮播图：</strong>从 TMDB 获取正在上映的电影，自动设置为首页轮播（最多5部）</p>
        <p class="sync-tip">提示：首次同步建议先同步 50-100 部电影，再同步轮播图</p>
      </div>
      <el-form :inline="true" v-if="!syncing && !syncingBanners">
        <el-form-item label="同步数量">
          <el-input-number v-model="syncLimit" :min="10" :max="100" :step="10" />
        </el-form-item>
        <el-form-item label="页码">
          <el-input-number v-model="syncPage" :min="1" :max="100" />
        </el-form-item>
      </el-form>
      <el-progress v-if="syncing || syncingBanners" :percentage="syncProgress" :format="() => syncStatus" />
    </el-card>

    <!-- Charts Row 1: Rating & Genre -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>评分分布统计</span>
              <el-tag size="small" type="info">基于 TMDB 评分</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="ratingChartRef"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>电影分类统计</span>
              <el-tag size="small" type="info">Top 10</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="genreChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 2: User Activity -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户活跃度趋势</span>
              <el-tag size="small" type="success">最近 7 天</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="activityChartRef"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>各分类平均评分</span>
              <el-tag size="small" type="warning">Top 10</el-tag>
            </div>
          </template>
          <div class="chart-container" ref="avgRatingChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts Row 3: Top Rated by Users -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户评分最高的电影</span>
              <el-tag size="small" type="danger">基于用户评论</el-tag>
            </div>
          </template>
          <div class="chart-container-lg" ref="topRatedChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Activity -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>最近添加的电影</template>
          <el-table :data="recentMovies" style="width: 100%">
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="voteAverage" label="评分" width="80">
              <template #default="{ row }">
                <el-tag size="small" type="warning">{{ Number(row.voteAverage).toFixed(1) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="releaseDate" label="上映日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.releaseDate) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>最活跃用户</template>
          <el-table :data="activeUsers" style="width: 100%">
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="review_count" label="评论数" width="80" />
            <el-table-column prop="favorite_count" label="收藏数" width="80" />
            <el-table-column label="活跃度" width="100">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.min(100, (row.review_count + row.favorite_count) * 10)" 
                  :stroke-width="8"
                  :show-text="false"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { Film, User, ChatDotRound, View, Collection } from '@element-plus/icons-vue'
import axios from 'axios'
import * as echarts from 'echarts'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const stats = ref([
  { title: '总电影数', value: 0, icon: markRaw(Film), color: '#409EFF' },
  { title: '总用户数', value: 0, icon: markRaw(User), color: '#67C23A' },
  { title: '评论数', value: 0, icon: markRaw(ChatDotRound), color: '#E6A23C' },
  { title: '分类数', value: 0, icon: markRaw(Collection), color: '#909399' }
])

const recentMovies = ref([])
const activeUsers = ref([])
const syncing = ref(false)
const syncingBanners = ref(false)
const syncProgress = ref(0)
const syncStatus = ref('')
const syncLimit = ref(20)
const syncPage = ref(1)

// Chart refs
const ratingChartRef = ref(null)
const genreChartRef = ref(null)
const activityChartRef = ref(null)
const avgRatingChartRef = ref(null)
const topRatedChartRef = ref(null)

// Chart instances
let ratingChart = null
let genreChart = null
let activityChart = null
let avgRatingChart = null
let topRatedChart = null

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const getToken = () => localStorage.getItem('admin_token')

const loadStats = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      const data = res.data.data
      stats.value[0].value = data.totalMovies || 0
      stats.value[1].value = data.totalUsers || 0
      stats.value[2].value = data.totalReviews || 0
      stats.value[3].value = data.totalGenres || 0
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
}

const loadRecentMovies = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/movies`, {
      params: { page: 1, limit: 5, sort: 'release_date' }
    })
    recentMovies.value = res.data.data?.movies || []
  } catch (e) {
    console.error('Failed to load recent movies:', e)
  }
}

const loadRatingStats = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/stats/ratings`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      const { ratingDistribution, genreDistribution, avgRatingByGenre } = res.data.data
      
      // Rating Distribution Chart
      if (ratingChart && ratingChartRef.value) {
        ratingChart.setOption({
          tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
          legend: { bottom: 0, textStyle: { color: '#666' } },
          color: ['#F56C6C', '#E6A23C', '#909399', '#67C23A', '#409EFF'],
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: ratingDistribution.map(item => ({
              name: item.range_label + '分',
              value: item.count
            }))
          }]
        })
      }

      // Genre Distribution Chart
      if (genreChart && genreChartRef.value) {
        genreChart.setOption({
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', data: genreDistribution.map(g => g.name), axisLabel: { interval: 0, rotate: 30 } },
          yAxis: { type: 'value' },
          series: [{
            type: 'bar',
            data: genreDistribution.map(g => g.count),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#409EFF' },
                { offset: 1, color: '#79bbff' }
              ]),
              borderRadius: [4, 4, 0, 0]
            }
          }]
        })
      }

      // Avg Rating by Genre Chart
      if (avgRatingChart && avgRatingChartRef.value) {
        avgRatingChart.setOption({
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'value', max: 10 },
          yAxis: { type: 'category', data: avgRatingByGenre.map(g => g.name).reverse() },
          series: [{
            type: 'bar',
            data: avgRatingByGenre.map(g => Number(g.avg_rating).toFixed(1)).reverse(),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#E6A23C' },
                { offset: 1, color: '#f5d442' }
              ]),
              borderRadius: [0, 4, 4, 0]
            },
            label: { show: true, position: 'right', formatter: '{c}' }
          }]
        })
      }
    }
  } catch (e) {
    console.error('Failed to load rating stats:', e)
  }
}

const loadActivityStats = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/stats/activity`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      const { registrationTrend, reviewTrend, activeUsers: users, topUserRated } = res.data.data
      
      activeUsers.value = users || []

      // Generate last 7 days labels
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push(d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }))
      }

      // Create data map
      const regMap = new Map(registrationTrend?.map(r => [r.date.toISOString?.().split('T')[0] || r.date, r.count]) || [])
      const revMap = new Map(reviewTrend?.map(r => [r.date.toISOString?.().split('T')[0] || r.date, r.count]) || [])

      // Activity Trend Chart
      if (activityChart && activityChartRef.value) {
        const today = new Date().toISOString().split('T')[0]
        const regData = days.map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          const key = d.toISOString().split('T')[0]
          return regMap.get(key) || 0
        })
        const revData = days.map((_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          const key = d.toISOString().split('T')[0]
          return revMap.get(key) || 0
        })

        activityChart.setOption({
          tooltip: { trigger: 'axis' },
          legend: { data: ['新用户', '新评论'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
          xAxis: { type: 'category', boundaryGap: false, data: days },
          yAxis: { type: 'value' },
          series: [
            {
              name: '新用户',
              type: 'line',
              smooth: true,
              data: regData,
              areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
                { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
              ])},
              lineStyle: { color: '#67C23A' },
              itemStyle: { color: '#67C23A' }
            },
            {
              name: '新评论',
              type: 'line',
              smooth: true,
              data: revData,
              areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
                { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
              ])},
              lineStyle: { color: '#E6A23C' },
              itemStyle: { color: '#E6A23C' }
            }
          ]
        })
      }

      // Top Rated by Users Chart
      if (topRatedChart && topRatedChartRef.value && topUserRated?.length > 0) {
        topRatedChart.setOption({
          tooltip: { 
            trigger: 'axis', 
            axisPointer: { type: 'shadow' },
            formatter: (params) => {
              const movie = topUserRated[params[0].dataIndex]
              return `<strong>${movie.title}</strong><br/>
                      用户评分: ${Number(movie.avg_user_rating).toFixed(1)}<br/>
                      评论数: ${movie.review_count}`
            }
          },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', data: topUserRated.map(m => m.title.length > 15 ? m.title.slice(0, 15) + '...' : m.title), axisLabel: { interval: 0, rotate: 20 } },
          yAxis: { type: 'value', max: 10, name: '评分' },
          series: [{
            type: 'bar',
            data: topUserRated.map(m => ({
              value: Number(m.avg_user_rating).toFixed(1),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#F56C6C' },
                  { offset: 1, color: '#fab6b6' }
                ])
              }
            })),
            label: { show: true, position: 'top', formatter: '{c}' },
            barWidth: '50%'
          }]
        })
      }
    }
  } catch (e) {
    console.error('Failed to load activity stats:', e)
  }
}

const syncData = async (type) => {
  if (type === 'banners') {
    syncingBanners.value = true
  } else {
    syncing.value = true
  }
  syncProgress.value = 0
  syncStatus.value = '正在连接 TMDB...'

  try {
    const res = await axios.post(`${API_BASE_URL}/admin/sync`, {
      type,
      page: syncPage.value,
      limit: syncLimit.value
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })

    if (res.data.success) {
      syncProgress.value = 100
      if (type === 'banners') {
        syncStatus.value = res.data.data.message || `成功同步 ${res.data.data.synced} 部轮播电影`
        ElMessage.success(syncStatus.value)
      } else {
        syncStatus.value = `成功同步 ${res.data.data.synced} 部电影`
        ElMessage.success(`同步完成，共 ${res.data.data.synced} 部电影`)
      }
      await Promise.all([loadStats(), loadRecentMovies(), loadRatingStats()])
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '同步失败')
    syncStatus.value = '同步失败'
  } finally {
    setTimeout(() => {
      syncing.value = false
      syncingBanners.value = false
      syncProgress.value = 0
    }, 2000)
  }
}

const initCharts = () => {
  // Initialize all charts
  if (ratingChartRef.value) {
    ratingChart = echarts.init(ratingChartRef.value)
  }
  if (genreChartRef.value) {
    genreChart = echarts.init(genreChartRef.value)
  }
  if (activityChartRef.value) {
    activityChart = echarts.init(activityChartRef.value)
  }
  if (avgRatingChartRef.value) {
    avgRatingChart = echarts.init(avgRatingChartRef.value)
  }
  if (topRatedChartRef.value) {
    topRatedChart = echarts.init(topRatedChartRef.value)
  }
}

const handleResize = () => {
  ratingChart?.resize()
  genreChart?.resize()
  activityChart?.resize()
  avgRatingChart?.resize()
  topRatedChart?.resize()
}

onMounted(async () => {
  initCharts()
  window.addEventListener('resize', handleResize)
  
  await Promise.all([
    loadStats(),
    loadRecentMovies(),
    loadRatingStats(),
    loadActivityStats()
  ])
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  ratingChart?.dispose()
  genreChart?.dispose()
  activityChart?.dispose()
  avgRatingChart?.dispose()
  topRatedChart?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.sync-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sync-info p {
  margin: 8px 0;
  color: #606266;
}

.sync-tip {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  height: 300px;
}

.chart-container-lg {
  height: 350px;
}
</style>
