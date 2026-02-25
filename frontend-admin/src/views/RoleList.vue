<template>
  <div class="role-list">
    <!-- Header -->
    <div class="header-actions">
      <div class="stats">
        共 <strong>{{ roles.length }}</strong> 个角色
      </div>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加角色
      </el-button>
    </div>

    <!-- Role Table -->
    <el-table :data="roles" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="角色标识" width="150">
        <template #default="{ row }">
          <el-tag :type="row.is_system ? 'info' : ''">{{ row.name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="display_name" label="角色名称" width="150" />
      <el-table-column prop="description" label="描述" min-width="200" />
      <el-table-column prop="permission_count" label="权限数" width="100">
        <template #default="{ row }">
          <el-tag type="success" size="small">{{ row.permission_count }} 个</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="user_count" label="用户数" width="100">
        <template #default="{ row }">
          <el-tag type="warning" size="small">{{ row.user_count }} 人</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_system" label="系统角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.is_system ? 'danger' : 'info'" size="small">
            {{ row.is_system ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click="editRole(row)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteRole(row)"
              :disabled="row.is_system"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit Dialog -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingRole ? '编辑角色' : '添加角色'"
      width="700px"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="角色标识" prop="name" v-if="!editingRole">
          <el-input v-model="formData.name" placeholder="如: editor" />
          <div class="form-tip">角色标识只能包含字母、数字和下划线</div>
        </el-form-item>
        <el-form-item label="角色名称" prop="display_name">
          <el-input v-model="formData.display_name" placeholder="如: 编辑" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="角色描述" />
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="permissions-section">
            <div v-for="(perms, module) in groupedPermissions" :key="module" class="module-group">
              <div class="module-header">
                <el-checkbox 
                  :model-value="isModuleSelected(module)"
                  :indeterminate="isModuleIndeterminate(module)"
                  @change="toggleModule(module, $event)"
                >
                  {{ getModuleName(module) }}
                </el-checkbox>
              </div>
              <div class="module-permissions">
                <el-checkbox 
                  v-for="perm in perms" 
                  :key="perm.id"
                  :label="perm.id"
                  v-model="formData.permissions"
                >
                  {{ perm.display_name }}
                </el-checkbox>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingRole ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api/v1'

const roles = ref([])
const permissions = ref([])
const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const editingRole = ref(null)
const formRef = ref(null)

const formData = reactive({
  name: '',
  display_name: '',
  description: '',
  permissions: []
})

const formRules = {
  name: [
    { required: true, message: '请输入角色标识', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '只能包含小写字母和下划线', trigger: 'blur' }
  ],
  display_name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

const moduleNames = {
  movie: '电影管理',
  genre: '分类管理',
  user: '用户管理',
  review: '评论管理',
  system: '系统管理'
}

const getToken = () => localStorage.getItem('admin_token')

const groupedPermissions = computed(() => {
  const grouped = {}
  permissions.value.forEach(p => {
    if (!grouped[p.module]) {
      grouped[p.module] = []
    }
    grouped[p.module].push(p)
  })
  return grouped
})

const getModuleName = (module) => moduleNames[module] || module

const isModuleSelected = (module) => {
  const modulePerms = groupedPermissions.value[module] || []
  return modulePerms.every(p => formData.permissions.includes(p.id))
}

const isModuleIndeterminate = (module) => {
  const modulePerms = groupedPermissions.value[module] || []
  const selectedCount = modulePerms.filter(p => formData.permissions.includes(p.id)).length
  return selectedCount > 0 && selectedCount < modulePerms.length
}

const toggleModule = (module, checked) => {
  const modulePerms = groupedPermissions.value[module] || []
  if (checked) {
    modulePerms.forEach(p => {
      if (!formData.permissions.includes(p.id)) {
        formData.permissions.push(p.id)
      }
    })
  } else {
    const moduleIds = modulePerms.map(p => p.id)
    formData.permissions = formData.permissions.filter(id => !moduleIds.includes(id))
  }
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/roles`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    roles.value = res.data.data || []
  } catch (e) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const fetchPermissions = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/permissions`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    permissions.value = res.data.data?.permissions || []
  } catch (e) {
    ElMessage.error('获取权限列表失败')
  }
}

const editRole = async (role) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/admin/roles/${role.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    const roleData = res.data.data
    editingRole.value = roleData
    formData.name = roleData.name
    formData.display_name = roleData.display_name
    formData.description = roleData.description
    formData.permissions = (roleData.permissions || []).map(p => p.id)
    showAddDialog.value = true
  } catch (e) {
    ElMessage.error('获取角色详情失败')
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    if (editingRole.value) {
      await axios.put(
        `${API_BASE_URL}/admin/roles/${editingRole.value.id}`,
        {
          display_name: formData.display_name,
          description: formData.description,
          permissions: formData.permissions
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      ElMessage.success('角色更新成功')
    } else {
      await axios.post(
        `${API_BASE_URL}/admin/roles`,
        formData,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      )
      ElMessage.success('角色添加成功')
    }
    showAddDialog.value = false
    resetForm()
    fetchRoles()
  } catch (e) {
    ElMessage.error(e.response?.data?.error?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteRole = async (role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色「${role.display_name}」吗？`,
      '删除确认',
      { type: 'warning' }
    )

    await axios.delete(`${API_BASE_URL}/admin/roles/${role.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    
    ElMessage.success('角色删除成功')
    fetchRoles()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error?.message || '删除失败')
    }
  }
}

const resetForm = () => {
  editingRole.value = null
  formData.name = ''
  formData.display_name = ''
  formData.description = ''
  formData.permissions = []
  formRef.value?.resetFields()
}

onMounted(async () => {
  await Promise.all([fetchRoles(), fetchPermissions()])
})
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.permissions-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.module-group {
  border-bottom: 1px solid #ebeef5;
}

.module-group:last-child {
  border-bottom: none;
}

.module-header {
  background: #f5f7fa;
  padding: 10px 15px;
  font-weight: 500;
}

.module-permissions {
  padding: 10px 15px 10px 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
</style>
