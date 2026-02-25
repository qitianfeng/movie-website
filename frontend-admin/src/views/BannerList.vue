<template>
  <div class="banner-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>轮播管理</span>
          <el-button type="primary" @click="showMovieSelector">
            <el-icon><Plus /></el-icon>
            添加轮播
          </el-button>
        </div>
      </template>

      <div class="banner-info">
        <el-alert type="info" :closable="false">
          <template #title>
            管理首页轮播展示的电影
          </template>
          拖拽调整顺序，最多显示5部电影作为轮播
        </el-alert>
      </div>

      <!-- Banner List -->
      <el-table :data="banners" style="width: 100%" v-loading="loading">
        <el-table-column label="排序" width="80">
          <template #default="{ row, $index }">
            <el-tag>{{ $index + 1 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="海报" width="120">
          <template #default="{ row }">
            <el-image 
              :src="`https://image.tmdb.org/t/p/w200${row.poster_path}`"
              :preview-src="`https://image.tmdb.org/t/p/w500${row.poster_path}`"
              fit="cover"
              style="width: 80px; height: 120px; border-radius: 4px;"
            />
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" />
        <el-table-column label="评分" width="80">
          <template #default="{ row }">
            <el-tag type="warning">{{ Number(row.vote_average).toFixed(1) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上映日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.release_date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              :disabled="$index === 0"
              @click="moveUp(row, $index)"
            >
              上移
            </el-button>
            <el-button 
              type="danger" 
              size="small"
              @click="removeBanner(row)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="empty-state" v-if="!loading && banners.length === 0">
        <el-empty description="暂无轮播电影，点击上方按钮添加" />
      </div>
    </el-card>

    <!-- Movie Selector Dialog -->
    <el-dialog 
      v-model="movieSelectorVisible" 
      title="选择电影" 
      width="70%"
      :close-on-click-modal="false"
    >
      <div class="movie-selector">
        <el-input 
          v-model="movieSearch" 
          placeholder="搜索电影..." 
          @input="searchMovies"
          clearable
          style="margin-bottom: 16px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-table 
          :data="availableMovies" 
          style="width: 100%"
          v-loading="searching"
          max-height="400"
        >
          <el-table-column label="海报" width="100">
            <template #default="{ row }">
                <el-image 
                  :src="`https://image.tmdb.org/t/p/w200${row.poster_path}`"
                  fit="cover"
                  style="width: 60px; height: 90px; border-radius: 4px;"
                />
              </template>
            </el-table-column>
            <el-table-column label="标题" prop="title" />
            <el-table-column label="评分" width="80">
              <template #default="{ row }">
                {{ Number(row.vote_average).toFixed(1) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small"
                  :disabled="row.is_banner"
                  @click="addToBanner(row)"
                >
                  {{ row.is_banner ? '已添加' : '添加' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="moviePage"
              :page-size="10"
              :total="movieTotal"
              layout="prev, pager, next"
              @current-change="loadAvailableMovies"
            />
          </div>
        </div>
      </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const banners = ref([])
const loading = ref(false)
const movieSelectorVisible = ref(false)
const movieSearch = ref('')
const availableMovies = ref([])
const searching = ref(false)
const moviePage = ref(1)
const movieTotal = ref(0)

const getToken = () => localStorage.getItem('admin_token')

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

const loadBanners = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/banners`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      banners.value = res.data.data || []
    }
  } catch (e) {
    console.error('Failed to load banners:', e)
    ElMessage.error('加载轮播列表失败')
  } finally {
    loading.value = false
  }
}

const showMovieSelector = () => {
  movieSelectorVisible.value = true
  loadAvailableMovies()
}

const loadAvailableMovies = async () => {
  searching.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/banners/available`, {
      params: {
        page: moviePage.value,
        limit: 10,
        search: movieSearch.value
      },
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      availableMovies.value = res.data.data.movies || []
      movieTotal.value = res.data.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('Failed to load movies:', e)
  } finally {
    searching.value = false
  }
}

let searchTimeout = null
const searchMovies = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    moviePage.value = 1
    loadAvailableMovies()
  }, 300)
}

const addToBanner = async (movie) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/banners/${movie.id}`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      ElMessage.success('已添加到轮播')
      loadBanners()
      loadAvailableMovies()
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '添加失败')
  }
}

const removeBanner = async (movie) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/admin/banners/${movie.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.data.success) {
      ElMessage.success('已从轮播移除')
      loadBanners()
    }
  } catch (e) {
    ElMessage.error('移除失败')
  }
}

const moveUp = async (movie, index) => {
  if (index === 0) return
  
  const newBanners = [...banners.value]
  const temp = newBanners[index - 1]
  newBanners[index - 1] = newBanners[index]
  newBanners[index] = temp

  // Update order on server
  try {
    const orders = newBanners.map((m, i) => ({ id: m.id, order: i + 1 }))
    await axios.put(`${API_BASE_URL}/admin/banners/order`, 
      { orders },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
    banners.value = newBanners
    ElMessage.success('顺序已更新')
  } catch (e) {
    ElMessage.error('更新顺序失败')
  }
}

onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-info {
  margin-bottom: 16px;
}

.empty-state {
  padding: 40px 0;
}

.movie-selector {
  max-height: 500px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
