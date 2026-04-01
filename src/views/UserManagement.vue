<template>
  <div class="user-management">
    <div class="header-section">
      <h1>User Management</h1>
      <button class="primary-btn" @click="openCreateModal">
        <span class="icon">+</span> Add New User
      </button>
    </div>
    
    <div class="controls-section">
      <input type="text" v-model="searchQuery" placeholder="Search users by name or email..." class="search-input" />
    </div>
    
    <div class="loading" v-if="loading">Loading users...</div>
    <div class="error" v-else-if="error">{{ error }}</div>
    
    <div class="table-container" v-else>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Level</th>
            <th>Reg. Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.user_id">
            <td>{{ user.user_id }}</td>
            <td>{{ user.user_firstname }} {{ user.user_lastname }}</td>
            <td class="username-cell">{{ user.user_name }}</td>
            <td>{{ user.user_email }}</td>
            <td>
              <span class="level-badge" :class="'level-' + user.user_level">
                Level {{ user.user_level }}
              </span>
            </td>
            <td>{{ formatDate(user.user_regdate) }}</td>
            <td class="actions-cell">
              <button class="edit-btn" @click="openEditModal(user)">Edit</button>
              <button class="delete-btn" @click="confirmDelete(user)" :disabled="user.user_id == 1 || isSelf(user.user_id)">Delete</button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="empty-state">No users matching your search.</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- User Form Modal Component -->
    <UserFormModal 
      v-if="isModalOpen" 
      :isEdit="isEditing" 
      :userData="selectedUser"
      :groups="availableGroups"
      @close="closeModal" 
      @save="saveUser"
      @error="showError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import UserFormModal from '../components/UserFormModal.vue';
import { API_ENDPOINTS } from '../config/constant.js';

const users = ref([]);
const availableGroups = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');

const isModalOpen = ref(false);
const isEditing = ref(false);
const selectedUser = ref(null);

const myUserId = ref(null); // Used to prevent deleting self

const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('tce_token');
    const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (result.status === 'success') {
      users.value = result.data || [];
    } else {
      error.value = result.message || 'Failed to fetch users';
    }
  } catch (err) {
    error.value = 'Network error fetching users';
  } finally {
    loading.value = false;
  }
};

const fetchGroups = async () => {
  try {
    const token = localStorage.getItem('tce_token');
    const response = await fetch(`${API_ENDPOINTS.ADMIN_GROUPS}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const result = await response.json();
    if (result.status === 'success') {
      availableGroups.value = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load groups for assignment', err);
  }
};

onMounted(() => {
  // Extract own user ID from token data
  const userData = JSON.parse(localStorage.getItem('tce_user'));
  if (userData && userData.id) {
    myUserId.value = userData.id;
  }
  
  fetchUsers();
  fetchGroups();
});

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const lowerQuery = searchQuery.value.toLowerCase();
  return users.value.filter(user => 
    user.user_name.toLowerCase().includes(lowerQuery) || 
    (user.user_email && user.user_email.toLowerCase().includes(lowerQuery)) ||
    (user.user_firstname && user.user_firstname.toLowerCase().includes(lowerQuery)) ||
    (user.user_lastname && user.user_lastname.toLowerCase().includes(lowerQuery))
  );
});

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString();
};

const isSelf = (id) => {
  return id == myUserId.value;
};

const openCreateModal = () => {
  isEditing.value = false;
  selectedUser.value = null;
  isModalOpen.value = true;
};

const openEditModal = (user) => {
  isEditing.value = true;
  selectedUser.value = { ...user };
  // Pre-process groups array for easier handling in the modal
  if (user.groups && Array.isArray(user.groups)) {
      selectedUser.value.group_ids = user.groups.map(g => g.group_id);
  } else {
      selectedUser.value.group_ids = [];
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedUser.value = null;
};

const showError = (msg) => {
  error.value = msg;
  setTimeout(() => { error.value = ''; }, 5000); // clear after 5s
};

const saveUser = async (userData) => {
  console.log('UserManagement: saveUser called with data:', userData);
  try {
    const token = localStorage.getItem('tce_token');
    const url = isEditing.value 
      ? `${API_ENDPOINTS.ADMIN_USERS}?user_id=${selectedUser.value.user_id}` 
      : `${API_ENDPOINTS.ADMIN_USERS}`;
      
    const method = isEditing.value ? 'PUT' : 'POST';
    console.log(`UserManagement: making ${method} request to ${url}`);
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    console.log('UserManagement: response status:', response.status);
    const result = await response.json();
    console.log('UserManagement: result:', result);
    
    if (result.status === 'success') {
      console.log('UserManagement: success! closing modal and refreshing list');
      closeModal();
      fetchUsers(); // Refresh list
    } else {
      console.error('UserManagement: backend error:', result.message);
      showError(result.message || 'Failed to save user');
    }
  } catch (err) {
    console.error('UserManagement: network/generic error:', err);
    showError('Network error while saving');
  }
};

const confirmDelete = async (user) => {
  if (confirm(`Are you sure you want to permanently delete user: ${user.user_name}?`)) {
    try {
      const token = localStorage.getItem('tce_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_USERS}?user_id=${user.user_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        fetchUsers();
      } else {
        alert(result.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Network error while deleting');
    }
  }
};
</script>

<style scoped>
.user-management {
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

h1 {
  font-size: 1.8rem;
  color: #1e293b;
  font-weight: 700;
  margin: 0;
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

.username-cell {
  font-weight: 600;
  color: #0f172a;
}

.level-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Specific TCExam Colors for Levels */
.level-10 { background: #fee2e2; color: #b91c1c; } /* Admin */
.level-5 { background: #fef08a; color: #854d0e; } /* Teacher */
.level-0, .level-1, .level-2, .level-3, .level-4 { 
  background: #e0f2fe; color: #0369a1; /* Student */
}

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

.edit-btn {
  background: #e0e7ff;
  color: #4338ca;
}
.edit-btn:hover { background: #c7d2fe; }

.delete-btn {
  background: #fee2e2;
  color: #b91c1c;
}
.delete-btn:hover:not(:disabled) { background: #fecaca; }
.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
</style

