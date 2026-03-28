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
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/groups" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
          <span>Exam Categories</span>
        </router-link>
      </div>

      <div class="nav-section" v-if="isAdmin">
        <p class="nav-label">Administration</p>
        <router-link to="/admin/users" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>Manage Users</span>
        </router-link>
        <router-link to="/admin/modules" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          <span>Manage Modules</span>
        </router-link>
        <router-link to="/admin/topics" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Manage Topics</span>
        </router-link>
        <router-link to="/admin/questions" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>Manage Questions</span>
        </router-link>
        <router-link to="/admin/questions-list" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          <span>All Questions List</span>
        </router-link>
        <router-link to="/admin/passages" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          <span>Passages</span>
        </router-link>
        <router-link to="/admin/tests" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16h16a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Manage Tests</span>
        </router-link>
        <router-link to="/admin/categories" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Exam Categories</span>
        </router-link>
        <router-link to="/admin/results" class="nav-link" active-class="active" @click="handleLinkClick">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
          <span>All Test Results</span>
        </router-link>
      </div>
    </div>

    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        <span>Logout</span>
      </button>
    </div>
  </aside>
  
  <div class="sidebar-overlay" v-if="isOpen" @click="$emit('close')"></div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);
const router = useRouter();

const userData = JSON.parse(localStorage.getItem('tce_user') || '{}');
const isAdmin = computed(() => {
  return userData && parseInt(userData.level || 0) >= 10;
});

const handleLinkClick = () => {
  if (window.innerWidth <= 1024) {
    emit('close');
  }
};

const handleLogout = () => {
  localStorage.removeItem('tce_token');
  localStorage.removeItem('tce_user');
  router.push('/login');
};
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background: white;
  border-right: 1px solid rgba(229, 231, 235, 0.5);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 50;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.02);
}

.sidebar-header {
  padding: 1.5rem 1.75rem;
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
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.logo h2 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
  letter-spacing: -0.025em;
}

.close-sidebar {
  display: none;
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}

.close-sidebar:hover {
  background: #f3f4f6;
  color: #111827;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  font-weight: 700;
  margin-bottom: 0.75rem;
  padding-left: 0.75rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  color: #4b5563;
  text-decoration: none;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  font-size: 0.95rem;
}

.nav-link:hover {
  background-color: #f3f4f6;
  color: #111827;
}

.nav-link.active {
  background-color: #eef2ff;
  color: #4f46e5;
  box-shadow: 0 1px 2px rgba(79, 70, 229, 0.05);
}

.nav-link svg {
  color: #6b7280;
  transition: color 0.2s ease;
}

.nav-link.active svg,
.nav-link:hover svg {
  color: #4f46e5;
}

.sidebar-footer {
  padding: 1.25rem 1.25rem;
  border-top: 1px solid rgba(229, 231, 235, 0.5);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #ef4444;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(17, 24, 39, 0.4);
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
