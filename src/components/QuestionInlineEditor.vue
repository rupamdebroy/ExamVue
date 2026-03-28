<template>
  <div class="inline-editor-container">
    <div class="editor-header">
      <h3>{{ isEdit ? 'Edit Question & Answers' : 'Create New Question' }}</h3>
      <button class="close-btn" @click="$emit('close')">&times;</button>
    </div>

    <!-- Question Form -->
    <form @submit.prevent="submitQuestion" class="editor-form">
      <div class="form-row">
        <div class="form-group flex-1">
          <label>Topic <span class="required">*</span></label>
          <select v-model="formData.question_subject_id" class="form-input" required>
            <option value="" disabled>-- Select Topic --</option>
            <option v-for="topic in topics" :key="topic.subject_id" :value="topic.subject_id">
              {{ topic.subject_name }}
            </option>
          </select>
        </div>
        <div class="form-group flex-1">
          <label>Type <span class="required">*</span></label>
          <select v-model="formData.question_type" class="form-input" required>
            <option value="1">Single Answer</option>
            <option value="2">Multiple Answers</option>
            <option value="3">Free Text</option>
            <option value="4">Ordering</option>
          </select>
        </div>
        <div class="form-group flex-1">
          <label>Difficulty (0-10)</label>
          <input type="number" v-model.number="formData.question_difficulty" min="0" max="10" class="form-input" />
        </div>
      </div>

      <div class="form-group">
        <label>Question Text <span class="required">*</span></label>
        <textarea v-model="formData.question_description" required rows="3" class="form-input"></textarea>
      </div>

      <div class="form-group">
        <label>Explanation (Optional)</label>
        <textarea v-model="formData.question_explanation" rows="2" class="form-input"></textarea>
      </div>

      <!-- Passage Selector -->
      <div class="form-group passage-group">
        <label>📖 Link to Reading Passage 
          <span class="passage-badge" v-if="formData.question_passage_id">Linked</span>
        </label>
        <div class="passage-inputs">
          <select class="form-input passage-select" v-model="formData.question_passage_id">
            <option :value="null">— No passage (standalone) —</option>
            <option v-for="p in passages" :key="p.passage_id" :value="p.passage_id">
              {{ p.passage_title }} {{ p.subject_name ? '· ' + p.subject_name : '' }}
            </option>
          </select>
          <span class="passage-or">OR</span>
          <input 
            type="number" 
            class="form-input passage-id-input" 
            placeholder="ID #..." 
            v-model.number="formData.question_passage_id"
            title="Directly enter passage ID"
          />
        </div>
        <small class="help-text-grey" v-if="passages.length === 0">No passages found. <a href="/admin/passages" target="_blank">Create a passage first</a>.</small>
      </div>

      <div class="checkbox-grid">
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.question_enabled" class="styled-checkbox" />
          <span>Enabled Status</span>
        </label>
        
        <label class="checkbox-label">
          <input type="checkbox" v-model="formData.question_inline_answers" class="styled-checkbox" />
          <span>Inline Answers</span>
        </label>
      </div>

      <div class="form-actions">
        <button type="submit" class="save-btn" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : 'Save Question' }}
        </button>
      </div>
    </form>

    <!-- Answers Section (Only visible after question is saved/exists) -->
    <div class="answers-section" v-if="isEdit && questionData?.question_id">
      <hr class="section-divider" />
      <div class="answers-header">
        <h4>Manage Answers</h4>
        <button type="button" class="add-ans-btn" @click="addNewAnswer">
          <span>+</span> Add Answer
        </button>
      </div>

      <div class="loading-answers" v-if="loadingAnswers">
        Loading answers...
      </div>

      <div class="answers-list" v-else>
        <div v-for="(ans, index) in answers" :key="ans.answer_id || 'new-'+index" 
             class="answer-item shadow-card" 
             :class="{'is-correct': ans.answer_isright}">
          
          <div class="ans-left">
            <span class="handle">⋮⋮</span>
            <input type="checkbox" v-model="ans.answer_isright" title="Correct Answer?" class="correct-chk" />
          </div>
          
          <div class="ans-content">
            <textarea v-model="ans.answer_description" rows="2" class="form-input ans-input" placeholder="Enter answer option..."></textarea>
            <input type="text" v-model="ans.answer_explanation" class="form-input ans-expl" placeholder="Optional explanation..." />
          </div>
          <div class="ans-right">
            <button class="action-btn save" @click="saveAnswer(ans, index)" :disabled="ans.saving">
              {{ ans.saving ? '...' : (ans.answer_id ? 'Update' : 'Save') }}
            </button>
            <button class="action-btn del" @click="deleteAnswer(ans, index)" :disabled="ans.deleting">
              {{ ans.deleting ? '...' : 'Del' }}
            </button>
          </div>
        </div>

        <div v-if="answers.length === 0" class="no-answers">
          No answers found. Add one above.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { API_BASE_URL } from '../config/constant.js';

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  questionData: { type: Object, default: () => ({}) },
  topics: { type: Array, default: () => [] }
});

