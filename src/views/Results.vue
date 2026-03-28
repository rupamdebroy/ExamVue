<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_BASE_URL } from '../config/constant.js'

const router = useRouter()
const route = useRoute()

const testuser_id = parseInt(route.params.testuser_id)
const token = localStorage.getItem('tce_token')

const isLoading = ref(true)
const errorMsg = ref('')
const results = ref(null)
const leaderboard = ref([])
const userStats = ref(null)

const API = API_BASE_URL

async function fetchResults() {
  if (!token) { router.replace('/login'); return }
  try {
    const res = await fetch(`${API}/test_results.php?testuser_id=${testuser_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.status === 401) { router.replace('/login'); return }
    const data = await res.json()
    if (data.status !== 'success') {
      errorMsg.value = data.message || 'Failed to load results'
    } else {
      results.value = data
      fetchLeaderboard(data.test_id)
    }
  } catch (e) {
    errorMsg.value = 'Network error loading results.'
  } finally {
    isLoading.value = false
  }
}

const fetchLeaderboard = async (testId) => {
  try {
    const res = await fetch(`${API}/test_leaderboard.php?test_id=${testId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.status === 'success') {
      leaderboard.value = data.leaderboard || []
      userStats.value = data.user_stats || null
    }
  } catch (err) {
    console.warn("Failed to load leaderboard", err)
  }
}

const scorePercent = computed(() => {
  if (!results.value || !results.value.max_score) return 0
  return Math.round((results.value.user_score / results.value.max_score) * 100)
})

const formattedDuration = computed(() => {
  if (!results.value?.duration_seconds) return 'N/A'
  const m = Math.floor(results.value.duration_seconds / 60)
  const s = results.value.duration_seconds % 60
  return `${m}m ${s}s`
})

function formatDate(str) {
  if (!str) return 'N/A'
  return new Date(str).toLocaleString()
}

function getAnswerClass(ans) {
  if (ans.is_correct && ans.was_selected) return 'ans-correct-selected'
  if (ans.is_correct && !ans.was_selected) return 'ans-correct-missed'
  if (!ans.is_correct && ans.was_selected) return 'ans-wrong-selected'
  return 'ans-neutral'
}

onMounted(fetchResults)
</script>

<template>
  <div class="results-page">
    <div class="main-content">
      <!-- Loading -->
      <div v-if="isLoading" class="center-pad">
        <div class="spinner"></div>
        <p>Loading results…</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="center-pad">
        <div class="error-banner">{{ errorMsg }}</div>
        <button class="btn-ghost" @click="router.push('/dashboard')">Back to Dashboard</button>
      </div>

      <!-- Results -->
      <div v-else-if="results" class="results-body">
        <!-- Top header -->
        <header class="results-header">
          <div>
            <h1>{{ results.test_name }}</h1>
            <p>Test completed · {{ formatDate(results.end_time) }}</p>
          </div>
          <router-link to="/dashboard" class="btn-ghost">← Back to Dashboard</router-link>
        </header>

        <!-- Score Cards -->
        <div class="score-cards" v-if="results.results_visible">
          <!-- Score gauge card -->
          <div class="card score-gauge-card">
            <div class="gauge-ring"
                 :style="{ '--pct': scorePercent + '%',
                            '--clr': results.passed === true ? '#16a34a' :
                                     results.passed === false ? '#dc2626' : '#4f46e5' }">
              <svg viewBox="0 0 100 100" class="gauge-svg">
                <circle cx="50" cy="50" r="42" class="gauge-bg"/>
                <circle cx="50" cy="50" r="42" class="gauge-fg"
                        :style="{ strokeDashoffset: 264 - (264 * scorePercent / 100),
                                  stroke: results.passed === true ? '#16a34a' :
                                          results.passed === false ? '#dc2626' : '#4f46e5' }"/>
              </svg>
              <div class="gauge-label">
                <span class="gauge-pct">{{ scorePercent }}%</span>
                <span class="gauge-sub">score</span>
              </div>
            </div>
            <div class="gauge-details">
              <p class="gauge-score">{{ results.user_score ?? '—' }} / {{ results.max_score }}</p>
              <span v-if="results.passed === true" class="status-badge passed">✓ Passed</span>
              <span v-else-if="results.passed === false" class="status-badge failed">✗ Failed</span>
              <span v-else class="status-badge neutral">Completed</span>
              <p v-if="results.score_threshold" class="threshold-note">
                Pass threshold: {{ results.score_threshold }} pts
              </p>
            </div>
          </div>

          <!-- Stats card -->
          <div class="card stats-card">
            <div class="stat-row">
              <span class="stat-label">Duration</span>
              <span class="stat-val">{{ formattedDuration }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Started</span>
              <span class="stat-val">{{ formatDate(results.start_time) }}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Ended</span>
              <span class="stat-val">{{ formatDate(results.end_time) }}</span>
            </div>
            <div class="stat-row" v-if="results.questions.length">
              <span class="stat-label">Questions</span>
              <span class="stat-val">{{ results.questions.length }}</span>
            </div>
          </div>
        </div>

        <!-- Leaderboard Section -->
        <div class="leaderboard-container" v-if="leaderboard.length > 0">
          <div class="leaderboard-header">
            <h2>🏆 Top Performers Leaderboard</h2>
            <div v-if="userStats && userStats.rank !== null" class="user-stats-pill">
              Your Rank: <strong>#{{ userStats.rank }}</strong> <span class="sub">/ {{ userStats.total_participants }}</span>
              <span class="pct-badge" v-if="userStats.percentile">{{ userStats.percentile }}%ile</span>
            </div>
          </div>
          <table class="leader-table">
            <thead>
              <tr>
                <th width="80">Rank</th>
                <th>Participant</th>
                <th width="120">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lb in leaderboard" :key="lb.user_id">
                <td>
                  <span class="rank-badge" :class="`rank-${lb.rank}`">#{{ lb.rank }}</span>
                </td>
                <td class="name-td">
                  {{ lb.name }} <small>@{{ lb.username }}</small>
                </td>
                <td class="score-td">{{ lb.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Results not visible -->
        <div v-if="!results.results_visible" class="no-results-banner">
          <span>🔒</span>
          <p>Your test has been submitted. Results will be available once the instructor releases them.</p>
        </div>

        <!-- Per-question breakdown -->
        <div v-if="results.questions.length > 0" class="questions-breakdown">
          <h2 class="section-title">Question Review</h2>
          <div v-for="q in results.questions" :key="q.question_num" class="q-review-card">
            <div class="qr-header">
              <span class="q-num-badge">Q{{ q.question_num }}</span>
              <span :class="['score-chip',
                q.score > 0 ? 'score-pos' : q.score < 0 ? 'score-neg' : 'score-zero']">
                {{ q.score > 0 ? '+' : '' }}{{ q.score ?? 'N/A' }} pts
              </span>
              <span v-if="!q.answered" class="skipped-badge">Skipped</span>
            </div>
            <p class="qr-text">{{ q.question_text }}</p>

            <!-- MCX answers -->
            <div v-if="q.answers.length" class="qr-answers">
              <div v-for="ans in q.answers" :key="ans.id"
                   :class="['qr-ans', getAnswerClass(ans)]">
                <span class="ans-icon">
                  {{ ans.is_correct && ans.was_selected ? '✓' :
                     ans.is_correct && !ans.was_selected ? '○' :
                     !ans.is_correct && ans.was_selected ? '✗' : '' }}
                </span>
                {{ ans.description }}
              </div>
            </div>

            <!-- Text answer -->
            <div v-if="q.answer_text" class="qr-text-answer">
              <span class="text-ans-label">Your answer:</span>
              {{ q.answer_text }}
            </div>

            <!-- Explanation -->
            <div v-if="q.explanation" class="qr-explanation">
              <span class="exp-label">💡 Explanation:</span>
              {{ q.explanation }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-page { font-family:'Inter',sans-serif; }
.center-pad { display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-height:60vh; gap:16px; color:#6b7280; }

/* Header */
.results-header { padding:36px 48px 20px; display:flex; align-items:flex-start;
  justify-content:space-between; gap:16px; }
.results-header h1 { font-size:26px; font-weight:800; color:#111827; margin:0 0 6px 0; }
.results-header p { color:#6b7280; margin:0; font-size:14px; }

.results-body { padding-bottom: 60px; }

/* Score Cards Row */
.score-cards { display:flex; gap:20px; padding:0 48px 24px; flex-wrap:wrap; }
.card { background:white; border-radius:16px; padding:28px;
  box-shadow:0 4px 16px rgba(0,0,0,0.05); border:1px solid #f3f4f6; }
.score-gauge-card { display:flex; align-items:center; gap:28px; flex:0 0 auto; }
.stats-card { flex:1; display:flex; flex-direction:column; gap:14px; min-width:220px; }

/* Gauge */
.gauge-ring { position:relative; width:120px; height:120px; flex-shrink:0; }
.gauge-svg { width:120px; height:120px; transform:rotate(-90deg); }
.gauge-bg { fill:none; stroke:#f3f4f6; stroke-width:10; }
.gauge-fg { fill:none; stroke-width:10; stroke-linecap:round;
  stroke-dasharray:264; transition:stroke-dashoffset .8s ease, stroke .4s; }
.gauge-label { position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; }
.gauge-pct { font-size:24px; font-weight:900; color:#111827; line-height:1; }
.gauge-sub { font-size:11px; color:#9ca3af; font-weight:600; text-transform:uppercase; }

.gauge-details { display:flex; flex-direction:column; gap:8px; }
.gauge-score { font-size:22px; font-weight:800; color:#111827; margin:0; }

.status-badge { display:inline-block; font-size:13px; font-weight:700;
  padding:5px 14px; border-radius:20px; }
.status-badge.passed { background:#dcfce7; color:#166534; }
.status-badge.failed { background:#fee2e2; color:#b91c1c; }
.status-badge.neutral { background:#e0e7ff; color:#3730a3; }
.threshold-note { font-size:12px; color:#9ca3af; margin:0; }

.stat-row { display:flex; justify-content:space-between; align-items:center;
  padding-bottom:12px; border-bottom:1px solid #f3f4f6; }
.stat-row:last-child { border-bottom:none; padding-bottom:0; }
.stat-label { font-size:13px; color:#6b7280; font-weight:500; }
.stat-val { font-size:14px; color:#111827; font-weight:700; }

/* No results */
.no-results-banner { margin:0 48px 24px; background:#fef9c3; border-left:4px solid #facc15;
  border-radius:10px; padding:16px 20px; display:flex; align-items:center; gap:12px;
  color:#713f12; font-weight:500; }

/* Leaderboard */
.leaderboard-container { padding: 0 48px; margin-bottom: 24px; }
.leaderboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.leaderboard-header h2 { font-size: 18px; font-weight: 800; color: #111827; margin: 0; }
.user-stats-pill { background: #111827; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.user-stats-pill .sub { color: #9ca3af; font-size: 11px; }
.pct-badge { background: #3b82f6; padding: 2px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; }

.leader-table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); border: 1px solid #f3f4f6; }
.leader-table th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
.leader-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; background: white; }
.leader-table tr:last-child td { border-bottom: none; }
.rank-badge { display: inline-block; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 13px; background: #f1f5f9; color: #475569; }
.rank-badge.rank-1 { background: #fef08a; color: #854d0e; }
.rank-badge.rank-2 { background: #e2e8f0; color: #475569; }
.rank-badge.rank-3 { background: #fed7aa; color: #9a3412; }
.name-td { font-weight: 600; color: #1f2937; font-size: 14px; }
.name-td small { color: #94a3b8; font-weight: 500; margin-left: 6px; }
.score-td { font-weight: 800; color: #111827; font-size: 15px; }

/* Questions Breakdown */
.questions-breakdown { padding:0 48px; }
.section-title { font-size:20px; font-weight:800; color:#111827; margin:0 0 16px 0; }
.q-review-card { background:white; border-radius:14px; padding:22px 24px;
  border:1px solid #f3f4f6; box-shadow:0 2px 8px rgba(0,0,0,0.04);
  margin-bottom:16px; }
.qr-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.q-num-badge { background:#eef2ff; color:#4338ca; font-size:12px; font-weight:700;
  padding:3px 10px; border-radius:20px; }
.score-chip { font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; }
.score-pos { background:#dcfce7; color:#166534; }
.score-neg { background:#fee2e2; color:#b91c1c; }
.score-zero { background:#f3f4f6; color:#6b7280; }
.skipped-badge { background:#fef3c7; color:#92400e; font-size:12px; font-weight:600;
  padding:3px 10px; border-radius:20px; }

.qr-text { font-size:15px; font-weight:600; color:#1f2937; margin:0 0 14px 0; line-height:1.5; }

.qr-answers { display:flex; flex-direction:column; gap:7px; margin-bottom:14px; }
.qr-ans { display:flex; align-items:flex-start; gap:10px; padding:10px 14px;
  border-radius:8px; font-size:14px; font-weight:500; border:1px solid transparent; }
.ans-icon { font-size:14px; font-weight:800; flex-shrink:0; min-width:16px; }
.ans-correct-selected { background:#f0fdf4; border-color:#bbf7d0; color:#166534; }
.ans-correct-missed  { background:#fafff4; border-color:#e5e7eb; color:#4b7c3f; }
.ans-wrong-selected  { background:#fef2f2; border-color:#fecaca; color:#b91c1c; }
.ans-neutral         { background:#f9fafb; border-color:#f3f4f6; color:#6b7280; }

.qr-text-answer { background:#f9fafb; border-radius:8px; padding:12px 14px;
  font-size:14px; color:#374151; margin-bottom:10px; }
.text-ans-label { font-weight:700; color:#6b7280; margin-right:6px; }

.qr-explanation { display:flex; gap:8px; background:#fffbeb; border:1px solid #fde68a;
  border-radius:8px; padding:12px 14px; font-size:13px; color:#78350f; }
.exp-label { font-weight:700; flex-shrink:0; }

/* Misc */
.error-banner { background:#fef2f2; color:#b91c1c; padding:14px 18px;
  border-radius:10px; border-left:4px solid #ef4444; }
.btn-ghost { padding:10px 18px; background:transparent; color:#6b7280;
  border:1px solid #e5e7eb; border-radius:8px; font-weight:600; font-size:13px;
  cursor:pointer; transition:all .2s; text-decoration:none; display:inline-flex; align-items:center; }
.btn-ghost:hover { background:#f3f4f6; color:#374151; }

.spinner { width:36px; height:36px; border:4px solid #e5e7eb;
  border-top-color:#4f46e5; border-radius:50%; animation:spin .9s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
