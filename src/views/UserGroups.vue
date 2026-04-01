<script setup>
import { ref, onMounted, computed } from 'vue'
import { API_ENDPOINTS } from '../config/constant.js'

const groups = ref([])
const isLoading = ref(true)
const errorMsg = ref('')
const infoMsg = ref('')

// Search Filter
const searchQuery = ref('')

const fetchGroups = async () => {
  const token = localStorage.getItem('tce_token')
  try {
    const res = await fetch(API_ENDPOINTS.USER_GROUPS, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.status === 'success') {
      groups.value = data.data || []
    } else {
      errorMsg.value = data.message || 'Failed to fetch groups'
    }
  } catch (err) {
    errorMsg.value = 'Network error fetching group subscriptions'
  } finally {
    isLoading.value = false
  }
}

const toggleSubscription = async (group) => {
  const token = localStorage.getItem('tce_token')
  const action = group.subscribed ? 'unsubscribe' : 'subscribe'
  
  // Optimistic UI update
  group.subscribed = !group.subscribed
  
  try {
    const res = await fetch(API_ENDPOINTS.USER_GROUPS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ group_id: group.group_id, action })
    })
    
    const data = await res.json()
    if (data.status === 'success') {
      infoMsg.value = `Successfully ${action}d to ${group.group_name}`
      setTimeout(() => { infoMsg.value = '' }, 3000)
    } else {
      // Revert if failed
      group.subscribed = !group.subscribed
      errorMsg.value = data.message || `Failed to ${action}`
      setTimeout(() => { errorMsg.value = '' }, 4000)
    }
  } catch(err) {
    // Revert if failed
    group.subscribed = !group.subscribed
    errorMsg.value = 'Network error while updating subscription'
    setTimeout(() => { errorMsg.value = '' }, 4000)
  }
}

// Derived
const filteredGroups = computed(() => {
  if (!searchQuery.value) return groups.value
  const q = searchQuery.value.toLowerCase()
  return groups.value.filter(g => g.group_name.toLowerCase().includes(q))
})

onMounted(fetchGroups)
</script>

<template>
  <div class="user-groups-page">
    <div class="header-section">
      <div class="header-titles">
        <h1>Exam Categories</h1>
        <p>Subscribe to test groups like TET, SSC, SBI PO to see their assessments.</p>
      </div>
    </div>

    <!-- Messages -->
    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
    <div v-if="infoMsg" class="success-banner">{{ infoMsg }}</div>

    <!-- Search / Filter -->
    <div class="filters-card">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" v-model="searchQuery" placeholder="Search for exam categories..." class="search-input" />
      </div>
    </div>

    <!-- Group Grid -->
    <div class="loading-state" v-if="isLoading">
      <div class="spinner"></div>
      <p>Loading exam groups...</p>
    </div>

    <div v-else class="groups-grid">
      <div v-if="filteredGroups.length === 0" class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>No Exam Groups Found</h3>
        <p>There are no exam groups matching your search.</p>
      </div>

      <div v-for="group in filteredGroups" :key="group.group_id" class="group-card">
        <div class="group-header">
          <div class="group-icon">📚</div>
          <h3>{{ group.group_name }}</h3>
        </div>
        <p class="group-desc">Subscribe to unlock mock tests and practice sets for <strong>{{ group.group_name }}</strong> exams.</p>
        
        <div class="group-footer">
          <button 
            @click="toggleSubscription(group)" 
            class="action-btn"
            :class="group.subscribed ? 'unsub-btn' : 'sub-btn'"
          >
            {{ group.subscribed ? 'Unsubscribe' : 'Subscribe' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-groups-page {
  max-width: 1300px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-titles h1 {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.header-titles p {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
}

/* Banner */
.error-banner { background: #fef2f2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-weight: 500; border-left: 4px solid #ef4444; }
.success-banner { background: #dcfce7; color: #15803d; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-weight: 500; border-left: 4px solid #22c55e; }

/* Filter Card */
.filters-card {
  background: white; border-radius: 12px; padding: 1rem;
  margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f3f4f6;
}

.search-wrap { position: relative; width: 100%; max-width: 500px; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; transition: all 0.2s; font-size: 0.95rem; }
.search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

/* Grid */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.group-card {
  background: white;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03);
  border: 1px solid #f3f4f6;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.group-icon {
  width: 40px; height: 40px; background: #e0e7ff; 
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px; font-size: 20px;
}

.group-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.group-desc {
  color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 20px; flex: 1;
}

.group-footer {
  margin-top: auto;
}

.action-btn {
  width: 100%;
  padding: 10px 0;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.sub-btn {
  background: #3b82f6; color: white;
}
.sub-btn:hover { background: #2563eb; }

.unsub-btn {
  background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
}
.unsub-btn:hover { background: #e2e8f0; color: #1e293b; }

/* Loading & Empty state */
.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 0; color: #6b7280; text-align: center; width: 100%; grid-column: 1 / -1;
}

.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-state h3 { color: #111827; font-size: 20px; margin: 0 0 8px 0; }
.spinner { width: 36px; height: 36px; border: 4px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