const emit = defineEmits(['close', 'save-question', 'error', 'info']);
const API = `${API_BASE_URL}/admin`;
const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('tce_token')}` });

const isSubmitting = ref(false);
const loadingAnswers = ref(false);
const answers = ref([]);
const passages = ref([]);

const formData = reactive({
  question_subject_id: '',
  question_description: '',
  question_explanation: '',
  question_type: 1,
  question_difficulty: 1,
  question_enabled: true,
  question_position: 0,
  question_inline_answers: false,
  question_passage_id: null
});

onMounted(() => {
  if (props.isEdit && props.questionData) {
    Object.assign(formData, {
      question_subject_id: props.questionData.question_subject_id,
      question_description: props.questionData.question_description || '',
      question_explanation: props.questionData.question_explanation || '',
      question_type: props.questionData.question_type || 1,
      question_difficulty: props.questionData.question_difficulty || 1,
      question_enabled: props.questionData.question_enabled !== false,
      question_inline_answers: !!props.questionData.question_inline_answers,
      question_passage_id: props.questionData.question_passage_id || null
    });
    fetchAnswers();
  } else {
    formData.question_subject_id = props.topics.length > 0 ? props.topics[0].subject_id : '';
  }
  fetchPassages();
});

const fetchPassages = async () => {
  try {
    const res = await fetch(`${API}/passages.php`, { headers: authHeader() });
    const data = await res.json();
    if (data.status === 'success') passages.value = data.data || [];
  } catch (err) {
    passages.value = [];
  }
};

const submitQuestion = async () => {
  isSubmitting.value = true;
  try {
    const payload = { ...formData };
    if (props.isEdit) payload.question_id = props.questionData.question_id;
    await emit('save-question', payload);
  } finally {
    isSubmitting.value = false;
  }
};

const fetchAnswers = async () => {
  if (!props.questionData?.question_id) return;
  loadingAnswers.value = true;
  try {
    const res = await fetch(`${API}/answers.php?question_id=${props.questionData.question_id}`, {
      headers: authHeader()
    });
    const data = await res.json();
    if (data.status === 'success') {
      answers.value = data.data.map(a => ({ ...a, saving: false, deleting: false }));
    }
  } catch (err) {
    emit('error', 'Failed to load answers.');
  } finally {
    loadingAnswers.value = false;
  }
};

const addNewAnswer = () => {
  answers.value.push({
    answer_description: '',
    answer_explanation: '',
    answer_isright: false,
    answer_enabled: true,
    saving: false,
    deleting: false
  });
};

const saveAnswer = async (ans, index) => {
  if (!ans.answer_description.trim()) {
    emit('error', 'Answer text cannot be empty'); return;
  }
  ans.saving = true;
  try {
    const isNew = !ans.answer_id;
    const url = isNew ? `${API}/answers.php` : `${API}/answers.php?answer_id=${ans.answer_id}`;
    
    const payload = {
      answer_question_id: props.questionData.question_id,
      answer_description: ans.answer_description,
      answer_explanation: ans.answer_explanation,
      answer_isright: ans.answer_isright,
      answer_enabled: ans.answer_enabled !== false,
      answer_position: index + 1
    };

    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      emit('info', 'Answer saved.');
      if (isNew) ans.answer_id = data.answer_id;
    } else {
      emit('error', data.message || 'Error saving answer');
    }
  } catch (err) {
    emit('error', 'Network error saving answer');
  } finally {
    ans.saving = false;
  }
};

const deleteAnswer = async (ans, index) => {
  if (!ans.answer_id) {
    // Just remove from array if not saved to DB yet
    answers.value.splice(index, 1);
    return;
  }
  ans.deleting = true;
  try {
    const res = await fetch(`${API}/answers.php?answer_id=${ans.answer_id}`, {
      method: 'DELETE', headers: authHeader()
    });
    const data = await res.json();
    if (data.status === 'success') {
      emit('info', 'Answer deleted.');
      answers.value.splice(index, 1);
    } else {
      emit('error', data.message || 'Error deleting answer');
    }
  } catch (err) {
    emit('error', 'Network error deleting answer');
  } finally {
    if (answers.value[index]) ans.deleting = false;
  }
};
</script>

<style scoped>
.inline-editor-container {
  display: flex; flex-direction: column; height: 100%;
  background: #fdfdfd; font-family: system-ui, sans-serif;
}

.editor-header { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 1rem 1.25rem;
  background: white; border-bottom: 2px solid #e2e8f0;
  position: sticky; top: 0; z-index: 20;
}
.editor-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #1e293b; }
.close-btn { 
  background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 1.2rem; width: 28px; height: 28px;
  border-radius: 6px; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 2px 2px 0px #cbd5e1; transition: all 0.1s;
}
.close-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px #cbd5e1; }

.editor-form { padding: 1.25rem; background: #fdfdfd; }
.form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
.flex-1 { flex: 1; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }
.required { color: #e11d48; }

.form-input {
  width: 100%; border: 2px solid #cbd5e1; border-radius: 6px; padding: 0.5rem 0.6rem;
  font-size: 0.9rem; font-family: inherit; color: #0f172a; outline: none; transition: border 0.1s;
  background: white; box-shadow: 3px 3px 0px rgba(0,0,0,0.05); /* Simple 3D Shadow */
}
.form-input:focus { border-color: #3b82f6; box-shadow: 3px 3px 0px rgba(59,130,246,0.2); }

.passage-group { 
  background: #faf5ff; border: 2px solid #e9d5ff; border-radius: 6px; padding: 0.85rem; 
  box-shadow: 3px 3px 0px rgba(139,92,246,0.1); 
}
.passage-group label { color: #7c3aed !important; font-weight: 700; display: flex; align-items: center; }
.passage-badge { background: #8b5cf6; color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; margin-left: auto; font-weight: 700; text-transform: uppercase; }
.passage-inputs { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; }
.passage-select { flex: 1; min-width: 0; background: white; border-color: #d8b4fe; }
.passage-select:focus { border-color: #a855f7; }
.passage-or { font-size: 0.75rem; color: #9333ea; font-weight: 700; flex-shrink: 0; }
.passage-id-input { width: 90px !important; max-width: 90px; flex: 0 0 90px; text-align: center; border-color: #d8b4fe; font-weight: 700; color: #7c3aed; }
.passage-id-input:focus { border-color: #a855f7; }
.help-text-grey { display: block; margin-top: 0.4rem; font-size: 0.75rem; color: #64748b; }

.checkbox-grid { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #334155; cursor: pointer;}
.styled-checkbox { width: 1.1rem; height: 1.1rem; accent-color: #3b82f6; cursor: pointer; }

.form-actions { display: flex; justify-content: flex-end; padding-top: 1rem; }
.save-btn { 
  background: #3b82f6; color: white; border: 2px solid #2563eb; padding: 0.5rem 1.25rem; border-radius: 6px; 
  font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.1s; 
  box-shadow: 4px 4px 0px rgba(37,99,235,0.3); /* Catchy 3D Button */
}
.save-btn:active:not(:disabled) { transform: translate(4px, 4px); box-shadow: 0px 0px 0px rgba(37,99,235,0.3); }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.answers-section { padding: 1.25rem; background: #f1f5f9; border-top: 2px solid #e2e8f0; flex: 1; }
.answers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.answers-header h4 { margin: 0; color: #0f172a; font-size: 1.1rem; font-weight: 700; }
.add-ans-btn { 
  background: #10b981; color: white; border: 2px solid #059669; padding: 0.4rem 0.85rem; border-radius: 6px; 
  font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.1s; 
  box-shadow: 3px 3px 0px rgba(5,150,105,0.3);
}
.add-ans-btn:active { transform: translate(3px, 3px); box-shadow: 0px 0px 0px rgba(5,150,105,0.3); }

.answers-list { display: flex; flex-direction: column; gap: 0.85rem; padding-bottom: 1.5rem;}
.shadow-card { 
  display: flex; gap: 0.75rem; background: white; padding: 1rem; 
  border: 2px solid #cbd5e1; border-radius: 8px; align-items: flex-start; 
  box-shadow: 5px 5px 0px rgba(148,163,184,0.2); transition: all 0.15s; 
}
.shadow-card:hover { border-color: #94a3b8; }
.shadow-card.is-correct { border-color: #10b981; background: #ecfdf5; box-shadow: 5px 5px 0px rgba(16,185,129,0.25); }

.ans-left { display: flex; flex-direction: column; align-items: center; gap: 0.85rem; width: 30px; }
.handle { color: #94a3b8; cursor: grab; font-size: 1.1rem; font-weight: bold; }
.correct-chk { width: 1.3rem; height: 1.3rem; accent-color: #10b981; cursor: pointer; box-shadow: 2px 2px 0px rgba(0,0,0,0.1); }

.ans-content { flex: 1; display: flex; flex-direction: column; gap: 0.6rem; }
.ans-input { resize: vertical; min-height: 44px; }
.ans-expl { font-size: 0.85rem; color: #475569; }

.ans-right { display: flex; flex-direction: column; gap: 0.5rem; width: 75px; }
.action-btn { border: 2px solid transparent; padding: 0.4rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: all 0.1s; text-align: center; }
.action-btn.save { background: #e0e7ff; color: #4338ca; border-color: #c7d2fe; box-shadow: 2px 2px 0px rgba(67,56,202,0.15); }
.action-btn.save:active { transform: translate(2px,2px); box-shadow: 0 0 0; }
.action-btn.del { background: #ffe4e6; color: #e11d48; border-color: #fecdd3; box-shadow: 2px 2px 0px rgba(225,29,72,0.15); }
.action-btn.del:active { transform: translate(2px,2px); box-shadow: 0 0 0; }

.no-answers { text-align: center; color: #64748b; padding: 2rem 1rem; background: white; border-radius: 8px; border: 2px dashed #cbd5e1; font-weight: 600; font-size: 0.95rem; }
</style>
