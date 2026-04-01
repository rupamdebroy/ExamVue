<template>
  <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">TC</div>
        <h2>TCExam</h2>
      </div>
      <button class="close-sidebar" @click="$emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    <div class="sidebar-content">
      <div class="nav-section">
        <p class="nav-label">Main</p>
        <router-link to="/dashboard" class="nav-link" active-class="active" @click="handleLinkClick">
          <span>Dashboard</span>
        </router-link>
        <router-link to="/groups" class="nav-link" active-class="active" @click="handleLinkClick">
          <span>Exam Categories</span>
        </router-link>
      </div>

      <div class="nav-section" v-if="isAdmin">
        <p class="nav-label">Administration</p>
        <router-link to="/admin/users" class="nav-link" active-class="active" @click="handleLinkClick"><span>Manage Users</span></router-link>
        <router-link to="/admin/modules" class="nav-link" active-class="active" @click="handleLinkClick"><span>Manage Modules</span></router-link>
        <router-link to="/admin/topics" class="nav-link" active-class="active" @click="handleLinkClick"><span>Manage Topics</span></router-link>
        <router-link to="/admin/questions" class="nav-link" active-class="active" @click="handleLinkClick"><span>Manage Questions</span></router-link>
        <router-link to="/admin/questions-list" class="nav-link" active-class="active" @click="handleLinkClick"><span>All Questions List</span></router-link>
        <router-link to="/admin/passages" class="nav-link" active-class="active" @click="handleLinkClick"><span>Passages</span></router-link>
        <router-link to="/admin/tests" class="nav-link" active-class="active" @click="handleLinkClick"><span>Manage Tests</span></router-link>
        <router-link to="/admin/categories" class="nav-link" active-class="active" @click="handleLinkClick"><span>Exam Categories</span></router-link>
        <router-link to="/admin/results" class="nav-link" active-class="active" @click="handleLinkClick"><span>All Test Results</span></router-link>
      </div>
    </div>

    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-btn">
        <span>Logout</span>
      </button>
    </div>
  </aside>

  <div class="sidebar-overlay" v-if="isOpen" @click="$emit('close')"></div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearAuth, getStoredUser } from '../../shared/utils/auth'

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])
const router = useRouter()

const isAdmin = computed(() => {
  const userData = getStoredUser()
  return userData && parseInt(userData.level || 0, 10) >= 10
})

const handleLinkClick = () => {
  if (window.innerWidth <= 1024) {
    emit('close')
  }
}

const handleLogout = () => {
  clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background:
    linear-gradient(180deg, rgba(255, 253, 249, 0.96) 0%, rgba(255, 248, 240, 0.92) 100%);
  border-right: 1px solid var(--surface-border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 16px 0 42px rgba(93, 58, 35, 0.1);
  backdrop-filter: blur(18px);
}

.sidebar-header {
  padding: 1.6rem 1.5rem 1.2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  background: linear-gradient(135deg, var(--brand) 0%, #e3965e 100%);
  color: white;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.08em;
  box-shadow: 0 14px 24px rgba(201, 111, 59, 0.25);
}

.logo h2 {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-strong);
  margin: 0;
  letter-spacing: -0.04em;
}

.close-sidebar {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-soft);
  cursor: pointer;
  padding: 4px;
  border-radius: 10px;
}

.close-sidebar:hover {
  background: rgba(201, 111, 59, 0.1);
  color: var(--brand-deep);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem 1.25rem;
}

.nav-section {
  margin-bottom: 1.4rem;
  padding: 0.35rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.45);
}

.nav-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-soft);
  font-weight: 700;
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: var(--text-body);
  text-decoration: none;
  font-weight: 600;
  border-radius: 14px;
  transition: all 0.2s ease;
  margin-bottom: 6px;
  font-size: 0.95rem;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.82);
  color: var(--text-strong);
  transform: translateX(2px);
}

.nav-link.active {
  background: linear-gradient(135deg, rgba(201, 111, 59, 0.14), rgba(20, 91, 115, 0.1));
  color: var(--brand-deep);
  box-shadow: inset 0 0 0 1px rgba(201, 111, 59, 0.18), 0 10px 22px rgba(93, 58, 35, 0.08);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 225, 222, 0.72);
  border: 1px solid rgba(192, 88, 66, 0.18);
  color: #b3432d;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(255, 225, 222, 0.96);
  border-color: rgba(192, 88, 66, 0.28);
  color: #952f1c;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(33, 23, 18, 0.34);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 40;
}

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .close-sidebar,
  .sidebar-overlay {
    display: block;
  }
}
</style>
