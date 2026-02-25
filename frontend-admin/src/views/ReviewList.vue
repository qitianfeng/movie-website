<template>
  <div class="review-list">
    <!-- Status Stats -->
    <el-row :gutter="16" class="status-stats">
      <el-col :span="6">
        <el-card class="stat-card" :class="{ active: statusFilter === null }" @click="statusFilter = null; fetchReviews()">
          <div class="stat-content">
            <span class="stat-value">{{ statusStats.total || 0 }}</span>
            <span class="stat-label">全部评论</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pending" :class="{ active: statusFilter === 'pending' }" @click="statusFilter = 'pending'; fetchReviews()">
          <div class="stat-content">
            <span class="stat-value">{{ statusStats.pending || 0 }}</span>
            <span class="stat-label">待审核</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card approved" :class="{ active: statusFilter === 'approved' }" @click="statusFilter = 'approved'; fetchReviews()">
          <div class="stat-content">
            <span class="stat-value">{{ statusStats.approved || 0 }}</span>
            <span class="stat-label">已通过</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card rejected" :class="{ active: statusFilter === 'rejected' }" @click="statusFilter = 'rejected'; fetchReviews()">
          <div class="stat-content">
            <span class="stat-value">{{ statusStats.rejected || 0 }}</span>
            <span class="stat-label">已拒绝</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Header -->
    <div class="header-actions">
      <el-input
        v-model="searchQuery"
        placeholder="搜索评论内容..."
        style="width: 300px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="filterRating" placeholder="评分筛选" clearable @change="fetchReviews" style="width: 120px">
        <el-option label="全部" :value="null" />
        <el-option label="1-3分" :value="1" />
        <el-option label="4-6分" :value="4" />
        <el-option label="7-10分" :value="7" />
      </el-select>
      <div class="batch-actions" v-if="selectedReviews.length > 0">
        <el-button type="success" @click="batchApprove">
          批量通过 ({{ selectedReviews.length }})
        </el-button>
        <el-button type="danger" @click="batchReject">
          批量拒绝 ({{ selectedReviews.length }})
        </el-button>
      </div>
    </div>

    <!-- Review Table -->
    <el-table 
      :data="reviews" 
      v-loading="loading" 
      border 
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="movie_title" label="电影" min-width="150">
        <template #default="{ row }">
          <span>{{ row.movie_title || `电影ID: ${row.movie_id}` }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户" width="120">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="28">{{ row.username?.charAt(0)?.toUpperCase() }}</el-avatar>
            <span>{{ row.username }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="rating" label="评分" width="100">
        <template #default="{ row }">
          <el-rate :model-value="row.rating / 2" disabled show-score text-color="#ff9900" />
        </template>
      </el-table-column>
      <el-table-column prop="content" label="评论内容" min-width="200">
        <template #default="{ row }">
          <el-text line-clamp="2">{{ row.content }}</el-text>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag 
            :type="getStatusType(row.status)" 
            size="small"
            effect="dark"
          >
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="发布时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click="viewReview(row)">查看</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="approveReview(row)"
              v-if="row.status !== 'approved'"
            >
              通过
            </el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="rejectReview(row)"
              v-if="row.status !== 'rejected'"
            >
              拒绝
            </el-button>
            <el-button size="small" type="danger" @click="deleteReview(row)">删除</el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="limit"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="fetchReviews"
      />
    </div>

    <!-- Review Detail Dialog -->
    <el-dialog v-model="showDetailDialog" title="评论详情" width="600px">
      <div class="review-detail" v-if="currentReview">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="电影">{{ currentReview.movie_title }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentReview.username }} ({{ currentReview.email }})</el-descriptions-item>
          <el-descriptions-item label="评分">
            <el-rate :model-value="currentReview.rating / 2" disabled show-score />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentReview.status)" effect="dark">
              {{ getStatusText(currentReview.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatDate(currentReview.created_at) }}</el-descriptions-item>
        </el-descriptions>
        <div class="review-content">
          <h4>评论内容</h4>
          <p>{{ currentReview.content }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button 
          type="success" 
          @click="approveReview(currentReview)"
          v-if="currentReview?.status !== 'approved'"
        >
          通过审核
        </el-button>
        <el-button 
          type="warning" 
          @click="rejectReview(currentReview)"
          v-if="currentReview?.status !== 'rejected'"
        >
          拒绝
        </el-button>
        <el-button type="danger" @click="deleteReview(currentReview)">删除此评论</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const reviews = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const searchQuery = ref('')
const filterRating = ref(null)
const statusFilter = ref(null)
const showDetailDialog = ref(false)
const currentReview = ref(null)
const selectedReviews = ref([])
const statusStats = ref({ pending: 0, approved: 0, rejected: 0, total: 0 })

const getToken = () => localStorage.getItem('admin_token')

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || '未知'
}

const fetchReviews = async () => {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    
    const res = await axios.get(`${API_BASE_URL}/admin/reviews`, {
      params,
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      reviews.value = res.data.data.reviews || []
      total.value = res.data.data.pagination?.total || 0
      const stats = res.data.data.statusStats || {}
      statusStats.value = {
        ...stats,
        total: (stats.pending || 0) + (stats.approved || 0) + (stats.rejected || 0)
      }
    }
  } catch (e) {
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchReviews()
}

const handleSelectionChange = (selection) => {
  selectedReviews.value = selection
}

const viewReview = (review) => {
  currentReview.value = review
  showDetailDialog.value = true
}

const approveReview = async (review) => {
  try {
    await axios.put(`${API_BASE_URL}/admin/reviews/${review.id}/approve`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    ElMessage.success('审核通过')
    review.status = 'approved'
    if (showDetailDialog.value) {
      showDetailDialog.value = false
    }
    fetchReviews()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '操作失败')
  }
}

const rejectReview = async (review) => {
  try {
    await ElMessageBox.confirm('确定要拒绝这条评论吗？', '确认', { type: 'warning' })
    
    await axios.put(`${API_BASE_URL}/admin/reviews/${review.id}/reject`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    ElMessage.success('已拒绝')
    review.status = 'rejected'
    if (showDetailDialog.value) {
      showDetailDialog.value = false
    }
    fetchReviews()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '操作失败')
    }
  }
}

const deleteReview = async (review) => {
  try {
    await ElMessageBox.confirm(`确定要删除这条评论吗？`, '警告', { type: 'warning' })
    
    await axios.delete(`${API_BASE_URL}/admin/reviews/${review.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    ElMessage.success('删除成功')
    showDetailDialog.value = false
    fetchReviews()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '删除失败')
    }
  }
}

const batchApprove = async () => {
  try {
    const ids = selectedReviews.value.map(r => r.id)
    await ElMessageBox.confirm(`确定要批量通过 ${ids.length} 条评论吗？`, '确认', { type: 'warning' })
    
    await axios.put(`${API_BASE_URL}/admin/reviews/batch/approve`, { ids }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    ElMessage.success(`已通过 ${ids.length} 条评论`)
    selectedReviews.value = []
    fetchReviews()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '操作失败')
    }
  }
}

const batchReject = async () => {
  try {
    const ids = selectedReviews.value.map(r => r.id)
    await ElMessageBox.confirm(`确定要批量拒绝 ${ids.length} 条评论吗？`, '确认', { type: 'warning' })
    
    await axios.put(`${API_BASE_URL}/admin/reviews/batch/reject`, { ids }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    ElMessage.success(`已拒绝 ${ids.length} 条评论`)
    selectedReviews.value = []
    fetchReviews()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '操作失败')
    }
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(fetchReviews)
</script>

<style scoped>
.status-stats {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.active {
  border-color: #409EFF;
}

.stat-card.pending.active {
  border-color: #E6A23C;
}

.stat-card.approved.active {
  border-color: #67C23A;
}

.stat-card.rejected.active {
  border-color: #F56C6C;
}

.stat-content {
  text-align: center;
  padding: 8px 0;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.stat-card.pending .stat-value {
  color: #E6A23C;
}

.stat-card.approved .stat-value {
  color: #67C23A;
}

.stat-card.rejected .stat-value {
  color: #F56C6C;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.batch-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.review-content {
  margin-top: 20px;
}

.review-content h4 {
  margin-bottom: 10px;
  color: #303133;
}

.review-content p {
  color: #606266;
  line-height: 1.6;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
