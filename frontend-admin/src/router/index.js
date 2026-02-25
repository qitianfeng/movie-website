import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import MovieList from '../views/MovieList.vue'
import GenreList from '../views/GenreList.vue'
import UserList from '../views/UserList.vue'
import RoleList from '../views/RoleList.vue'
import ReviewList from '../views/ReviewList.vue'
import BannerList from '../views/BannerList.vue'
import Logs from '../views/Logs.vue'
import Settings from '../views/Settings.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'movies',
        name: 'MovieList',
        component: MovieList,
        meta: { title: '电影管理', icon: 'VideoCamera' }
      },
      {
        path: 'banners',
        name: 'BannerList',
        component: BannerList,
        meta: { title: '轮播管理', icon: 'Picture' }
      },
      {
        path: 'genres',
        name: 'GenreList',
        component: GenreList,
        meta: { title: '分类管理', icon: 'Grid' }
      },
      {
        path: 'users',
        name: 'UserList',
        component: UserList,
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'roles',
        name: 'RoleList',
        component: RoleList,
        meta: { title: '角色管理', icon: 'Key' }
      },
      {
        path: 'reviews',
        name: 'ReviewList',
        component: ReviewList,
        meta: { title: '评论管理', icon: 'ChatDotRound' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: Logs,
        meta: { title: '系统日志', icon: 'Document' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Auth guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (!to.meta.public && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
