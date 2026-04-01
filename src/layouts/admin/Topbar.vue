<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="menu-toggle" @click="$emit('toggle-sidebar')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div class="page-title" v-if="title">
        <span class="page-kicker">Control Center</span>
        <h1>{{ title }}</h1>
      </div>
    </div>
    <div class="topbar-right">
      <div class="user-profile" v-if="user">
        <div class="avatar">
          {{ userInitials }}
        </div>
        <div class="user-info">
          <span class="user-name">{{ user.firstname || user.username }}</span>
          <span class="user-role">{{ roleName }}</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getStoredUser } from '../../shared/utils/auth'

const route = useRoute()
const user = ref(getStoredUser())

const routeTitles = {
  dashboard: 'Dashboard',
  UserManagement: 'User Management',
  ModuleManagement: 'Module Management',
  AdminTopics: 'Topic Management',
  AdminQuestions: 'Question Management',
  AdminTests: 'Test Management',
  AdminResults: 'All Test Results',
  CategoryManagement: 'Category Management',
  PassageManagement: 'Passage Management',
  QuestionsListBulk: 'All Questions List',
  Results: 'Results',
  UserGroups: 'Exam Categories',
}

const title = computed(() => routeTitles[route.name] || '')

const userInitials = computed(() => {
  if (!user.value) return 'U'
  if (user.value.firstname && user.value.lastname) {
    return `${user.value.firstname[0]}${user.value.lastname[0]}`.toUpperCase()
  }
  return (user.value.username || 'U')[0].toUpperCase()
})

const roleName = computed(() => {
  if (!user.value) return ''
  const level = parseInt(user.value.level || 0, 10)
  if (level >= 10) return 'Administrator'
  if (level >= 5) return 'Teacher'
  return 'Student'
})

onMounted(() => {
  window.addEventListener('storage', () => {
    user.value = getStoredUser()
  })
})
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 1.25rem 0;
  padding: 1rem 1.25rem;
  background: rgba(255, 252, 247, 0.72);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--surface-border);
  border-radius: 24px;
  box-shadow: var(--shadow-soft);
  position: sticky;
  top: 1rem;
  z-index: 40;
  min-height: 88px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: var(--text-body);
  cursor: pointer;
  padding: 10px;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.menu-toggle:hover {
  background: rgba(201, 111, 59, 0.12);
  color: var(--brand-deep);
}

.page-kicker {
  display: inline-flex;
  margin-bottom: 0.35rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: rgba(20, 91, 115, 0.08);
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-strong);
  margin: 0;
  letter-spacing: -0.045em;
}

.topbar-right {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px 8px 8px;
  border-radius: 999px;
  transition: background 0.2s, transform 0.2s;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(174, 125, 73, 0.12);
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.76);
  transform: translateY(-1px);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, #2f91af 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 12px 24px rgba(20, 91, 115, 0.22);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-strong);
  line-height: 1.2;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-soft);
  font-weight: 600;
}

@media (max-width: 1024px) {
  .menu-toggle {
    display: flex;
  }
}

@media (max-width: 640px) {
  .topbar {
    margin: 0.75rem 0.75rem 0;
    padding: 0.9rem 1rem;
  }

  .user-info {
    display: none;
  }

  .user-profile {
    padding: 0;
    background: transparent;
    border-color: transparent;
  }

  .user-profile:hover {
    background: transparent;
    transform: none;
  }
}
</style>
