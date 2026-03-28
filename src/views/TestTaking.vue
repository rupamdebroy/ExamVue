<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '../config/constant.js'

const router = useRouter()
const route = useRoute()

const test_id = parseInt(route.params.id)
const token = localStorage.getItem('tce_token')
const userStr = localStorage.getItem('tce_user')
const userData = userStr ? JSON.parse(userStr) : {}

// State
const phase = ref('loading')   // loading | password | taking | submitting | error
const errorMsg = ref('')
const testMeta = ref(null)
const testuser_id = ref(null)

// Screen & Panel state
const isFullScreen = ref(false)
const isPanelClosed = ref(false)
const showMobilePanel = ref(false)
const showSubmitModal = ref(false)

// Question state
const currentQ = ref(null)
const selectedAnswers = ref([])
const answerText = ref('')
const isSaving = ref(false)
const questionLoading = ref(false)
const passageExpanded = ref(true)  // show passage by default when entering a passage question

// Palette state
const palette = ref([])

// Timer
const timeRemaining = ref(0)
let timerInterval = null

// Password state
const passwordInput = ref('')
const passwordError = ref('')

// Proctoring state
const warnings = ref(0)
const showWarningModal = ref(false)
const maxWarnings = 3

const API = API_BASE_URL

function authHeaders() {
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ─── Timer ────────────────────────────────────────────────
function startTimer(seconds) {
  timeRemaining.value = seconds
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    timeRemaining.value--
    if (timeRemaining.value <= 0) {
      clearInterval(timerInterval)
      autoSubmit()
    }
  }, 1000)
}

const formattedTime = computed(() => {
  const t = Math.max(0, timeRemaining.value)
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
  return `00 : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`
})

const timerUrgent = computed(() => timeRemaining.value <= 60 && timeRemaining.value > 0)

// ─── Fullscreen Toggle ──────────────────────────────────────
async function toggleFullScreen() {
  if (!document.fullscreenElement) {
    try {
      await document.documentElement.requestFullscreen()
      isFullScreen.value = true
    } catch(err) {
      console.warn("Fullscreen request denied", err)
    }
  } else {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
      isFullScreen.value = false
    }
  }
}

// ─── Start / Resume ────────────────────────────────────────
async function startTest(password = '') {
  phase.value = 'loading'
  try {
    const isRepeating = route.query.repeat === 'true'
    const res = await fetch(`${API}/test_start.php`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ test_id, password, repeat: isRepeating })
    })
    const data = await res.json()

    if (data.requires_password) {
      phase.value = 'password'
      return
    }
    if (data.status !== 'success') {
      errorMsg.value = data.message || 'Failed to start test'
      phase.value = 'error'
      return
    }
    if (data.test_status >= 4) {
      router.replace(`/results/${data.testuser_id}`)
      return
    }

    testMeta.value = data
    testuser_id.value = data.testuser_id
    startTimer(data.time_remaining_seconds)
    
    // Fetch palette
    await loadPalette()
    
    phase.value = 'taking'
    await loadQuestion()
  } catch (e) {
    errorMsg.value = 'Network error. Please try again.'
    phase.value = 'error'
  }
}

async function submitPassword() {
  passwordError.value = ''
  if (!passwordInput.value.trim()) {
    passwordError.value = 'Please enter the test password.'
    return
  }
  await startTest(passwordInput.value.trim())
  if (phase.value === 'password') {
    passwordError.value = 'Incorrect password. Please try again.'
  }
}

// ─── Palette Loading & Stats ───────────────────────────────
async function loadPalette() {
  try {
    const res = await fetch(`${API}/test_palette.php?testuser_id=${testuser_id.value}`, { headers: authHeaders() })
    const data = await res.json()
    if (data.status === 'success') {
      palette.value = data.palette
    }
  } catch(e) {
    console.warn("Failed to load palette", e)
  }
}

const stats = computed(() => {
  let answered = 0, not_answered = 0, not_visited = 0, marked = 0, marked_answered = 0;
  palette.value.forEach(p => {
    if (p.status === 'not_visited') not_visited++;
    else if (p.marked) {
      if (p.status === 'answered') marked_answered++;
      else marked++;
    } else {
      if (p.status === 'answered') answered++;
      else not_answered++;
    }
  });
  return { answered, not_answered, not_visited, marked, marked_answered };
})

