<template>
  <div class="test-management">
    <div class="header-section">
      <div class="header-titles">
        <h1>Test Management</h1>
        <p>Manage examinations, dates, and settings</p>
      </div>
      <button class="primary-btn" @click="openCreateModal">
        <span class="icon">+</span> Create New Test
      </button>
    </div>

    <div class="controls-section">
      <input type="text" v-model="searchQuery" placeholder="Search tests by name..." class="search-input" @input="currentPage = 1" />
      <div class="per-page-control">
        <label>Per page:</label>
        <select v-model="perPage" @change="currentPage = 1">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <div class="status-bar" v-if="!loading && !error">
      Showing {{ paginatedTests.length }} of {{ filteredTests.length }} tests
      <span v-if="searchQuery"> (filtered from {{ testsList.length }} total)</span>
    </div>

    <div class="loading" v-if="loading">Loading tests...</div>
    <div class="error-banner" v-else-if="error">{{ error }}</div>
    <div class="info-banner" v-else-if="infoMessage">{{ infoMessage }}</div>

    <div class="table-container" v-if="!loading && !error">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Timespan</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="test in paginatedTests" :key="test.test_id">
            <td class="id-cell">#{{ test.test_id }}</td>
            <td class="name-cell">{{ test.test_name }}</td>
            <td class="date-cell">
              <div class="date-row">Start: {{ formatDate(test.test_begin_time) }}</div>
              <div class="date-row end">End: {{ formatDate(test.test_end_time) }}</div>
            </td>
            <td>{{ test.test_duration_time > 0 ? test.test_duration_time + ' min' : 'Unlimited' }}</td>
            <td>
              <span class="status-badge" :class="isTestActive(test) ? 'active' : 'inactive'">
                {{ isTestActive(test) ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="manage-btn" @click="manageQuestions(test)" title="Build Question Paper">📝 Questions</button>
              <button class="edit-btn" @click="openEditModal(test)" title="Edit Test">✏️ Edit</button>
              <button class="delete-btn" @click="promptDelete(test)" title="Delete Test">🗑️ Delete</button>
            </td>
          </tr>
          <tr v-if="paginatedTests.length === 0">
            <td colspan="6" class="empty-state">
              <div class="empty-icon">📋</div>
              <div>No tests match your search.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
      <span v-for="page in visiblePages" :key="page">
        <button
          v-if="page !== '...'"
          class="page-btn"
          :class="{ active: page === currentPage }"
          @click="currentPage = page"
        >{{ page }}</button>
        <span v-else class="page-ellipsis">…</span>
      </span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
    </div>

    <!-- Test Form Modal -->
    <TestFormModal
      v-if="isModalOpen"
      :isEdit="isEditing"
      :testData="selectedTest"
      @close="closeModal"
      @save="saveTest"
      @error="showError"
    />

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" v-if="testToDelete" @click.self="testToDelete = null">
      <div class="confirm-modal">
        <div class="confirm-icon">⚠️</div>
        <h3>Delete Test</h3>
        <p>Are you sure you want to delete <strong>{{ testToDelete?.test_name }}</strong>?</p>
        <p class="confirm-note">If this test is currently in use, it will be expired instead of deleted.</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="testToDelete = null">Cancel</button>
          <button class="confirm-delete-btn" :disabled="deleting" @click="executeDelete">
            {{ deleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TestFormModal from '../components/TestFormModal.vue';
import { API_ENDPOINTS } from '../config/constant.js';

const router = useRouter();
const testsList = ref([]);
const loading = ref(true);
const error = ref('');
const infoMessage = ref('');
const searchQuery = ref('');

// Pagination
const currentPage = ref(1);
const perPage = ref(25);

// Modal states
const isModalOpen = ref(false);
const isEditing = ref(false);
const selectedTest = ref(null);

// Delete state
const testToDelete = ref(null);
const deleting = ref(false);

const fetchTests = async () => {
  loading.value = true;
  error.value = '';
  infoMessage.value = '';
  try {
    const token = localStorage.getItem('tce_token');
    const response = await fetch(API_ENDPOINTS.ADMIN_MANAGE_TEST, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();
    if (result.status === 'success') {
      testsList.value = result.data || [];
    } else if (result.status === 'error' && result.message.toLowerCase().includes('token')) {
      localStorage.removeItem('tce_token');
      localStorage.removeItem('tce_user');
      router.push('/login');
    } else {
      error.value = result.message || 'Failed to fetch tests';
    }
  } catch (err) {
    error.value = 'Network error fetching tests';
  } finally {
    loading.value = false;
  }
};

onMounted(() => { fetchTests(); });

const isTestActive = (test) => {
  const now = new Date();
  const begin = new Date(test.test_begin_time);
  const end = new Date(test.test_end_time);
  return now >= begin && now <= end;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const filteredTests = computed(() => {
  if (!searchQuery.value) return testsList.value;
  const lowerQuery = searchQuery.value.toLowerCase();
  return testsList.value.filter(t => t.test_name.toLowerCase().includes(lowerQuery));
});

const totalPages = computed(() => Math.ceil(filteredTests.value.length / perPage.value));

const paginatedTests = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredTests.value.slice(start, start + perPage.value);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
});

const openCreateModal = () => {
  isEditing.value = false;
  selectedTest.value = null;
  isModalOpen.value = true;
};

const openEditModal = (test) => {
  isEditing.value = true;
  selectedTest.value = { ...test };
  isModalOpen.value = true;
};

const manageQuestions = (test) => {
  router.push(`/admin/tests/${test.test_id}/questions`);
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedTest.value = null;
};

const showError = (msg) => {
  error.value = msg;
  setTimeout(() => { error.value = ''; }, 5000);
};

const showInfo = (msg) => {
  infoMessage.value = msg;
  setTimeout(() => { infoMessage.value = ''; }, 6000);
};

const saveTest = async (testData) => {
  // Create flow is handled inside TestFormModal (POST + redirect).
  // This handler is only called for UPDATE (isEditing === true).
  if (!isEditing.value) return;

  try {
    const token = localStorage.getItem('tce_token');
    const url = `${API_ENDPOINTS.ADMIN_MANAGE_TEST}?test_id=${selectedTest.value.test_id}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    if (result.status === 'success') {
      closeModal();
      showInfo(result.message || 'Test updated successfully.');
      fetchTests();
    } else {
      showError(result.message || 'Failed to save test');
    }
  } catch (err) {
    showError('Network error while saving test');
  }
};

const promptDelete = (test) => {
  testToDelete.value = test;
};

const executeDelete = async () => {
  if (!testToDelete.value) return;
  deleting.value = true;
  try {
    const token = localStorage.getItem('tce_token');
    const response = await fetch(`${API_ENDPOINTS.ADMIN_MANAGE_TEST}?test_id=${testToDelete.value.test_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await response.json();
    if (result.status === 'success') {
      testToDelete.value = null;
      if (result.action_taken === 'expired') {
        showInfo(result.message);
      } else {
        showInfo('Test deleted successfully.');
      }
      fetchTests();
    } else {
      showError(result.message || 'Failed to delete test');
      testToDelete.value = null;
    }
  } catch (err) {
    showError('Network error while deleting test');
    testToDelete.value = null;
  } finally {
    deleting.value = false;
  }
};
</script>

<style scoped>
.test-management {
  max-width: 1300px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header-titles h1 {
  font-size: 1.8rem;
  color: #1e293b;
  font-weight: 700;
  margin: 0;
}

.header-titles p {
  color: #64748b;
  margin: 0.2rem 0 0;
  font-size: 0.95rem;
}

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}
.primary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35); }

.controls-section {
  background: white;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  max-width: 450px;
  padding: 0.7rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.per-page-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #475569;
  white-space: nowrap;
}
.per-page-control select {
  padding: 0.4rem 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
}

.status-bar {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.75rem;
  padding: 0 0.2rem;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.data-table th {
  background: #f8fafc;
  padding: 0.9rem 1rem;
  font-weight: 600;
  color: #475569;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}
.data-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 0.93rem;
}
.data-table tbody tr:hover { background: #f8fafc; }

.id-cell { font-weight: 500; color: #64748b; }
.name-cell { font-weight: 600; color: #0f172a; }
.date-cell .date-row { line-height: 1.5; font-size: 0.83rem; }
.date-cell .end { color: #64748b; }

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.status-badge.active { background: #dcfce7; color: #15803d; }
.status-badge.inactive { background: #f1f5f9; color: #64748b; }

.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }

.manage-btn, .edit-btn, .delete-btn {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.2s, transform 0.15s;
  white-space: nowrap;
}
.manage-btn, .edit-btn, .delete-btn { transform: scale(1); }
.manage-btn:hover, .edit-btn:hover, .delete-btn:hover { transform: scale(1.04); }

.manage-btn { background: #dbeafe; color: #1e40af; }
.manage-btn:hover { background: #bfdbfe; }
.edit-btn { background: #e0e7ff; color: #4338ca; }
.edit-btn:hover { background: #c7d2fe; }
.delete-btn { background: #fee2e2; color: #b91c1c; }
.delete-btn:hover { background: #fecaca; }

.empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.3rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}
.page-btn {
  padding: 0.45rem 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  color: #334155;
  transition: all 0.15s;
  min-width: 36px;
}
.page-btn:hover:not(:disabled) { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }
.page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; font-weight: 700; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-ellipsis { padding: 0.45rem 0.3rem; color: #94a3b8; }

/* Status banners */
.loading, .error-banner, .info-banner {
  border-radius: 8px;
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
}
.loading { color: #3b82f6; }
.error-banner { background: #fee2e2; color: #b91c1c; }
.info-banner { background: #e0f2fe; color: #0369a1; border-left: 4px solid #0ea5e9; }

/* Delete Confirmation Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}
.confirm-modal {
  background: white;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: pop-in 0.2s ease;
}
@keyframes pop-in {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.confirm-icon { font-size: 2.8rem; margin-bottom: 0.75rem; }
.confirm-modal h3 { font-size: 1.3rem; color: #0f172a; margin: 0 0 0.5rem; }
.confirm-modal p { color: #334155; margin: 0.3rem 0; }
.confirm-note { font-size: 0.82rem; color: #64748b; margin-top: 0.5rem !important; }
.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}
.cancel-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.cancel-btn:hover { background: #f8fafc; }
.confirm-delete-btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}
.confirm-delete-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.confirm-delete-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
