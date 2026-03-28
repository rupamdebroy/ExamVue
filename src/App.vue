<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AdminLayout from './components/AdminLayout.vue'

const route = useRoute()
const layoutClass = computed(() => {
  return route.meta.layout === 'admin' ? AdminLayout : 'div'
})
</script>

<template>
  <component :is="layoutClass" v-if="route.meta.layout === 'admin'">
    <RouterView />
  </component>
  <RouterView v-else />
</template>

<style>
/* Base global styles */
body {
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
  font-family: 'Inter', sans-serif;
  color: #111827;
}

* {
  box-sizing: border-box;
}

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
</style>
