<script setup>
import { ref, onMounted, computed } from 'vue'
import { API_ENDPOINTS } from '../config/constant.js'

const groups = ref([])
const isLoading = ref(true)
const errorMsg = ref('')
const infoMsg = ref('')

const searchQuery = ref('')
const isModalOpen = ref(false)
const isEditing = ref(false)
const formData = ref({ group_id: null, group_name: '' })

const groupToDelete = ref(null)
const isDeleting = ref(false)

const fetchGroups = async () => {
  isLoading.value = true
  const token = localStorage.getItem('tce_token')
  try {
    const res = await fetch(`${API_ENDPOINTS.ADMIN_GROUPS}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.status === 'success') {
      groups.value = data.data || []
    } else {
      errorMsg.value = data.message || 'Failed to fetch categories'
    }
  } catch (err) {
    errorMsg.value = 'Network error fetching categories'
  } finally {
    isLoading.value = false
  }
}

const openCreateModal = () => {
  isEditing.value = false
  formData.value = { group_id: null, group_name: '' }
  isModalOpen.value = true
}

const openEditModal = (group) => {
  isEditing.value = true
  formData.value = { ...group }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  formData.value = { group_id: null, group_name: '' }
}

const handleSave = async () => {
  if (!formData.value.group_name.trim()) {
    alert('Category name is required')
    return
  }
  
  const token = localStorage.getItem('tce_token')
  const url = isEditing.value 
    ? `${API_ENDPOINTS.ADMIN_GROUPS}?group_id=${formData.value.group_id}`
    : `${API_ENDPOINTS.ADMIN_GROUPS}`
    
  try {
    const res = await fetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_name: formData.value.group_name })
    })
    const data = await res.json()
    if (data.status === 'success') {
      infoMsg.value = data.message || 'Category saved successfully'
      setTimeout(() => { infoMsg.value = '' }, 3000)
      closeModal()
      fetchGroups()
    } else {
      alert(data.message || 'Failed to save category')
    }
  } catch (err) {
    alert('Network error while saving state')
  }
}

const promptDelete = (group) => {
  groupToDelete.value = group
}

const confirmDelete = async () => {
  if (!groupToDelete.value) return
  isDeleting.value = true
  const token = localStorage.getItem('tce_token')
  try {
    const res = await fetch(`${API_ENDPOINTS.ADMIN_GROUPS}?group_id=${groupToDelete.value.group_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.status === 'success') {
      infoMsg.value = data.message || 'Category deleted successfully'
      setTimeout(() => { infoMsg.value = '' }, 3000)
      groupToDelete.value = null
      fetchGroups()
    } else {
      alert(data.message || 'Failed to delete category (it may contain users/tests)')
      groupToDelete.value = null
    }
  } catch (err) {
    alert('Network error while deleting condition')
    groupToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

const filteredGroups = computed(() => {
  if (!searchQuery.value) return groups.value
  const q = searchQuery.value.toLowerCase()
  return groups.value.filter(g => g.group_name.toLowerCase().includes(q))
})

onMounted(fetchGroups)
</script>

<template>
  <div class="category-management">
    <div class="header-section">
      <div class="header-titles">
        <h1>Exam Categories</h1>
        <p>Manage test groups like TET, SBI PO, SSC, etc.</p>
      </div>
      <button class="primary-btn" @click="openCreateModal">
        <span>+</span> Add Category
      </button>
    </div>

    <!-- Banner -->
    <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
    <div v-if="infoMsg" class="success-banner">{{ infoMsg }}</div>

    <div class="filters-card">
      <div class="search-wrap">
        <span class="search-icon">ðŸ”</span>
        <input type="text" v-model="searchQuery" placeholder="Search categories..." class="search-input" />
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div class="loading-overlay" v-if="isLoading">
        <div class="spinner-ring"></div>
        <span>Loading...</span>
      </div>

      <table class="data-table" v-if="filteredGroups.length > 0">
        <thead>
          <tr>
            <th class="id-col">ID</th>
            <th>Category Name</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in filteredGroups" :key="cat.group_id">
            <td class="id-cell">#{{ cat.group_id }}</td>
            <td class="name-cell">{{ cat.group_name }}</td>
            <td class="action-cell">
              <button class="edit-btn" @click="openEditModal(cat)">âœï¸ Edit</button>
              <button class="delete-btn" @click="promptDelete(cat)">ðŸ—‘ï¸ Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">ðŸ“‚</div>
        <p>No categories found.</p>
      </div>
    </div>

    <!-- Edit Modal -->
    <div class="modal-overlay" v-if="isModalOpen" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Category' : 'Create New Category' }}</h3>
          <button class="close-btn" @click="closeModal">âœ•</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Category Name</label>
            <input type="text" v-model="formData.group_name" placeholder="e.g. TET, SBI PO" class="form-input" @keyup.enter="handleSave" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeModal">Cancel</button>
          <button class="save-btn" @click="handleSave">Save</button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div class="modal-overlay" v-if="groupToDelete" @click.self="groupToDelete = null">
      <div class="confirm-modal">
        <div class="confirm-icon">âš ï¸</div>
        <h3>Delete Category</h3>
        <p>Are you sure you want to delete <strong>{{ groupToDelete.group_name }}</strong>?</p>
        <p class="confirm-note">Warning: If this category is currently being used, it cannot be deleted.</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="groupToDelete = null">Cancel</button>
          <button class="confirm-delete-btn" :disabled="isDeleting" @click="confirmDelete">
            {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-management { max-width: 1000px; margin: 0 auto; }

.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-titles h1 { font-size: 1.8rem; color: #1e293b; font-weight: 700; margin: 0; }
.header-titles p { color: #64748b; margin: 0.2rem 0 0; font-size: 0.95rem; }

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white; border: none; padding: 0.65rem 1.4rem; border-radius: 8px;
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(79,70,229,0.25); transition: transform 0.2s, box-shadow 0.2s; display: flex; align-items: center; gap: 8px;
}
.primary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(79,70,229,0.35); }

.error-banner { background: #fef2f2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-weight: 500; border-left: 4px solid #ef4444; }
.success-banner { background: #dcfce7; color: #15803d; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-weight: 500; border-left: 4px solid #22c55e; }

/* Filter */
.filters-card { background: white; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f3f4f6; }
.search-wrap { position: relative; width: 100%; max-width: 350px; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #9ca3af; }
.search-input { width: 100%; padding: 10px 12px 10px 40px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; transition: all 0.2s; font-size: 0.95rem; }
.search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

/* Table */
.table-container { background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.05); position: relative; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { background: #f8fafc; padding: 0.9rem 1rem; font-weight: 600; color: #64748b; font-size: 0.8rem; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
.data-table td { padding: 0.9rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.93rem; }
.id-col { width: 60px; }
.actions-col { width: 180px; }
.id-cell { font-weight: 600; color: #94a3b8; }
.name-cell { font-weight: 600; color: #0f172a; }
.action-cell { display: flex; gap: 0.5rem; }

.edit-btn { padding: 6px 12px; background: #e0e7ff; color: #4338ca; border: none; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: background 0.2s; }
.edit-btn:hover { background: #c7d2fe; }
.delete-btn { padding: 6px 10px; background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: background 0.2s; }
.delete-btn:hover { background: #fecaca; }

.empty-state { text-align: center; padding: 3rem 2rem; color: #94a3b8; }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

.loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; }
.spinner-ring { width: 36px; height: 36px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 10px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(2px); }
.modal-content { background: white; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: slideDown 0.2s ease-out; }
@keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 1.2rem; color: #0f172a; }
.close-btn { background: none; border: none; font-size: 1.2rem; color: #94a3b8; cursor: pointer; }
.modal-body { padding: 1.5rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; }
.form-input { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 0.75rem; background: #f8fafc; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; }

.cancel-btn { padding: 0.5rem 1rem; background: white; border: 1px solid #cbd5e1; color: #475569; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background 0.2s; }
.cancel-btn:hover { background: #f1f5f9; }
.save-btn { padding: 0.5rem 1.2rem; background: #3b82f6; color: white; border: none; font-weight: 600; border-radius: 6px; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 4px rgba(59,130,246,0.3); }
.save-btn:hover { background: #2563eb; }

/* Confirm modal */
.confirm-modal { background: white; border-radius: 16px; padding: 2rem; max-width: 400px; text-align: center; }
.confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.confirm-modal h3 { font-size: 1.3rem; margin: 0 0 8px; color: #0f172a; }
.confirm-note { font-size: 0.85rem; color: #64748b; margin-top: 8px; }
.confirm-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
.confirm-delete-btn { padding: 0.6rem 1.4rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }
.confirm-delete-btn:hover:not(:disabled) { opacity: 0.9; }
.confirm-delete-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>

