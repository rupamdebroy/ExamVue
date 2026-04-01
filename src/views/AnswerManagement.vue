<template>
  <div class="answer-management">
    <div class="header-section">
      <div class="header-titles">
        <div class="breadcrumbs">
           <router-link to="/admin/questions">&larr; Back to Questions</router-link>
        </div>
        <h1>Manage Options</h1>
        <p v-if="questionData">
            For Question #{{ questionId }}: <strong>{{ formatTruncated(questionData.question_description, 100) }}</strong>
        </p>
        <p v-else>Loading question context...</p>
      </div>
      <button class="primary-btn" @click="openCreateModal" :disabled="!questionData">
        <span class="icon">+</span> Add New Option
      </button>
    </div>
    
    <div class="messages">
      <div class="error" v-if="error">{{ error }}</div>
      <div class="info" v-if="infoMessage">{{ infoMessage }}</div>
    </div>

    <!-- Data Table -->
    <div class="table-container">
      <div class="loading-overlay" v-if="loading">
        <div class="spinner">Loading Options...</div>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Is Correct?</th>
            <th class="wide-col">Option Text</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in answersList" :key="a.answer_id" :class="{'correct-row': a.answer_isright}">
            <td>{{ a.answer_position }}</td>
            <td>
                <span v-if="a.answer_isright" class="correct-badge">âœ“ Correct</span>
                <span v-else class="wrong-badge">âœ— Wrong</span>
            </td>
            <td class="desc-cell" :title="a.answer_description">
                {{ formatTruncated(a.answer_description, 150) }}
            </td>
            <td>
              <span class="status-badge" :class="a.answer_enabled ? 'enabled' : 'disabled'">
                {{ a.answer_enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </td>
            <td class="actions-cell">
              <button class="edit-btn" @click="openEditModal(a)">Edit</button>
              <button class="delete-btn" @click="confirmDelete(a)">Delete</button>
            </td>
          </tr>
          <tr v-if="!loading && answersList.length === 0">
            <td colspan="5" class="empty-state">No options found for this question. Add some choices!</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Modal -->
    <AnswerFormModal 
      v-if="isModalOpen" 
      :isEdit="isEditing" 
      :answerData="selectedAnswer"
      :questionId="questionId"
      @close="closeModal" 
      @save="saveAnswer"
      @error="showError"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AnswerFormModal from '../components/AnswerFormModal.vue';
import { API_ENDPOINTS } from '../config/constant.js';

const route = useRoute();
const router = useRouter();
const questionId = ref(route.params.questionId);

const questionData = ref(null);
const answersList = ref([]);

const loading = ref(true);
const error = ref('');
const infoMessage = ref('');

// Modal State
const isModalOpen = ref(false);
const isEditing = ref(false);
const selectedAnswer = ref(null);

onMounted(() => {
  if (!questionId.value) {
      router.push('/admin/questions');
      return;
  }
  fetchQuestionContext();
  fetchAnswers();
});

const fetchQuestionContext = async () => {
    try {
        const token = localStorage.getItem('tce_token');
        const response = await fetch(`${API_ENDPOINTS.ADMIN_QUESTIONS}?question_id=${questionId.value}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.status === 'success') {
            questionData.value = result.data;
        } else {
            showError("Could not load parent question context.");
        }
    } catch(err) {
        showError("Network error loading context.");
    }
};

const fetchAnswers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const token = localStorage.getItem('tce_token');
    
    const response = await fetch(`${API_ENDPOINTS.ADMIN_ANSWERS}?question_id=${questionId.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    if (result.status === 'success') {
      answersList.value = result.data || [];
    } else {
      error.value = result.message || 'Failed to fetch answers';
    }
  } catch (err) {
    error.value = 'Network error fetching data';
  } finally {
    loading.value = false;
  }
};

const saveAnswer = async (formData) => {
  try {
    const token = localStorage.getItem('tce_token');
    const url = isEditing.value 
      ? `${API_ENDPOINTS.ADMIN_ANSWERS}?answer_id=${selectedAnswer.value.answer_id}` 
      : `${API_ENDPOINTS.ADMIN_ANSWERS}`;
      
    const method = isEditing.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      closeModal();
      if (result.restricted) {
          showInfo(result.message);
      } else {
          showInfo("Option saved successfully!");
      }
      fetchAnswers();
    } else {
      showError(result.message || 'Failed to save option');
    }
  } catch (err) {
    showError('Network error while saving');
  }
};

const confirmDelete = async (answer) => {
  if (confirm(`Are you sure you want to delete this option?`)) {
    try {
      const token = localStorage.getItem('tce_token');
      const response = await fetch(`${API_ENDPOINTS.ADMIN_ANSWERS}?answer_id=${answer.answer_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        if (result.action_taken === 'disabled') {
            showInfo(result.message);
        } else {
            showInfo("Option deleted.");
        }
        fetchAnswers();
      } else {
        showError(result.message || 'Failed to delete option');
      }
    } catch (err) {
      showError('Network error while deleting');
    }
  }
};

// Helpers
const formatTruncated = (str, len) => {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
};

// View Management
const openCreateModal = () => {
  isEditing.value = false;
  selectedAnswer.value = null;
  isModalOpen.value = true;
};

const openEditModal = (a) => {
  isEditing.value = true;
  selectedAnswer.value = { ...a };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedAnswer.value = null;
};

const showError = (msg) => { error.value = msg; setTimeout(() => { error.value = ''; }, 5000); };
const showInfo = (msg) => { infoMessage.value = msg; setTimeout(() => { infoMessage.value = ''; }, 6000); };
</script>

<style scoped>
.answer-management {
  /* padding removed for layout */ max-width: 1000px; margin: 0 auto;
}

.breadcrumbs { margin-bottom: 0.5rem; }
.breadcrumbs a { color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 0.9rem;}
.breadcrumbs a:hover { text-decoration: underline; }

.header-section {
  display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;
}

.header-titles h1 { font-size: 1.8rem; color: #1e293b; font-weight: 700; margin: 0 0 0.5rem 0; }
.header-titles p { color: #475569; margin: 0; font-size: 0.95rem; }
.header-titles strong { color: #0f172a; }

.primary-btn {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); color: white;
  border: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); transition: transform 0.2s;
}
.primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35); }
.primary-btn:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; opacity: 0.7;}

/* Table */
.table-container {
  background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  position: relative; overflow-x: auto;
}

.loading-overlay {
  position: absolute; top:0; left:0; width:100%; height:100%; background:rgba(255,255,255,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.spinner { color: #3b82f6; font-weight: bold; }

.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th {
  background-color: #f8fafc; padding: 1rem; font-weight: 600; color: #475569;
  font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0;
}
.data-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.95rem; }
.data-table tbody tr:hover { background-color: #f8fafc; }
.data-table tbody tr.correct-row { background-color: #f0fdf4; border-left: 3px solid #22c55e;}
.data-table tbody tr.correct-row:hover { background-color: #dcfce3; }

.wide-col { min-width: 300px; }
.desc-cell { color: #0f172a; font-weight: 500; line-height: 1.4; }

.correct-badge { color: #16a34a; font-weight: 700; font-size: 0.85rem;}
.wrong-badge { color: #94a3b8; font-weight: 500; font-size: 0.85rem;}

.status-badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
.status-badge.enabled { background: #dcfce3; color: #166534; }
.status-badge.disabled { background: #fee2e2; color: #b91c1c; }


/* Actions */
.actions-cell { display: flex; gap: 0.5rem; }
.edit-btn, .delete-btn {
  padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; border: none; transition: background 0.2s;
}
.edit-btn { background: #e0e7ff; color: #4338ca; }
.edit-btn:hover { background: #c7d2fe; }
.delete-btn { background: #fee2e2; color: #b91c1c; }
.delete-btn:hover { background: #fecaca; }

.empty-state { text-align: center; padding: 3rem; color: #64748b; font-style: italic; }

.messages { margin-bottom: 1rem; }
.error { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; text-align: center; }
.info { background: #e0f2fe; color: #0369a1; padding: 1rem; border-radius: 8px; text-align: center; font-weight: 500; border-left: 4px solid #0ea5e9; }
</style>

