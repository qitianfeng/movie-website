<template>
  <div class="genre-list">
    <!-- Header -->
    <div class="header-actions">
      <div class="stats">
        共 <strong>{{ genres.length }}</strong> 个分类
      </div>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加分类
      </el-button>
    </div>

    <!-- Genre Table -->
    <el-table :data="genres" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="分类名称" min-width="150">
        <template #default="{ row }">
          <div class="genre-name">
            <span class="genre-emoji">{{ getGenreEmoji(row.name) }}</span>
            {{ row.name }}
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="tmdb_id" label="TMDB ID" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.tmdb_id" size="small">{{ row.tmdb_id }}</el-tag>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="movie_count" label="电影数量" width="100">
        <template #default="{ row }">
          <el-tag :type="row.movie_count > 0 ? 'success' : 'info'" size="small">
            {{ row.movie_count }} 部
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click="editGenre(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="deleteGenre(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit Dialog -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingGenre ? '编辑分类' : '添加分类'"
      width="450px"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="TMDB ID" prop="tmdbId">
          <el-input-number v-model="formData.tmdbId" :min="1" placeholder="可选" style="width: 100%" />
          <div class="form-tip">TMDB 分类 ID，用于同步数据</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingGenre ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const genres = ref([])
const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const editingGenre = ref(null)
const formRef = ref(null)

const formData = reactive({
  name: '',
  tmdbId: null
})

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

const getToken = () => localStorage.getItem('admin_token')

const getGenreEmoji = (name) => {
  const emojis = {
    '动作': '💥', '冒险': '🗺️', '动画': '🎨', '喜剧': '😂', '犯罪': '🔫',
    '纪录': '📹', '剧情': '🎭', '家庭': '👨‍👩‍👧‍👦', '奇幻': '🧙', '历史': '📜',
    '恐怖': '👻', '音乐': '🎵', '悬疑': '🔮', '爱情': '❤️', '科幻': '🚀',
    '电视电影': '📺', '惊悚': '😱', '战争': '⚔️', '西部': '🤠',
    'Action': '💥', 'Adventure': '🗺️', 'Animation': '🎨', 'Comedy': '😂',
    'Crime': '🔫', 'Documentary': '📹', 'Drama': '🎭', 'Family': '👨‍👩‍👧‍👦',
    'Fantasy': '🧙', 'History': '📜', 'Horror': '👻', 'Music': '🎵',
    'Mystery': '🔮', 'Romance': '❤️', 'Science Fiction': '🚀', 'TV Movie': '📺',
    'Thriller': '😱', 'War': '⚔️', 'Western': '🤠'
  }
  return emojis[name] || '🎬'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const fetchGenres = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/genres`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      genres.value = res.data.data || []
    }
  } catch (e) {
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

const editGenre = (genre) => {
  editingGenre.value = genre
  formData.name = genre.name
  formData.tmdbId = genre.tmdb_id
  showAddDialog.value = true
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    if (editingGenre.value) {
      await axios.put(
        `${API_BASE_URL}/admin/genres/${editingGenre.value.id}`,
        formData,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      ElMessage.success('分类更新成功')
    } else {
      await axios.post(
        `${API_BASE_URL}/admin/genres`,
        formData,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      ElMessage.success('分类添加成功')
    }
    showAddDialog.value = false
    resetForm()
    fetchGenres()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteGenre = async (genre) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类「${genre.name}」吗？`,
      '删除确认',
      { type: 'warning' }
    )

    await axios.delete(`${API_BASE_URL}/admin/genres/${genre.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    ElMessage.success('分类删除成功')
    fetchGenres()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '删除失败')
    }
  }
}

const resetForm = () => {
  editingGenre.value = null
  formData.name = ''
  formData.tmdbId = null
  formRef.value?.resetFields()
}

onMounted(fetchGenres)
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats {
  font-size: 14px;
  color: #606266;
}

.stats strong {
  color: #409EFF;
  font-size: 18px;
}

.genre-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.genre-emoji {
  font-size: 18px;
}

.text-muted {
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
