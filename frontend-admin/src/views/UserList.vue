<template>
  <div class="user-list">
    <!-- Header -->
    <div class="header-actions">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户..."
        style="width: 300px"
        clearable
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- User Table -->
    <el-table :data="users" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" min-width="150">
        <template #default="{ row }">
          <div class="user-info">
            <el-avatar :size="36" class="user-avatar">
              {{ row.username?.charAt(0)?.toUpperCase() || 'U' }}
            </el-avatar>
            <span>{{ row.username }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column label="角色" width="180">
        <template #default="{ row }">
          <el-select 
            v-model="row.role_id" 
            size="small" 
            @change="(val) => updateRole(row, val)"
            :disabled="row.id === currentUserId"
            placeholder="选择角色"
          >
            <el-option 
              v-for="role in roles" 
              :key="role.id" 
              :label="role.display_name" 
              :value="role.id"
            >
              <div class="role-option">
                <span>{{ role.display_name }}</span>
                <el-tag v-if="role.is_system" size="small" type="info">系统</el-tag>
              </div>
            </el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="旧角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
            {{ row.role === 'admin' ? '管理员' : '用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at || row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="lastLogin" label="最后登录" width="180">
        <template #default="{ row }">
          {{ formatDate(row.last_login || row.lastLogin) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteUser(row)"
            :disabled="row.id === currentUserId"
          >
            删除
          </el-button>
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
        @change="fetchUsers"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const users = ref([])
const roles = ref([])
const loading = ref(false)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const searchQuery = ref('')

const getToken = () => localStorage.getItem('admin_token')

const currentUserId = computed(() => {
  const user = localStorage.getItem('admin_user')
  return user ? JSON.parse(user).id : null
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/users`, {
      params: { page: page.value, limit: limit.value },
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    if (res.data.success) {
      users.value = res.data.data.users || []
      total.value = res.data.data.pagination?.total || 0
    }
  } catch (e) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/roles`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    roles.value = res.data.data || []
  } catch (e) {
    console.error('Failed to load roles:', e)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchUsers()
}

const updateRole = async (user, newRoleId) => {
  try {
    await axios.put(`${API_BASE_URL}/admin/users/${user.id}/role`, 
      { role_id: newRoleId },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    )
    ElMessage.success('角色更新成功')
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '更新失败')
    fetchUsers()
  }
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？`, '警告', {
      type: 'warning'
    })
    
    await axios.delete(`${API_BASE_URL}/admin/users/${user.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '删除失败')
    }
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(async () => {
  await Promise.all([fetchUsers(), fetchRoles()])
})
</script>

<style scoped>
.header-actions {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  background: #409EFF;
  color: #fff;
}

.role-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
