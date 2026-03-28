<template>
  <div class="question-management">
    <!-- Header -->
    <div class="header-section">
      <div class="header-titles">
        <h1>Question Management</h1>
        <p>Manage your test bank questions with full control</p>
      </div>
      <div class="header-actions">
        <button class="action-btn export-btn" @click="exportCSV" title="Export current questions filter to CSV">
          <span>📥</span> Export CSV
        </button>
        <button class="action-btn import-btn" @click="triggerImport" title="Import questions from CSV">
          <span>📤</span> Import CSV
        </button>
        <input type="file" ref="fileInput" @change="handleImport" accept=".csv" class="hidden-file-input" />
        <button class="primary-btn" @click="isCreatingNew = true; editingQuestionId = null; pagination.page = 1;">
          <span>+</span> Add New Question
        </button>
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
          <select v-model="filterModuleId" class="form-select" @change="onModuleChange">
            <option value="">All Modules</option>
            <option v-for="mod in modules" :key="mod.module_id" :value="mod.module_id">
              {{ mod.module_name }}
            </option>
          </select>
        </div>

        <div class="filter-group" v-if="filterModuleId">
          <label>Topic</label>
          <select v-model="filterTopicId" class="form-select" @change="onFilterChange">
            <option value="">All Topics</option>
            <option v-for="topic in filteredTopics" :key="topic.subject_id" :value="topic.subject_id">
              {{ topic.subject_name }}
            </option>
          </select>
        </div>

        <div class="filter-group filter-type">
          <label>Type</label>
          <select v-model="filterType" class="form-select" @change="onFilterChange">
            <option value="">All Types</option>
            <option value="1">MCSA (Single)</option>
            <option value="2">MCMA (Multi)</option>
            <option value="3">Text</option>
            <option value="4">Order</option>
          </select>
        </div>

        <div class="filter-group filter-search">
          <label>Search</label>
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" v-model="searchQuery" @input="debouncedSearch" placeholder="Search question text…" class="form-select search-input" />
          </div>
        </div>

        <div class="filter-group filter-narrow">
          <label>Per page</label>
          <select v-model="perPage" class="form-select" @change="onFilterChange">
            <option :value="5">5</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Status Bar -->
    <div class="status-bar" v-if="!loading">
      <span v-if="pagination.total > 0">
        Showing <strong>{{ questionsList.length }}</strong> of <strong>{{ pagination.total }}</strong> questions
        — Page <strong>{{ pagination.page }}</strong> / {{ pagination.total_pages }}
      </span>
      <span v-else>No questions found for current filters.</span>
    </div>

    <!-- Table -->
    <div class="table-container">
      <div class="loading-overlay" v-if="loading">
        <div class="spinner-ring"></div>
        <span>Loading…</span>
      </div>


      <table class="data-table" v-if="questionsList.length > 0">
        <thead>
          <tr>
            <th class="id-col">ID</th>
            <th>Type</th>
            <th>Difficulty</th>
            <th class="wide-col">Question</th>
            <th>Topic</th>
            <th>Status</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="q in questionsList" :key="q.question_id">
            <tr :class="{'editing-row': editingQuestionId === q.question_id}">
            <td class="id-cell">#{{ q.question_id }}</td>
            <td><span class="type-badge" :class="'type-' + q.question_type">{{ getTypeName(q.question_type) }}</span></td>
            <td>
              <div class="diff-dots">
                <span v-for="i in 5" :key="i" class="diff-dot" :class="{ filled: i <= q.question_difficulty }"></span>
              </div>
            </td>
            <td class="desc-cell" :title="stripHtml(q.question_description)">
              {{ formatTruncated(stripHtml(q.question_description), 90) }}
            </td>
            <td>
              <div class="topic-pill" :title="q.module_name">
                {{ formatTruncated(q.subject_name, 22) }}
              </div>
              <div class="module-name" v-if="q.module_name">{{ formatTruncated(q.module_name, 20) }}</div>
            </td>
            <td>
              <span class="status-badge" :class="q.question_enabled ? 'enabled' : 'disabled'">
                {{ q.question_enabled ? 'Active' : 'Disabled' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="act-btn edit" @click="openInlineEdit(q.question_id)" :class="{'active': editingQuestionId === q.question_id}" title="Edit Question & Answers">
                {{ editingQuestionId === q.question_id ? 'Close' : '✏️ Edit' }}
              </button>
              <button class="act-btn del" @click="promptDelete(q)" title="Delete Question" v-if="editingQuestionId !== q.question_id">🗑️</button>
            </td>
          </tr>
          </template>
        </tbody>
      </table>

      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">🗂️</div>
        <div>No questions found{{ searchQuery ? ` matching "${searchQuery}"` : ' for the selected filters' }}.</div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.total_pages > 1">
      <button class="page-btn" :disabled="pagination.page <= 1" @click="changePage(1)">«</button>
      <button class="page-btn" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">‹</button>
      <span v-for="page in visiblePages" :key="page">
        <button v-if="page !== '...'" class="page-btn" :class="{ active: page === pagination.page }" @click="changePage(page)">{{ page }}</button>
        <span v-else class="page-ellipsis">…</span>
      </span>
      <button class="page-btn" :disabled="pagination.page >= pagination.total_pages" @click="changePage(pagination.page + 1)">›</button>
      <button class="page-btn" :disabled="pagination.page >= pagination.total_pages" @click="changePage(pagination.total_pages)">»</button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal-overlay" v-if="questionToDelete" @click.self="questionToDelete = null">
      <div class="confirm-modal">
        <div class="confirm-icon">⚠️</div>
        <h3>Delete Question</h3>
        <p>Delete question <strong>#{{ questionToDelete?.question_id }}</strong>?</p>
        <p class="confirm-note" v-html="'<em>' + formatTruncated(stripHtml(questionToDelete?.question_description), 80) + '</em>'"></p>
        <p class="confirm-warning">If this question is used in a test, it will be disabled instead of deleted.</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="questionToDelete = null">Cancel</button>
          <button class="confirm-btn" :disabled="deleting" @click="executeDelete">
            {{ deleting ? 'Deleting…' : 'Yes, Delete' }}
          </button>
        </div>
      </div>
    </div>
    <transition name="drawer-slide">
      <div v-if="editingQuestionId || isCreatingNew" class="side-drawer-overlay" @click.self="closeInlineEdit">
        <div class="side-drawer">
          <QuestionInlineEditor 
            :key="editingQuestionId || 'new'"
            :isEdit="!isCreatingNew && !!editingQuestionId" 
            :questionData="activeFormData" 
            :topics="topics"
            @close="closeInlineEdit"
            @save-question="saveQuestion"
            @error="showError"
            @info="showInfo"
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import QuestionInlineEditor from '../components/QuestionInlineEditor.vue';
import { API_BASE_URL } from '../config/constant.js';

const router = useRouter();
const API = `${API_BASE_URL}/admin`;
const getToken = () => localStorage.getItem('tce_token');
const authHeader = () => ({ 'Authorization': `Bearer ${getToken()}` });

// Data
const questionsList = ref([]);
const modules = ref([]);
const topics = ref([]);

// State
const loading = ref(true);
const error = ref('');
const infoMessage = ref('');

// Filters
const filterModuleId = ref('');
const filterTopicId = ref('');
const filterType = ref('');
const searchQuery = ref('');
const perPage = ref(25);

// Pagination (server-side)
const pagination = ref({ page: 1, per_page: 25, total: 0, total_pages: 1 });

// Inline Editor State
const isCreatingNew = ref(false);
const editingQuestionId = ref(null);
const fileInput = ref(null);

const activeFormData = computed(() => {
  if (isCreatingNew.value) return null;
  return questionsList.value.find(q => q.question_id === editingQuestionId.value) || null;
});

// Delete modal
const questionToDelete = ref(null);
const deleting = ref(false);

// Debounce search
let searchTimer = null;
const debouncedSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { pagination.value.page = 1; fetchQuestions(); }, 300);
};

