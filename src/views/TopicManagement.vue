<template>
  <div class="topic-management">
    <div class="header-section">
      <div class="header-titles">
        <h1>Topic Management</h1>
        <p>Manage TCExam subjects within modules</p>
      </div>
      <div class="header-actions">
        <button class="secondary-btn" @click="exportTopics">
          <span class="icon">â†“</span> Export CSV
        </button>
        <label class="secondary-btn">
          <span class="icon">â†‘</span> Import CSV
          <input type="file" accept=".csv" @change="importTopics" style="display: none" />
        </label>
        <button class="primary-btn" @click="openCreateModal">
          <span class="icon">+</span> Add New Topic
        </button>
      </div>
    </div>
    
    <div class="controls-section">
      <input type="text" v-model="searchQuery" placeholder="Search topics by name..." class="search-input" />
      <select v-model="moduleFilter" class="filter-select">
        <option value="">All Modules</option>
        <option v-for="mod in modules" :key="mod.module_id" :value="mod.module_id">
          {{ mod.module_name }}
        </option>
      </select>
    </div>
    
    <!-- Toast Messages (fixed overlay) -->
    <teleport to="body">
      <transition name="toast-slide">
        <div class="toast error-toast" v-if="error">âš ï¸ {{ error }}</div>
      </transition>
      <transition name="toast-slide">
        <div class="toast info-toast" v-if="infoMessage">âœ… {{ infoMessage }}</div>
      </transition>
    </teleport>

    <div class="loading" v-if="loading">Loading topics...</div>

    <div class="table-container" v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Topic Name</th>
            <th>Parent Module</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="topic in filteredTopics" :key="topic.subject_id">
            <td class="id-cell">#{{ topic.subject_id }}</td>
            <td class="name-cell">{{ topic.subject_name }}</td>
            <td class="module-cell">{{ topic.module_name || `Module ID: ${topic.subject_module_id}` }}</td>
            <td class="desc-cell" :title="topic.subject_description">
                {{ topic.subject_description ? (topic.subject_description.length > 50 ? topic.subject_description.substring(0, 50) + '...' : topic.subject_description) : '-' }}
            </td>
            <td>
              <span class="status-badge" :class="topic.subject_enabled ? 'enabled' : 'disabled'">
                {{ topic.subject_enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="edit-btn" @click="openEditModal(topic)">Edit</button>
              <button class="delete-btn" @click="confirmDelete(topic)">Delete</button>
            </td>
          </tr>
          <tr v-if="filteredTopics.length === 0">
            <td colspan="6" class="empty-state">No topics matching your search/filter.</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Topic Form Modal Component -->
    <TopicFormModal 
      v-if="isModalOpen" 
      :isEdit="isEditing" 
      :topicData="selectedTopic"
      @close="closeModal" 
      @save="saveTopic"
      @error="showError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import TopicFormModal from '../components/TopicFormModal.vue';
import { API_ENDPOINTS } from '../config/constant.js';

const topicsList = ref([]);
const modules = ref([]);
const loading = ref(true);
const error = ref('');
const infoMessage = ref('');
const searchQuery = ref('');
const moduleFilter = ref('');

const isModalOpen = ref(false);
const isEditing = ref(false);
const selectedTopic = ref(null);

const fetchTopicsAndModules = async () => {
  loading.value = true;
  error.value = '';
  infoMessage.value = '';
  try {
    const token = localStorage.getItem('tce_token');
    
    // Fetch Modules for filtering
    const modRes = await fetch(`${API_ENDPOINTS.ADMIN_MODULES}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const modResult = await modRes.json();
    if (modResult.status === 'success') {
      modules.value = modResult.data || [];
    }

    // Fetch Topics
    const topRes = await fetch(`${API_ENDPOINTS.ADMIN_TOPICS}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const topResult = await topRes.json();
    if (topResult.status === 'success') {
      topicsList.value = topResult.data || [];
    } else {
      error.value = topResult.message || 'Failed to fetch topics';
    }
  } catch (err) {
    error.value = 'Network error fetching data';
  } finally {
    loading.value = false;
  }
};

const fetchTopicsOnly = async () => {
    try {
        const token = localStorage.getItem('tce_token');
        const topRes = await fetch(`${API_ENDPOINTS.ADMIN_TOPICS}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const topResult = await topRes.json();
        if (topResult.status === 'success') {
          topicsList.value = topResult.data || [];
        }
    } catch (err) {
        console.error('Error refreshing topics', err);
    }
};

onMounted(() => {
  fetchTopicsAndModules();
});

const exportTopics = () => {
  const token = localStorage.getItem('tce_token');
  let url = `${API_ENDPOINTS.ADMIN_EXPORT_TOPICS}?token=${token}`;
  if (moduleFilter.value) url += `&module_id=${moduleFilter.value}`;
  window.open(url, '_blank');
};

const importTopics = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    loading.value = true;
    const token = localStorage.getItem('tce_token');
    const response = await fetch(`${API_ENDPOINTS.ADMIN_IMPORT_TOPICS}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const result = await response.json();
    if (result.status === 'success') {
      let msg = result.message;
      if (result.skipped > 0) msg += ` (${result.skipped} skipped)`;
      showInfo(msg);
      fetchTopicsAndModules();
    } else {
      showError(result.message || 'Failed to import topics');
    }
  } catch (err) {
    showError('Network error while importing');
  } finally {
    loading.value = false;
    event.target.value = '';
  }
};

const filteredTopics = computed(() => {
  let result = topicsList.value;
  
  if (moduleFilter.value) {
    result = result.filter(t => t.subject_module_id === moduleFilter.value);
  }
  
  if (searchQuery.value) {
      const lowerQuery = searchQuery.value.toLowerCase();
      result = result.filter(t => 
        t.subject_name.toLowerCase().includes(lowerQuery)
      );
  }
  
  return result;
});

const openCreateModal = () => {
  isEditing.value = false;
  selectedTopic.value = null;
  isModalOpen.value = true;
};

const openEditModal = (topic) => {
  isEditing.value = true;
  selectedTopic.value = { ...topic };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedTopic.value = null;
};

const showError = (msg) => {
  error.value = msg;
  setTimeout(() => { error.value = ''; }, 5000); 
};

const showInfo = (msg) => {
  infoMessage.value = msg;
  setTimeout(() => { infoMessage.value = ''; }, 6000); 
};

const saveTopic = async (topicData) => {
  try {
    const token = localStorage.getItem('tce_token');
    const url = isEditing.value 
      ? `${API_ENDPOINTS.ADMIN_TOPICS}?topic_id=${selectedTopic.value.subject_id}` 
      : `${API_ENDPOINTS.ADMIN_TOPICS}`;
      
    const method = isEditing.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(topicData)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      closeModal();
      if (result.restricted) {
          showInfo(result.message);
      }
      fetchTopicsOnly(); // Refresh list only
    } else {
      showError(result.message || 'Failed to save topic');
    }
  } catch (err) {
    showError('Network error while saving');
  }
};

const confirmDelete = async (topic) => {
  if (confirm(`Are you sure you want to delete topic: ${topic.subject_name}?`)) {
    try {
      const token = localStorage.getItem('tce_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_TOPICS}?topic_id=${topic.subject_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        if (result.action_taken === 'disabled') {
            showInfo(result.message);
        }
        fetchTopicsOnly();
      } else {
        alert(result.message || 'Failed to delete topic');
      }
    } catch (err) {
      alert('Network error while deleting');
    }
  }
};
</script>

<style scoped>
.topic-management {
  /* padding: 1.5rem; handled by admin layout */
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-titles h1 {
  font-size: 1.8rem;
  color: #1e293b;
  font-weight: 700;
  margin: 0;
}

.header-titles p {
  color: #64748b;
  margin: 0.2rem 0 0 0;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.secondary-btn {
  background: white;
  color: #4f46e5;
  border: 1px solid #4f46e5;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.secondary-btn:hover { background: #f5f3ff; }

/* Toast (fixed overlay) */
.toast {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  z-index: 9999;
  padding: 0.85rem 1.4rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.92rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  max-width: 420px;
  pointer-events: none;
}
.error-toast { background: #fee2e2; color: #b91c1c; border-left: 4px solid #b91c1c; }
.info-toast  { background: #dcfce7; color: #15803d; border-left: 4px solid #22c55e; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(60px); }

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
}

.controls-section {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  display: flex;
  gap: 1rem;
}

.search-input {
  flex: 1;
  max-width: 400px;
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-select {
  width: 200px;
  padding: 0.8rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #334155;
  outline: none;
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
  background-color: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #475569;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  font-size: 0.95rem;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.id-cell {
  font-weight: 500;
  color: #64748b;
}

.name-cell {
  font-weight: 600;
  color: #0f172a;
}

.module-cell {
  color: #4338ca;
  font-weight: 500;
}

.desc-cell {
  color: #64748b;
  font-size: 0.9rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-badge.enabled { background: #dcfce3; color: #166534; }
.status-badge.disabled { background: #fee2e2; color: #b91c1c; }

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.edit-btn, .delete-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.edit-btn { background: #e0e7ff; color: #4338ca; }
.edit-btn:hover { background: #c7d2fe; }

.delete-btn { background: #fee2e2; color: #b91c1c; }
.delete-btn:hover { background: #fecaca; }

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #64748b;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #3b82f6;
  font-weight: 600;
}

.error {
  background: #fee2e2;
  color: #b91c1c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.info {
  background: #e0f2fe;
  color: #0369a1;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
  border-left: 4px solid #0ea5e9;
}
</style>

