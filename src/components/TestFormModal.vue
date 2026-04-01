<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">

      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon">📋</div>
          <div>
            <h2>{{ isEdit ? 'Edit Test' : 'Create New Test' }}</h2>
            <p class="header-sub">{{ stepTitles[step - 1] }}</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- Step indicator -->
      <div class="steps-bar">
        <div v-for="(s, i) in stepTitles" :key="i"
          class="step-item"
          :class="{ active: step === i + 1, done: step > i + 1 }"
          @click="goStep(i + 1)"
        >
          <div class="step-circle">
            <span v-if="step > i + 1">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="step-label">{{ s }}</span>
        </div>
        <div class="steps-line">
          <div class="steps-progress" :style="{ width: ((step - 1) / (stepTitles.length - 1) * 100) + '%' }"></div>
        </div>
      </div>

      <!-- Body -->
      <div class="modal-body">

        <!-- STEP 1: Basic Info + Time -->
        <div v-show="step === 1" class="step-content">
          <div class="form-section">
            <div class="section-badge">📝 Identity</div>
            <div class="form-group">
              <label>Test Name <span class="req">*</span></label>
              <input type="text" v-model="fd.test_name" placeholder="e.g. Midterm Exam 2026" required />
            </div>
            <div class="form-group">
              <label>Description <span class="req">*</span></label>
              <textarea v-model="fd.test_description" rows="2" placeholder="Brief instructions or summary…"></textarea>
            </div>
            <div class="form-group">
              <label>Test Password <span class="hint">(optional — leave blank for open access)</span></label>
              <input type="text" v-model="fd.test_password" placeholder="Leave blank for no password" />
            </div>
          </div>

          <div class="form-section">
            <div class="section-badge">🗓️ Schedule</div>
            <div class="form-row">
              <div class="form-group">
                <label>Start Date & Time <span class="req">*</span></label>
                <input type="datetime-local" v-model="fd.test_begin_time" required />
              </div>
              <div class="form-group">
                <label>End Date & Time <span class="req">*</span></label>
                <input type="datetime-local" v-model="fd.test_end_time" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Duration (minutes)</label>
                <input type="number" v-model="fd.test_duration_time" min="0" placeholder="0 = Unlimited" />
                <span class="field-hint">Set to 0 for no time limit within the window.</span>
              </div>
              <div class="form-group" style="justify-content: center; padding-top: 1.6rem;">
                <label class="toggle-pill" :class="{ on: fd.test_repeatable }">
                  <input type="checkbox" v-model="fd.test_repeatable" />
                  <span class="pill-track"><span class="pill-thumb"></span></span>
                  <span class="pill-label">
                    <strong>Repeatable Test</strong>
                    <small>{{ fd.test_repeatable ? 'Users can retake this test' : 'One attempt per user' }}</small>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: Scoring & Rules -->
        <div v-show="step === 2" class="step-content">
          <div class="form-section">
            <div class="section-badge">🎯 Score per Answer</div>
            <div class="score-cards">
              <div class="score-card green">
                <div class="score-icon">✅</div>
                <label>Marks for Correct</label>
                <input type="number" step="0.5" v-model="fd.test_score_right" min="0" />
              </div>
              <div class="score-card red">
                <div class="score-icon">❌</div>
                <label>Negative Mark (Wrong)</label>
                <input type="number" step="0.5" v-model="fd.test_score_wrong" />
                <span class="field-hint">Enter as negative (e.g. -0.25) or 0 for none</span>
              </div>
              <div class="score-card gray">
                <div class="score-icon">⏭️</div>
                <label>Mark for Unanswered</label>
                <input type="number" step="0.5" v-model="fd.test_score_unanswered" />
              </div>
              <div class="score-card blue">
                <div class="score-icon">🏁</div>
                <label>Pass Threshold (total)</label>
                <input type="number" step="0.5" v-model="fd.test_score_threshold" min="0" />
                <span class="field-hint">Minimum total score to pass</span>
              </div>
            </div>

            <!-- Live score preview -->
            <div class="score-preview" v-if="fd.test_score_right > 0">
              <span>With <strong>{{ fd.test_score_right }}</strong> per correct &amp; <strong>{{ fd.test_score_wrong }}</strong> per wrong:</span>
              <span class="preview-pill">{{ previewScoreText }}</span>
            </div>
          </div>

          <div class="form-section">
            <div class="section-badge">⚙️ Test Behaviour</div>
            <div class="toggles-grid">
              <label class="toggle-pill compact" :class="{ on: fd.test_random_questions_select }">
                <input type="checkbox" v-model="fd.test_random_questions_select" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Random Question Selection</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_random_questions_order }">
                <input type="checkbox" v-model="fd.test_random_questions_order" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Shuffle Question Order</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_random_answers_select }">
                <input type="checkbox" v-model="fd.test_random_answers_select" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Random Answer Selection</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_random_answers_order }">
                <input type="checkbox" v-model="fd.test_random_answers_order" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Shuffle Answer Order</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_noanswer_enabled }">
                <input type="checkbox" v-model="fd.test_noanswer_enabled" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Allow 'No Answer' Option</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_menu_enabled }">
                <input type="checkbox" v-model="fd.test_menu_enabled" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Show Questions Menu</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_mcma_radio }">
                <input type="checkbox" v-model="fd.test_mcma_radio" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Radiobuttons for MCMA</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_mcma_partial_score }">
                <input type="checkbox" v-model="fd.test_mcma_partial_score" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Partial Score for MCMA</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_comment_enabled }">
                <input type="checkbox" v-model="fd.test_comment_enabled" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Allow Test Comments</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_logout_on_timeout }">
                <input type="checkbox" v-model="fd.test_logout_on_timeout" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Logout on Timeout</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_results_to_users }">
                <input type="checkbox" v-model="fd.test_results_to_users" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Show Results to Users</span>
              </label>
              <label class="toggle-pill compact" :class="{ on: fd.test_report_to_users }">
                <input type="checkbox" v-model="fd.test_report_to_users" />
                <span class="pill-track"><span class="pill-thumb"></span></span>
                <span class="pill-label">Show Detailed Report</span>
              </label>
            </div>
          </div>
        </div>

        <!-- STEP 3: Topic Binding -->
        <div v-show="step === 3" class="step-content">
          <div class="form-section">
            <div class="section-badge">🔗 Bind Topics</div>
            <p class="help-text">
              {{ isEdit ? 'Saving replaces existing topic assignments.' : 'Select topics to randomly draw questions from when a user starts this test.' }}
            </p>

            <div class="module-filter">
              <label>Filter by Module</label>
              <select v-model="moduleFilter">
                <option value="">All Modules</option>
                <option v-for="m in modules" :key="m.module_id" :value="m.module_id">{{ m.module_name }}</option>
              </select>
            </div>

            <div class="topics-list" v-if="filteredTopics.length > 0">
              <label v-for="t in filteredTopics" :key="t.subject_id" class="topic-check">
                <input type="checkbox" :value="t.subject_id" v-model="fd.subject_ids" />
                <span class="topic-name">{{ t.subject_name }}</span>
                <span class="topic-module">{{ t.module_name }}</span>
              </label>
            </div>
            <div v-else class="empty-topics">No topics found. Create topics first.</div>

            <div class="qps-row" v-if="fd.subject_ids.length > 0">
              <div class="qps-badge">
                <strong>{{ fd.subject_ids.length }}</strong> topic{{ fd.subject_ids.length > 1 ? 's' : '' }} selected
              </div>
              <div class="form-group" style="flex:1">
                <label>Questions drawn per topic</label>
                <input type="number" v-model="fd.questions_per_subject" min="1" max="200" />
              </div>
              <div class="max-score-display">
                <div class="msd-label">Max Possible Score</div>
                <div class="msd-value">{{ maxPossibleScore }}</div>
              </div>
            </div>
          </div>
        </div>

      </div><!-- end modal-body -->

      <!-- Footer nav -->
      <div class="modal-footer">
        <button class="btn-back" v-if="step > 1" @click="step--">← Back</button>
        <div class="footer-right">
          <button class="btn-cancel" @click="$emit('close')">Cancel</button>
          <button class="btn-next" v-if="step < 3" @click="nextStep" :disabled="!canProceed">
            Next →
          </button>
          <button class="btn-save" v-else @click="handleSubmit" :disabled="isSaving">
            <span v-if="isSaving">⏳ Saving…</span>
            <span v-else>{{ isEdit ? '💾 Update Test' : '🚀 Create & Add Questions' }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { API_ENDPOINTS, API_BASE_URL } from '../config/constant.js';

const props = defineProps({
  isEdit: { type: Boolean, default: false },
  testData: { type: Object, default: null }
});
const emit = defineEmits(['close', 'save', 'error']);

const router = useRouter();
const isSaving = ref(false);
const step = ref(1);
const stepTitles = ['Basic Info & Schedule', 'Scoring & Settings', 'Topic Binding'];

const availableTopics = ref([]);
const modules = ref([]);
const moduleFilter = ref('');

const getToken = () => localStorage.getItem('tce_token');
const authH = () => ({ 'Authorization': `Bearer ${getToken()}` });

const formatDTLocal = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  const off = dt.getTimezoneOffset() * 60000;
  return new Date(dt - off).toISOString().slice(0, 16);
};

