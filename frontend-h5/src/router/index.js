import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Movies from '../views/Movies.vue'
import MovieDetail from '../views/MovieDetail.vue'
import Search from '../views/Search.vue'
import Profile from '../views/Profile.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页' }
  },
  {
    path: '/movies',
    name: 'Movies',
    component: Movies,
    meta: { title: '电影' }
  },
  {
    path: '/movie/:id',
    name: 'MovieDetail',
    component: MovieDetail,
    meta: { title: '电影详情' }
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
    meta: { title: '搜索' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { title: '我的' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - MovieHub` : 'MovieHub'
  next()
})

export default router
