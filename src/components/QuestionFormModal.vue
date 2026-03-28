<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEdit ? 'Edit Question' : 'Add New Question' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="submitForm" class="modal-form">
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="questionModule">Parent Module</label>
              <select 
                id="questionModule" 
                v-model="selectedModuleId" 
                class="form-input"
                :disabled="isSubmitting"
              >
                <option value="">-- Select a Module --</option>
                <option v-for="mod in modules" :key="mod.module_id" :value="mod.module_id">
                  {{ mod.module_name }}
                </option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label for="questionTopic">Parent Topic <span class="required">*</span></label>
              <select 
                id="questionTopic" 
                v-model="formData.question_subject_id" 
                class="form-input"
                required
                :disabled="filteredTopics.length === 0 || isSubmitting"
              >
                <option value="" disabled>-- Select a Topic --</option>
                <option v-for="topic in filteredTopics" :key="topic.subject_id" :value="topic.subject_id">
                  {{ topic.subject_name }}
                </option>
              </select>
              <small class="help-text" v-if="filteredTopics.length === 0 && selectedModuleId">No topics in this module.</small>
            </div>
          </div>

          <div class="form-group">
            <label for="questionDesc">Question Text <span class="required">*</span></label>
            <textarea 
              id="questionDesc" 
              v-model="formData.question_description" 
              required 
              placeholder="Enter the question text..."
              rows="4"
              class="form-input"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="questionExpl">Explanation (Optional)</label>
            <textarea 
              id="questionExpl" 
              v-model="formData.question_explanation" 
              placeholder="Explanation shown after answering..."
              rows="2"
              class="form-input"
            ></textarea>
          </div>

          <!-- Passage Selector -->
          <div class="form-group passage-group">
            <label>
              📖 Link to Reading Passage
              <span class="passage-badge" v-if="formData.question_passage_id">Linked</span>
            </label>
            <select class="form-input" v-model="formData.question_passage_id">
              <option :value="null">— No passage (standalone question) —</option>
              <option v-for="p in passages" :key="p.passage_id" :value="p.passage_id">
                {{ p.passage_title }} {{ p.subject_name ? '· ' + p.subject_name : '' }}
              </option>
            </select>
            <small class="help-text-grey" v-if="passages.length === 0">No passages found. <a href="/admin/passages" target="_blank">Create a passage first</a>.</small>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="questionType">Question Type <span class="required">*</span></label>
              <select id="questionType" v-model="formData.question_type" class="form-input" required>
                <option value="1">Single Answer</option>
                <option value="2">Multiple Answers</option>
                <option value="3">Free Text</option>
                <option value="4">Ordering</option>
              </select>
            </div>
            
            <div class="form-group flex-1">
              <label for="questionDiff">Difficulty (0-10)</label>
              <input 
                type="number" 
                id="questionDiff" 
                v-model.number="formData.question_difficulty" 
                min="0" max="10" 
                class="form-input"
              />
            </div>
            
            <div class="form-group flex-1">
              <label for="questionPos">Position</label>
              <input 
                type="number" 
                id="questionPos" 
                v-model.number="formData.question_position" 
                min="0"
                class="form-input"
              />
            </div>
            
            <div class="form-group flex-1">
              <label for="questionTimer">Timer (sec)</label>
              <input 
                type="number" 
                id="questionTimer" 
                v-model.number="formData.question_timer" 
                min="0"
                class="form-input"
              />
            </div>
          </div>
          
          <div class="checkbox-grid">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.question_enabled" />
              <span class="checkmark"></span> Enabled
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.question_fullscreen" />
              <span class="checkmark"></span> Fullscreen Focus
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.question_inline_answers" />
              <span class="checkmark"></span> Inline Answers
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.question_auto_next" />
              <span class="checkmark"></span> Auto Next
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="$emit('close')" :disabled="isSubmitting">Cancel</button>
            <button type="submit" class="save-btn" :disabled="isSubmitting || !formData.question_description.trim() || !formData.question_subject_id">
              {{ isSubmitting ? 'Saving...' : 'Save Question' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { API_BASE_URL } from '../config/constant.js';

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  questionData: {
    type: Object,
    default: () => ({})
  },
  targetModuleId: {
    type: [String, Number],
    default: ''
  },
  targetTopicId: {
    type: [String, Number],
    default: ''
  }
});

const emit = defineEmits(['close', 'save', 'error']);

const isSubmitting = ref(false);
const modules = ref([]);
const topics = ref([]);

const selectedModuleId = ref('');

const formData = reactive({
  question_subject_id: '',
  question_description: '',
  question_explanation: '',
  question_type: 1,
  question_difficulty: 1,
  question_enabled: true,
  question_position: 0,
  question_timer: 0,
  question_fullscreen: false,
  question_inline_answers: false,
  question_auto_next: false,
  question_passage_id: null
});