const now = new Date();
const end = new Date(); end.setDate(end.getDate() + 7);

const fd = ref({
  test_name: '',
  test_description: '',
  test_begin_time: formatDTLocal(now),
  test_end_time: formatDTLocal(end),
  test_duration_time: 60,
  test_password: '',
  test_repeatable: false,
  // scoring
  test_score_right: 1,
  test_score_wrong: 0,
  test_score_unanswered: 0,
  test_score_threshold: 0,
  // behaviour
  test_random_questions_select: true,
  test_random_questions_order: true,
  test_random_answers_select: true,
  test_random_answers_order: true,
  test_noanswer_enabled: true,
  test_menu_enabled: true,
  test_mcma_radio: true,
  test_mcma_partial_score: true,
  test_comment_enabled: true,
  test_logout_on_timeout: false,
  test_results_to_users: true,
  test_report_to_users: true,
  // topics
  subject_ids: [],
  questions_per_subject: 10
});

if (props.isEdit && props.testData) {
  const t = props.testData;
  fd.value = {
    test_name: t.test_name,
    test_description: t.test_description,
    test_begin_time: formatDTLocal(t.test_begin_time),
    test_end_time: formatDTLocal(t.test_end_time),
    test_duration_time: t.test_duration_time,
    test_password: t.test_password || '',
    test_repeatable: t.test_repeatable == 1,
    test_score_right: parseFloat(t.test_score_right ?? 1),
    test_score_wrong: parseFloat(t.test_score_wrong ?? 0),
    test_score_unanswered: parseFloat(t.test_score_unanswered ?? 0),
    test_score_threshold: parseFloat(t.test_score_threshold ?? 0),
    test_random_questions_select: t.test_random_questions_select == 1,
    test_random_questions_order: t.test_random_questions_order == 1,
    test_random_answers_select: t.test_random_answers_select == 1,
    test_random_answers_order: t.test_random_answers_order == 1,
    test_noanswer_enabled: t.test_noanswer_enabled == 1,
    test_menu_enabled: t.test_menu_enabled == 1,
    test_mcma_radio: t.test_mcma_radio == 1,
    test_mcma_partial_score: t.test_mcma_partial_score == 1,
    test_comment_enabled: t.test_comment_enabled == 1,
    test_logout_on_timeout: t.test_logout_on_timeout == 1,
    test_results_to_users: t.test_results_to_users == 1,
    test_report_to_users: t.test_report_to_users == 1,
    subject_ids: [],
    questions_per_subject: 10
  };
}

