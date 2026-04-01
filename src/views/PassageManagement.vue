<template>
  <div class="passage-management">
    <div class="header-section">
      <div class="header-titles">
        <h1>ðŸ“– Passage Management</h1>
        <p>Create and manage reading passages for comprehension-style questions</p>
      </div>
      <button class="primary-btn" @click="openCreate">+ New Passage</button>
    </div>

    <!-- Toasts (fixed overlay) -->
    <teleport to="body">
      <transition name="toast-slide">
        <div class="toast error-toast" v-if="error">âš ï¸ {{ error }}</div>
      </transition>
      <transition name="toast-slide">
        <div class="toast info-toast" v-if="info">âœ… {{ info }}</div>
      </transition>
    </teleport>

    <!-- Filters -->
    <div class="filters-card">
      <div class="filter-row">
        <div class="filter-group">
          <label>Module</label>
          <select class="form-select" v-model="filterModule" @change="filterSubject = ''; fetchPassages()">
            <option value="">All Modules</option>
            <option v-for="m in modules" :key="m.module_id" :value="m.module_id">{{ m.module_name }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Topic</label>
          <select class="form-select" v-model="filterSubject" :disabled="!filterModule" @change="fetchPassages">
            <option value="">All Topics</option>
            <option v-for="t in filteredTopics" :key="t.subject_id" :value="t.subject_id">{{ t.subject_name }}</option>
          </select>
        </div>
        <div class="filter-group search-group">
          <label>Search</label>
          <input class="form-select" v-model="searchQuery" placeholder="Search passage titlesâ€¦" />
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="table-container">
      <div class="loading-overlay" v-if="loading">
        <div class="spinner-ring"></div> Loadingâ€¦
      </div>
      <table class="data-table" v-if="filteredPassages.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th class="wide-col">Passage Title</th>
            <th>Module / Topic</th>
            <th class="center">Questions</th>
            <th class="center">Updated</th>
            <th class="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredPassages" :key="p.passage_id">
            <td class="id-cell">#{{ p.passage_id }}</td>
            <td>
              <div class="passage-title">{{ p.passage_title }}</div>
              <div class="passage-preview">{{ truncate(p.passage_text, 100) }}</div>
            </td>
            <td>
              <div class="topic-pill" v-if="p.subject_name">{{ p.subject_name }}</div>
              <div class="module-name" v-if="p.module_name">{{ p.module_name }}</div>
              <span class="muted" v-else>â€”</span>
            </td>
            <td class="center">
              <span class="q-count" :class="{ none: p.question_count === 0 }">{{ p.question_count }}</span>
            </td>
            <td class="center muted-sm">{{ formatDate(p.passage_updated_at) }}</td>
            <td class="actions-cell">
              <button class="act-btn view" @click="previewPassage(p)">ðŸ‘ View</button>
              <button class="act-btn edit" @click="openEdit(p)">âœï¸ Edit</button>
              <button class="act-btn del" @click="promptDelete(p)" :disabled="p.question_count > 0" :title="p.question_count > 0 ? 'Unlink questions first' : 'Delete passage'">ðŸ—‘ï¸</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon">ðŸ“„</div>
        <div>No passages found. Click <strong>+ New Passage</strong> to create one.</div>
      </div>
    </div>

    <!-- Passage Create/Edit Modal -->
    <div class="modal-overlay" v-if="showFormModal" @click.self="showFormModal = false">
      <div class="form-modal">
        <div class="modal-header">
          <h3>{{ editingPassage ? 'Edit Passage' : 'Create New Passage' }}</h3>
          <button class="close-btn" @click="showFormModal = false">âœ•</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Module (optional)</label>
            <select class="form-select" v-model="form.passage_module_id" @change="form.passage_subject_id = ''">
              <option value="">â€” None â€”</option>
              <option v-for="m in modules" :key="m.module_id" :value="m.module_id">{{ m.module_name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Topic (optional)</label>
            <select class="form-select" v-model="form.passage_subject_id" :disabled="!form.passage_module_id">
              <option value="">â€” None â€”</option>
              <option v-for="t in formTopics" :key="t.subject_id" :value="t.subject_id">{{ t.subject_name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Passage Title <span class="req">*</span></label>
            <input class="form-select" v-model="form.passage_title" placeholder="e.g. The Industrial Revolution" />
          </div>
          <div class="form-group">
            <label>Passage Text <span class="req">*</span></label>
            <textarea class="form-select passage-textarea" v-model="form.passage_text" rows="12" placeholder="Paste or type your reading passage hereâ€¦"></textarea>
            <small class="char-count">{{ form.passage_text.length }} characters</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showFormModal = false">Cancel</button>
          <button class="save-btn" :disabled="saving || !form.passage_title.trim() || !form.passage_text.trim()" @click="savePassage">
            {{ saving ? 'Savingâ€¦' : editingPassage ? 'Update Passage' : 'Create Passage' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div class="modal-overlay" v-if="previewPassageData" @click.self="previewPassageData = null">
      <div class="preview-modal">
        <div class="modal-header">
          <h3>{{ previewPassageData.passage_title }}</h3>
          <button class="close-btn" @click="previewPassageData = null">âœ•</button>
        </div>
        <div class="preview-body">
          <div class="passage-text-content">{{ previewPassageData.passage_text }}</div>
          <div class="preview-meta">
            <span v-if="previewPassageData.subject_name">ðŸ“ {{ previewPassageData.subject_name }}</span>
            <span>ðŸ“ {{ previewPassageData.question_count }} questions linked</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div class="modal-overlay" v-if="passageToDelete" @click.self="passageToDelete = null">
      <div class="confirm-modal">
        <div class="confirm-icon">ðŸ—‘ï¸</div>
        <h3>Delete Passage</h3>
        <p>Delete <strong>"{{ passageToDelete.passage_title }}"</strong>?</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="passageToDelete = null">Cancel</button>
          <button class="confirm-btn" :disabled="deleting" @click="executeDelete">{{ deleting ? 'Deletingâ€¦' : 'Yes, Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { API_ENDPOINTS } from '../config/constant.js';


const getToken = () => localStorage.getItem('tce_token');
const authH = () => ({ 'Authorization': `Bearer ${getToken()}` });

const passages = ref([]);
const modules  = ref([]);
const topics   = ref([]);
const loading  = ref(false);
const saving   = ref(false);
const deleting = ref(false);
const error = ref(''); const info = ref('');

const filterModule  = ref('');
const filterSubject = ref('');
const searchQuery   = ref('');

const showFormModal   = ref(false);
const editingPassage  = ref(null);
const previewPassageData = ref(null);
const passageToDelete = ref(null);

const form = ref({ passage_title: '', passage_text: '', passage_module_id: '', passage_subject_id: '' });

const filteredTopics = computed(() => !filterModule.value ? topics.value : topics.value.filter(t => t.subject_module_id == filterModule.value));
const formTopics     = computed(() => !form.value.passage_module_id ? [] : topics.value.filter(t => t.subject_module_id == form.value.passage_module_id));

const filteredPassages = computed(() => {
  let list = passages.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(p => p.passage_title.toLowerCase().includes(q));
  }
  return list;
});

onMounted(async () => {
  await loadDeps();
  await fetchPassages();
});

const loadDeps = async () => {
  const [mRes, tRes] = await Promise.all([
    fetch(`${API_ENDPOINTS.ADMIN_MODULES}`, { headers: authH() }),
    fetch(`${API_ENDPOINTS.ADMIN_TOPICS}`,  { headers: authH() })
  ]);
  const mD = await mRes.json(); const tD = await tRes.json();
  if (mD.status === 'success') modules.value = mD.data;
  if (tD.status === 'success') topics.value  = tD.data;
};

const fetchPassages = async () => {
  loading.value = true;
  const params = new URLSearchParams();
  if (filterModule.value)  params.set('module_id',  filterModule.value);
  if (filterSubject.value) params.set('subject_id', filterSubject.value);
  const res  = await fetch(`${API_ENDPOINTS.ADMIN_PASSAGES}?${params}`, { headers: authH() });
  const data = await res.json();
  if (data.status === 'success') passages.value = data.data;
  loading.value = false;
};

const openCreate = () => {
  editingPassage.value = null;
  form.value = { passage_title: '', passage_text: '', passage_module_id: filterModule.value || '', passage_subject_id: filterSubject.value || '' };
  showFormModal.value = true;
};

const openEdit = (p) => {
  editingPassage.value = p;
  form.value = { passage_title: p.passage_title, passage_text: p.passage_text, passage_module_id: p.passage_module_id || '', passage_subject_id: p.passage_subject_id || '' };
  showFormModal.value = true;
};

const savePassage = async () => {
  saving.value = true;
  const body = { ...form.value };
  let url = `${API_ENDPOINTS.ADMIN_PASSAGES}`;
  let method = 'POST';
  if (editingPassage.value) { url += `?passage_id=${editingPassage.value.passage_id}`; method = 'PUT'; }
  const res  = await fetch(url, { method, headers: { ...authH(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  saving.value = false;
  if (data.status === 'success') {
    showFormModal.value = false;
    showInfo(data.message);
    fetchPassages();
  } else showError(data.message);
};

const previewPassage = (p) => { previewPassageData.value = p; };
const promptDelete   = (p) => { passageToDelete.value = p; };

const executeDelete = async () => {
  deleting.value = true;
  const res  = await fetch(`${API_ENDPOINTS.ADMIN_PASSAGES}?passage_id=${passageToDelete.value.passage_id}`, { method: 'DELETE', headers: authH() });
  const data = await res.json();
  deleting.value = false;
  passageToDelete.value = null;
  if (data.status === 'success') { showInfo(data.message); fetchPassages(); }
  else showError(data.message);
};

const truncate   = (s, n) => s && s.length > n ? s.slice(0, n) + 'â€¦' : (s || '');
const formatDate = (d)    => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'â€”';
const showError  = (m)    => { error.value = m; setTimeout(() => error.value = '', 5000); };
const showInfo   = (m)    => { info.value  = m; setTimeout(() => info.value  = '', 6000); };
</script>

<style scoped>
.passage-management { max-width: 1250px; margin: 0 auto; }

.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.header-titles h1 { font-size: 1.8rem; color: #1e293b; font-weight: 700; margin: 0; }
.header-titles p { color: #64748b; margin: 0.2rem 0 0; }

.primary-btn {
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: white; border: none; padding: 0.65rem 1.4rem; border-radius: 8px;
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(124,58,237,0.25); transition: transform 0.2s;
}
.primary-btn:hover { transform: translateY(-2px); }

/* Toast (fixed overlay) */
.toast {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  z-index: 9999;
  padding: 0.85rem 1.4rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.92rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  max-width: 420px;
  pointer-events: none;
}
.error-toast { background: #fee2e2; color: #b91c1c; border-left: 4px solid #b91c1c; }
.info-toast  { background: #dcfce7; color: #15803d; border-left: 4px solid #22c55e; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(60px); }

/* Filters */
.filters-card { background: white; border-radius: 12px; padding: 1.2rem 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
.filter-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
.filter-group { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 140px; }
.search-group { flex: 2; }
.filter-group label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.form-select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.55rem 0.85rem; font-size: 0.9rem; background: #f8fafc; outline: none; width: 100%; transition: border-color 0.2s; }
.form-select:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: white; }

/* Table */
.table-container { background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; position: relative; }
.loading-overlay { position: absolute; inset: 0; background: rgba(248,250,252,0.9); display: flex; align-items: center; justify-content: center; gap: 1rem; z-index: 10; font-weight: 600; color: #7c3aed; }
.spinner-ring { width: 30px; height: 30px; border: 4px solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #f8fafc; padding: 0.85rem 1rem; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; text-align: left; }
.data-table td { padding: 0.9rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: top; }
.data-table tbody tr:hover { background: #faf5ff; }
.wide-col { min-width: 280px; } .actions-col { width: 180px; } .center { text-align: center; }

.id-cell { color: #94a3b8; font-weight: 600; vertical-align: middle; }
.passage-title { font-weight: 600; color: #0f172a; margin-bottom: 3px; }
.passage-preview { font-size: 0.82rem; color: #94a3b8; line-height: 1.4; }
.topic-pill { background: #ede9fe; color: #4c1d95; font-size: 0.78rem; padding: 0.2rem 0.55rem; border-radius: 999px; display: inline-block; font-weight: 600; }
.module-name { font-size: 0.75rem; color: #94a3b8; margin-top: 3px; }
.muted { color: #94a3b8; font-size: 0.9rem; }
.muted-sm { font-size: 0.82rem; color: #94a3b8; vertical-align: middle; }
.q-count { background: #e0e7ff; color: #3730a3; padding: 0.2rem 0.6rem; border-radius: 999px; font-weight: 700; font-size: 0.82rem; }
.q-count.none { background: #f1f5f9; color: #94a3b8; }

.actions-cell { display: flex; gap: 0.4rem; flex-wrap: wrap; vertical-align: middle; }
.act-btn { padding: 0.35rem 0.7rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap; }
.act-btn.view { background: #e0e7ff; color: #3730a3; }
.act-btn.view:hover { background: #c7d2fe; }
.act-btn.edit { background: #dcfce7; color: #15803d; }
.act-btn.edit:hover { background: #bbf7d0; }
.act-btn.del { background: #fee2e2; color: #b91c1c; }
.act-btn.del:hover:not(:disabled) { background: #fecaca; }
.act-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.empty-state { text-align: center; padding: 3rem; color: #94a3b8; }
.empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

/* Modals shared */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(2px); }
.modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
.modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
.close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #64748b; padding: 2px 6px; border-radius: 4px; }
.close-btn:hover { background: #e2e8f0; }
.modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.75rem; background: #f8fafc; }

/* Form modal */
.form-modal { background: white; border-radius: 14px; width: 90%; max-width: 680px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: pop-in 0.2s ease; }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.form-group { margin-bottom: 1.2rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }
.req { color: #ef4444; }
.passage-textarea { min-height: 220px; resize: vertical; font-family: inherit; line-height: 1.6; }
.char-count { font-size: 0.78rem; color: #94a3b8; display: block; margin-top: 4px; text-align: right; }

/* Preview modal */
.preview-modal { background: white; border-radius: 14px; width: 90%; max-width: 720px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.preview-body { padding: 1.5rem; overflow-y: auto; }
.passage-text-content { white-space: pre-wrap; line-height: 1.8; color: #334155; font-size: 0.95rem; background: #f8fafc; padding: 1.2rem; border-radius: 8px; border-left: 4px solid #7c3aed; }
.preview-meta { display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.85rem; color: #64748b; }

/* Confirm modal */
.confirm-modal { background: white; border-radius: 16px; padding: 2rem 2.5rem; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: pop-in 0.2s ease; }
.confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.confirm-modal h3 { font-size: 1.1rem; margin: 0 0 0.5rem; }
.confirm-modal p { color: #475569; font-size: 0.92rem; }
.confirm-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.5rem; }

@keyframes pop-in { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.cancel-btn { padding: 0.6rem 1.4rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #475569; font-weight: 600; cursor: pointer; }
.save-btn   { padding: 0.6rem 1.4rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; font-weight: 700; cursor: pointer; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.confirm-btn { padding: 0.6rem 1.4rem; border-radius: 8px; border: none; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; font-weight: 700; cursor: pointer; }
.confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>

