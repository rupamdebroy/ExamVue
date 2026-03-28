<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEdit ? 'Edit Option' : 'Add New Option' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="submitForm" class="modal-form">
          
          <div class="form-group">
            <label for="answerDesc">Option Text <span class="required">*</span></label>
            <textarea 
              id="answerDesc" 
              v-model="formData.answer_description" 
              required 
              placeholder="Enter the option/answer text..."
              rows="3"
              class="form-input"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="answerExpl">Explanation (Optional)</label>
            <textarea 
              id="answerExpl" 
              v-model="formData.answer_explanation" 
              placeholder="Explanation shown after selecting this option..."
              rows="2"
              class="form-input"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="answerPos">Position</label>
              <input 
                type="number" 
                id="answerPos" 
                v-model.number="formData.answer_position" 
                min="0"
                class="form-input"
              />
            </div>
            
            <div class="form-group flex-1 offset-bottom">
              <div class="checkbox-box highlight-is-right" :class="{ 'active': formData.answer_isright }">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="formData.answer_isright" />
                  <span class="checkmark"></span> 
                  <strong>Is Correct Answer?</strong>
                </label>
              </div>
            </div>
          </div>
          
          <div class="checkbox-grid">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.answer_enabled" />
              <span class="checkmark"></span> Enabled
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="$emit('close')" :disabled="isSubmitting">Cancel</button>
            <button type="submit" class="save-btn" :disabled="isSubmitting || !formData.answer_description.trim()">
              {{ isSubmitting ? 'Saving...' : 'Save Option' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  answerData: {
    type: Object,
    default: () => ({})
  },
  questionId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['close', 'save', 'error']);
const isSubmitting = ref(false);

const formData = reactive({
  answer_question_id: props.questionId,
  answer_description: '',
  answer_explanation: '',
  answer_isright: false,
  answer_enabled: true,
  answer_position: 0
});

onMounted(() => {
  if (props.isEdit && props.answerData) {
    formData.answer_description = props.answerData.answer_description || '';
    formData.answer_explanation = props.answerData.answer_explanation || '';
    formData.answer_isright = !!props.answerData.answer_isright;
    formData.answer_enabled = props.answerData.answer_enabled !== false;
    formData.answer_position = props.answerData.answer_position || 0;
  }
});

const submitForm = async () => {
  if (!formData.answer_description.trim()) {
    emit('error', 'Option Text is required');
    return;
  }
  
  isSubmitting.value = true;
  try {
    const payload = { ...formData };
    
    if (props.isEdit && props.answerData) {
        payload.answer_id = props.answerData.answer_id;
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
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
}

.modal-content {
  background: white; border-radius: 12px; width: 100%; max-width: 600px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: modal-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; flex-direction: column;
}

@keyframes modal-enter {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex;
  justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;
}

.modal-header h2 { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0f172a; }

.close-btn {
  background: transparent; border: none; font-size: 1.5rem; color: #64748b;
  cursor: pointer; line-height: 1; padding: 0; transition: color 0.2s;
}
.close-btn:hover { color: #0f172a; }

.modal-body { padding: 1.5rem; overflow-y: auto; }

.form-row { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; align-items: flex-end;}
.flex-1 { flex: 1; }

.form-group { margin-bottom: 1.5rem; }
.form-row .form-group { margin-bottom: 0; }
.offset-bottom { margin-bottom: 0px;}

.form-group label {
  display: block; font-weight: 600; margin-bottom: 0.5rem; color: #334155; font-size: 0.95rem;
}

.required { color: #ef4444; }

.form-input {
  width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem;
  color: #1e293b; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s;
}
input.form-input { padding: 0.75rem 1rem; }
textarea.form-input { padding: 1rem; resize: vertical; }

.form-input:focus {
  outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.checkbox-grid {
  display: flex; gap: 1rem; margin-top: 1rem; background: #f8fafc; padding: 1rem;
  border-radius: 8px; border: 1px solid #e2e8f0;
}

.checkbox-box {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    transition: all 0.2s;
}
.highlight-is-right.active {
    background-color: #dcfce3;
    border-color: #22c55e;
    color: #166534;
}
.highlight-is-right.active .checkbox-label {
    color: #166534;
}

.checkbox-label {
  display: flex !important; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500 !important; font-size: 0.9rem; margin-bottom: 0 !important;
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
</style>
