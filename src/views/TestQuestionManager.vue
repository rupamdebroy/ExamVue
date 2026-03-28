<template>
  <div class="q-manager">
    <div class="header">
      <div class="header-titles">
        <h1>Question Paper Builder</h1>
        <p>Manually select and sequence exact questions for Test ID: {{ testId }}</p>
      </div>
      <div class="actions">
        <button class="btn-ghost" @click="router.push('/admin/tests')">Back to Tests</button>
        <button class="btn-primary" @click="saveQuestionPaper" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Question Paper' }}
        </button>
      </div>
    </div>

    <div class="info-msg" v-if="sysMessage" :class="{ error: isError }">{{ sysMessage }}</div>

    <div class="workspace">
      <!-- LEFTPANE: POOL -->
      <div class="pane left-pane">
        <div class="pane-header">
          <h3>Question Pool</h3>
          <span class="badge">{{ poolQuestions.length }} available</span>
        </div>
        
        <div class="filters">
          <input type="text" v-model="filters.search" placeholder="Search text..." @keyup.enter="fetchPool" />
          <div class="filter-row">
            <select v-model="filters.module_id" @change="fetchPool">
              <option value="0">All Modules</option>
              <option v-for="mod in modules" :key="mod.module_id" :value="mod.module_id">{{ mod.module_name }}</option>
            </select>
            <select v-model="filters.subject_id" @change="fetchPool">
              <option value="0">All Subjects</option>
              <option v-for="sub in filteredSubjects" :key="sub.subject_id" :value="sub.subject_id">{{ sub.subject_name }}</option>
            </select>
            <select v-model="filters.difficulty" @change="fetchPool">
              <option value="0">All Difficulties</option>
              <option v-for="n in 10" :key="n" :value="n">Level {{ n }}</option>
            </select>
            <button class="btn-search" @click="fetchPool">Search</button>
          </div>
        </div>

        <div class="scroll-area pool-list">
          <div v-if="loadingPool" class="loading">Loading pool...</div>
          <div v-else-if="poolQuestions.length === 0" class="empty">No questions found matching criteria.</div>
          
          <div class="q-card" v-for="q in poolQuestions" :key="q.question_id" :class="{ 'already-added': isSelected(q.question_id) }">
            <div class="q-meta">
              <span class="id">#{{ q.question_id }}</span>
              <span class="dif">Diff: {{ q.difficulty }}</span>
              <span class="sub">{{ q.subject_name || 'Topic' }}</span>
            </div>
            <div class="q-desc" v-html="stripTags(q.description)"></div>
            <button class="btn-add" @click="addQuestion(q)" :disabled="isSelected(q.question_id)">
              {{ isSelected(q.question_id) ? 'Added' : 'Add to Paper →' }}
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHTPANE: SELECTED -->
      <div class="pane right-pane">
        <div class="pane-header dark">
          <h3>Current Question Paper</h3>
          <span class="badge">{{ selectedQuestions.length }} questions</span>
        </div>

        <div class="scroll-area selected-list">
          <div v-if="loadingSelected" class="loading">Loading paper...</div>
          <div v-else-if="selectedQuestions.length === 0" class="empty">Drag or add questions from the pool.</div>
          
          <TransitionGroup name="list" tag="div" class="list-wrapper">
            <div class="q-card selected-card" v-for="(q, index) in selectedQuestions" :key="q.question_id">
              <div class="order-badge">{{ index + 1 }}</div>
              <div class="q-content">
                <div class="q-meta">
                  <span class="id">#{{ q.question_id }}</span>
                  <span class="dif">Diff: {{ q.difficulty }}</span>
                </div>
                <div class="q-desc" v-html="stripTags(q.description)"></div>
              </div>
              <div class="q-controls">
                <button class="btn-icon" @click="moveUp(index)" :disabled="index === 0">▲</button>
                <button class="btn-icon" @click="moveDown(index)" :disabled="index === selectedQuestions.length - 1">▼</button>
                <button class="btn-icon danger" @click="removeQuestion(index)">✕</button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { API_ENDPOINTS } from '../config/constant.js';

