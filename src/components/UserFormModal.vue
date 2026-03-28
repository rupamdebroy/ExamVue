<template>
  <div class="modal-backdrop" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ isEdit ? 'Edit User' : 'Create New User' }}</h2>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <form @submit.prevent="submitForm" class="user-form">
        <div class="form-row">
          <div class="form-group">
            <label>Username <span class="required">*</span></label>
            <input type="text" v-model="form.user_name" required placeholder="system_admin" />
          </div>
          <div class="form-group">
            <label>Email <span class="required">*</span></label>
            <input type="email" v-model="form.user_email" required placeholder="admin@tcexam.org" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" v-model="form.user_firstname" placeholder="John" />
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" v-model="form.user_lastname" placeholder="Doe" />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Access Level <span class="required">*</span></label>
            <select v-model="form.user_level" required>
              <option value="0">0 - Anonymous</option>
              <option value="1">1 - Basic User</option>
              <option value="2">2 - Basic Student</option>
              <option value="5">5 - Teacher / Editor</option>
              <option value="10">10 - Administrator</option>
            </select>
          </div>
          <div class="form-group">
            <label>Password <span v-if="!isEdit" class="required">*</span></label>
            <input type="password" v-model="form.user_password" :required="!isEdit" :placeholder="isEdit ? 'Leave blank to keep current' : 'Enter password'" />
          </div>
        </div>
        
        <div class="form-group full-width">
          <label>Assign Groups</label>
          <div class="groups-container">
            <label v-for="group in groups" :key="group.group_id" class="group-checkbox">
              <input type="checkbox" :value="group.group_id" v-model="form.groups" />
              {{ group.group_name }}
            </label>
            <span v-if="groups.length === 0" class="no-groups">No groups available.</span>
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="close">Cancel</button>
          <button type="submit" class="save-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'Saving...' : (isEdit ? 'Update User' : 'Create User') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  isEdit: Boolean,
  userData: Object,
  groups: Array
});

const emit = defineEmits(['close', 'save', 'error']);

const form = ref({
  user_name: '',
  user_email: '',
  user_firstname: '',
  user_lastname: '',
  user_level: '1',
  user_password: '',
  groups: []
});

const isSubmitting = ref(false);

onMounted(() => {
  if (props.isEdit && props.userData) {
    form.value = {
      user_name: props.userData.user_name || '',
      user_email: props.userData.user_email || '',
      user_firstname: props.userData.user_firstname || '',
      user_lastname: props.userData.user_lastname || '',
      user_level: props.userData.user_level ? props.userData.user_level.toString() : '1',
      user_password: '', // Never populate password hash
      groups: props.userData.group_ids || []
    };
  }
});

const close = () => {
  emit('close');
};

const submitForm = () => {
  console.log('UserFormModal: submitForm called');
  isSubmitting.value = true;
  
  // Basic validation
  if (!form.value.user_name || !form.value.user_email) {
    console.warn('UserFormModal: validation failed');
    emit('error', 'Please fill in all required fields.');
    isSubmitting.value = false;
    return;
  }
  
  const payload = { ...form.value };
  console.log('UserFormModal: emitting save with payload:', payload);
  
  // If editing and password is empty, remove it from payload so backend doesn't overwrite
  if (props.isEdit && !payload.user_password) {
    delete payload.user_password;
  }
  
  emit('save', payload);
  isSubmitting.value = false;
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  transition: color 0.15s;
}

.close-btn:hover { color: #0f172a; }

.user-form {
  padding: 1.5rem 2rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.25rem;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  flex: none;
  width: 100%;
  margin-bottom: 1.5rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}

.required { color: #ef4444; }

input, select {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
  outline: none;
  font-family: inherit;
}

input:focus, select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.groups-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  max-height: 150px;
  overflow-y: auto;
}

.group-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  margin: 0;
}

.no-groups { color: #94a3b8; font-style: italic; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.cancel-btn, .save-btn {
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
}
.cancel-btn:hover { background: #f8fafc; color: #0f172a; }

.save-btn {
  background: #3b82f6;
  border: none;
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}
.save-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}
.save-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
