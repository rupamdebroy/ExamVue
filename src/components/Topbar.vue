<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="menu-toggle" @click="$emit('toggle-sidebar')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div class="greeting-block" v-if="user">
        <h1>Good Morning, {{ user.firstname || user.username }}</h1>
        <p>Exam Date: {{ currentFormattedDate }}</p>
      </div>
    </div>
    
    <div class="topbar-right">
      <button class="icon-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
      </button>
      <button class="icon-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      </button>
      
      <div class="user-cluster">
        <img src="https://i.pravatar.cc/100?img=1" class="c-avatar" />
        <img src="https://i.pravatar.cc/100?img=2" class="c-avatar" />
        <img src="https://i.pravatar.cc/100?img=3" class="c-avatar" />
        <div class="c-avatar count">10+</div>
      </div>
      
      <button class="invite-btn" v-if="isAdmin">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
        Invite Students
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';

const user = ref(JSON.parse(localStorage.getItem('tce_user') || '{}'));

const isAdmin = computed(() => {
  return user.value && parseInt(user.value.level || 0) >= 10;
});

const currentFormattedDate = computed(() => {
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return new Date().toLocaleDateString('en-GB', options);
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
  padding: 1.2rem 2.5rem;
  background: white;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
  position: sticky;
  top: 0;
  z-index: 40;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: #4b5563;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
}

.greeting-block h1 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 4px 0;
  letter-spacing: -0.01em;
}

.greeting-block p {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.icon-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.user-cluster {
  display: flex;
  align-items: center;
  margin: 0 0.5rem;
}

.c-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid white;
  margin-left: -10px;
  background: #f1f5f9;
  object-fit: cover;
}

.c-avatar:first-child {
  margin-left: 0;
}

.c-avatar.count {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: #1e293b;
  background: #f8fafc;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #1e293b;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  transition: all 0.2s;
}

.invite-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

@media (max-width: 1024px) {
  .menu-toggle { display: flex; }
}

@media (max-width: 768px) {
  .topbar { padding: 1rem; }
  .user-cluster, .invite-btn { display: none; }
  .greeting-block h1 { font-size: 1.1rem; }
}
</style>
