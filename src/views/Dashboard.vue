<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { API_ENDPOINTS } from '../config/constant.js'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('tce_user') || '{}'))
const tests = ref([])
const errorMsg = ref('')
const isLoading = ref(true)
const searchQuery = ref('')

const handleTestAction = (test) => {
  if (test.status_code >= 4) {
    if (test.testuser_id) {
      router.push(`/results/${test.testuser_id}`)
    } else {
      router.push('/dashboard')
    }
  } else {
    router.push(`/test/${test.id}`)
  }
}

const fetchDashboardData = async () => {
  const token = localStorage.getItem('tce_token')
  if (!token) {
    router.push('/login')
    return
  }

  try {
    const userRes = await fetch(API_ENDPOINTS.USER_PROFILE, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (userRes.status === 401) {
      localStorage.removeItem('tce_token')
      localStorage.removeItem('tce_user')
      router.push('/login')
      return
    }

    const userData = await userRes.json()
    if (userData.status === 'success') {
      user.value = userData.user
      localStorage.setItem('tce_user', JSON.stringify(userData.user))
      window.dispatchEvent(new Event('storage'))
    }

    const testsRes = await fetch(API_ENDPOINTS.TEST_LIST, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const testsData = await testsRes.json()
    if (testsData.status === 'success') {
      tests.value = testsData.tests
    }
  } catch (err) {
    console.error(err)
    errorMsg.value = 'Failed to fetch dashboard data.'
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const options = { month: 'short', day: 'numeric', year: 'numeric' }
  return new Date(dateStr).toLocaleDateString('en-US', options)
}

const getGradient = (index) => {
  const gradients = [
    'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', // Purple
    'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // Orange
    'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', // Yellow
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', // Blue
    'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Green
    'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', // Rose
  ]
  return gradients[index % gradients.length]
}

const filteredTests = computed(() => {
  if (!searchQuery.value) return tests.value
  return tests.value.filter(t => t.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard-page">
    
    <div class="exams-header-bar">
      <h2>All Exams</h2>
      <div class="header-actions">
        <div class="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search..." v-model="searchQuery" />
        </div>
        <select class="status-select">
          <option>Exam status</option>
          <option>Active</option>
          <option>Completed</option>
        </select>
      </div>
    </div>

    <div v-if="errorMsg" class="error-banner">
      {{ errorMsg }}
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching your data...</p>
    </div>

    <div v-else class="exams-grid">
      <div v-if="filteredTests.length === 0" class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No Exams Found</h3>
        <p>You don't have any exams matching your criteria.</p>
      </div>

      <div v-for="(test, index) in filteredTests" :key="test.id" class="exam-card">
        
        <div class="card-hero" :style="{ background: getGradient(index) }">
          <div class="hero-shapes"></div>
          <span v-if="test.status_code >= 4" class="status-badge completed">Completed</span>
          <span v-else-if="test.status_code === 0" class="status-badge active">New</span>
          <span v-else class="status-badge active">Active</span>
        </div>
        
        <div class="card-content">
          <h3>{{ test.name }}</h3>
          
          <div class="tags-row">
            <span class="tag">Default group</span>
            <span class="tag">{{ test.duration }} mins</span>
          </div>

          <div class="date-row">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Created on {{ formatDate(test.begin_time) }}
          </div>

          <button class="view-more-btn" @click="handleTestAction(test)">
            {{ 
              test.status_code === 0 ? 'Start Exam' : 
              test.status_code > 0 && test.status_code < 4 ? 'Continue Exam' : 'View Results' 
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  max-width: 1300px;
  margin: 0 auto;
}

.exams-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.exams-header-bar h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}

.search-box input {
  padding: 10px 10px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  width: 220px;
  outline: none;
  transition: border-color 0.2s;
  background: white;
}

.search-box input:focus {
  border-color: #6366f1;
}

.status-select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  font-weight: 500;
  color: #1e293b;
  outline: none;
  cursor: pointer;
}

.error-banner {
  background-color: #fef2f2;
  color: #b91c1c;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #ef4444;
  margin-bottom: 24px;
}

.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 24px;
}

.exam-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}

.exam-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 28px rgba(0,0,0,0.08);
}

.card-hero {
  position: relative;
  height: 180px;
  width: 100%;
  overflow: hidden;
}

/* Abstract shapes inside the hero to simulate a rich illustration */
.hero-shapes {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 40%),
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 40%);
}
.hero-shapes::before {
  content: '';
  position: absolute;
  bottom: -20px;
  right: 10%;
  width: 100px;
  height: 100px;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  transform: rotate(15deg);
}
.hero-shapes::after {
  content: '';
  position: absolute;
  top: 20px;
  left: 20px;
  width: 60px;
  height: 60px;
  background: rgba(255,255,255,0.15);
  border-radius: 50%;
}

.status-badge {
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.active { 
  background: #ffedd5; 
  color: #ea580c; 
}
.status-badge.completed { 
  background: #dcfce7; 
  color: #16a34a; 
}

.card-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-content h3 {
  margin: 0 0 1rem 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.tags-row {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tag {
  background: #f1f5f9;
  color: #475569;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #e2e8f0;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
}

.view-more-btn {
  width: 100%;
  padding: 10px 0;
  background: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
}

.view-more-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #1e293b;
  font-size: 20px;
  margin: 0 0 8px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .exams-header-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
  .search-box input { width: 100%; }
}
</style>
