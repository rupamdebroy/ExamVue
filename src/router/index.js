import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { isAdminUser, isAuthenticated } from '../shared/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const loggedIn = isAuthenticated()
  const isAdmin = isAdminUser()

  if (to.meta.requiresAuth && !loggedIn) {
    next('/login')
  } else if (to.name === 'login' && loggedIn) {
    next('/dashboard')
  } else if (to.meta.requiresAdmin && !isAdmin) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
