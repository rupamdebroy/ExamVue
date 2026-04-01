<template>
  <div class="admin-layout">
    <div class="layout-glow layout-glow-one"></div>
    <div class="layout-glow layout-glow-two"></div>
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
import { ref } from 'vue'
import Sidebar from './admin/Sidebar.vue'
import Topbar from './admin/Topbar.vue'

const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<style scoped>
.admin-layout {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.layout-glow {
  position: fixed;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(10px);
  opacity: 0.8;
}

.layout-glow-one {
  top: -140px;
  right: 10%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(242, 156, 87, 0.28), transparent 68%);
}

.layout-glow-two {
  bottom: -180px;
  left: 260px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(57, 140, 163, 0.18), transparent 68%);
}

.main-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.main-content {
  flex: 1;
  padding: 2rem 2rem 2.5rem;
  overflow-y: auto;
  height: calc(100vh - 88px);
}

@media (max-width: 1024px) {
  .main-wrapper {
    margin-left: 0;
  }

  .main-content {
    padding: 1.5rem;
  }

  .layout-glow-two {
    left: 0;
  }
}

@media (max-width: 640px) {
  .main-content {
    padding: 1rem;
  }

  .layout-glow-one {
    right: -80px;
  }
}
</style>
