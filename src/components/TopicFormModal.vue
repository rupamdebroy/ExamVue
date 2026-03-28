<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEdit ? 'Edit Topic' : 'Add New Topic' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <form @submit.prevent="submitForm" class="modal-form">
        
        <div class="form-group">
          <label for="topicModule">Parent Module <span class="required">*</span></label>
          <select 
            id="topicModule" 
            v-model="formData.subject_module_id" 
            class="form-input"
            required
            :disabled="modules.length === 0"
          >
            <option value="" disabled>-- Select a Module --</option>
            <option v-for="mod in modules" :key="mod.module_id" :value="mod.module_id">
              {{ mod.module_name }}
            </option>
          </select>
          <small class="help-text" v-if="modules.length === 0">No modules available. Please create a module first.</small>
        </div>

        <div class="form-group">
          <label for="topicName">Topic Name <span class="required">*</span></label>
          <input 
            type="text" 
            id="topicName" 
            v-model="formData.subject_name" 
            required 
            placeholder="Enter topic name"
            maxlength="255"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="topicDescription">Description</label>
          <textarea 
            id="topicDescription" 
            v-model="formData.subject_description" 
            placeholder="Optional description for this topic"
            rows="3"
            class="form-input"
          ></textarea>
        </div>
        
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="formData.subject_enabled" 
            />
            <span class="checkmark"></span>
            Enable Topic
          </label>
        </div>

        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="$emit('close')" :disabled="isSubmitting">Cancel</button>
          <button type="submit" class="save-btn" :disabled="isSubmitting || !formData.subject_name.trim() || !formData.subject_module_id">
            {{ isSubmitting ? 'Saving...' : 'Save Topic' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { API_BASE_URL } from '../config/constant.js';

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  topicData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'save', 'error']);

const isSubmitting = ref(false);
const modules = ref([]);

const formData = reactive({
  subject_name: '',
  subject_description: '',
  subject_enabled: true,
  subject_module_id: ''
});

onMounted(() => {
  if (props.isEdit && props.topicData) {
    formData.subject_name = props.topicData.subject_name || '';
    formData.subject_description = props.topicData.subject_description || '';
    formData.subject_enabled = props.topicData.subject_enabled !== false;
    formData.subject_module_id = props.topicData.subject_module_id || '';
  }
  
  fetchModules();
});

const fetchModules = async () => {
  try {
    const token = localStorage.getItem('tce_token');
    const response = await fetch(`${API_BASE_URL}/admin/modules.php`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    if (result.status === 'success') {
      modules.value = result.data || [];
    }
  } catch (err) {
    console.error('Failed to load modules for topic dropdown', err);
  }
};

const submitForm = async () => {
  if (!formData.subject_name.trim() || !formData.subject_module_id) {
    emit('error', 'Module and Topic Name are required');
    return;
  }
  
  isSubmitting.value = true;
  
  try {
    const payload = { ...formData };
    
    if (props.isEdit && props.topicData) {
        payload.subject_id = props.topicData.subject_id;
    }
    
    await emit('save', payload);
  } catch (error) {
    console.error('Modal error:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modal-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

@keyframes modal-enter {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #0f172a;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #334155;
  font-size: 0.95rem;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  color: #1e293b;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

textarea.form-input {
  resize: vertical;
}

.help-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #ef4444;
}

.checkbox-group {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500 !important;
}

.checkbox-label input {
  width: 1.2rem;
  height: 1.2rem;
  accent-color: #4f46e5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.save-btn, .cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
}

.save-btn:disabled {
  background: #94a3b8;
  box-shadow: none;
  cursor: not-allowed;
}

.cancel-btn {
  background: white;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.cancel-btn:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
}
</style>
