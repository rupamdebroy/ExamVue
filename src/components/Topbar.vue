<template>
  <header class="topbar">
    <div class="topbar-left">
      <!-- Mobile menu toggle button -->
      <button class="menu-toggle" @click="$emit('toggle-sidebar')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div class="page-title" v-if="title">
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
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const user = ref(JSON.parse(localStorage.getItem('tce_user') || '{}'));

const title = computed(() => {
  return route.name === 'dashboard' ? 'Dashboard' : 
         route.name === 'UserManagement' ? 'User Management' :
         route.name === 'ModuleManagement' ? 'Module Management' :
         route.name === 'AdminTopics' ? 'Topic Management' :
         route.name === 'AdminQuestions' ? 'Question Management' :
         route.name === 'QuestionsListBulk' ? 'All Questions List' :
         route.name === 'Results' ? 'Results' : '';
});

const userInitials = computed(() => {
  if (!user.value) return 'U';
  if (user.value.firstname && user.value.lastname) {
    return `${user.value.firstname[0]}${user.value.lastname[0]}`.toUpperCase();
  }
  return (user.value.username || 'U')[0].toUpperCase();
});

const roleName = computed(() => {
  if (!user.value) return '';
  const level = parseInt(user.value.level || 0);
  if (level >= 10) return 'Administrator';
  if (level >= 5) return 'Teacher';
  return 'Student';
});

onMounted(() => {
  window.addEventListener('storage', () => {
    user.value = JSON.parse(localStorage.getItem('tce_user') || '{}');
  });
});
</script>

<style scoped>
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  position: sticky;
  top: 0;
  z-index: 40;
  height: 72px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: #4b5563;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.menu-toggle:hover {
  background: #f3f4f6;
  color: #111827;
}

.page-title h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.025em;
}

.topbar-right {
  display: flex;
  align-items: center;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px 6px 6px;
  border-radius: 99px;
  transition: background 0.2s;
  cursor: pointer;
}

.user-profile:hover {
  background: #f3f4f6;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
}

.user-role {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .menu-toggle {
    display: flex;
  }
}

@media (max-width: 640px) {
  .topbar {
    padding: 1rem;
  }

  .user-info {
    display: none;
  }

  .user-profile {
    padding: 0;
  }

  .user-profile:hover {
    background: transparent;
  }
}
</style>