onMounted(() => {
  if (props.isEdit && props.questionData) {
    selectedModuleId.value = props.questionData.subject_module_id || props.targetModuleId;
    
    formData.question_subject_id = props.questionData.question_subject_id || props.targetTopicId;
    formData.question_description = props.questionData.question_description || '';
    formData.question_explanation = props.questionData.question_explanation || '';
    formData.question_type = props.questionData.question_type || 1;
    formData.question_difficulty = props.questionData.question_difficulty || 1;
    formData.question_enabled = props.questionData.question_enabled !== false;
    formData.question_position = props.questionData.question_position || 0;
    formData.question_timer = props.questionData.question_timer || 0;
    formData.question_fullscreen = !!props.questionData.question_fullscreen;
    formData.question_inline_answers = !!props.questionData.question_inline_answers;
    formData.question_auto_next = !!props.questionData.question_auto_next;
    formData.question_passage_id = props.questionData.question_passage_id || null;
  } else {
    // New Question default mapping based on parent view context
    selectedModuleId.value = props.targetModuleId;
    formData.question_subject_id = props.targetTopicId;
  }
  
  fetchContextData();
});

const filteredTopics = computed(() => {
  if (!selectedModuleId.value) return topics.value;
  return topics.value.filter(t => t.subject_module_id == selectedModuleId.value);
});

// Auto select topic if only 1 exists, or deselect if current topic isn't in module
watch(selectedModuleId, (newVal) => {
    const validTopics = filteredTopics.value;
    if (validTopics.length === 1) {
        formData.question_subject_id = validTopics[0].subject_id;
    } else if (validTopics.findIndex(t => t.subject_id == formData.question_subject_id) === -1) {
        formData.question_subject_id = '';
    }
});

const passages = ref([]);

const fetchContextData = async () => {
    try {
        const token = localStorage.getItem('tce_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Parallel requests
        const [modRes, topRes] = await Promise.all([
             fetch(`${API_BASE_URL}/admin/modules.php`, { headers }),
             fetch(`${API_BASE_URL}/admin/topics.php`, { headers })
        ]);
        
        const modData = await modRes.json();
        const topData = await topRes.json();
        
        if (modData.status === 'success') modules.value = modData.data || [];
        if (topData.status === 'success') topics.value = topData.data || [];
        
        // Load passages for the current module if set
        await loadPassages();
    } catch(err) {
        console.error("Failed to load dependency dropdowns", err);
    }
};

const loadPassages = async () => {
    try {
        const token = localStorage.getItem('tce_token');
        let url = `${API_BASE_URL}/admin/passages.php`;
        const params = new URLSearchParams();
        if (selectedModuleId.value) params.set('module_id', selectedModuleId.value);
        if (params.toString()) url += '?' + params;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.status === 'success') passages.value = data.data || [];
    } catch { passages.value = []; }
};

// Reload passages when module changes
watch(selectedModuleId, () => loadPassages());

const submitForm = async () => {
  if (!formData.question_description.trim() || !formData.question_subject_id) {
    emit('error', 'Topic and Question Description are required');
    return;
  }
  
  isSubmitting.value = true;
  try {
    const payload = { ...formData };
    
    if (props.isEdit && props.questionData) {
        payload.question_id = props.questionData.question_id;
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
  max-width: 800px; /* Wider for questions */
  max-height: 90vh; /* Allow scrolling if too tall */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modal-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
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
  flex-shrink: 0;
}

.modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }

.close-btn {
  background: transparent; border: none; font-size: 1.5rem; color: #64748b;
  cursor: pointer; line-height: 1; padding: 0; transition: color 0.2s;
}
.close-btn:hover { color: #0f172a; }

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.flex-1 { flex: 1; }

.form-group { margin-bottom: 1.5rem; }
.form-row .form-group { margin-bottom: 0; }

.form-group label {
  display: block; font-weight: 600; margin-bottom: 0.5rem; color: #334155; font-size: 0.95rem;
}

.required { color: #ef4444; }

.form-input {
  width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
  color: #1e293b; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s;
}
input.form-input, select.form-input { padding: 0.75rem 1rem; }
textarea.form-input { padding: 1rem; resize: vertical; }

.form-input:focus {
  outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.help-text { display: block; margin-top: 0.5rem; font-size: 0.8rem; color: #ef4444; }

.checkbox-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem;
  background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;
}

@media (min-width: 600px) {
    .checkbox-grid { grid-template-columns: repeat(4, 1fr); }
}

.checkbox-label {
  display: flex !important; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500 !important; font-size: 0.9rem;
}
.checkbox-label input { width: 1.1rem; height: 1.1rem; accent-color: #4f46e5; }

.modal-actions {
  display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;
  padding-top: 1.5rem; border-top: 1px solid #e2e8f0;
}

.save-btn, .cancel-btn {
  padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem;
  cursor: pointer; transition: all 0.2s;
}

.save-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white; border: none;
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
}
.save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3); }
.save-btn:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }

.cancel-btn { background: white; color: #475569; border: 1px solid #cbd5e1; }
.cancel-btn:hover:not(:disabled) { background: #f8fafc; color: #0f172a; }

/* Passage selector */
.passage-group { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 1rem; }
.passage-group label { color: #6d28d9 !important; }
.passage-badge { background: #7c3aed; color: white; font-size: 0.72rem; padding: 1px 8px; border-radius: 999px; margin-left: 8px; vertical-align: middle; font-weight: 600; }
.help-text-grey { display: block; margin-top: 0.4rem; font-size: 0.8rem; color: #94a3b8; }
.help-text-grey a { color: #7c3aed; }
</style>
