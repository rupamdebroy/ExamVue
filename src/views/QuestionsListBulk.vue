<template>
  <div class="bulk-management">
    <div class="header-section">
      <div class="header-titles">
        <h1>All Questions List</h1>
        <p>Filter, review, and manage questions in bulk across topics</p>
      </div>
    </div>

    <!-- Toast Messages -->
    <transition name="slide-down">
      <div class="toast error-toast" v-if="error">⚠️ {{ error }}</div>
    </transition>
    <transition name="slide-down">
      <div class="toast info-toast" v-if="infoMessage">✅ {{ infoMessage }}</div>
    </transition>

    <!-- Filters Card -->
    <div class="filters-card">
      <div class="filter-row">
        <div class="filter-group">
          <label>Module</label>
          <select class="form-select" v-model="selectedModule" @change="fetchTopics">
            <option value="">-- All Modules --</option>
            <option v-for="m in modules" :key="m.module_id" :value="m.module_id">
              {{ m.module_name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Topic / Subject</label>
          <select class="form-select" v-model="selectedTopic" :disabled="!selectedModule" @change="onTopicChange">
            <option value="">-- All Topics --</option>
            <option v-for="t in topics" :key="t.subject_id" :value="t.subject_id">
              {{ t.subject_name }}
            </option>
          </select>
        </div>

        <div class="filter-group search-group">
          <label>Search</label>
          <input type="text" class="form-select" v-model="searchQuery" placeholder="Search questions..." @input="currentPage = 1" />
        </div>

        <div class="filter-group narrow">
          <label>Per page</label>
          <select class="form-select" v-model="perPage" @change="currentPage = 1">
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>

        <div class="filter-group narrow">
          <label>Show Answers</label>
          <div class="toggle-wrap">
            <input type="checkbox" id="showAns" v-model="includeAnswers" @change="fetchQuestions" class="toggle-input" />
            <label for="showAns" class="toggle-label"></label>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Action Toolbar (sticky) -->
    <transition name="slide-down">
      <div class="bulk-toolbar" v-if="selectedQuestions.length > 0">
        <div class="toolbar-left">
          <span class="selected-count"><strong>{{ selectedQuestions.length }}</strong> selected</span>
          <button class="tb-btn deselect" @click="selectedQuestions = []">✕ Deselect</button>
        </div>
        <div class="toolbar-right">
          <button class="tb-btn enable" @click="openBulkModal('enable')">✔ Enable</button>
          <button class="tb-btn disable" @click="openBulkModal('disable')">✕ Disable</button>
          <div class="tb-sep"></div>
          <select class="form-select dest-select" v-model="targetTopic">
            <option value="">— Target Topic —</option>
            <optgroup v-for="mod in treeNav" :key="mod.id" :label="mod.name">
              <option v-for="top in mod.topics" :key="top.id" :value="top.id">{{ top.name }}</option>
            </optgroup>
          </select>
          <button class="tb-btn copy" :disabled="!targetTopic" @click="openBulkModal('copy')">📋 Copy To</button>
          <button class="tb-btn move" :disabled="!targetTopic" @click="openBulkModal('move')">📦 Move To</button>
          <div class="tb-sep"></div>
          <button class="tb-btn del" @click="openBulkModal('delete')">🗑 Delete</button>
        </div>
      </div>
    </transition>

    <!-- Status bar -->
    <div class="status-bar" v-if="!loading && questionsList.length > 0">
      Showing <strong>{{ paginatedQuestions.length }}</strong> of <strong>{{ filteredQuestions.length }}</strong>
      questions
      <span v-if="searchQuery"> matching "<em>{{ searchQuery }}</em>"</span>
      <span v-if="selectedTopic"> in {{ currentTopicName }}</span>
      <button class="select-label" @click="toggleAll(true)" v-if="selectedQuestions.length < filteredQuestions.length">
        Select all {{ filteredQuestions.length }}
      </button>
      <button class="select-label desel" @click="toggleAll(false)" v-else-if="selectedQuestions.length > 0">
        Deselect all
      </button>
    </div>

    <!-- Questions Table -->
    <div class="table-container">
      <div class="loading-overlay" v-if="loading">
        <div class="spinner-ring"></div>
        <span>Loading questions…</span>
      </div>

      <table class="data-table" v-if="paginatedQuestions.length > 0">
        <thead>
          <tr>
            <th class="chk-col">
              <input type="checkbox" @change="(e) => toggleAll(e.target.checked)" :checked="isAllPageSelected" :indeterminate="isPartialSelected" />
            </th>
            <th class="pos-col">#</th>
            <th class="wide-col">Question</th>
            <th>Type</th>
            <th>Diff</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="q in paginatedQuestions" :key="q.question_id">
            <tr :class="{'selected-row': selectedQuestions.includes(q.question_id), 'expanded-row': expandedQuestions.includes(q.question_id)}">
              <td class="chk-col">
                <input type="checkbox" :value="q.question_id" v-model="selectedQuestions" />
              </td>
              <td class="pos-col muted">{{ q.question_position }}</td>
              <td class="desc-cell">
                <div class="q-header">
                  <div class="q-title" v-html="truncateText(q.question_description)"></div>
                  <div class="q-actions">
                    <button class="action-btn expand-btn" @click="toggleExpand(q.question_id)" :title="expandedQuestions.includes(q.question_id) ? 'Collapse' : 'Expand answers'">
                      {{ expandedQuestions.includes(q.question_id) ? '▲' : '▼' }}
                    </button>
                  </div>
                </div>
              </td>
              <td>
                <span class="type-badge" :class="'type-' + q.question_type">{{ getTypeLabel(q.question_type) }}</span>
              </td>
              <td>
                <div class="diff-dots">
                  <span v-for="i in 5" :key="i" class="diff-dot" :class="{ filled: i <= q.question_difficulty }"></span>
                </div>
              </td>
              <td>
                <span class="status-badge" :class="q.question_enabled ? 'enabled' : 'disabled'">
                  {{ q.question_enabled ? 'Active' : 'Disabled' }}
                </span>
              </td>
            </tr>
            <!-- Expanded Answers Row -->
            <tr v-if="expandedQuestions.includes(q.question_id)" class="answers-expand-row">
              <td colspan="6">
                <div class="answers-panel">
                  <div v-if="q.answers && q.answers.length > 0">
                    <div v-for="a in q.answers" :key="a.answer_id" class="answer-item" :class="{ 'answer-correct': a.answer_isright }">
                      <span class="answer-icon">{{ a.answer_isright ? '✓' : '○' }}</span>
                      <span class="answer-text" v-html="a.answer_description"></span>
                    </div>
                  </div>
                  <div v-else class="no-answers">No answers defined for this question yet.</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div v-else-if="!loading && selectedTopic" class="empty-state">
        <div class="empty-icon">📋</div>
        <div>No questions found{{ searchQuery ? ` matching "${searchQuery}"` : '' }}.</div>
      </div>
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">🔍</div>
        <div>Select a <strong>Module</strong> and <strong>Topic</strong> to list questions.</div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage = 1">«</button>
      <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">‹</button>
      <span v-for="page in visiblePages" :key="page">
        <button v-if="page !== '...'" class="page-btn" :class="{ active: page === currentPage }" @click="currentPage = page">{{ page }}</button>
        <span v-else class="page-ellipsis">…</span>
      </span>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">›</button>
      <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage = totalPages">»</button>
    </div>

    <!-- Bulk Action Confirmation Modal -->
    <div class="modal-overlay" v-if="bulkModalAction" @click.self="bulkModalAction = null">
      <div class="confirm-modal">
        <div class="confirm-icon">{{ bulkModalIcon }}</div>
        <h3>{{ bulkModalTitle }}</h3>
        <p>{{ bulkModalMessage }}</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="bulkModalAction = null">Cancel</button>
          <button class="confirm-btn" :class="bulkModalAction === 'delete' ? 'danger' : 'primary'" :disabled="loading" @click="executeBulkAction">
            {{ loading ? 'Processing…' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { API_BASE_URL } from '../config/constant.js';

const modules = ref([]);
const topics = ref([]);
const treeNav = ref([]);

const selectedModule = ref('');
const selectedTopic = ref('');
const targetTopic = ref('');
const searchQuery = ref('');
const includeAnswers = ref(false);

const questionsList = ref([]);
const selectedQuestions = ref([]);
const expandedQuestions = ref([]);
const currentPage = ref(1);
const perPage = ref(20);

const loading = ref(false);
const error = ref('');
const infoMessage = ref('');

const bulkModalAction = ref(null);

const bulkModalConfig = {
  enable:  { icon: '✔', title: 'Enable Questions', msg: (n) => `Enable ${n} selected question(s)?` },
  disable: { icon: '⏸', title: 'Disable Questions', msg: (n) => `Disable ${n} selected question(s)?` },
  copy:    { icon: '📋', title: 'Copy Questions', msg: (n) => `Copy ${n} selected question(s) to the target topic?` },
  move:    { icon: '📦', title: 'Move Questions', msg: (n) => `Move ${n} selected question(s) to the target topic?` },
  delete:  { icon: '🗑', title: 'Delete Questions', msg: (n) => `Delete ${n} selected question(s)? Questions in use will be disabled instead.` },
};

const bulkModalIcon = computed(() => bulkModalConfig[bulkModalAction.value]?.icon || '?');
const bulkModalTitle = computed(() => bulkModalConfig[bulkModalAction.value]?.title || '');
const bulkModalMessage = computed(() => bulkModalConfig[bulkModalAction.value]?.msg(selectedQuestions.value.length) || '');

const filteredQuestions = computed(() => {
  if (!searchQuery.value) return questionsList.value;
  const q = searchQuery.value.toLowerCase();
  return questionsList.value.filter(item => item.question_description?.toLowerCase().includes(q));
});

const totalPages = computed(() => Math.ceil(filteredQuestions.value.length / perPage.value));

const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredQuestions.value.slice(start, start + perPage.value);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
});

const isAllPageSelected = computed(() =>
  paginatedQuestions.value.length > 0 &&
  paginatedQuestions.value.every(q => selectedQuestions.value.includes(q.question_id))
);

const isPartialSelected = computed(() =>
  paginatedQuestions.value.some(q => selectedQuestions.value.includes(q.question_id)) && !isAllPageSelected.value
);

const currentTopicName = computed(() => {
  const t = topics.value.find(t => t.subject_id == selectedTopic.value);
  return t?.subject_name || '';
});

onMounted(async () => {
  await fetchModules();
  await buildTreeNav();
});

const getTypeLabel = (typeId) => {
  const types = { 1: 'MCSA', 2: 'MCMA', 3: 'Text', 4: 'Order' };
  return types[typeId] || `Type ${typeId}`;
};

const truncateText = (text) => {
  if (!text) return '';
  const stripped = text.replace(/<[^>]*>/g, '');
  return stripped.length > 200 ? stripped.slice(0, 200) + '…' : stripped;
};

const toggleAll = (check) => {
  if (check) {
    const allIds = filteredQuestions.value.map(q => q.question_id);
    selectedQuestions.value = [...new Set([...selectedQuestions.value, ...allIds])];
  } else {
    selectedQuestions.value = [];
  }
};

const toggleExpand = (id) => {
  const idx = expandedQuestions.value.indexOf(id);
  if (idx === -1) expandedQuestions.value.push(id);
  else expandedQuestions.value.splice(idx, 1);
};

const apiBase = `${API_BASE_URL}/admin`;
const getToken = () => localStorage.getItem('tce_token');
const authHeaders = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

const fetchModules = async () => {
  try {
    const res = await fetch(`${apiBase}/modules.php`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.status === 'success') modules.value = data.data;
  } catch { showError('Failed to load modules.'); }
};

const fetchTopics = async () => {
  selectedTopic.value = '';
  topics.value = [];
  questionsList.value = [];
  selectedQuestions.value = [];
  if (!selectedModule.value) return;
  try {
    const res = await fetch(`${apiBase}/topics.php?module_id=${selectedModule.value}`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
    const data = await res.json();
    if (data.status === 'success') topics.value = data.data;
  } catch { showError('Failed to load topics.'); }
};

const onTopicChange = () => {
  currentPage.value = 1;
  selectedQuestions.value = [];
  fetchQuestions();
};

const buildTreeNav = async () => {
  try {
    const token = getToken();
    const mRes = await fetch(`${apiBase}/modules.php`, { headers: { 'Authorization': `Bearer ${token}` } });
    const mData = await mRes.json();
    if (mData.status !== 'success') return;
    let tree = [];
    for (const mod of mData.data) {
      const tRes = await fetch(`${apiBase}/topics.php?module_id=${mod.module_id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const tData = await tRes.json();
      if (tData.status === 'success' && tData.data.length > 0) {
        tree.push({ id: mod.module_id, name: mod.module_name, topics: tData.data.map(t => ({ id: t.subject_id, name: t.subject_name })) });
      }
    }
    treeNav.value = tree;
  } catch { /* silent fail */ }
};

const fetchQuestions = async () => {
  if (!selectedTopic.value) return;
  loading.value = true;
  selectedQuestions.value = [];
  expandedQuestions.value = [];
  try {
    const res = await fetch(`${apiBase}/questions_list.php?subject_id=${selectedTopic.value}&include_answers=${includeAnswers.value ? '1' : '0'}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (data.status === 'success') {
      questionsList.value = data.data;
    } else {
      showError(data.message);
    }
  } catch { showError('Network error loading questions.'); }
  finally { loading.value = false; }
};

const openBulkModal = (action) => { bulkModalAction.value = action; };

const executeBulkAction = async () => {
  const action = bulkModalAction.value;
  bulkModalAction.value = null;
  loading.value = true;
  const token = getToken();
  try {
    let res;
    if (action === 'enable' || action === 'disable') {
      res = await fetch(`${apiBase}/questions_list.php`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ question_ids: selectedQuestions.value, action })
      });
    } else if (action === 'copy' || action === 'move') {
      res = await fetch(`${apiBase}/questions_list.php`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ question_ids: selectedQuestions.value, target_subject_id: targetTopic.value, action })
      });
    } else if (action === 'delete') {
      res = await fetch(`${apiBase}/questions_list.php`, {
        method: 'DELETE', headers: authHeaders(),
        body: JSON.stringify({ question_ids: selectedQuestions.value })
      });
    }
    const data = await res.json();
    if (data.status === 'success') {
      showInfo(data.message);
      selectedQuestions.value = [];
      await fetchQuestions();
    } else {
      showError(data.message);
    }
  } catch { showError('Network error executing bulk action.'); }
  finally { loading.value = false; }
};

