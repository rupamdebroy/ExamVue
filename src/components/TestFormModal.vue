<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEdit ? 'Edit Test' : 'Create New Test' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit" class="form-container">
          
          <!-- SECTION 1: Basic Information -->
          <div class="form-section">
            <h3 class="section-title"><i class="icon-info"></i> Basic Information</h3>
            <div class="form-group">
              <label for="test_name">Test Name <span class="required">*</span></label>
              <input type="text" id="test_name" v-model="formData.test_name" required placeholder="E.g., Midterm Exam 2026" />
            </div>
            
            <div class="form-group">
              <label for="test_description">Description <span class="required">*</span></label>
              <textarea id="test_description" v-model="formData.test_description" required rows="2" placeholder="Instructions or summary of the test"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label for="test_begin_time">Start Time <span class="required">*</span></label>
                <input type="datetime-local" id="test_begin_time" v-model="formData.test_begin_time" required />
              </div>
              <div class="form-group half">
                <label for="test_end_time">End Time <span class="required">*</span></label>
                <input type="datetime-local" id="test_end_time" v-model="formData.test_end_time" required />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group half">
                <label for="test_duration_time">Duration (Minutes)</label>
                <input type="number" id="test_duration_time" v-model="formData.test_duration_time" min="0" placeholder="0 for unlimited" />
                <span class="field-hint">0 means no time limit.</span>
              </div>
            </div>
          </div>

          <!-- SECTION 2: Scoring & Pass Criteria -->
          <div class="form-section">
            <h3 class="section-title"><i class="icon-star"></i> Scoring Rules</h3>
            <div class="form-row">
              <div class="form-group quarter">
                <label for="test_score_right">Right Answer</label>
                <input type="number" step="0.01" id="test_score_right" v-model="formData.test_score_right" required />
              </div>
              <div class="form-group quarter">
                <label for="test_score_wrong">Wrong Answer</label>
                <input type="number" step="0.01" id="test_score_wrong" v-model="formData.test_score_wrong" required />
              </div>
              <div class="form-group quarter">
                <label for="test_score_unanswered">Unanswered</label>
                <input type="number" step="0.01" id="test_score_unanswered" v-model="formData.test_score_unanswered" required />
              </div>
              <div class="form-group quarter">
                <label for="test_score_threshold">Pass Threshold</label>
                <input type="number" step="0.01" id="test_score_threshold" v-model="formData.test_score_threshold" required />
              </div>
            </div>
          </div>

          <!-- SECTION 3: Test Options -->
          <div class="form-section">
            <h3 class="section-title"><i class="icon-settings"></i> Options & Display</h3>
            <div class="toggles-grid">
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_random_questions_select" />
                <span class="control-label">Random Questions Selection</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_random_questions_order" />
                <span class="control-label">Random Questions Order</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_random_answers_select" />
                <span class="control-label">Random Answers Selection</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_random_answers_order" />
                <span class="control-label">Random Answers Order</span>
              </label>
              
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_mcma_radio" />
                <span class="control-label">Radiobuttons for MISA/MCMA</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_mcma_partial_score" />
                <span class="control-label">Partial Score for MCMA</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_noanswer_enabled" />
                <span class="control-label">Enable 'No Answer' Option</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_menu_enabled" />
                <span class="control-label">Show Questions Menu</span>
              </label>
            </div>
          </div>

          <!-- SECTION 4: User Access & Results -->
          <div class="form-section">
            <h3 class="section-title"><i class="icon-lock"></i> Access & Final Results</h3>
            
            <div class="form-row">
              <div class="form-group half">
                <label for="test_password">Test Password (Optional)</label>
                <input type="text" id="test_password" v-model="formData.test_password" placeholder="Min 8 characters (alphanumeric)" />
              </div>
            </div>

            <div class="toggles-grid mt-3">
               <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_comment_enabled" />
                <span class="control-label">Allow Test Comments</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_repeatable" />
                <span class="control-label">Test is Repeatable</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_logout_on_timeout" />
                <span class="control-label">Logout on Time Expiration</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_results_to_users" />
                <span class="control-label">Show Results to Users</span>
              </label>
              <label class="toggle-control">
                <input type="checkbox" v-model="formData.test_report_to_users" />
                <span class="control-label">Show Detailed Report to Users</span>
              </label>
            </div>
          </div>

          <!-- SECTION 5: Topics Binding -->
          <div class="form-section target-theme">
            <h3 class="section-title"><i class="icon-link"></i> Bind Topics</h3>
            <p class="help-text">{{ isEdit ? 'Select topics to draw questions from. Saving will replace existing topic assignments.' : 'Automatically draws random questions from selected topics when users start the test.' }}</p>
            <div class="topics-list" v-if="availableTopics.length > 0">
              <label v-for="topic in availableTopics" :key="topic.subject_id" class="checkbox-label">
                <input type="checkbox" :value="topic.subject_id" v-model="formData.subject_ids" />
                {{ topic.subject_name }}
              </label>
            </div>
            <div v-else class="text-muted">Loading topics...</div>
            
            <div class="form-group mt-3" v-if="formData.subject_ids.length > 0">
              <label for="questions_per_subject">Questions drawn per Topic</label>
              <input type="number" id="questions_per_subject" v-model="formData.questions_per_subject" min="1" max="100"/>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="$emit('close')">Cancel</button>
            <button type="submit" class="btn-save" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : (isEdit ? 'Update Test' : 'Create Test') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { API_ENDPOINTS } from '../config/constant.js';

