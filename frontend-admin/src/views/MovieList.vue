<template>
  <div class="movie-list">
    <!-- Header Actions -->
    <div class="header-actions">
      <div class="search-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索电影..."
          style="width: 280px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="selectedGenre" placeholder="分类" clearable @change="fetchMovies" style="width: 140px">
          <el-option v-for="g in genres" :key="g.id" :label="g.name" :value="g.tmdbId || g.id" />
        </el-select>
        <el-select v-model="sortBy" placeholder="排序" @change="fetchMovies" style="width: 130px">
          <el-option label="热度排序" value="popularity" />
          <el-option label="评分排序" value="vote_average" />
          <el-option label="最新上映" value="release_date" />
          <el-option label="最新添加" value="created_at" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="状态" clearable @change="fetchMovies" style="width: 110px">
          <el-option label="全部" :value="null" />
          <el-option label="热门" value="popular" />
          <el-option label="趋势" value="trending" />
        </el-select>
      </div>
      <div class="actions-right">
        <el-button 
          v-if="selectedMovies.length > 0" 
          type="danger" 
          @click="batchDelete"
        >
          删除选中 ({{ selectedMovies.length }})
        </el-button>
        <el-button type="success" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加电影
        </el-button>
        <el-button type="primary" @click="showSyncDialog = true">
          <el-icon><Refresh /></el-icon>
          同步数据
        </el-button>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <span>共 <strong>{{ total }}</strong> 部电影</span>
      <span v-if="selectedMovies.length > 0">已选 <strong>{{ selectedMovies.length }}</strong> 部</span>
    </div>

    <!-- Movie Table -->
    <el-table 
      :data="movies" 
      v-loading="loading" 
      border 
      stripe
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="id" label="ID" width="70" sortable="custom" />
      <el-table-column prop="title" label="标题" min-width="280">
        <template #default="{ row }">
          <div class="movie-info">
            <img :src="getPosterUrl(row.posterPath || row.poster_path)" class="movie-poster" @click="viewMovie(row)">
            <div class="movie-meta">
              <span class="movie-title" @click="viewMovie(row)">{{ row.title }}</span>
              <span class="movie-original" v-if="row.originalTitle && row.originalTitle !== row.title">
                {{ row.originalTitle }}
              </span>
              <div class="movie-badges">
                <el-tag v-if="row.isPopular" type="success" size="small" effect="dark">热门</el-tag>
                <el-tag v-if="row.isTrending" type="danger" size="small" effect="dark">趋势</el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="voteAverage" label="评分" width="110" sortable="custom">
        <template #default="{ row }">
          <div class="rating-cell">
            <el-progress 
              :percentage="row.voteAverage * 10" 
              :stroke-width="8"
              :color="getRatingColor(row.voteAverage)"
              :show-text="false"
            />
            <span class="rating-text">{{ Number(row.voteAverage).toFixed(1) || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="releaseDate" label="上映日期" width="110" sortable="custom">
        <template #default="{ row }">
          {{ formatDate(row.releaseDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="popularity" label="热度" width="90" sortable="custom">
        <template #default="{ row }">
          <span class="popularity">{{ Number(row.popularity).toFixed(0) || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-switch
            v-model="row.isPopular"
            @change="(val) => updateMovieStatus(row, 'isPopular', val)"
            active-text="热门"
            inactive-text=""
            size="small"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click="editMovie(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button size="small" type="primary" @click="viewMovie(row)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="deleteMovie(row)">
              <el-icon><Delete /></el-icon>
            </el-button>
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
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="fetchMovies"
      />
    </div>

    <!-- Sync Dialog -->
    <el-dialog v-model="showSyncDialog" title="同步 TMDB 数据" width="500px">
      <el-form label-width="100px">
        <el-form-item label="同步类型">
          <el-radio-group v-model="syncType">
            <el-radio value="movies">电影</el-radio>
            <el-radio value="genres">分类</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="同步数量" v-if="syncType === 'movies'">
          <el-input-number v-model="syncLimit" :min="10" :max="100" :step="10" />
        </el-form-item>
        <el-form-item label="页码" v-if="syncType === 'movies'">
          <el-input-number v-model="syncPage" :min="1" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSyncDialog = false">取消</el-button>
        <el-button type="primary" @click="syncMovies" :loading="syncing">
          开始同步
        </el-button>
      </template>
    </el-dialog>

    <!-- Movie Detail Dialog -->
    <el-dialog v-model="showDetailDialog" :title="currentMovie?.title" width="700px">
      <div class="movie-detail" v-if="currentMovie">
        <div class="detail-header">
          <img :src="getPosterUrl(currentMovie.posterPath || currentMovie.poster_path, 'w342')" class="detail-poster">
          <div class="detail-info">
            <h2>{{ currentMovie.title }}</h2>
            <p class="tagline" v-if="currentMovie.tagline">{{ currentMovie.tagline }}</p>
            <div class="meta">
              <span>评分: {{ Number(currentMovie.voteAverage || currentMovie.vote_average).toFixed(1) }}</span>
              <span>热度: {{ Number(currentMovie.popularity).toFixed(0) }}</span>
              <span>时长: {{ currentMovie.runtime || '-' }}分钟</span>
            </div>
            <div class="genres">
              <el-tag v-for="g in currentMovie.genres" :key="g.id" size="small">
                {{ g.name }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="detail-overview">
          <h4>剧情简介</h4>
          <p>{{ currentMovie.overview || '暂无简介' }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- Edit Movie Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑电影" width="650px">
      <el-form :model="editForm" label-width="100px" v-if="editForm">
        <el-form-item label="标题">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.genres" multiple placeholder="选择分类" style="width: 100%">
            <el-option v-for="g in genres" :key="g.id" :label="g.name" :value="g.tmdbId || g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="评分">
          <el-slider v-model="editForm.voteAverage" :min="0" :max="10" :step="0.1" show-input />
        </el-form-item>
        <el-form-item label="热度">
          <el-input-number v-model="editForm.popularity" :min="0" :max="10000" />
        </el-form-item>
        <el-form-item label="海报URL">
          <el-input v-model="editForm.posterPath" placeholder="/abc123.jpg" />
        </el-form-item>
        <el-form-item label="背景URL">
          <el-input v-model="editForm.backdropPath" placeholder="/def456.jpg" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.overview" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="状态">
          <el-checkbox v-model="editForm.isPopular">热门</el-checkbox>
          <el-checkbox v-model="editForm.isTrending">趋势</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMovie" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- Add Movie Dialog -->
    <el-dialog v-model="showAddDialog" title="添加电影" width="700px">
      <el-tabs v-model="addTab">
        <el-tab-pane label="手动添加" name="manual">
          <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
            <el-form-item label="电影标题" prop="title">
              <el-input v-model="addForm.title" placeholder="请输入电影标题" />
            </el-form-item>
            <el-form-item label="上映日期">
              <el-date-picker v-model="addForm.releaseDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
            <el-form-item label="时长(分钟)">
              <el-input-number v-model="addForm.runtime" :min="1" :max="500" style="width: 100%" />
            </el-form-item>
            <el-form-item label="评分">
              <el-slider v-model="addForm.voteAverage" :min="0" :max="10" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="海报URL">
              <el-input v-model="addForm.posterPath" placeholder="例如: /abc123.jpg (TMDB路径) 或完整URL" />
            </el-form-item>
            <el-form-item label="背景URL">
              <el-input v-model="addForm.backdropPath" placeholder="例如: /def456.jpg (TMDB路径)" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="addForm.selectedGenres" multiple placeholder="选择分类" style="width: 100%">
                <el-option v-for="g in genres" :key="g.id" :label="g.name" :value="g.tmdbId || g.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="简介">
              <el-input v-model="addForm.overview" type="textarea" :rows="4" placeholder="电影简介" />
            </el-form-item>
            <el-form-item label="状态">
              <el-checkbox v-model="addForm.isPopular">标记为热门</el-checkbox>
              <el-checkbox v-model="addForm.isTrending">标记为趋势</el-checkbox>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="搜索TMDB" name="tmdb">
          <div class="tmdb-search">
            <el-input v-model="tmdbSearchQuery" placeholder="输入电影名称搜索 TMDB..." @keyup.enter="searchTMDB">
              <template #append>
                <el-button @click="searchTMDB" :loading="tmdbSearching">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
            <div class="tmdb-results" v-loading="tmdbSearching">
              <div v-for="movie in tmdbResults" :key="movie.id" class="tmdb-movie-item" @click="selectTMDBMovie(movie)">
                <img :src="getPosterUrl(movie.poster_path, 'w92')" class="tmdb-poster">
                <div class="tmdb-info">
                  <div class="tmdb-title">{{ movie.title }}</div>
                  <div class="tmdb-meta">{{ movie.release_date?.split('-')[0] || '未知年份' }} · {{ Number(movie.vote_average).toFixed(1) }}分</div>
                  <div class="tmdb-overview">{{ movie.overview?.substring(0, 100) }}...</div>
                </div>
                <el-button type="primary" size="small">导入</el-button>
              </div>
              <el-empty v-if="!tmdbSearching && tmdbResults.length === 0 && tmdbSearchQuery" description="未找到相关电影" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addMovie" :loading="adding" v-if="addTab === 'manual'">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Edit, View, Delete, Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const movies = ref([])
const genres = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const searchQuery = ref('')
const selectedGenre = ref(null)
const sortBy = ref('popularity')
const statusFilter = ref(null)
const showSyncDialog = ref(false)
const showDetailDialog = ref(false)
const showEditDialog = ref(false)
const showAddDialog = ref(false)
const syncing = ref(false)
const saving = ref(false)
const adding = ref(false)
const addTab = ref('manual')
const syncType = ref('movies')
const syncLimit = ref(20)
const syncPage = ref(1)
const currentMovie = ref(null)
const editForm = ref(null)
const selectedMovies = ref([])
const tmdbSearchQuery = ref('')
const tmdbResults = ref([])
const tmdbSearching = ref(false)
const addFormRef = ref(null)

const addForm = reactive({
  title: '',
  overview: '',
  posterPath: '',
  backdropPath: '',
  releaseDate: null,
  runtime: null,
  voteAverage: 7,
  popularity: 0,
  selectedGenres: [],
  isPopular: false,
  isTrending: false
})

const addRules = {
  title: [{ required: true, message: '请输入电影标题', trigger: 'blur' }]
}

const getToken = () => localStorage.getItem('admin_token')

const fetchMovies = async () => {
  loading.value = true
  try {
    const params = { 
      page: page.value, 
      limit: limit.value,
      sort: sortBy.value
    }
    if (selectedGenre.value) params.genre = selectedGenre.value
    if (searchQuery.value) params.keyword = searchQuery.value

    const res = await axios.get(`${API_BASE_URL}/movies`, { params })
    if (res.data.success) {
      movies.value = res.data.data.movies || []
      total.value = res.data.data.pagination?.total || 0
    }
  } catch (e) {
    ElMessage.error('获取电影列表失败')
  } finally {
    loading.value = false
  }
}

const fetchGenres = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/genres`)
    genres.value = res.data.data || []
  } catch (e) {
    console.error('Failed to load genres:', e)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchMovies()
}

const handleSortChange = ({ prop, order }) => {
  if (order) {
    sortBy.value = order === 'ascending' ? prop : `-${prop}`
    fetchMovies()
  }
}

const handleSelectionChange = (selection) => {
  selectedMovies.value = selection
}

const getRatingColor = (rating) => {
  if (rating >= 8) return '#67C23A'
  if (rating >= 6) return '#E6A23C'
  return '#F56C6C'
}

const syncMovies = async () => {
  syncing.value = true
  try {
    const res = await axios.post(`${API_BASE_URL}/admin/sync`, {
      type: syncType.value,
      page: syncPage.value,
      limit: syncLimit.value
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })

    if (res.data.success) {
      ElMessage.success(`同步成功，共 ${res.data.data.synced} 条数据`)
      showSyncDialog.value = false
      fetchMovies()
      fetchGenres()
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '同步失败')
  } finally {
    syncing.value = false
  }
}

const viewMovie = async (movie) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/movies/${movie.id}`)
    currentMovie.value = res.data.data
    showDetailDialog.value = true
  } catch (e) {
    ElMessage.error('获取电影详情失败')
  }
}

const editMovie = async (movie) => {
  try {
    // Fetch full movie details including genres
    const res = await axios.get(`${API_BASE_URL}/movies/${movie.id}`)
    const fullMovie = res.data.data
    
    editForm.value = {
      id: fullMovie.id,
      title: fullMovie.title,
      overview: fullMovie.overview,
      posterPath: fullMovie.posterPath || fullMovie.poster_path,
      backdropPath: fullMovie.backdropPath || fullMovie.backdrop_path,
      voteAverage: Number(fullMovie.voteAverage || fullMovie.vote_average || 0),
      popularity: Number(fullMovie.popularity || 0),
      isPopular: fullMovie.isPopular || fullMovie.is_popular,
      isTrending: fullMovie.isTrending || fullMovie.is_trending,
      genres: (fullMovie.genres || []).map(g => g.id) // Array of genre tmdb_ids
    }
    showEditDialog.value = true
  } catch (e) {
    ElMessage.error('获取电影详情失败')
  }
}

const saveMovie = async () => {
  saving.value = true
  try {
    await axios.put(`${API_BASE_URL}/admin/movies/${editForm.value.id}`, {
      title: editForm.value.title,
      overview: editForm.value.overview,
      posterPath: editForm.value.posterPath,
      backdropPath: editForm.value.backdropPath,
      voteAverage: editForm.value.voteAverage,
      popularity: editForm.value.popularity,
      isPopular: editForm.value.isPopular,
      isTrending: editForm.value.isTrending,
      genres: editForm.value.genres
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    ElMessage.success('保存成功')
    showEditDialog.value = false
    fetchMovies()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const addMovie = async () => {
  try {
    await addFormRef.value.validate()
  } catch {
    return
  }

  adding.value = true
  try {
    const genreObjects = addForm.selectedGenres.map(gId => {
      const genre = genres.value.find(g => (g.tmdbId || g.id) === gId)
      return genre ? { id: gId, name: genre.name } : null
    }).filter(Boolean)

    await axios.post(`${API_BASE_URL}/admin/movies`, {
      title: addForm.title,
      overview: addForm.overview,
      posterPath: addForm.posterPath,
      backdropPath: addForm.backdropPath,
      releaseDate: addForm.releaseDate ? new Date(addForm.releaseDate).toISOString().split('T')[0] : null,
      runtime: addForm.runtime,
      voteAverage: addForm.voteAverage,
      popularity: addForm.popularity,
      genres: genreObjects,
      isPopular: addForm.isPopular,
      isTrending: addForm.isTrending
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })

    ElMessage.success('电影添加成功')
    showAddDialog.value = false
    resetAddForm()
    fetchMovies()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '添加失败')
  } finally {
    adding.value = false
  }
}

const searchTMDB = async () => {
  if (!tmdbSearchQuery.value.trim()) return
  
  tmdbSearching.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/tmdb/search`, {
      params: { query: tmdbSearchQuery.value },
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    tmdbResults.value = res.data.data?.results || []
  } catch (e) {
    ElMessage.error('搜索 TMDB 失败')
  } finally {
    tmdbSearching.value = false
  }
}

const selectTMDBMovie = async (movie) => {
  try {
    await axios.post(`${API_BASE_URL}/admin/sync`, {
      type: 'single_movie',
      tmdbId: movie.id
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    ElMessage.success(`《${movie.title}》已导入`)
    showAddDialog.value = false
    fetchMovies()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '导入失败')
  }
}

const resetAddForm = () => {
  addForm.title = ''
  addForm.overview = ''
  addForm.posterPath = ''
  addForm.backdropPath = ''
  addForm.releaseDate = null
  addForm.runtime = null
  addForm.voteAverage = 7
  addForm.popularity = 0
  addForm.selectedGenres = []
  addForm.isPopular = false
  addForm.isTrending = false
  addFormRef.value?.resetFields()
}

const updateMovieStatus = async (movie, field, value) => {
  try {
    await axios.put(`${API_BASE_URL}/admin/movies/${movie.id}`, {
      ...movie,
      [field]: value
    }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    ElMessage.success('状态已更新')
  } catch (e) {
    movie[field] = !value // Revert
    ElMessage.error('更新失败')
  }
}

const deleteMovie = async (movie) => {
  try {
    await ElMessageBox.confirm(`确定要删除《${movie.title}》吗？`, '警告', {
      type: 'warning'
    })
    
    await axios.delete(`${API_BASE_URL}/admin/movies/${movie.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    ElMessage.success('删除成功')
    fetchMovies()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '删除失败')
    }
  }
}

const batchDelete = async () => {
  try {
    const count = selectedMovies.value.length
    await ElMessageBox.confirm(`确定要删除选中的 ${count} 部电影吗？`, '警告', {
      type: 'warning'
    })
    
    await Promise.all(
      selectedMovies.value.map(movie => 
        axios.delete(`${API_BASE_URL}/admin/movies/${movie.id}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      )
    )
    
    ElMessage.success(`成功删除 ${count} 部电影`)
    selectedMovies.value = []
    fetchMovies()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

const getPosterUrl = (path, size = 'w92') => {
  if (!path) {
    // 使用一个简单的灰色占位图
    return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="92" height="138" viewBox="0 0 92 138"><rect fill="#e0e0e0" width="92" height="138"/><text x="50%" y="50%" fill="#999" font-size="12" text-anchor="middle" dy=".3em">No Image</text></svg>')
  }
  return `https://image.tmdb.org/t/p/${size}${path}`
}

const formatDate = (date) => {
  return date ? new Date(date).toLocaleDateString('zh-CN') : '-'
}

onMounted(async () => {
  await Promise.all([fetchMovies(), fetchGenres()])
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-filters {
  display: flex;
  gap: 12px;
}

.actions-right {
  display: flex;
  gap: 12px;
}

.stats-bar {
  margin-bottom: 16px;
  font-size: 13px;
  color: #909399;
}

.stats-bar strong {
  color: #409EFF;
}

.movie-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.movie-poster {
  width: 45px;
  height: 68px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.movie-poster:hover {
  transform: scale(1.05);
}

.movie-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.movie-title {
  font-weight: 500;
  cursor: pointer;
}

.movie-title:hover {
  color: #409EFF;
}

.movie-original {
  font-size: 12px;
  color: #909399;
}

.movie-badges {
  display: flex;
  gap: 4px;
}

.rating-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-cell .el-progress {
  flex: 1;
}

.rating-text {
  font-weight: 500;
  min-width: 32px;
  text-align: right;
}

.popularity {
  color: #909399;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.movie-detail {
  padding: 0;
}

.detail-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.detail-poster {
  width: 200px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
}

.detail-info {
  flex: 1;
}

.detail-info h2 {
  margin: 0 0 10px;
}

.tagline {
  font-style: italic;
  color: #909399;
  margin-bottom: 16px;
}

.meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  color: #606266;
}

.genres {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-overview h4 {
  margin-bottom: 10px;
}

.detail-overview p {
  color: #606266;
  line-height: 1.6;
}

.tmdb-search {
  margin-bottom: 20px;
}

.tmdb-results {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.tmdb-movie-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tmdb-movie-item:hover {
  border-color: #409EFF;
  background: #f5f7fa;
}

.tmdb-poster {
  width: 50px;
  height: 75px;
  object-fit: cover;
  border-radius: 4px;
}

.tmdb-info {
  flex: 1;
  min-width: 0;
}

.tmdb-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.tmdb-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.tmdb-overview {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