function getPaletteClass(p) {
  let cls = [];
  if (currentQ.value && currentQ.value.question_num === p.question_num) cls.push('active');
  if (p.status === 'not_visited') cls.push('not-visited');
  else if (p.marked) {
     cls.push(p.status === 'answered' ? 'marked-answered' : 'marked');
  } else {
     cls.push(p.status === 'answered' ? 'answered' : 'not-answered');
  }
  return cls.join(' ');
}

// ─── Load Question ──────────────────────────────────────────
async function loadQuestion(questionNum = 0) {
  questionLoading.value = true
  try {
    const url = `${API}/test_question.php?testuser_id=${testuser_id.value}` +
                (questionNum > 0 ? `&question_num=${questionNum}` : '')
    const res = await fetch(url, { headers: authHeaders() })
    const data = await res.json()

    if (data.all_answered) {
      if (questionNum === 0) {
         await loadQuestion(1);
         return;
      }
    }
    if (data.status !== 'success') {
      errorMsg.value = data.message || 'Failed to load question'
      phase.value = 'error'
      return
    }
    currentQ.value = data
    selectedAnswers.value = [...(data.current_selection || [])]
    answerText.value = data.answer_text || ''
    
    const pItem = palette.value.find(p => p.question_num === currentQ.value.question_num);
    if (pItem && pItem.status === 'not_visited') {
       pItem.status = 'not_answered';
    }

    if (Math.abs(data.time_remaining_seconds - timeRemaining.value) > 5) {
      timeRemaining.value = data.time_remaining_seconds
    }
    showMobilePanel.value = false;
  } catch (e) {
    errorMsg.value = 'Network error loading question.'
    phase.value = 'error'
  } finally {
    questionLoading.value = false
  }
}

// ─── Answer Helpers ────────────────────────────────────────
function toggleMCSA(answerId) {
  selectedAnswers.value = [answerId]
}

function toggleMCMA(answerId) {
  const idx = selectedAnswers.value.indexOf(answerId)
  if (idx === -1) selectedAnswers.value.push(answerId)
  else selectedAnswers.value.splice(idx, 1)
}

function clearResponse() {
  selectedAnswers.value = []
  answerText.value = ""
}

// ─── Save + Navigate ────────────────────────────────────────
async function saveCurrentAnswer(isMarked = false) {
  if (!currentQ.value) return
  
  const pItem = palette.value.find(p => p.question_num === currentQ.value.question_num);
  const isAnswered = selectedAnswers.value.length > 0 || answerText.value.trim().length > 0;
  
  if (pItem) {
     pItem.status = isAnswered ? 'answered' : 'not_answered';
     pItem.marked = isMarked;
  }

  await fetch(`${API}/test_answer.php`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      testlog_id: currentQ.value.testlog_id,
      selected_answers: selectedAnswers.value,
      answer_text: answerText.value,
      marked: isMarked
    })
  })
}

async function markAndNext() {
  if (!currentQ.value || isSaving.value) return
  isSaving.value = true
  try {
    await saveCurrentAnswer(true)
    await goToNextOrFirst()
  } finally {
    isSaving.value = false
  }
}

async function saveAndNext() {
  if (!currentQ.value || isSaving.value) return
  isSaving.value = true
  try {
    await saveCurrentAnswer(false)
    await goToNextOrFirst()
  } finally {
    isSaving.value = false
  }
}

async function goToNextOrFirst() {
    const nextNum = currentQ.value.question_num + 1
    if (nextNum > currentQ.value.total_questions) {
      await loadQuestion(1)
    } else {
      await loadQuestion(nextNum)
    }
}

async function goToQuestion(num) {
  if (!currentQ.value || isSaving.value || num === currentQ.value.question_num) return
  isSaving.value = true
  try {
    const currentPItem = palette.value.find(p => p.question_num === currentQ.value.question_num);
    const markedState = currentPItem ? currentPItem.marked : false;
    await saveCurrentAnswer(markedState)
    await loadQuestion(num)
  } finally {
    isSaving.value = false
  }
}

// ─── Submit / End ──────────────────────────────────────────
async function confirmSubmit() {
  showSubmitModal.value = true;
}