onMounted(() => {
  fetchDependencies();
  fetchQuestions();
});

const filteredTopics = computed(() => {
  if (!filterModuleId.value) return topics.value;
  return topics.value.filter(t => t.subject_module_id == filterModuleId.value);
});

const visiblePages = computed(() => {
  const total = pagination.value.total_pages;
  const current = pagination.value.page;
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

const onModuleChange = () => {
  filterTopicId.value = '';
  onFilterChange();
};

const onFilterChange = () => {
  pagination.value.page = 1;
  fetchQuestions();
};

const changePage = (page) => {
  if (page < 1 || page > pagination.value.total_pages) return;
  pagination.value.page = page;
  fetchQuestions();
};

const fetchDependencies = async () => {
  try {
    const headers = authHeader();
    const [modRes, topRes] = await Promise.all([
      fetch(`${API}/modules.php`, { headers }),
      fetch(`${API}/topics.php`, { headers })
    ]);
    const modData = await modRes.json();
    const topData = await topRes.json();
    if (modData.status === 'success') modules.value = modData.data || [];
    if (topData.status === 'success') topics.value = topData.data || [];
  } catch { showError('Failed to load filter options.'); }
};

const fetchQuestions = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params = new URLSearchParams({
      page: pagination.value.page,
      per_page: perPage.value
    });
    if (filterModuleId.value) params.append('module_id', filterModuleId.value);
    if (filterTopicId.value) params.append('subject_id', filterTopicId.value);
    if (filterType.value) params.append('type', filterType.value);
    if (searchQuery.value) params.append('search', searchQuery.value);

    const res = await fetch(`${API}/questions.php?${params}`, { headers: authHeader() });
    const result = await res.json();
    if (result.status === 'success') {
      questionsList.value = result.data || [];
      if (result.pagination) pagination.value = result.pagination;
    } else {
      showError(result.message || 'Failed to fetch questions');
    }
  } catch { showError('Network error fetching questions'); }
  finally { loading.value = false; }
};

