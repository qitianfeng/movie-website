<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo">
        <span v-if="!isCollapse">MovieHub Admin</span>
        <span v-else>MH</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="item in filteredMenus" :key="item.path">
          <el-menu-item :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon 
            class="collapse-btn" 
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" class="avatar">
                {{ userInfo.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <div class="user-role">
                    <span>角色: </span>
                    <el-tag size="small" type="primary">{{ userInfo.roleName || '普通用户' }}</el-tag>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Odometer, 
  VideoCamera, 
  Picture,
  Grid,
  User, 
  Key,
  ChatDotRound, 
  Document,
  Setting, 
  ArrowDown,
  Fold,
  Expand
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 菜单折叠状态
const isCollapse = ref(false)

// 菜单配置（包含所需权限）
const allMenus = [
  {
    path: '/dashboard',
    title: '仪表盘',
    icon: markRaw(Odometer),
    permission: 'dashboard' // 仪表盘所有人都能看
  },
  {
    path: '/movies',
    title: '电影管理',
    icon: markRaw(VideoCamera),
    permission: 'movie'
  },
  {
    path: '/banners',
    title: '轮播管理',
    icon: markRaw(Picture),
    permission: 'movie' // 轮播管理需要电影权限
  },
  {
    path: '/genres',
    title: '分类管理',
    icon: markRaw(Grid),
    permission: 'genre'
  },
  {
    path: '/users',
    title: '用户管理',
    icon: markRaw(User),
    permission: 'user'
  },
  {
    path: '/roles',
    title: '角色管理',
    icon: markRaw(Key),
    permission: 'role'
  },
  {
    path: '/reviews',
    title: '评论管理',
    icon: markRaw(ChatDotRound),
    permission: 'review'
  },
  {
    path: '/logs',
    title: '系统日志',
    icon: markRaw(Document),
    permission: 'system'
  },
  {
    path: '/settings',
    title: '系统设置',
    icon: markRaw(Setting),
    permission: 'system'
  }
]

const activeMenu = computed(() => route.path)

const userInfo = computed(() => {
  const user = localStorage.getItem('admin_user')
  return user ? JSON.parse(user) : {}
})

// 用户权限列表
const userPermissions = computed(() => {
  return userInfo.value.permissions || []
})

// 检查是否是超级管理员
const isSuperAdmin = computed(() => {
  // 以数据库 roleId 为准
  if (userInfo.value.roleId === 1 || userInfo.value.roleId === '1') {
    return true
  }
  // 兼容 roleName 判断
  if (userInfo.value.roleName === '超级管理员' || userInfo.value.role === 'super_admin') {
    return true
  }
  return false
})

// 根据权限过滤菜单
const filteredMenus = computed(() => {
  // 超级管理员显示所有菜单
  if (isSuperAdmin.value) {
    return allMenus
  }
  
  // 普通用户根据权限过滤
  return allMenus.filter(menu => {
    // 仪表盘所有人都能访问
    if (menu.permission === 'dashboard') {
      return true
    }
    
    // 检查用户是否有对应权限
    return userPermissions.value.includes(menu.permission) || 
           userPermissions.value.includes(`${menu.permission}_read`) ||
           userPermissions.value.includes(`${menu.permission}_write`) ||
           userPermissions.value.includes(`${menu.permission}_delete`)
  })
})

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.aside {
  background: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.aside :deep(.el-menu) {
  border-right: none;
}

.aside :deep(.el-menu--collapse) {
  width: 64px;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
  overflow: hidden;
  white-space: nowrap;
}

.header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  transition: color 0.3s;
}

.collapse-btn:hover {
  color: #409EFF;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  background: #409EFF;
  color: #fff;
}

.username {
  font-weight: 500;
}

.user-role {
  color: #909399;
  font-size: 12px;
}

.main {
  background: #f0f2f5;
  padding: 20px;
}

/* 折叠时隐藏菜单文字 */
.aside :deep(.el-menu--collapse .el-menu-item span) {
  display: none;
}
</style>