onMounted(async () => {
  await fetchModulesAndTopics();
  if (props.isEdit && props.testData?.test_id) {
    fetchExistingSubjects(props.testData.test_id);
  }
});

const fetchModulesAndTopics = async () => {
  try {
    const [mRes, tRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/modules.php`, { headers: authH() }),
      fetch(API_ENDPOINTS.ADMIN_TOPICS, { headers: authH() })
    ]);
    const mD = await mRes.json();
    const tD = await tRes.json();
    if (mD.status === 'success') modules.value = mD.data || [];
    if (tD.status === 'success') availableTopics.value = tD.data || [];
  } catch { console.error('Failed to load modules/topics'); }
};

const fetchExistingSubjects = async (testId) => {
  try {
    const res = await fetch(`${API_ENDPOINTS.ADMIN_TEST_QUESTIONS}?test_id=${testId}&info_only=1`, { headers: authH() });
    const r = await res.json();
    if (r.status === 'success' && r.subject_ids) {
      fd.value.subject_ids = r.subject_ids;
      if (r.questions_per_topic) fd.value.questions_per_subject = r.questions_per_topic;
    }
  } catch { console.error('Failed to load existing subjects'); }
};

const filteredTopics = computed(() => {
  if (!moduleFilter.value) return availableTopics.value;
  return availableTopics.value.filter(t => t.subject_module_id == moduleFilter.value);
});

const canProceed = computed(() => {
  if (step.value === 1) {
    return fd.value.test_name.trim() && fd.value.test_description.trim()
      && fd.value.test_begin_time && fd.value.test_end_time;
  }
  return true;
});

const previewScoreText = computed(() => {
  const qs = fd.value.questions_per_subject * Math.max(fd.value.subject_ids.length, 1);
  const max = qs * parseFloat(fd.value.test_score_right || 0);
  const wrong = parseFloat(fd.value.test_score_wrong || 0);
  return `${wrong < 0 ? `Negative marking: ${wrong} per wrong answer. ` : ''}Max if all correct: ${max.toFixed(1)} pts`;
});

const maxPossibleScore = computed(() => {
  const total = fd.value.subject_ids.length * fd.value.questions_per_subject;
  return (total * parseFloat(fd.value.test_score_right || 0)).toFixed(1) + ' pts';
});

const goStep = (n) => {
  if (n < step.value) step.value = n;
};

const nextStep = () => {
  if (!canProceed.value) return;
  step.value++;
};

const handleSubmit = async () => {
  isSaving.value = true;
  const payload = { ...fd.value };
  payload.test_begin_time = new Date(payload.test_begin_time).toISOString().slice(0, 19).replace('T', ' ');
  payload.test_end_time = new Date(payload.test_end_time).toISOString().slice(0, 19).replace('T', ' ');

  if (!props.isEdit) {
    // Create flow: call API directly then redirect
    try {
      const res = await fetch(API_ENDPOINTS.ADMIN_MANAGE_TEST, {
        method: 'POST',
        headers: { ...authH(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.status === 'success') {
        emit('close');
        router.push(`/admin/tests/${result.test_id}/questions`);
      } else {
        emit('error', result.message || 'Failed to create test');
      }
    } catch {
      emit('error', 'Network error while creating test');
    } finally {
      isSaving.value = false;
    }
  } else {
    // Edit flow: delegate to parent
    emit('save', payload);
    setTimeout(() => { isSaving.value = false; }, 1000);
  }
};
</script>

<style scoped>
/* ─── Overlay & Container ─────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-content {
  background: #ffffff;
  width: 100%; max-width: 820px;
  max-height: 92vh;
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.18);
  display: flex; flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

/* ─── Header ─────────────────────────────────────────── */
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.75rem;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white; flex-shrink: 0;
}
.header-left { display: flex; gap: 0.85rem; align-items: center; }
.header-icon { font-size: 2rem; }
.header-left h2 { margin: 0; font-size: 1.25rem; font-weight: 700; }
.header-sub { margin: 0.1rem 0 0; font-size: 0.82rem; opacity: 0.85; }
.close-btn {
  background: rgba(255,255,255,0.18); border: none; color: white;
  width: 32px; height: 32px; border-radius: 8px; font-size: 1rem;
  cursor: pointer; transition: background 0.2s;
}
.close-btn:hover { background: rgba(255,255,255,0.3); }

/* ─── Steps Bar ──────────────────────────────────────── */
.steps-bar {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 2.5rem;
  background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.steps-line {
  position: absolute; top: 50%; left: 2.5rem; right: 2.5rem;
  height: 2px; background: #e2e8f0; z-index: 0;
  transform: translateY(-50%);
}
.steps-progress {
  height: 100%; background: linear-gradient(90deg, #4f46e5, #3b82f6);
  transition: width 0.4s ease; border-radius: 2px;
}
.step-item {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  cursor: pointer; z-index: 1; position: relative;
}
.step-circle {
  width: 32px; height: 32px; border-radius: 50%;
  background: #e2e8f0; color: #94a3b8;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.85rem;
  border: 2px solid #e2e8f0; transition: all 0.3s;
}
.step-item.active .step-circle {
  background: #4f46e5; color: white; border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79,70,229,0.2);
}
.step-item.done .step-circle { background: #22c55e; color: white; border-color: #22c55e; }
.step-label { font-size: 0.75rem; color: #94a3b8; white-space: nowrap; font-weight: 500; }
.step-item.active .step-label, .step-item.done .step-label { color: #4f46e5; }
.step-item.done .step-label { color: #22c55e; }

/* ─── Body ───────────────────────────────────────────── */
.modal-body { overflow-y: auto; padding: 1.5rem 1.75rem; flex: 1; background: #f8fafc; }
.step-content { display: flex; flex-direction: column; gap: 1.25rem; }

.form-section {
  background: white; border-radius: 12px; padding: 1.25rem 1.5rem;
  border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.section-badge {
  display: inline-block; background: #eff6ff; color: #3b82f6;
  font-size: 0.78rem; font-weight: 700; border-radius: 6px;
  padding: 0.2rem 0.6rem; margin-bottom: 1rem; letter-spacing: 0.04em;
}

.form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.form-group:last-child { margin-bottom: 0; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
.form-row { display: flex; gap: 1.25rem; }
.form-row .form-group { flex: 1; }
.req { color: #ef4444; }
.hint { font-size: 0.78rem; color: #94a3b8; font-weight: 400; }
.field-hint { font-size: 0.78rem; color: #94a3b8; }

input[type="text"], input[type="number"], input[type="datetime-local"], textarea, select {
  padding: 0.65rem 0.9rem; border: 1.5px solid #e5e7eb; border-radius: 8px;
  font-size: 0.9rem; font-family: inherit; background: #fafafa; color: #1e293b;
  transition: border-color 0.2s, box-shadow 0.2s; width: 100%; box-sizing: border-box;
}
input:focus, textarea:focus, select:focus {
  outline: none; border-color: #4f46e5; background: white;
  box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
}
input[type="checkbox"] { width: auto; accent-color: #4f46e5; cursor: pointer; }

/* ─── Toggle Pills ───────────────────────────────────── */
.toggle-pill {
  display: flex; align-items: center; gap: 0.75rem; cursor: pointer; user-select: none;
  padding: 0.75rem 1rem; border-radius: 10px; border: 1.5px solid #e5e7eb;
  background: #fafafa; transition: all 0.2s;
}
.toggle-pill.on { border-color: #4f46e5; background: #eff6ff; }
.toggle-pill.compact { padding: 0.6rem 0.75rem; }
.toggle-pill input[type="checkbox"] { display: none; }
.pill-track {
  width: 36px; height: 20px; background: #d1d5db; border-radius: 10px;
  position: relative; flex-shrink: 0; transition: background 0.2s;
}
.toggle-pill.on .pill-track { background: #4f46e5; }
.pill-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; background: white; border-radius: 50%;
  transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.toggle-pill.on .pill-thumb { left: 18px; }
.pill-label { display: flex; flex-direction: column; font-size: 0.88rem; font-weight: 600; color: #374151; line-height: 1.3; }
.pill-label small { font-weight: 400; font-size: 0.75rem; color: #64748b; font-style: italic; }
.toggle-pill.compact .pill-label { font-size: 0.82rem; }
.toggles-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }

/* ─── Score Cards ────────────────────────────────────── */
.score-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem; margin-bottom: 0.85rem; }
.score-card {
  border-radius: 10px; padding: 1rem; border: 1.5px solid;
  display: flex; flex-direction: column; gap: 0.4rem;
}
.score-card.green { background: #f0fdf4; border-color: #bbf7d0; }
.score-card.red   { background: #fff1f2; border-color: #fecdd3; }
.score-card.gray  { background: #f8fafc; border-color: #e2e8f0; }
.score-card.blue  { background: #eff6ff; border-color: #bfdbfe; }
.score-icon { font-size: 1.4rem; }
.score-card label { font-size: 0.8rem; font-weight: 600; color: #374151; }
.score-card input { font-size: 1rem; font-weight: 700; text-align: center; }

.score-preview {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;
  background: #f1f5f9; border-radius: 8px; padding: 0.6rem 1rem;
  font-size: 0.82rem; color: #64748b;
}
.preview-pill { background: #4f46e5; color: white; border-radius: 6px; padding: 0.2rem 0.6rem; font-size: 0.78rem; font-weight: 600; }

/* ─── Topics ─────────────────────────────────────────── */
.help-text { color: #64748b; font-size: 0.84rem; margin-bottom: 0.85rem; }
.module-filter { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem; }
.module-filter label { font-size: 0.82rem; font-weight: 600; color: #374151; white-space: nowrap; }
.module-filter select { flex: 1; }

.topics-list {
  max-height: 220px; overflow-y: auto;
  border: 1.5px solid #e5e7eb; border-radius: 8px;
  background: #fafafa;
}
.topic-check {
  display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.9rem;
  cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
}
.topic-check:hover { background: #eff6ff; }
.topic-check:last-child { border-bottom: none; }
.topic-name { flex: 1; font-size: 0.88rem; color: #1e293b; font-weight: 500; }
.topic-module { font-size: 0.75rem; color: #94a3b8; background: #f1f5f9; padding: 0.1rem 0.4rem; border-radius: 4px; }
.empty-topics { text-align: center; padding: 2rem; color: #94a3b8; font-size: 0.9rem; }

.qps-row { display: flex; align-items: flex-end; gap: 1rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
.qps-badge { background: #4f46e5; color: white; border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.82rem; font-weight: 700; white-space: nowrap; align-self: center; }
.max-score-display { text-align: center; background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 8px; padding: 0.5rem 1rem; white-space: nowrap; }
.msd-label { font-size: 0.72rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
.msd-value { font-size: 1.1rem; color: #16a34a; font-weight: 800; }

/* ─── Footer ─────────────────────────────────────────── */
.modal-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.75rem; border-top: 1px solid #e2e8f0;
  background: white; flex-shrink: 0;
}
.footer-right { display: flex; gap: 0.75rem; align-items: center; }

.btn-back, .btn-cancel {
  padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer;
  border: 1.5px solid #e5e7eb; background: white; color: #475569; transition: all 0.2s; font-size: 0.9rem;
}
.btn-back:hover, .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }

.btn-next {
  padding: 0.65rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer;
  border: none; background: linear-gradient(135deg, #4f46e5, #3b82f6); color: white;
  font-size: 0.92rem; transition: all 0.2s; box-shadow: 0 4px 10px rgba(79,70,229,0.2);
}
.btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(79,70,229,0.3); }
.btn-next:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-save {
  padding: 0.7rem 1.75rem; border-radius: 8px; font-weight: 700; cursor: pointer;
  border: none; background: linear-gradient(135deg, #22c55e, #16a34a); color: white;
  font-size: 0.92rem; transition: all 0.2s; box-shadow: 0 4px 10px rgba(34,197,94,0.25);
}
.btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(34,197,94,0.35); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