const props = defineProps({
  isEdit: {
    type: Boolean,
    default: false
  },
  testData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'save', 'error']);

const isSaving = ref(false);
const availableTopics = ref([]);

const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d - tzOffset)).toISOString().slice(0,-1);
    return localISOTime.substring(0, 16);
};

const formData = ref({
  test_name: '',
  test_description: '',
  test_begin_time: '',
  test_end_time: '',
  test_duration_time: 0,
  subject_ids: [],
  questions_per_subject: 10,
  // New scoring & rules
  test_score_right: 1,
  test_score_wrong: 0,
  test_score_unanswered: 0,
  test_score_threshold: 0,
  test_random_questions_select: true,
  test_random_questions_order: true,
  test_random_answers_select: true,
  test_random_answers_order: true,
  test_mcma_radio: true,
  test_mcma_partial_score: true,
  test_noanswer_enabled: true,
  test_menu_enabled: true,
  test_comment_enabled: true,
  test_results_to_users: true,
  test_report_to_users: true,
  test_repeatable: false,
  test_logout_on_timeout: false,
  test_password: ''
});

onMounted(() => {
  // Always load topics
  fetchTopics();
  
  if (props.isEdit && props.testData) {
    formData.value = {
      test_name: props.testData.test_name,
      test_description: props.testData.test_description,
      test_begin_time: formatDateTimeLocal(props.testData.test_begin_time),
      test_end_time: formatDateTimeLocal(props.testData.test_end_time),
      test_duration_time: props.testData.test_duration_time,
      subject_ids: [],
      questions_per_subject: 10,
      
      test_score_right: parseFloat(props.testData.test_score_right ?? 1),
      test_score_wrong: parseFloat(props.testData.test_score_wrong ?? 0),
      test_score_unanswered: parseFloat(props.testData.test_score_unanswered ?? 0),
      test_score_threshold: parseFloat(props.testData.test_score_threshold ?? 0),
      
      test_random_questions_select: props.testData.test_random_questions_select == 1,
      test_random_questions_order: props.testData.test_random_questions_order == 1,
      test_random_answers_select: props.testData.test_random_answers_select == 1,
      test_random_answers_order: props.testData.test_random_answers_order == 1,
      test_mcma_radio: props.testData.test_mcma_radio == 1,
      test_mcma_partial_score: props.testData.test_mcma_partial_score == 1,
      test_noanswer_enabled: props.testData.test_noanswer_enabled == 1,
      test_menu_enabled: props.testData.test_menu_enabled == 1,
      test_comment_enabled: props.testData.test_comment_enabled == 1,
      test_results_to_users: props.testData.test_results_to_users == 1,
      test_report_to_users: props.testData.test_report_to_users == 1,
      test_repeatable: props.testData.test_repeatable == 1,
      test_logout_on_timeout: props.testData.test_logout_on_timeout == 1,
      test_password: props.testData.test_password || ''
    };
    // Load existing subject assignments for this test
    fetchExistingSubjects(props.testData.test_id);
  } else {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    formData.value.test_begin_time = formatDateTimeLocal(now);
    formData.value.test_end_time = formatDateTimeLocal(end);
  }
});


