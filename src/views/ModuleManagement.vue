<template>
  <div class="module-management">
    <div class="header-section">
      <div class="header-titles">
        <h1>Module Management</h1>
        <p>Manage TCExam subjects and tests containers</p>
      </div>
      <button class="primary-btn" @click="openCreateModal">
        <span class="icon">+</span> Add New Module
      </button>
    </div>
    
    <div class="controls-section">
      <input type="text" v-model="searchQuery" placeholder="Search modules by name or owner..." class="search-input" />
    </div>
    
    <div class="loading" v-if="loading">Loading modules...</div>
    <div class="error" v-else-if="error">{{ error }}</div>
    <div class="info" v-else-if="infoMessage">{{ infoMessage }}</div>
    
    <div class="table-container" v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mod in filteredModules" :key="mod.module_id">
            <td class="id-cell">#{{ mod.module_id }}</td>
            <td class="name-cell">{{ mod.module_name }}</td>
            <td class="owner-cell">
              <span v-if="mod.user_name">{{ mod.user_firstname }} {{ mod.user_lastname }} ({{ mod.user_name }})</span>
              <span v-else class="text-muted">ID: {{ mod.module_user_id }}</span>
            </td>
            <td>
              <span class="status-badge" :class="mod.module_enabled ? 'enabled' : 'disabled'">
                {{ mod.module_enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="edit-btn" @click="openEditModal(mod)">Edit</button>
              <button class="delete-btn" @click="confirmDelete(mod)">Delete</button>
            </td>
          </tr>
          <tr v-if="filteredModules.length === 0">
            <td colspan="5" class="empty-state">No modules matching your search.</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Module Form Modal Component -->
    <ModuleFormModal 
      v-if="isModalOpen" 
      :isEdit="isEditing" 
      :moduleData="selectedModule"
      @close="closeModal" 
      @save="saveModule"
      @error="showError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ModuleFormModal from '../components/ModuleFormModal.vue';
import { API_BASE_URL } from '../config/constant.js';

const modulesList = ref([]);
const loading = ref(true);
const error = ref('');
const infoMessage = ref('');
const searchQuery = ref('');

const isModalOpen = ref(false);
const isEditing = ref(false);
const selectedModule = ref(null);

const fetchModules = async () => {
  loading.value = true;
  error.value = '';
  infoMessage.value = '';
  try {
    const token = localStorage.getItem('tce_token');
    const response = await fetch(`${API_BASE_URL}/admin/modules.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (result.status === 'success') {
      modulesList.value = result.data || [];
    } else {
      error.value = result.message || 'Failed to fetch modules';
    }
  } catch (err) {
    error.value = 'Network error fetching modules';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchModules();
});

const filteredModules = computed(() => {
  if (!searchQuery.value) return modulesList.value;
  const lowerQuery = searchQuery.value.toLowerCase();
  return modulesList.value.filter(m => 
    m.module_name.toLowerCase().includes(lowerQuery) || 
    (m.user_name && m.user_name.toLowerCase().includes(lowerQuery)) ||
    (m.user_firstname && m.user_firstname.toLowerCase().includes(lowerQuery)) ||
    (m.user_lastname && m.user_lastname.toLowerCase().includes(lowerQuery))
  );
});

const openCreateModal = () => {
  isEditing.value = false;
  selectedModule.value = null;
  isModalOpen.value = true;
};

const openEditModal = (mod) => {
  isEditing.value = true;
  selectedModule.value = { ...mod };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedModule.value = null;
};

const showError = (msg) => {
  error.value = msg;
  setTimeout(() => { error.value = ''; }, 5000); 
};

const showInfo = (msg) => {
  infoMessage.value = msg;
  setTimeout(() => { infoMessage.value = ''; }, 6000); 
};

const saveModule = async (moduleData) => {
  try {
    const token = localStorage.getItem('tce_token');
    const url = isEditing.value 
      ? `${API_BASE_URL}/admin/modules.php?module_id=${selectedModule.value.module_id}` 
      : `${API_BASE_URL}/admin/modules.php`;
      
    const method = isEditing.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(moduleData)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      closeModal();
      if (result.restricted) {
          showInfo(result.message);
      }
      fetchModules(); // Refresh list
    } else {
      showError(result.message || 'Failed to save module');
    }
  } catch (err) {
    showError('Network error while saving');
  }
};

const confirmDelete = async (mod) => {
  if (confirm(`Are you sure you want to delete module: ${mod.module_name}?`)) {
    try {
      const token = localStorage.getItem('tce_token');
      const response = await fetch(`${API_BASE_URL}/admin/modules.php?module_id=${mod.module_id}`, {
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
        fetchModules();
      } else {
        alert(result.message || 'Failed to delete module');
      }
    } catch (err) {
      alert('Network error while deleting');
    }
  }
};
</script>

<style scoped>
.module-management {
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
}

.search-input {
  width: 100%;
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

.owner-cell {
  color: #334155;
}

.text-muted {
  color: #94a3b8;
  font-style: italic;
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