async function submitTest() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const currentPItem = palette.value.find(p => p.question_num === currentQ.value.question_num);
    await saveCurrentAnswer(currentPItem ? currentPItem.marked : false)
    phase.value = 'submitting'
    await finish()
  } finally {
    isSaving.value = false
  }
}

async function autoSubmit() {
  phase.value = 'submitting'
  await finish()
}

async function finish() {
  try {
    await fetch(`${API}/test_end.php`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ testuser_id: testuser_id.value })
    })
    if (document.fullscreenElement) await document.exitFullscreen();
    router.replace(`/results/${testuser_id.value}`)
  } catch (e) {
    errorMsg.value = 'Failed to submit test. Please try again.'
    phase.value = 'error'
  }
}

// ─── Proctoring / Anti-Cheat ──────────────────────────────
function handleVisibilityChange() {
  if (phase.value !== 'taking') return
  if (document.visibilityState === 'hidden') {
     warnings.value++
     if (warnings.value >= maxWarnings) {
       alert("Maximum warnings exceeded. Your test has been automatically submitted.")
       autoSubmit()
     } else {
       showWarningModal.value = true
     }
  }
}

onMounted(() => {
  if (!token) { router.replace('/login'); return }
  startTest()
  document.addEventListener('fullscreenchange', () => {
     isFullScreen.value = !!document.fullscreenElement;
  });
  document.addEventListener('visibilitychange', handleVisibilityChange);
})
onUnmounted(() => {
  clearInterval(timerInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange);
})
</script>

