<template>
  <div class="logs-page">
    <!-- Header -->
    <div class="header-actions">
      <div class="filters">
        <el-select v-model="filterType" placeholder="操作类型" clearable @change="fetchLogs" style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="用户操作" value="user" />
          <el-option label="电影操作" value="movie" />
          <el-option label="评论操作" value="review" />
          <el-option label="系统操作" value="system" />
        </el-select>
        <el-date-picker
          v-model="filterDate"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="fetchLogs"
          style="width: 280px"
        />
        <el-input
          v-model="searchKeyword"
          placeholder="搜索日志内容..."
          style="width: 200px"
          clearable
          @keyup.enter="fetchLogs"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="actions">
        <el-button @click="refreshLogs" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="danger" @click="clearLogs" :disabled="logs.length === 0">
          <el-icon><Delete /></el-icon>
          清空日志
        </el-button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #409EFF"><Document /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">总日志数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #67C23A"><User /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ todayCount }}</div>
            <div class="stat-label">今日操作</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <el-icon class="stat-icon" style="color: #E6A23C"><Warning /></el-icon>
          <div class="stat-info">
            <div class="stat-value">{{ errorCount }}</div>
            <div class="stat-label">错误/警告</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Logs Table -->
    <el-table :data="logs" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)" size="small">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="action" label="操作" min-width="180">
        <template #default="{ row }">
          <div class="action-cell">
            <el-icon :class="['action-icon', getActionClass(row.level)]">
              <component :is="getActionIcon(row.level)" />
            </el-icon>
            <span>{{ row.action }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="user" label="操作用户" width="120">
        <template #default="{ row }">
          <span v-if="row.user">{{ row.user }}</span>
          <span v-else class="text-muted">系统</span>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP地址" width="140" />
      <el-table-column prop="details" label="详情" min-width="200">
        <template #default="{ row }">
          <span class="details-text">{{ row.details || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="time" label="时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.time) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="limit"
        :total="total"
        :page-sizes="[20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="fetchLogs"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete, Document, User, Warning, CircleCheck, CircleClose, InfoFilled } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const logs = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(50)
const total = ref(0)
const filterType = ref('')
const filterDate = ref(null)
const searchKeyword = ref('')

// Mock data for demo
const mockLogs = [
  { id: 1, type: 'user', action: '用户登录', user: 'admin', ip: '127.0.0.1', details: '登录成功', level: 'info', time: new Date().toISOString() },
  { id: 2, type: 'movie', action: '同步电影数据', user: 'admin', ip: '127.0.0.1', details: '同步了 20 部电影', level: 'success', time: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, type: 'review', action: '审核评论', user: 'admin', ip: '127.0.0.1', details: '通过评论 ID: 123', level: 'info', time: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, type: 'system', action: '数据库备份', user: null, ip: '127.0.0.1', details: '自动备份完成', level: 'success', time: new Date(Date.now() - 10800000).toISOString() },
  { id: 5, type: 'user', action: '新用户注册', user: 'test', ip: '192.168.1.100', details: '邮箱: test@example.com', level: 'info', time: new Date(Date.now() - 14400000).toISOString() },
  { id: 6, type: 'movie', action: '添加电影', user: 'admin', ip: '127.0.0.1', details: '《测试电影》', level: 'success', time: new Date(Date.now() - 18000000).toISOString() },
  { id: 7, type: 'review', action: '删除评论', user: 'admin', ip: '127.0.0.1', details: '删除违规评论 ID: 456', level: 'warning', time: new Date(Date.now() - 21600000).toISOString() },
  { id: 8, type: 'system', action: 'API 限流', user: null, ip: '192.168.1.50', details: 'IP 被临时限制', level: 'error', time: new Date(Date.now() - 25200000).toISOString() },
  { id: 9, type: 'user', action: '修改密码', user: 'admin', ip: '127.0.0.1', details: '密码已更新', level: 'info', time: new Date(Date.now() - 28800000).toISOString() },
  { id: 10, type: 'movie', action: '更新电影信息', user: 'admin', ip: '127.0.0.1', details: '更新《测试电影》评分', level: 'info', time: new Date(Date.now() - 32400000).toISOString() },
]

const todayCount = computed(() => {
  const today = new Date().toDateString()
  return logs.value.filter(log => new Date(log.time).toDateString() === today).length
})

const errorCount = computed(() => {
  return logs.value.filter(log => log.level === 'error' || log.level === 'warning').length
})

const getToken = () => localStorage.getItem('admin_token')

const fetchLogs = async () => {
  loading.value = true
  try {
    // Use mock data for now since backend logs API is basic
    // In production, replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    let filtered = [...mockLogs]
    
    if (filterType.value) {
      filtered = filtered.filter(log => log.type === filterType.value)
    }
    
    if (filterDate.value && filterDate.value.length === 2) {
      const start = new Date(filterDate.value[0])
      const end = new Date(filterDate.value[1])
      end.setHours(23, 59, 59)
      filtered = filtered.filter(log => {
        const logDate = new Date(log.time)
        return logDate >= start && logDate <= end
      })
    }
    
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(keyword) ||
        (log.details && log.details.toLowerCase().includes(keyword)) ||
        (log.user && log.user.toLowerCase().includes(keyword))
      )
    }
    
    total.value = filtered.length
    const offset = (page.value - 1) * limit.value
    logs.value = filtered.slice(offset, offset + limit.value)
  } catch (e) {
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

const refreshLogs = () => {
  fetchLogs()
}

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？此操作不可恢复！', '警告', {
      type: 'warning',
      confirmButtonText: '确定清空',
      cancelButtonText: '取消'
    })
    
    logs.value = []
    total.value = 0
    ElMessage.success('日志已清空')
  } catch (e) {
    // User cancelled
  }
}

const getTypeTagType = (type) => {
  const types = {
    user: '',
    movie: 'success',
    review: 'warning',
    system: 'info'
  }
  return types[type] || ''
}

const getTypeLabel = (type) => {
  const labels = {
    user: '用户',
    movie: '电影',
    review: '评论',
    system: '系统'
  }
  return labels[type] || type
}

const getActionClass = (level) => {
  return {
    info: 'action-info',
    success: 'action-success',
    warning: 'action-warning',
    error: 'action-error'
  }[level] || 'action-info'
}

const getActionIcon = (level) => {
  const icons = {
    info: InfoFilled,
    success: CircleCheck,
    warning: Warning,
    error: CircleClose
  }
  return icons[level] || InfoFilled
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(fetchLogs)
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 12px;
}

.actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: default;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 36px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  font-size: 16px;
}

.action-info {
  color: #909399;
}

.action-success {
  color: #67C23A;
}

.action-warning {
  color: #E6A23C;
}

.action-error {
  color: #F56C6C;
}

.text-muted {
  color: #909399;
}

.details-text {
  font-size: 12px;
  color: #606266;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