const route = useRoute();
const router = useRouter();
const testId = route.params.id;

const sysMessage = ref('');
const isError = ref(false);
const saving = ref(false);

const loadingPool = ref(false);
const loadingSelected = ref(false);

const modules = ref([]);
const subjects = ref([]);

const filters = ref({
  module_id: 0,
  subject_id: 0,
  difficulty: 0,
  type: 0,
  search: ''
});

const poolQuestions = ref([]);
const selectedQuestions = ref([]);

// Setup Fetching
const token = localStorage.getItem('tce_token');
const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}` });

onMounted(async () => {
  if (!token) {
    router.push('/login');
    return;
  }
  loadingSelected.value = true;
  await fetchSelected();
  await fetchModulesAndSubjects();
  await fetchPool();
  loadingSelected.value = false;
});

const filteredSubjects = computed(() => {
  if (filters.value.module_id == 0) return subjects.value;
  return subjects.value.filter(s => s.subject_module_id === filters.value.module_id);
});

async function fetchModulesAndSubjects() {
  try {
    const rm = await fetch(API_ENDPOINTS.ADMIN_MODULES, { headers: getAuthHeaders() });
    const dm = await rm.json();
    if (dm.status === 'success') modules.value = dm.data;

    const rs = await fetch(API_ENDPOINTS.ADMIN_TOPICS, { headers: getAuthHeaders() });
    const ds = await rs.json();
    if (ds.status === 'success') subjects.value = ds.data;
  } catch (e) {
    console.error("Failed loading filters", e);
  }
}

async function fetchPool() {
  loadingPool.value = true;
  try {
    const params = new URLSearchParams({
      module_id: filters.value.module_id,
      subject_id: filters.value.subject_id,
      difficulty: filters.value.difficulty,
      search: filters.value.search
    });
    const res = await fetch(`${API_ENDPOINTS.ADMIN_QUESTIONS_POOL}?${params.toString()}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.status === 'success') {
      poolQuestions.value = data.data;
    } else if (data.status === 'error' && data.message.toLowerCase().includes('token')) {
      localStorage.removeItem('tce_token');
      localStorage.removeItem('tce_user');
      router.push('/login');
    }
  } catch(e) {
    showMessage("Failed to load question pool.", true);
  } finally {
    loadingPool.value = false;
  }
}