<template>
  <div class="exam-wrapper" :class="{ 'fullscreen-mode': isFullScreen }" @contextmenu.prevent @copy.prevent @paste.prevent>

    <!-- Loading / Progress Screens -->
    <div v-if="phase === 'loading'" class="center-screen">
      <div class="spinner lg"></div>
      <p>Preparing your test portal…</p>
    </div>
    <div v-else-if="phase === 'submitting'" class="center-screen">
      <div class="spinner lg"></div>
      <p>Submitting your test securely…</p>
    </div>
    <div v-else-if="phase === 'error' || phase === 'password'" class="center-screen">
      <div class="info-card">
        <div class="card-icon">{{ phase === 'password' ? '🔒' : '⚠️' }}</div>
        <h2>{{ phase === 'password' ? 'Password Required' : 'Something went wrong' }}</h2>
        <p v-if="phase === 'error'">{{ errorMsg }}</p>
        <p v-else>This test is protected by an instructor password.</p>
        
        <form v-if="phase === 'password'" @submit.prevent="submitPassword" class="password-form">
          <input v-model="passwordInput" type="password" placeholder="Enter test password" class="form-input" autofocus />
          <p v-if="passwordError" class="field-error">{{ passwordError }}</p>
          <button type="submit" class="btn-cyan w-full mt-4">Unlock Test</button>
        </form>
        <button v-if="phase === 'error' || phase === 'password'" class="btn-ghost" @click="router.push('/dashboard')">Back to Dashboard</button>
      </div>
    </div>

    <!-- Test Taking Layout -->
    <div v-else-if="phase === 'taking'" class="exam-layout">
      
      <!-- TOP HEADER -->
      <header class="exam-header">
        <div class="exam-title">
          <span>{{ testMeta?.test_name || 'UPSC CSE: Current Affairs' }}</span>
        </div>
        <div class="header-right">
          <div class="exam-timer" :class="{ urgent: timerUrgent }">
            Time Left <div class="time-box">{{ formattedTime }}</div>
          </div>
          <button class="btn-fullscreen hidden sm:inline-block" @click="toggleFullScreen">
            {{ isFullScreen ? 'Exit Full Screen' : 'Switch Full Screen' }}
          </button>
          <!-- Mobile Hamburger -->
          <button class="mobile-menu-btn sm:hidden" @click="showMobilePanel = !showMobilePanel">☰</button>
        </div>
      </header>

      <!-- SUB HEADER -->
      <div class="exam-subheader">
        <div class="tabs">
          <span class="tab-label">SECTIONS |</span>
          <button class="tab-btn active">Test</button>
        </div>
      </div>

      <!-- MAIN BODY -->
      <div class="exam-body-container">
        
        <!-- LEFT CONTENT -->
        <main class="main-content">
          <div class="content-scroll" v-if="!questionLoading && currentQ">
            <!-- Question Meta Bar -->
            <div class="q-header-bar">
              <span class="q-number">Question No. {{ currentQ.question_num }}</span>
              <div class="q-meta">
                <div class="marks-block">
                  <span class="meta-label">Marks</span>
                  <span class="mark positive">+2</span>
                  <span class="mark negative">-0.5</span>
                </div>
                <div class="time-block hidden sm:flex">
                  <span class="meta-label">Time</span>
                  <span class="meta-val">00:00</span>
                </div>
                <div class="lang-block hidden sm:flex">
                  <span class="meta-val">View in: <select class="lang-select"><option>English</option></select></span>
                </div>
                <button class="btn-report" title="Report Error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="inherit" class="inline"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg> Report
                </button>
              </div>
            </div>
            
            <div class="horizontal-divider"></div>
            
            <!-- Reading Passage Panel (shown when question is linked to a passage) -->
            <div class="passage-panel" v-if="currentQ.passage_id">
              <div class="passage-header" @click="passageExpanded = !passageExpanded">
                <div class="passage-header-left">
                  <span class="passage-icon">📖</span>
                  <span class="passage-title-text">{{ currentQ.passage_title || 'Reading Passage' }}</span>
                  <span class="passage-tag">Comprehension</span>
                </div>
                <button class="passage-toggle">{{ passageExpanded ? '▲ Hide' : '▼ Read Passage' }}</button>
              </div>
              <div class="passage-body" v-show="passageExpanded">
                <div class="passage-text">{{ currentQ.passage_text }}</div>
              </div>
            </div>

            <!-- Question Content Region -->
            <div class="q-content-box">
              <div class="q-text" v-html="currentQ.question_text"></div>
              
              <!-- MCSA (Radio) -->
              <div class="q-options" v-if="currentQ.question_type === 'mcsa'">
                <label v-for="ans in currentQ.answers" :key="ans.id" class="option-row">
                  <input type="radio" :value="ans.id" :checked="selectedAnswers.includes(ans.id)" @change="toggleMCSA(ans.id)" />
                  <span class="opt-text" v-html="ans.description"></span>
                </label>
              </div>
              
              <!-- MCMA (Checkbox) -->
              <div class="q-options" v-else-if="currentQ.question_type === 'mcma'">
                <label v-for="ans in currentQ.answers" :key="ans.id" class="option-row">
                  <input type="checkbox" :value="ans.id" :checked="selectedAnswers.includes(ans.id)" @change="toggleMCMA(ans.id)" />
                  <span class="opt-text" v-html="ans.description"></span>
                </label>
              </div>

               <!-- TEXT -->
               <div class="q-options" v-else-if="currentQ.question_type === 'text'">
                  <textarea v-model="answerText" rows="6" class="text-answer-box" placeholder="Type your answer here..."></textarea>
               </div>
            </div>
          </div>
          <div v-else class="content-scroll flex-center">
             <div class="spinner"></div>
          </div>

          <!-- Bottom Action Buttons (Left side panel footer) -->
          <div class="content-footer-actions">
            <div class="left-actions">
              <button class="btn-light-blue" @click="markAndNext" :disabled="isSaving || questionLoading">Mark for Review & Next</button>
              <button class="btn-light-blue" @click="clearResponse" :disabled="isSaving || questionLoading">Clear Response</button>
            </div>
            <div class="right-actions">
              <button class="btn-cyan-solid" @click="saveAndNext" :disabled="isSaving || questionLoading">Save & Next</button>
            </div>
          </div>
        </main>

        <!-- RIGHT PANEL -->
        <aside class="side-panel-wrapper" :class="{ 'closed': isPanelClosed, 'mobile-open': showMobilePanel }">
          
          <div class="panel-toggle-tab hidden sm:flex" @click="isPanelClosed = !isPanelClosed">
            <svg v-if="isPanelClosed" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>

          <div class="side-panel">
            <div class="panel-inner-scroll">
              
              <!-- Profile Header -->
              <div class="profile-header">
                <div class="avatar-placeholder">
                   <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div class="username text-ellipsis">{{ userData.user_name || 'Debroy' }}</div>
              </div>
              
              <div class="horizontal-divider light"></div>

              <!-- Status Legend -->
              <div class="status-legend">
                <div class="legend-row">
                  <div class="legend-item">
                     <span class="shape answered">{{ stats.answered }}</span> Answered
                  </div>
                  <div class="legend-item">
                     <span class="shape marked">{{ stats.marked }}</span> Marked
                  </div>
                  <div class="legend-item">
                     <span class="shape not-visited">{{ stats.not_visited }}</span> Not Visited
                  </div>
                </div>
                <div class="legend-row mt-2">
                  <div class="legend-item merged">
                     <span class="shape marked-answered">{{ stats.marked_answered }}</span> Marked and answered
                  </div>
                  <div class="legend-item ml-4">
                     <span class="shape not-answered">{{ stats.not_answered }}</span> Not Answered
                  </div>
                </div>
              </div>
              
              <!-- Section Label -->
              <div class="section-title-bar">SECTION : Test</div>
              
              <!-- Palette Grid 1-N -->
              <div class="palette-grid">
                <button v-for="p in palette" :key="p.question_num" 
                        class="shape palette-btn" :class="getPaletteClass(p)"
                        @click="goToQuestion(p.question_num)">
                  {{ p.question_num }}
                </button>
              </div>
            </div>
            
            <!-- PANEL FOOTER -->
            <div class="side-panel-footer">
              <div class="secondary-actions">
                <button class="btn-action-light">Question Paper</button>
                <button class="btn-action-light">Instructions</button>
              </div>
              <button class="btn-submit" @click="confirmSubmit">Submit Test</button>
            </div>
          </div>
        </aside>

        <!-- Mobile Overlay -->
        <div class="mobile-overlay sm:hidden" v-if="showMobilePanel" @click="showMobilePanel = false"></div>

      </div>

    </div>

    <!-- Submit Confirmation Modal -->
    <div v-if="showSubmitModal" class="submit-modal-overlay" @click.self="showSubmitModal = false">
      <div class="submit-modal">
        <div class="submit-modal-icon">📋</div>
        <h3>Submit Test</h3>
        <div class="submit-modal-stats">
          <span class="stat answered">{{ stats.answered }} Answered</span>
          <span class="stat not-answered">{{ stats.not_answered }} Not Answered</span>
          <span class="stat not-visited">{{ stats.not_visited }} Not Visited</span>
        </div>
        <p>Are you sure you want to submit this test? <br/><small>This action cannot be undone.</small></p>
        <div class="submit-modal-actions">
          <button class="modal-btn cancel" @click="showSubmitModal = false">Go Back</button>
          <button class="modal-btn confirm" @click="showSubmitModal = false; submitTest()">Submit Test</button>
        </div>
      </div>
    </div>

    <!-- Warning Modal (Proctoring) -->
    <div v-if="showWarningModal" class="submit-modal-overlay">
      <div class="submit-modal warning-modal">
        <div class="submit-modal-icon">⚠️</div>
        <h3 style="color: #dc3545;">Proctoring Warning</h3>
        <p>You have navigated away from the test window.<br/>
        <strong>Warning {{ warnings }} of {{ maxWarnings }}</strong></p>
        <p><small>If you exceed the maximum warnings, your test will be auto-submitted.</small></p>
        <div class="submit-modal-actions" style="margin-top: 20px;">
          <button class="btn-cyan-solid" style="width: 100%; border-radius: 4px;" @click="showWarningModal = false">I Understand</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Reset */
