<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { API_BASE_URL } from '../config/constant.js'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('tce_user') || '{}'))
const tests = ref([])
const errorMsg = ref('')
const isLoading = ref(true)

const handleTestAction = (test) => {
  if (test.status_code >= 4) {
    // Completed: go to results if we have testuser_id
    if (test.testuser_id) {
      router.push(`/results/${test.testuser_id}`)
    } else {
      router.push('/dashboard') // fallback: no id available
    }
  } else {
    // New or in-progress: start/resume
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
    // 1. Fetch User Data
    const userRes = await fetch(`${API_BASE_URL}/user.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
      window.dispatchEvent(new Event('storage')) // Notify topbar/sidebar
    }

    // 2. Fetch Tests
    const testsRes = await fetch(`${API_BASE_URL}/tests.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div class="greeting" v-if="user">
        <h1>Welcome, {{ user.firstname || user.username }}! 👋</h1>
        <p>Here are your available assessments</p>
      </div>
      <div v-else-if="isLoading" class="greeting">
        <h1>Loading profile...</h1>
      </div>
    </div>

    <div v-if="errorMsg" class="error-banner">
      {{ errorMsg }}
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Fetching your data...</p>
    </div>

    <div v-else class="tests-grid">
      <div v-if="tests.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h3>No Tests Available</h3>
        <p>You don't have any assigned tests at this moment.</p>
      </div>

      <div v-for="test in tests" :key="test.id" class="test-card">
        <div class="test-header">
          <h3>{{ test.name }}</h3>
          <span v-if="test.status_code >= 4 && test.user_score !== null" 
                :class="['status-badge', test.passed ? 'passed' : 'failed']">
            {{ test.passed ? 'Passed' : 'Failed' }}
          </span>
          <span v-else-if="test.status_code === 0" class="status-badge incoming">
            New
          </span>
          <span v-else-if="test.status_code > 0 && test.status_code < 4" class="status-badge ongoing">
            Ongoing
          </span>
        </div>
        
        <div class="test-meta">
          <div class="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {{ test.duration }} mins
          </div>
          <div class="meta-item" v-if="test.is_password_protected">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Protected
          </div>
        </div>

        <div class="test-dates">
          <div class="date-row">
            <span class="label">Start:</span>
            <span class="value">{{ formatDate(test.begin_time) }}</span>
          </div>
          <div class="date-row">
            <span class="label">End:</span>
            <span class="value">{{ formatDate(test.end_time) }}</span>
          </div>
        </div>

        <div class="test-footer">
          <div v-if="test.user_score !== null" class="score-display">
            Score: <strong>{{ test.user_score }}</strong> / {{ test.max_score }}
          </div>
          
          <div style="display: flex; gap: 8px;">
            <button
              v-if="test.status_code >= 4 && test.can_repeat"
              class="action-btn"
              @click="router.push(`/test/${test.id}?repeat=true`)"
              style="background-color: #0b93d6;"
            >
              Retake
            </button>
            <button
              class="action-btn"
              :class="{ 'btn-secondary': test.status_code >= 4 }"
              @click="handleTestAction(test)"
            >
              {{ 
                test.status_code === 0 ? 'Start Test' : 
                test.status_code > 0 && test.status_code < 4 ? 'Continue' : 'Review' 
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 30px;
}

.greeting h1 {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.greeting p {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
}

.error-banner {
  background-color: #fef2f2;
  color: #b91c1c;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #ef4444;
  margin-bottom: 24px;
}

.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.test-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
}

.test-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.06);
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.test-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.incoming { background: #e0e7ff; color: #4338ca; }
.status-badge.ongoing { background: #fef3c7; color: #b45309; }
.status-badge.passed { background: #dcfce3; color: #166534; }
.status-badge.failed { background: #fee2e2; color: #b91c1c; }

.test-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.test-dates {
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.date-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.date-row:last-child { margin-bottom: 0; }
.date-row .label { color: #6b7280; font-weight: 500; }
.date-row .value { color: #374151; font-weight: 600; }

.test-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.score-display {
  font-size: 14px;
  color: #4b5563;
}
.score-display strong {
  font-size: 16px;
  color: #111827;
}

.action-btn {
  padding: 10px 20px;
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.action-btn:hover { background: #374151; }

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}
.btn-secondary:hover { background: #f9fafb; border-color: #9ca3af; }

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #111827;
  font-size: 20px;
  margin: 0 0 8px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