async function fetchSelected() {
  try {
    const res = await fetch(`${API_ENDPOINTS.ADMIN_TEST_QUESTIONS}?test_id=${testId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.status === 'success') {
      selectedQuestions.value = data.questions || [];
    } else if (data.status === 'error' && data.message.toLowerCase().includes('token')) {
      localStorage.removeItem('tce_token');
      localStorage.removeItem('tce_user');
      router.push('/login');
    }
  } catch(e) {
    showMessage("Failed to load existing paper map.", true);
  }
}

// Logic Mapping
function isSelected(id) {
  return selectedQuestions.value.some(q => q.question_id === id);
}

function addQuestion(q) {
  if (!isSelected(q.question_id)) {
    selectedQuestions.value.push({ ...q });
  }
}

function removeQuestion(index) {
  selectedQuestions.value.splice(index, 1);
}

function moveUp(index) {
  if (index > 0) {
    const el = selectedQuestions.value[index];
    selectedQuestions.value.splice(index, 1);
    selectedQuestions.value.splice(index - 1, 0, el);
  }
}

function moveDown(index) {
  if (index < selectedQuestions.value.length - 1) {
    const el = selectedQuestions.value[index];
    selectedQuestions.value.splice(index, 1);
    selectedQuestions.value.splice(index + 1, 0, el);
  }
}

// Save Output
async function saveQuestionPaper() {
  saving.value = true;
  const ids = selectedQuestions.value.map(q => q.question_id);
  try {
    const res = await fetch(API_ENDPOINTS.ADMIN_TEST_QUESTIONS, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_id: parseInt(testId), question_ids: ids })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showMessage("Question paper saved successfully!", false);
    } else {
      showMessage(data.message || "Failed to save.", true);
    }
  } catch(e) {
    showMessage("Network error saving paper.", true);
  } finally {
    saving.value = false;
  }
}

// Utils
function stripTags(html) {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  return text.substring(0, 150) + (text.length > 150 ? '...' : '');
}

function showMessage(msg, isErr = false) {
  sysMessage.value = msg;
  isError.value = isErr;
  setTimeout(() => sysMessage.value = '', 4000);
}
</script>

<style scoped>
.q-manager { max-width: 1400px; margin: 0 auto; height: calc(100vh - 80px); display: flex; flex-direction: column; }

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;}
.header-titles h1 { font-size: 1.8rem; color: #1e293b; margin: 0; }
.header-titles p { color: #64748b; margin: 5px 0 0 0; }
.actions { display: flex; gap: 12px; }

.btn-primary { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-primary:disabled { opacity: 0.6; }
.btn-ghost { background: white; border: 1px solid #cbd5e1; padding: 10px 20px; border-radius: 6px; cursor: pointer; }

.info-msg { padding: 12px; background: #dcfce3; color: #166534; border-radius: 6px; margin-bottom: 16px; text-align: center; font-weight: bold;}
.info-msg.error { background: #fee2e2; color: #b91c1c; }

/* Workspace Dual Pane */
.workspace { display: flex; gap: 24px; flex: 1; min-height: 0; }
.pane { flex: 1; display: flex; flex-direction: column; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }

.pane-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #f8fafc; }
.pane-header.dark { background: #f1f5f9; }
.pane-header h3 { margin: 0; font-size: 1.1rem; color: #334155; }
.badge { background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }

.filters { padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
.filters input, .filters select { padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; }
.filters input { width: 100%; }
.filter-row { display: flex; gap: 8px; }
.filter-row select { flex: 1; }
.btn-search { background: #e2e8f0; border: none; padding: 0 16px; border-radius: 6px; cursor: pointer; font-weight: bold;}

.scroll-area { flex: 1; overflow-y: auto; padding: 16px; background: #f1f5f9;}

/* Question Cards */
.q-card { background: white; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 12px; position: relative; transition: all 0.2s; }
.q-card:hover { border-color: #94a3b8; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.q-card.already-added { opacity: 0.5; }

.q-meta { display: flex; gap: 12px; font-size: 0.8rem; font-weight: bold; color: #64748b; margin-bottom: 8px; }
.q-meta .id { color: #3b82f6; }
.q-desc { font-size: 0.9rem; color: #1e293b; line-height: 1.4; }

.btn-add { margin-top: 12px; background: #f1f5f9; color: #3b82f6; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; cursor: pointer; width: 100%;}
.btn-add:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

/* Selected Pane Specific */
.list-wrapper { display: flex; flex-direction: column; gap: 12px; }
.selected-card { display: flex; align-items: stretch; padding: 0; overflow: hidden; margin-bottom: 0;}
.order-badge { background: #3b82f6; color: white; font-weight: bold; display: flex; align-items: center; justify-content: center; width: 40px; font-size: 1.2rem; }
.q-content { flex: 1; padding: 16px; border-right: 1px solid #e2e8f0; }

.q-controls { display: flex; flex-direction: column; background: #f8fafc; }
.btn-icon { flex: 1; min-height: 33px; width: 40px; background: transparent; border: none; border-bottom: 1px solid #e2e8f0; cursor: pointer; font-size: 1rem; color: #475569; transition: background 0.2s;}
.btn-icon:last-child { border-bottom: none; }
.btn-icon:hover:not(:disabled) { background: #e2e8f0; color: #0f172a; }
.btn-icon.danger { color: #ef4444; }
.btn-icon.danger:hover { background: #fee2e2; color: #b91c1c; }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }

.loading, .empty { text-align: center; padding: 40px; color: #64748b; font-weight: bold; }

/* Animations */
.list-move,
.list-enter-active,
.list-leave-active { transition: all 0.3s ease; }
.list-enter-from,
.list-leave-to { opacity: 0; transform: translateX(30px); }
.list-leave-active { position: absolute; }
</style>