const showError = (msg) => { error.value = msg; setTimeout(() => { error.value = ''; }, 5000); };
const showInfo = (msg) => { infoMessage.value = msg; setTimeout(() => { infoMessage.value = ''; }, 6000); };
</script>

<style scoped>
.bulk-management { max-width: 1300px; margin: 0 auto; }

.header-section { margin-bottom: 1.5rem; }
.header-titles h1 { font-size: 1.8rem; color: #1e293b; font-weight: 700; margin: 0; }
.header-titles p { color: #64748b; margin: 0.2rem 0 0; }

/* Toast */
.toast {
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}
.error-toast { background: #fee2e2; color: #b91c1c; }
.info-toast { background: #dcfce7; color: #15803d; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-12px); }

/* Filters Card */
.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  border: 1px solid #e2e8f0;
}
.filter-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
.filter-group { flex: 1; min-width: 140px; }
.filter-group.narrow { flex: 0 0 90px; }
.filter-group.search-group { flex: 2; }
.filter-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #64748b; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.04em; }
.form-select {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.55rem 0.8rem;
  font-size: 0.9rem;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); background: white; }

/* Toggle Switch */
.toggle-wrap { display: flex; align-items: center; height: 38px; }
.toggle-input { display: none; }
.toggle-label {
  width: 40px; height: 22px;
  background: #e2e8f0;
  border-radius: 999px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}
.toggle-label::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  background: white;
  border-radius: 50%;
  transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.toggle-input:checked + .toggle-label { background: #3b82f6; }
.toggle-input:checked + .toggle-label::after { left: 20px; }

/* Status Bar */
.status-bar { font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.75rem; }
.select-label { background: none; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; font-size: 0.8rem; cursor: pointer; color: #3b82f6; }
.select-label.desel { color: #ef4444; border-color: #fca5a5; }

/* Bulk Toolbar */
.bulk-toolbar {
  position: sticky; top: 1rem; z-index: 50;
  background: #1e293b; color: white;
  border-radius: 12px; padding: 0.85rem 1.2rem;
  margin-bottom: 1rem;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 8px 25px -5px rgba(0,0,0,0.25);
  flex-wrap: wrap; gap: 0.75rem;
}
.toolbar-left { display: flex; align-items: center; gap: 0.75rem; }
.toolbar-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.selected-count { font-size: 0.95rem; font-weight: 600; }
.selected-count strong { color: #38bdf8; font-size: 1.2rem; }
.tb-sep { width: 1px; height: 26px; background: rgba(255,255,255,0.2); margin: 0 0.25rem; }
.dest-select { min-width: 160px; max-width: 200px; }

.tb-btn {
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, transform 0.15s;
  white-space: nowrap;
}
.tb-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.tb-btn.deselect { background: transparent; border: 1px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); }
.tb-btn.enable  { background: #22c55e; color: white; }
.tb-btn.disable { background: #f59e0b; color: white; }
.tb-btn.copy    { background: #3b82f6; color: white; }
.tb-btn.move    { background: #6366f1; color: white; }
.tb-btn.del     { background: #ef4444; color: white; }

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  position: relative;
}
.loading-overlay {
  position: absolute; inset: 0;
  background: rgba(248,250,252,0.9);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; z-index: 10; font-weight: 600; color: #3b82f6;
}
.spinner-ring {
  width: 36px; height: 36px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  background: #f8fafc;
  padding: 0.8rem 1rem;
  font-size: 0.8rem;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
}
.data-table td { padding: 0.8rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.9rem; vertical-align: top; }
.data-table tbody tr:hover { background: #fafafa; }
.data-table tr.selected-row { background: #eff6ff; }
.data-table tr.expanded-row > td { padding-bottom: 0; border-bottom: none; }
.data-table tr.answers-expand-row > td { padding-top: 0; background: #f8fafc; }

.chk-col { width: 40px; text-align: center; }
.pos-col { width: 55px; font-size: 0.8rem; }
.muted { color: #94a3b8; }
.wide-col { min-width: 40%; }

.q-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.q-title { font-weight: 500; color: #0f172a; line-height: 1.5; flex: 1; }
.q-actions { flex-shrink: 0; }
.action-btn { background: none; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 0.75rem; color: #64748b; }
.action-btn:hover { background: #f1f5f9; }

/* Type Badge */
.type-badge { padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.78rem; font-weight: 700; }
.type-1 { background: #dbeafe; color: #1e40af; }
.type-2 { background: #ede9fe; color: #4c1d95; }
.type-3 { background: #fef9c3; color: #713f12; }
.type-4 { background: #fce7f3; color: #831843; }

/* Difficulty dots */
.diff-dots { display: flex; gap: 3px; align-items: center; }
.diff-dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; }
.diff-dot.filled { background: #f59e0b; }

/* Status badge */
.status-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
.status-badge.enabled { background: #dcfce7; color: #15803d; }
.status-badge.disabled { background: #fee2e2; color: #b91c1c; }

/* Answers panel */
.answers-panel { padding: 0.75rem 1rem 1rem; }
.answer-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.4rem;
  background: white;
  border: 1px solid #e2e8f0;
}
.answer-item.answer-correct { background: #f0fdf4; border-color: #bbf7d0; }
.answer-icon { font-size: 0.9rem; color: #94a3b8; flex-shrink: 0; padding-top: 1px; }
.answer-item.answer-correct .answer-icon { color: #22c55e; font-weight: bold; }
.answer-text { font-size: 0.88rem; color: #334155; line-height: 1.5; }
.no-answers { color: #94a3b8; font-style: italic; font-size: 0.85rem; padding: 0.5rem 0; }

/* Empty state */
.empty-state { text-align: center; padding: 3rem 2rem; color: #94a3b8; }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

/* Pagination */
.pagination { display: flex; justify-content: center; align-items: center; gap: 0.3rem; margin-top: 1.5rem; flex-wrap: wrap; }
.page-btn { padding: 0.45rem 0.75rem; border: 1px solid #e2e8f0; background: white; border-radius: 6px; font-size: 0.88rem; font-weight: 500; cursor: pointer; color: #334155; transition: all 0.15s; min-width: 36px; }
.page-btn:hover:not(:disabled) { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }
.page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; font-weight: 700; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-ellipsis { padding: 0.45rem 0.3rem; color: #94a3b8; }

/* Confirm Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(2px); }
.confirm-modal { background: white; border-radius: 16px; padding: 2rem 2.5rem; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: pop-in 0.2s ease; }
@keyframes pop-in { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.confirm-modal h3 { font-size: 1.2rem; color: #0f172a; margin: 0 0 0.5rem; }
.confirm-modal p { color: #475569; margin: 0.3rem 0; font-size: 0.92rem; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; }
.cancel-btn { padding: 0.6rem 1.4rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 600; cursor: pointer; }
.cancel-btn:hover { background: #f8fafc; }
.confirm-btn { padding: 0.6rem 1.6rem; border-radius: 8px; border: none; color: white; font-weight: 700; cursor: pointer; }
.confirm-btn.primary { background: #3b82f6; }
.confirm-btn.danger { background: #ef4444; }
.confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