.exam-wrapper { min-height: 100vh; background: white; font-family: 'Arial', sans-serif; color: #333; overflow: hidden; }
.exam-wrapper * { box-sizing: border-box; }

.hidden { display: none !important; }
@media(min-width: 640px){ .sm\:hidden { display: none !important; } .sm\:flex { display: flex !important; } .sm\:block { display: block !important; } .sm\:inline-block { display: inline-block !important; } }
.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Global Utilities */
.center-screen { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; gap:16px; color:#555; background:#f5f7fa; }
.flex-center { display: flex; align-items: center; justify-content: center; height: 100%; }
.mt-2 { margin-top: 8px; }
.mt-4 { margin-top: 16px; }
.ml-4 { margin-left: 16px; }

/* EXAM LAYOUT */
.exam-layout { display: flex; flex-direction: column; height: 100vh; width: 100vw; background-color: #fff; }

/* Header */
.exam-header { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; height: 50px; background-color: #fff; border-bottom: 2px solid #e1e7ec; flex-shrink: 0; position: relative;}
.exam-title { font-size: 14px; color: #444; letter-spacing: 0.3px; }
.header-right { display: flex; align-items: center; gap: 16px; }
.exam-timer { display: flex; align-items: center; font-size: 12px; font-weight: bold; color: #333; }
.time-box { background-color: #e6e6e6; color: #333; padding: 3px 8px; border-radius: 2px; border: 1px solid #ccc; margin-left: 8px; font-family: 'Arial', Courier, monospace; font-size: 13px; font-weight: normal;}
.exam-timer.urgent .time-box { background-color: #fee2e2; border-color: #ef4444; color: #b91c1c; animation: pulse 1s infinite; }
.btn-fullscreen { border: 1px solid #7cb9e8; color: #3182ce; background: transparent; padding: 4px 10px; border-radius: 2px; font-size: 12px; cursor: pointer; font-weight: normal;}
.mobile-menu-btn { font-size: 20px; background: none; border: none; color: #333; cursor: pointer; }

/* Sub Header */
.exam-subheader { display: flex; align-items: flex-end; height: 32px; background-color: #f7f9fa; border-bottom: 3px solid #000; padding: 0 16px; flex-shrink: 0; }
.tabs { display: flex; align-items: center; }
.tab-label { font-size: 11px; color: #666; margin-right: 12px; margin-bottom: 6px; }
.tab-btn { background-color: #1a6f8f; color: white; border: none; padding: 4px 20px; font-size: 13px; cursor: pointer; border-radius: 4px 4px 0 0; }
.tab-btn.active { margin-bottom: -3px; border-bottom: 3px solid #1a6f8f; z-index: 5; }

/* Body Container */
.exam-body-container { display: flex; flex: 1; min-height: 0; position: relative; }

/* Left Content */
.main-content { flex: 1; display: flex; flex-direction: column; background-color: #fff; position: relative; min-width: 0; border-right: 1px solid #ccc;}
.content-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; padding-bottom: 40px; }

/* Question Header Bar */
.q-header-bar { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 6px; }
.q-number { font-weight: bold; font-size: 14px; color: #111; }
.q-meta { display: flex; align-items: center; gap: 14px; font-size: 11px; color: #333; }
.marks-block { display: flex; align-items: center; gap: 4px;}
.marks-block .meta-label { margin-bottom: 12px; text-align: center; display: inline-block; vertical-align: top;}
.time-block { display: flex; align-items: center; gap: 4px; }
.meta-label { font-size: 10px; color: #666; position: relative; top: -6px; margin-right: 2px;}
.mark { padding: 1px 6px; border-radius: 8px; color: white; font-weight: normal; }
.mark.positive { background-color: #28a745; }
.mark.negative { background-color: #dc3545; }
.meta-val { font-size: 11px; }
.lang-select { border: 1px solid #ccc; font-size: 11px; padding: 1px; color: #333; outline: none;}
.btn-report { background: none; border: none; color: #555; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 2px;}
.btn-report:hover { color: #d9534f; }

.horizontal-divider { height: 1px; background-color: #e5e5e5; width: 100%; margin-bottom: 16px;}
.horizontal-divider.light { background-color: #cde0ed; margin: 0;}

/* Question Body */
.q-text { font-size: 14px; line-height: 1.5; color: #111; margin-bottom: 24px; }
.q-options { display: flex; flex-direction: column; gap: 14px; }
.option-row { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; }
.option-row input[type="radio"], .option-row input[type="checkbox"] { flex-shrink: 0; margin-top: 2px; }
.opt-text { font-size: 14px; color: #333; }
.text-answer-box { width: 100%; border: 1px solid #ccc; padding: 10px; font-size: 14px; font-family: inherit; }

/* Content Footer (Action Bar) */
.content-footer-actions { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background-color: #fff; border-top: 1px solid #ccc; flex-shrink: 0; }
.left-actions { display: flex; gap: 8px; }
.btn-light-blue { background-color: #a6ccf2; color: #1b4b79; border: 1px solid #78a9db; padding: 8px 16px; font-size: 12px; cursor: pointer; border-radius: 2px; }
.btn-light-blue:hover:not(:disabled) { background-color: #9abce0; }
.btn-light-blue:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-cyan-solid { background-color: #0b9cdb; color: white; border: none; padding: 8px 24px; font-size: 13px; font-weight: normal; cursor: pointer; border-radius: 2px; }
.btn-cyan-solid:hover:not(:disabled) { background-color: #0a89c0; }
.btn-cyan-solid:disabled { opacity: 0.6; cursor: not-allowed; }

/* Right Panel wrapper */
.side-panel-wrapper { width: 280px; display: flex; flex-direction: row; transition: transform 0.3s ease; position: relative; flex-shrink: 0; }
.side-panel-wrapper.closed { width: 0; transform: translateX(280px); }

/* The Toggle Tab natively injected */
.panel-toggle-tab { position: absolute; left: -16px; top: 50%; transform: translateY(-50%); width: 16px; height: 36px; background-color: #4a4f55; align-items: center; justify-content: center; border-radius: 4px 0 0 4px; cursor: pointer; z-index: 10; border-left: 1px solid #333; border-top: 1px solid #333; border-bottom: 1px solid #333;}
.side-panel-wrapper.closed .panel-toggle-tab { left: -16px; }

/* Panel Itself */
.side-panel { flex: 1; width: 280px; background-color: #e1f4fd; display: flex; flex-direction: column; height: 100%; position: relative; overflow: hidden; }
.panel-inner-scroll { flex: 1; overflow-y: auto; }

/* Profile */
.profile-header { display: flex; align-items: center; padding: 8px 16px; background-color: #e1f4fd; }
.avatar-placeholder { width: 44px; height: 44px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0; }
.username { font-size: 13px; color: #333; font-weight: normal; }

/* Status Legend (The Shapes) */
.status-legend { padding: 12px 16px; font-size: 11px; color: #333; }
.legend-row { display: flex; gap: 12px; align-items: center; justify-content: flex-start;}
.legend-item { display: flex; align-items: center; gap: 6px; }

/* Core Badge Shape Class for legends and palettes */
.shape { display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: normal; font-size: 11px; }

/* Specific Shapes EXACTLY matching image */
/* Answered: Green Arch */
.shape.answered { background: #28a745; border-radius: 12px 12px 0 0; width: 30px; height: 20px; line-height: 20px;}
/* Not Answered: Red Under-Arch */
.shape.not-answered { background: #dc3545; border-radius: 0 0 12px 12px; width: 30px; height: 20px; line-height: 20px; }
/* Not Visited: White Square */
.shape.not-visited { background: white; color: #333; border: 1px solid #111; width: 26px; height: 26px; border-radius: 0; line-height: 26px;}
/* Marked: Purple Circle */
.shape.marked { background: #9b51e0; border-radius: 50%; width: 26px; height: 26px; line-height: 26px;}
/* Marked & Answered: Purple Circle with internal green check */
.shape.marked-answered { background: #9b51e0; border-radius: 50%; width: 26px; height: 26px; line-height: 26px; position: relative; }
.shape.marked-answered::after { 
   content: '✔'; 
   position: absolute; 
   font-size: 10px; 
   color: #28a745; 
   font-weight: bold; 
   right: -2px; 
   bottom: -2px; 
}

/* Palette Overrides */
.palette-btn { cursor: pointer; border: none; font-size: 12px; margin: auto; transition: transform 0.1s;}
.palette-btn:hover { transform: scale(1.05); }
.palette-btn.active { outline: 2px solid #0b9cdb; outline-offset: 2px; }
.palette-btn.not-visited { border: 1px solid #111; }

.section-title-bar { background-color: #b5d3eb; padding: 4px 16px; font-size: 11px; font-weight: bold; color: #111; }

/* Palette Grid */
.palette-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; padding: 16px; justify-items: center; }

/* Panel Footer */
.side-panel-footer { background-color: #e1f4fd; padding: 8px 16px 16px 16px; border-top: 1px solid #cde0ed; }
.secondary-actions { display: flex; gap: 8px; margin-bottom: 8px; }
.btn-action-light { flex: 1; background-color: #a6ccf2; color: #1b4b79; border: 1px solid #8dbdec; padding: 6px 0; font-size: 11px; cursor: pointer; border-radius: 2px; }
.btn-submit { width: 100%; background-color: #00a4d1; color: white; border: none; padding: 8px; font-size: 12px; font-weight: normal; cursor: pointer; border-radius: 2px; }

/* Mobile Overlay Drawer */
.mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; }
@media (max-width: 639px) {
  .side-panel-wrapper { position: fixed; right: -280px; top: 50px; bottom: 0; z-index: 50; width: 280px; }
  .side-panel-wrapper.mobile-open { right: 0; }
  .side-panel-wrapper.closed { width: 280px; transform: none; }
  .panel-toggle-tab { display: none; }
  .exam-header { height: 50px; }
  .content-footer-actions { flex-direction: column-reverse; gap: 12px; padding: 10px; }
  .left-actions, .right-actions { display: flex; justify-content: space-between; width: 100%; }
  .right-actions .btn-cyan-solid { width: 100%; padding: 10px; }
  .left-actions .btn-light-blue { font-size: 12px; padding: 8px; flex: 1; text-align: center; }
}

/* Info Card CSS preserved */
.info-card { background: white; padding: 40px; border-radius: 4px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.card-icon { font-size: 40px; margin-bottom: 10px; }
.form-input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 2px; }
.w-full { width: 100%; }
.field-error { color: #dc3545; font-size: 13px; }
.spinner { width: 30px; height: 30px; border: 4px solid #ccc; border-top-color: #0b93d6; border-radius: 50%; animation: spin 0.8s linear infinite; }
.btn-cyan { background-color: #0b9cdb; color: white; border: none; border-radius: 2px; padding: 8px 16px; cursor: pointer; }
.btn-ghost { background: none; border: 1px solid #ccc; border-radius: 2px; padding: 8px 16px; margin-top:12px; cursor: pointer; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

/* Submit Confirmation Modal */
.submit-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}
.submit-modal {
  background: white;
  border-radius: 8px;
  padding: 28px 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  animation: modal-pop 0.2s ease;
}
@keyframes modal-pop {
  from { transform: scale(0.88); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.submit-modal-icon { font-size: 2.5rem; margin-bottom: 10px; }
.submit-modal h3 { font-size: 1.2rem; font-weight: bold; color: #1a1a1a; margin: 0 0 12px; }
.submit-modal p { color: #444; font-size: 13px; line-height: 1.5; margin: 12px 0; }
.submit-modal-stats {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 10px 0;
}
.stat {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
}
.stat.answered { background: #dcfce7; color: #15803d; }
.stat.not-answered { background: #fee2e2; color: #b91c1c; }
.stat.not-visited { background: #f1f5f9; color: #475569; }
.submit-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 18px;
}
.modal-btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, transform 0.15s;
}
.modal-btn:hover { opacity: 0.9; transform: translateY(-1px); }
.modal-btn.cancel { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
.modal-btn.confirm { background: #00a4d1; color: white; }

/* ─── Passage Panel ───────────────────────────────────── */
.passage-panel {
  background: #faf5ff;
  border: 1px solid #d8b4fe;
  border-radius: 10px;
  margin-bottom: 1.2rem;
  overflow: hidden;
}
.passage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  background: #f3e8ff;
  user-select: none;
}
.passage-header:hover { background: #ede9fe; }
.passage-header-left { display: flex; align-items: center; gap: 8px; }
.passage-icon { font-size: 1rem; }
.passage-title-text { font-weight: 600; color: #4c1d95; font-size: 0.92rem; }
.passage-tag {
  background: #7c3aed; color: white;
  font-size: 0.7rem; font-weight: 700;
  padding: 2px 8px; border-radius: 999px;
}
.passage-toggle {
  background: none; border: none; color: #6d28d9;
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
  white-space: nowrap;
}
.passage-body { padding: 14px 18px; border-top: 1px solid #e9d5ff; }
.passage-text {
  white-space: pre-wrap;
  line-height: 1.85;
  font-size: 0.93rem;
  color: #374151;
  max-height: 320px;
  overflow-y: auto;
  background: white;
  border-radius: 6px;
  padding: 12px 14px;
  border: 1px solid #e9d5ff;
}
</style>