const saveQuestion = async (formData) => {
  try {
    const isEditingMode = !!formData.question_id;
    const url = isEditingMode
      ? `${API}/questions.php?question_id=${formData.question_id}`
      : `${API}/questions.php`;
    const res = await fetch(url, {
      method: isEditingMode ? 'PUT' : 'POST',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const result = await res.json();
    if (result.status === 'success') {
      if (isCreatingNew.value) {
        isCreatingNew.value = false;
      } else {
        editingQuestionId.value = null;
      }
      showInfo(result.message || 'Question saved successfully!');
      fetchQuestions();
    } else {
      showError(result.message || 'Failed to save question');
    }
  } catch { showError('Network error while saving'); }
};

const promptDelete = (q) => { questionToDelete.value = q; };

const executeDelete = async () => {
  if (!questionToDelete.value) return;
  deleting.value = true;
  try {
    const res = await fetch(`${API}/questions.php?question_id=${questionToDelete.value.question_id}`, {
      method: 'DELETE', headers: authHeader()
    });
    const result = await res.json();
    if (result.status === 'success') {
      questionToDelete.value = null;
      showInfo(result.message || 'Question deleted.');
      if (questionsList.value.length === 1 && pagination.value.page > 1) pagination.value.page--;
      fetchQuestions();
    } else {
      showError(result.message || 'Failed to delete question');
      questionToDelete.value = null;
    }
  } catch { showError('Network error while deleting'); questionToDelete.value = null; }
  finally { deleting.value = false; }
};

// Import/Export CSV Logic
const exportCSV = () => {
  let url = `${API}/export_questions.php?token=${getToken()}`;
  if (filterModuleId.value) url += `&module_id=${filterModuleId.value}`;
  if (filterTopicId.value) url += `&subject_id=${filterTopicId.value}`;
  window.open(url, '_blank');
};

const triggerImport = () => {
  if (fileInput.value) fileInput.value.click();
};

const handleImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  loading.value = true;
  
  try {
    const res = await fetch(`${API}/import_questions.php`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    const result = await res.json();
    if (result.status === 'success') {
      showInfo(result.message || 'Import successful!');
      fetchQuestions();
    } else {
      showError(result.message || 'Import failed');
    }
  } catch {
    showError('Network error during import');
  } finally {
    loading.value = false;
    event.target.value = ''; // Reset input
  }
};

// Helpers
const getTypeName = (typeId) => ({ 1: 'MCSA', 2: 'MCMA', 3: 'Text', 4: 'Order' }[typeId] || `#${typeId}`);

const stripHtml = (str) => str ? str.replace(/<[^>]*>/g, '') : '';

const formatTruncated = (str, len) => {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
};

const openInlineEdit = (id) => { 
  if (editingQuestionId.value === id) {
    editingQuestionId.value = null;
  } else {
    editingQuestionId.value = id; 
    isCreatingNew.value = false;
  }
};
const closeInlineEdit = () => { editingQuestionId.value = null; isCreatingNew.value = false; };

const showError = (msg) => { error.value = msg; setTimeout(() => { error.value = ''; }, 5000); };
const showInfo = (msg) => { infoMessage.value = msg; setTimeout(() => { infoMessage.value = ''; }, 6000); };
</script>

<style scoped>
.question-management { max-width: 1350px; margin: 0 auto; }

.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.header-titles h1 { font-size: 1.8rem; color: #1e293b; font-weight: 700; margin: 0; }
.header-titles p { color: #64748b; margin: 0.2rem 0 0; font-size: 0.95rem; }

.header-actions { display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap;}
.hidden-file-input { display: none; }
.action-btn {
  background: white; border: 1px solid #e2e8f0; color: #475569;
  padding: 0.65rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;
  font-size: 0.9rem; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  display: flex; align-items: center; gap: 0.4rem;
}
.action-btn:hover { border-color: #cbd5e1; background: #f8fafc; color: #0f172a; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.export-btn { color: #0369a1; }
.import-btn { color: #15803d; }

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white; border: none; padding: 0.65rem 1.4rem; border-radius: 8px;
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(79,70,229,0.25);
  transition: transform 0.2s, box-shadow 0.2s;
}
.primary-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(79,70,229,0.35); }

/* Toast */
.toast { padding: 0.8rem 1.2rem; border-radius: 8px; margin-bottom: 1rem; font-weight: 500; }
.error-toast { background: #fee2e2; color: #b91c1c; }
.info-toast { background: #dcfce7; color: #15803d; }
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-12px); }

/* Filters */
.filters-card {
  background: white; border-radius: 12px; padding: 1.2rem 1.5rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0;
}
.filter-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 130px; }
.filter-group label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.filter-search { flex: 2; }
.filter-narrow { flex: 0 0 90px; }
.filter-type { flex: 0 0 130px; }

.form-select {
  border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.55rem 0.85rem;
  font-size: 0.9rem; background: #f8fafc; outline: none; width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); background: white; }

.search-wrap { position: relative; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; pointer-events: none; }
.search-input { padding-left: 2rem !important; }

/* Status Bar */
.status-bar { font-size: 0.85rem; color: #64748b; margin-bottom: 0.75rem; padding: 0 0.2rem; }

/* Table */
.table-container {
  background: white; border-radius: 12px; border: 1px solid #e2e8f0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05); position: relative; overflow: hidden;
}
.loading-overlay {
  position: absolute; inset: 0; background: rgba(248,250,252,0.9);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 1rem; z-index: 10; font-weight: 600; color: #3b82f6;
}
.spinner-ring {
  width: 36px; height: 36px; border: 4px solid #e2e8f0;
  border-top-color: #3b82f6; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th {
  background: #f8fafc; padding: 0.85rem 1rem;
  font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0;
}
.data-table td { padding: 0.9rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.91rem; vertical-align: middle; }
.data-table tbody tr:hover { background: #f8fafc; }

.id-col { width: 60px; }
.wide-col { min-width: 280px; }
.actions-col { width: 200px; }
.id-cell { font-weight: 600; color: #64748b; }
.desc-cell { color: #0f172a; font-weight: 500; line-height: 1.5; }

/* Type badge */
.type-badge { padding: 0.2rem 0.55rem; border-radius: 4px; font-size: 0.78rem; font-weight: 700; }
.type-1 { background: #dbeafe; color: #1e40af; }
.type-2 { background: #ede9fe; color: #4c1d95; }
.type-3 { background: #fef9c3; color: #713f12; }
.type-4 { background: #fce7f3; color: #831843; }

/* Difficulty dots */
.diff-dots { display: flex; gap: 3px; align-items: center; }
.diff-dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; }
.diff-dot.filled { background: #f59e0b; }

/* Topic pills */
.topic-pill {
  background: #e0e7ff; color: #3730a3; font-size: 0.78rem;
  padding: 0.2rem 0.55rem; border-radius: 999px; display: inline-block; font-weight: 600;
}
.module-name { font-size: 0.75rem; color: #94a3b8; margin-top: 3px; }

/* Status badge */
.status-badge { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
.status-badge.enabled { background: #dcfce7; color: #15803d; }
.status-badge.disabled { background: #fee2e2; color: #b91c1c; }

/* Action buttons */
.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.act-btn {
  padding: 0.35rem 0.7rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;
  cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap;
}
.act-btn:hover { transform: translateY(-1px); }
.act-btn.answers { background: #fef3c7; color: #b45309; }
.act-btn.answers:hover { background: #fde68a; }
.act-btn.edit { background: #e0e7ff; color: #4338ca; }
.act-btn.edit:hover { background: #c7d2fe; }
.act-btn.edit.active { background: #312e81; color: white; }
.act-btn.del { background: #fee2e2; color: #b91c1c; padding: 0.35rem 0.6rem; }
.act-btn.del:hover { background: #fecaca; }

/* Right Drawer Layout */
.side-drawer-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px);
  z-index: 2000; display: flex; justify-content: flex-end;
}

.side-drawer {
  width: 100%; max-width: 580px; height: 100%;
  background: white;
  box-shadow: -5px 0 25px rgba(0,0,0,0.1);
  overflow-y: auto;
  display: flex; flex-direction: column;
}

/* Drawer Animation */
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-slide-enter-active .side-drawer, .drawer-slide-leave-active .side-drawer { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.drawer-slide-enter-from, .drawer-slide-leave-to { opacity: 0; }
.drawer-slide-enter-from .side-drawer, .drawer-slide-leave-to .side-drawer { transform: translateX(100%); }

.editing-row { background: #f1f5f9; }

/* Empty state */
.empty-state { text-align: center; padding: 3rem 2rem; color: #94a3b8; }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

/* Pagination */
.pagination { display: flex; justify-content: center; align-items: center; gap: 0.3rem; margin-top: 1.5rem; flex-wrap: wrap; }
.page-btn {
  padding: 0.45rem 0.75rem; border: 1px solid #e2e8f0; background: white;
  border-radius: 6px; font-size: 0.88rem; font-weight: 500; cursor: pointer;
  color: #334155; transition: all 0.15s; min-width: 36px;
}
.page-btn:hover:not(:disabled) { background: #eff6ff; border-color: #3b82f6; color: #3b82f6; }
.page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; font-weight: 700; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-ellipsis { padding: 0.45rem 0.3rem; color: #94a3b8; }

/* Delete Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(2px); }
.confirm-modal { background: white; border-radius: 16px; padding: 2rem 2.5rem; max-width: 430px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: pop-in 0.2s ease; }
@keyframes pop-in { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.confirm-modal h3 { font-size: 1.2rem; color: #0f172a; margin: 0 0 0.5rem; }
.confirm-modal p { color: #475569; margin: 0.3rem 0; font-size: 0.92rem; }
.confirm-note { font-size: 0.85rem; color: #64748b; font-style: italic; }
.confirm-warning { font-size: 0.82rem; color: #b45309; background: #fef9c3; padding: 0.4rem 0.75rem; border-radius: 6px; margin-top: 0.5rem !important; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; }
.cancel-btn { padding: 0.6rem 1.4rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 600; cursor: pointer; }
.cancel-btn:hover { background: #f8fafc; }
.confirm-btn { padding: 0.6rem 1.4rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; font-weight: 700; cursor: pointer; box-shadow: 0 4px 10px rgba(239,68,68,0.3); }
.confirm-btn:hover:not(:disabled) { opacity: 0.9; }
.confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
