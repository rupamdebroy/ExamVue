<template>
  <div class="admin-layout">
    <Sidebar :is-open="isSidebarOpen" @close="closeSidebar" />
    
    <div class="main-wrapper">
      <Topbar @toggle-sidebar="toggleSidebar" />
      
      <main class="main-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Sidebar from './Sidebar.vue';
import Topbar from './Topbar.vue';

const isSidebarOpen = ref(false);

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: 'Inter', sans-serif;
  /* Prevent horizontal scroll if animating */
  overflow-x: hidden; 
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin-left: 280px; /* Width of sidebar */
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  height: calc(100vh - 72px); /* 72px is topbar height */
}

@media (max-width: 1024px) {
  .main-wrapper {
    margin-left: 0;
  }
  
  .main-content {
    padding: 1.5rem;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