const fetchTopics = async () => {
    try {
        const token = localStorage.getItem('tce_token');
        const res = await fetch(API_ENDPOINTS.ADMIN_TOPICS, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if(result.status === 'success') {
            availableTopics.value = result.data || [];
        }
    } catch(e) {
        console.error("Failed to load topics");
    }
};

const fetchExistingSubjects = async (testId) => {
    try {
        const token = localStorage.getItem('tce_token');
        const res = await fetch(`${API_ENDPOINTS.ADMIN_TEST_QUESTIONS}?test_id=${testId}&info_only=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.status === 'success' && result.subject_ids) {
            formData.value.subject_ids = result.subject_ids;
            if (result.questions_per_topic) {
                formData.value.questions_per_subject = result.questions_per_topic;
            }
        }
    } catch(e) {
        console.error("Failed to load existing subjects", e);
    }
};

const handleSubmit = () => {
  isSaving.value = true;
  
  // Format dates for backend
  const payload = { ...formData.value };
  payload.test_begin_time = new Date(payload.test_begin_time).toISOString().slice(0, 19).replace('T', ' ');
  payload.test_end_time = new Date(payload.test_end_time).toISOString().slice(0, 19).replace('T', ' ');
  
  emit('save', payload);
  setTimeout(() => { isSaving.value = false; }, 1000);
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 800px; /* Made wider for the detailed layout */
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  background-color: #fcfcfd;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.section-title {
  margin: 0 0 1.25rem 0;
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}
.form-row:last-child {
  margin-bottom: 0;
}

.form-group.half { flex: 1; }
.form-group.quarter { flex: 1; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.form-group:last-child { margin-bottom: 0; }

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.required { color: #ef4444; }

.field-hint {
  font-size: 0.8rem;
  color: #94a3b8;
}

.toggles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.toggle-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.control-label {
  font-size: 0.925rem;
  color: #334155;
  user-select: none;
}

input[type="text"],
input[type="number"],
input[type="datetime-local"],
textarea {
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: all 0.2s;
  color: #1e293b;
  background-color: #f8fafc;
}

input[type="text"]:focus,
input[type="number"]:focus,
input[type="datetime-local"]:focus,
textarea:focus {
  outline: none;
  border-color: #6366f1;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Checkbox specific styles to look like modern toggles if possible, but basic checkbox for now */
input[type="checkbox"] {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: #4f46e5;
  cursor: pointer;
}

.target-theme {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 150px;
  overflow-y: auto;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal !important;
  color: #334155;
  cursor: pointer;
}

.help-text {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.mt-3 { margin-top: 1rem; }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  position: sticky;
  bottom: 0;
  background: #fcfcfd;
  padding: 1rem 0 0 0;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 0.6rem 1.25rem;
  border: 1px solid #cbd5e1;
  background: white;
  color: #475569;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f8fafc;
  color: #1e293b;
}

.btn-save {
  padding: 0.75rem 1.75rem;
  border: none;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 8px -1px rgba(99, 102, 241, 0.3);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}
</style>
