<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">MovieHub 后台管理</h2>
      </template>
      
      <el-form :model="form" :rules="rules" ref="loginForm">
        <el-form-item prop="email">
          <el-input 
            v-model="form.email" 
            placeholder="邮箱"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="密码"
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin"
            :loading="loading"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const loginForm = ref(null)
    const loading = ref(false)
    
    const form = reactive({
      email: '',
      password: ''
    })
    
    const rules = {
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少6位', trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      try {
        await loginForm.value.validate()
        loading.value = true
        
        const response = await axios.post('http://localhost:3001/api/v1/auth/login', form)
        
        if (response.data.success) {
          const { token, user } = response.data.data
          localStorage.setItem('admin_token', token)
          localStorage.setItem('admin_user', JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            roleId: user.roleId,
            roleName: user.roleName,
            permissions: user.permissions || [],
            isSuperAdmin: user.isSuperAdmin || false
          }))
          ElMessage.success('登录成功')
          router.push('/')
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.error?.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
    
    return {
      form,
      rules,
      loginForm,
      loading,
      handleLogin,
      User,
      Lock
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
}

.login-card {
  width: 400px;
}

.login-title {
  text-align: center;
  margin: 0;
  font-size: 20px;
  color: #303133;
}
</style>
