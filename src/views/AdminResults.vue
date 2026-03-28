<script setup>
import { ref, onMounted, computed } from 'vue'
import { API_BASE_URL } from '../config/constant.js'

const results = ref([])
const isLoading = ref(true)
const errorMsg = ref('')

// Search and Filter
const searchQuery = ref('')
const selectedTestId = ref('')

// Delete State
const resultToDelete = ref(null)
const isDeleting = ref(false)

const fetchResults = async () => {
  const token = localStorage.getItem('tce_token')
  try {
    const res = await fetch(`${API_BASE_URL}/admin/results.php`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.status === 'success') {
      results.value = data.data || []
    } else {
      errorMsg.value = data.message || 'Failed to fetch results'
    }
  } catch (err) {
    errorMsg.value = 'Network error fetching results'
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleString()
}

// Derived
const availableTests = computed(() => {
  const map = new Map()
  results.value.forEach(r => {
    if (!map.has(r.test_id)) {
      map.set(r.test_id, { id: r.test_id, name: r.test_name })
    }
  })
  return Array.from(map.values())
})

const filteredResults = computed(() => {
  let list = results.value

  if (selectedTestId.value) {
    list = list.filter(r => r.test_id == selectedTestId.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r => 
      (r.username && r.username.toLowerCase().includes(q)) ||
      (r.firstname && r.firstname.toLowerCase().includes(q)) ||
      (r.lastname && r.lastname.toLowerCase().includes(q)) ||
      (r.test_name && r.test_name.toLowerCase().includes(q))
    )
  }
  return list
})

// Delete Logic
const confirmDelete = (result) => {
  resultToDelete.value = result;
}

const executeDelete = async () => {
  if (!resultToDelete.value) return;
  isDeleting.value = true;
  const token = localStorage.getItem('tce_token');
  try {
    const res = await fetch(`${API_BASE_URL}/admin/delete_result.php?testuser_id=${resultToDelete.value.testuser_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.status === 'success') {
      fetchResults();
      resultToDelete.value = null;
    } else {
      errorMsg.value = data.message || 'Failed to delete result';
      resultToDelete.value = null;
    }
  } catch (err) {
    errorMsg.value = 'Network error while deleting result';
    resultToDelete.value = null;
  } finally {
    isDeleting.value = false;
  }
}

onMounted(fetchResults)
</script>

<template>
  <div class="admin-results-page">
    <div class="header-section">
      <div class="header-titles">
        <h1>All Test Results</h1>
        <p>Review user performances across all completed tests</p>
      </div>
    </div>

    <div v-if="errorMsg" class="error-banner">
      {{ errorMsg }}
    </div>

    <!-- Filters -->
    <div class="filters-card">
      <div class="filter-group hide-mobile">
        <label>Filter by Test</label>
        <select v-model="selectedTestId" class="form-select">
          <option value="">All Tests</option>
          <option v-for="t in availableTests" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
      </div>
      <div class="filter-group search-group">
        <label>Search User</label>
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" v-model="searchQuery" placeholder="Search by name or username..." class="form-select search-input" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div class="loading-overlay" v-if="isLoading">
        <div class="spinner-ring"></div>
        <span>Loading Results…</span>
      </div>

      <table class="data-table" v-if="filteredResults.length > 0">
        <thead>
          <tr>
            <th>User</th>
            <th>Test Name</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Score</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filteredResults" :key="r.testuser_id">
            <td>
              <div class="user-info">
                <strong>{{ r.firstname }} {{ r.lastname }}</strong>
                <span class="username">@{{ r.username }}</span>
              </div>
            </td>
            <td><strong>{{ r.test_name }}</strong></td>
            <td>{{ formatDate(r.start_time) }}</td>
            <td>{{ formatDate(r.end_time) }}</td>
            <td>
              <strong style="color: #111827;">{{ r.score }}</strong> / {{ r.max_score }}
            </td>
            <td>
              <span v-if="r.passed === true" class="badge passed">Passed</span>
              <span v-else-if="r.passed === false" class="badge failed">Failed</span>
              <span v-else class="badge neutral">Completed</span>
            </td>
            <td class="action-cell">
              <router-link :to="`/results/${r.testuser_id}`" class="view-btn">View Detailed</router-link>
              <button class="delete-btn" @click="confirmDelete(r)" title="Delete Result">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>No results found matching your criteria.</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" v-if="resultToDelete" @click.self="resultToDelete = null">
      <div class="confirm-modal">
        <div class="confirm-icon">⚠️</div>
        <h3>Delete Test Result</h3>
        <p>Are you sure you want to delete the result for <strong>{{ resultToDelete.firstname }} {{ resultToDelete.lastname }}</strong> on test <strong>{{ resultToDelete.test_name }}</strong>?</p>
        <p class="confirm-note">This action cannot be undone.</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="resultToDelete = null">Cancel</button>
          <button class="confirm-delete-btn" :disabled="isDeleting" @click="executeDelete">
            {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-results-page {
  max-width: 1350px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 1.5rem;
}
.header-titles h1 { font-size: 1.8rem; color: #1e293b; font-weight: 700; margin: 0; }
.header-titles p { color: #64748b; margin: 0.2rem 0 0; font-size: 0.95rem; }

/* Filters */
.filters-card {
  background: white; border-radius: 12px; padding: 1.2rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;
  display: flex; gap: 1rem; flex-wrap: wrap;
}
.filter-group { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 200px; }
.filter-group label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }

.form-select {
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.55rem 0.85rem;
  font-size: 0.9rem; background: #f8fafc; outline: none; width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); background: white; }

.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; }
.search-input { padding-left: 2rem !important; }

/* Table */
.table-container {
  background: white; border-radius: 12px; border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05); position: relative; overflow-x: auto;
}

.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th {
  background: #f8fafc; padding: 0.85rem 1rem;
  font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
  color: #64748b; border-bottom: 2px solid #e2e8f0;
}
.data-table td { padding: 0.9rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.91rem; }
.data-table tbody tr:hover { background: #f8fafc; }

.user-info { display: flex; flex-direction: column; gap: 2px; }
.username { font-size: 0.8rem; color: #94a3b8; }

.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; line-height: 1; }
.badge.passed { background: #dcfce7; color: #15803d; }
.badge.failed { background: #fee2e2; color: #b91c1c; }
.badge.neutral { background: #f1f5f9; color: #64748b; }

.action-cell {
  display: flex; gap: 0.5rem; align-items: center; justify-content: flex-start;
}

.view-btn {
  display: inline-block; padding: 6px 14px;
  background: #e0e7ff; color: #4338ca; border-radius: 6px; font-weight: 600;
  text-decoration: none; font-size: 0.8rem; transition: background 0.2s;
}
.view-btn:hover { background: #c7d2fe; }

.delete-btn {
  padding: 6px 10px; border-radius: 6px; border: none; font-size: 0.8rem;
  background: #fee2e2; color: #b91c1c; cursor: pointer; transition: background 0.2s;
}
.delete-btn:hover { background: #fecaca; }

.empty-state { text-align: center; padding: 3rem 2rem; color: #94a3b8; }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

.error-banner { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-weight: 500; }

.loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.7);
  display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10;
}
.spinner-ring {
  width: 36px; height: 36px; border: 4px solid #e2e8f0; border-top-color: #3b82f6;
  border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 10px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Delete Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(2px);
}
.confirm-modal {
  background: white; border-radius: 16px; padding: 2rem 2.5rem; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: pop-in 0.2s ease;
}
@keyframes pop-in { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.confirm-modal h3 { font-size: 1.3rem; color: #0f172a; margin: 0 0 0.5rem; }
.confirm-modal p { color: #334155; margin: 0.3rem 0; font-size: 0.95rem; }
.confirm-note { font-size: 0.85rem; color: #64748b; margin-top: 0.5rem !important; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; }
.cancel-btn {
  padding: 0.6rem 1.4rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 600; cursor: pointer; transition: background 0.2s;
}
.cancel-btn:hover { background: #f8fafc; }
.confirm-delete-btn {
  padding: 0.6rem 1.4rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.15s; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}
.confirm-delete-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.confirm-delete-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
