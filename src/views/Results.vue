<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { API_ENDPOINTS } from '../config/constant.js'

const router = useRouter()
const route  = useRoute()

const testuser_id = parseInt(route.params.testuser_id)
const token = localStorage.getItem('tce_token')
const userData = JSON.parse(localStorage.getItem('tce_user') || '{}')

const isLoading   = ref(true)
const errorMsg    = ref('')
const results     = ref(null)
const analytics   = ref(null)
const leaderboard = ref(null)
const expandedQ   = ref(new Set())
const activeTab   = ref('overview') // overview | analytics | leaderboard | review
const selectedAttempt = ref(1)

async function fetchAll() {
  if (!token) { router.replace('/login'); return }
  try {
    // Fetch results first
    const res = await fetch(`${API_ENDPOINTS.TEST_RESULT}?testuser_id=${testuser_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.status === 401) { router.replace('/login'); return }
    const data = await res.json()
    if (data.status !== 'success') {
      errorMsg.value = data.message || 'Failed to load results'
      isLoading.value = false
      return
    }
    results.value = data

    // Fetch analytics + leaderboard in parallel
    const [anaRes, lbRes] = await Promise.all([
      fetch(`${API_ENDPOINTS.TEST_ANALYTICS}?testuser_id=${testuser_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_ENDPOINTS.TEST_LEADERBOARD}?test_id=${data.test_id}&testuser_id=${testuser_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ])
    const anaData = await anaRes.json()
    if (anaData.status === 'success') analytics.value = anaData

    const lbData = await lbRes.json()
    if (lbData.status === 'success') {
      leaderboard.value = lbData
      selectedAttempt.value = lbData.default_attempt || 1
    }

  } catch {
    errorMsg.value = 'Network error loading results.'
  } finally {
    isLoading.value = false
  }
}

const scorePercent = computed(() => {
  if (!results.value) return 0
  const max = results.value.max_score
  const score = results.value.user_score
  if (!max || max <= 0 || score === null) return 0
  return Math.min(100, Math.round((score / max) * 100))
})

const passColor = computed(() => {
  if (!results.value) return '#6366f1'
  if (results.value.passed === true)  return '#16a34a'
  if (results.value.passed === false) return '#dc2626'
  return '#6366f1'
})

const dashOffset = computed(() => {
  const r = 52
  const circ = 2 * Math.PI * r
  return circ - (circ * scorePercent.value / 100)
})

const formattedDuration = computed(() => {
  if (!results.value?.duration_seconds) return 'N/A'
  const h = Math.floor(results.value.duration_seconds / 3600)
  const m = Math.floor((results.value.duration_seconds % 3600) / 60)
  const s = results.value.duration_seconds % 60
  return h ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
})

function formatDate(str) {
  if (!str) return 'N/A'
  return new Date(str).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function toggleQ(num) {
  if (expandedQ.value.has(num)) expandedQ.value.delete(num)
  else expandedQ.value.add(num)
}
const expandAll   = () => results.value?.questions.forEach(q => expandedQ.value.add(q.question_num))
const collapseAll = () => expandedQ.value.clear()

function switchAttempt(e) {
  window.location.href = `/results/${e.target.value}`
}

function ansClass(a) {
  if (a.is_correct && a.was_selected)  return 'ans-ok'
  if (a.is_correct && !a.was_selected) return 'ans-missed'
  if (!a.is_correct && a.was_selected) return 'ans-wrong'
  return 'ans-neutral'
}
function ansIcon(a) {
  if (a.is_correct && a.was_selected)  return '✓'
  if (a.is_correct && !a.was_selected) return '○'
  if (!a.is_correct && a.was_selected) return '✗'
  return ''
}

const currentLbStats = computed(() => {
  return leaderboard.value?.user_stats?.[selectedAttempt.value] || null
})

const currentLbList = computed(() => {
  return leaderboard.value?.leaderboards?.[selectedAttempt.value] || []
})

const rankBadge = computed(() => {
  if (!currentLbStats.value?.rank) return null
  const r = currentLbStats.value.rank
  if (r === 1) return { icon: '🥇', label: '1st Place', cls: 'gold' }
  if (r === 2) return { icon: '🥈', label: '2nd Place', cls: 'silver' }
  if (r === 3) return { icon: '🥉', label: '3rd Place', cls: 'bronze' }
  return { icon: '🏅', label: `Rank #${r}`, cls: 'default' }
})

const accuracyColor = computed(() => {
  const pct = analytics.value?.accuracy_percent ?? 0
  if (pct >= 75) return '#16a34a'
  if (pct >= 50) return '#d97706'
  return '#dc2626'
})

onMounted(fetchAll)
</script>

<template>
  <div class="rp">

    <!-- Loading -->
    <div class="center-pad" v-if="isLoading">
      <div class="spin-ring"></div>
      <p class="load-txt">Crunching your results…</p>
    </div>

    <!-- Error -->
    <div class="center-pad" v-else-if="errorMsg">
      <div class="err-box">⚠️ {{ errorMsg }}</div>
      <button class="btn-ghost" @click="router.push('/dashboard')">← Dashboard</button>
    </div>

    <template v-else-if="results">

      <!-- ── Sticky Top Bar ───────────────────────────────── -->
      <div class="sticky-header">
        <div class="top-header">
          <div class="th-left">
            <button class="btn-back" @click="router.push('/dashboard')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div class="th-titles">
              <span class="sub-label">Test Result</span>
              <h1 class="test-name">{{ results.test_name }}</h1>
              <div class="test-meta-inline">📅 {{ formatDate(results.end_time) }} &nbsp;&bull;&nbsp; ⏱ {{ formattedDuration }} &nbsp;&bull;&nbsp; 📝 {{ results.question_count }} Qs</div>
            </div>
          </div>
          <div class="th-right">
            <div v-if="results.user_attempts?.length > 1" class="attempt-switch-wrap">
              <label>Attempt:</label>
              <select class="attempt-switch-sel" :value="results.testuser_id" @change="switchAttempt($event)">
                <option v-for="att in results.user_attempts" :key="att.testuser_id" :value="att.testuser_id">
                  #{{ att.attempt_num }} ({{ formatDate(att.date).split(',')[0] }})
                </option>
              </select>
            </div>
            <button class="btn-retake" v-if="results.test_id" @click="router.push(`/test/${results.test_id}?repeat=true`)">
              Retake Test
            </button>
          </div>
        </div>

        <!-- ── Tabs ───────────────────────────────────────── -->
        <div class="tabs-bar" v-if="results.results_visible">
          <button class="tab" :class="{ active: activeTab === 'overview' }"   @click="activeTab = 'overview'">Overview</button>
          <button class="tab" :class="{ active: activeTab === 'analytics' }"  @click="activeTab = 'analytics'" v-if="analytics">Analytics</button>
          <button class="tab" :class="{ active: activeTab === 'leaderboard' }" @click="activeTab = 'leaderboard'" v-if="leaderboard">Leaderboard</button>
          <button class="tab" :class="{ active: activeTab === 'review' }"     @click="activeTab = 'review'" v-if="results.report_visible && results.questions.length">Review</button>
        </div>
      </div>

      <!-- ── Main Content ───────────────────────────────── -->
      <div class="page-content">
        <!-- ── Score Section ── -->
        <div class="score-section" v-if="results.results_visible">
          <!-- Gauge Card -->
          <div class="gauge-card">
            <svg class="gauge-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" class="g-bg"/>
              <circle cx="60" cy="60" r="52" class="g-fg"
                :style="{ strokeDashoffset: dashOffset, stroke: passColor }"/>
            </svg>
            <div class="gauge-center">
              <span class="gauge-pct">{{ scorePercent }}%</span>
              <span class="gauge-sub">Score</span>
            </div>
          </div>

          <!-- Score Stats -->
          <div class="score-stats">
            <div class="big-score-row">
              <span class="big-num">{{ results.user_score ?? '—' }}</span>
              <span class="big-sep">/</span>
              <span class="big-max">{{ results.max_score ?? '?' }}</span>
              <span class="big-pts">pts</span>
              <span class="pass-pill"
                :class="results.passed === true ? 'pass' : results.passed === false ? 'fail' : 'neutral'">
                {{ results.passed === true ? '✓ Passed' : results.passed === false ? '✗ Failed' : '● Completed' }}
              </span>
            </div>

            <!-- Q stats bar -->
            <div class="qs-bar" v-if="results.report_visible">
              <div class="qs-item g">
                <div class="qs-val">{{ results.correct_count }}</div>
                <div class="qs-lbl">Correct</div>
              </div>
              <div class="qs-sep"></div>
              <div class="qs-item r">
                <div class="qs-val">{{ results.wrong_count }}</div>
                <div class="qs-lbl">Wrong</div>
              </div>
              <div class="qs-sep"></div>
              <div class="qs-item a">
                <div class="qs-val">{{ results.skipped_count }}</div>
                <div class="qs-lbl">Skipped</div>
              </div>
              <div class="qs-sep"></div>
              <div class="qs-item b">
                <div class="qs-val">{{ results.question_count }}</div>
                <div class="qs-lbl">Total</div>
              </div>
            </div>

            <!-- Rank chip -->
            <div class="rank-row" v-if="currentLbStats">
              <div class="rank-badge" :class="rankBadge?.cls">
                <span class="rank-icon">{{ rankBadge?.icon ?? '🏅' }}</span>
                <div class="rank-info">
                  <span class="rank-label">{{ rankBadge?.label }}</span>
                  <span class="rank-sub">out of {{ currentLbStats.total_participants }} participants</span>
                </div>
              </div>
              <div class="percentile-badge">
                <span class="pct-big">{{ currentLbStats.percentile }}%ile</span>
                <span class="pct-lbl">Percentile</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Results hidden -->
        <div class="locked-banner" v-if="!results.results_visible">
          <span class="lock-icon">🔒</span>
          <div>
            <strong>Results Pending</strong>
            <p>Your test has been submitted. The instructor will release your score shortly.</p>
          </div>
        </div>

      <!-- ══ TAB: OVERVIEW ══ -->
      <div class="tab-body" v-show="activeTab === 'overview'">
        <div class="overview-grid">
          <div class="ov-card">
            <div class="ov-icon">📅</div>
            <div class="ov-val">{{ formatDate(results.start_time) }}</div>
            <div class="ov-lbl">Started At</div>
          </div>
          <div class="ov-card">
            <div class="ov-icon">🏁</div>
            <div class="ov-val">{{ formatDate(results.end_time) }}</div>
            <div class="ov-lbl">Ended At</div>
          </div>
          <div class="ov-card">
            <div class="ov-icon">⏱</div>
            <div class="ov-val">{{ formattedDuration }}</div>
            <div class="ov-lbl">Time Taken</div>
          </div>
          <div class="ov-card" v-if="results.score_right">
            <div class="ov-icon">✅</div>
            <div class="ov-val">+{{ results.score_right }}</div>
            <div class="ov-lbl">Per Correct</div>
          </div>
          <div class="ov-card" v-if="results.score_threshold">
            <div class="ov-icon">🎯</div>
            <div class="ov-val">{{ results.score_threshold }} pts</div>
            <div class="ov-lbl">Pass Mark</div>
          </div>
          <div class="ov-card" v-if="analytics">
            <div class="ov-icon">⚡</div>
            <div class="ov-val">{{ analytics.avg_time_seconds }}s</div>
            <div class="ov-lbl">Avg Time/Q</div>
          </div>
        </div>

        <!-- Accuracy Bar -->
        <div class="accuracy-bar-section" v-if="analytics">
          <div class="ab-header">
            <span class="ab-title">Overall Accuracy</span>
            <span class="ab-val" :style="{ color: accuracyColor }">{{ analytics.accuracy_percent }}%</span>
          </div>
          <div class="ab-track">
            <div class="ab-fill" :style="{ width: analytics.accuracy_percent + '%', background: accuracyColor }"></div>
          </div>
        </div>

        <!-- Comparison callout -->
        <div class="comparison-card" v-if="currentLbList.length">
          <div class="cmp-icon">🏆</div>
          <div class="cmp-text">
            <span>Top scorer achieved <strong>{{ currentLbList[0]?.score }} pts</strong></span>
            <span v-if="results.user_score !== null"> · You scored <strong>{{ results.user_score }} pts</strong></span>
            <span v-if="currentLbStats?.rank">
              · You're <strong>#{{ currentLbStats.rank }}</strong> out of {{ currentLbStats.total_participants }}
            </span>
          </div>
        </div>
      </div>

      <!-- ══ TAB: ANALYTICS ══ -->
      <div class="tab-body" v-show="activeTab === 'analytics'" v-if="analytics">

        <!-- Weak Topics -->
        <div class="section-card" v-if="analytics.weak_topics?.length">
          <div class="sc-header">
            <span class="sc-icon">⚠️</span>
            <h3>Weak Areas — Focus Here</h3>
          </div>
          <div class="weak-list">
            <div v-for="wt in analytics.weak_topics" :key="wt.topic" class="weak-row">
              <span class="weak-topic">{{ wt.topic }}</span>
              <div class="weak-bar-wrap">
                <div class="weak-bar" :style="{ width: wt.accuracy + '%' }"></div>
              </div>
              <span class="weak-pct">{{ wt.accuracy }}%</span>
            </div>
          </div>
        </div>

        <!-- Subject Breakdown -->
        <div class="section-card" v-if="analytics.subject_breakdown?.length">
          <div class="sc-header">
            <span class="sc-icon">📊</span>
            <h3>Topic-wise Breakdown</h3>
          </div>
          <div class="breakdown-table">
            <div class="bt-head">
              <span>Topic</span><span>Correct</span><span>Wrong</span><span>Skipped</span><span>Accuracy</span>
            </div>
            <div v-for="sb in analytics.subject_breakdown" :key="sb.topic" class="bt-row">
              <span class="bt-topic">{{ sb.topic }}</span>
              <span class="bt-cell green">{{ sb.correct }}</span>
              <span class="bt-cell red">{{ sb.wrong }}</span>
              <span class="bt-cell amber">{{ sb.skipped }}</span>
              <span class="bt-cell" :style="{ color: sb.accuracy >= 75 ? '#16a34a' : sb.accuracy >= 50 ? '#d97706' : '#dc2626' }">
                {{ sb.accuracy }}%
              </span>
            </div>
          </div>
        </div>

        <div class="no-data" v-if="!analytics.subject_breakdown?.length">
          <span>📭</span>
          <p>No topic-level data available for this test.</p>
        </div>
      </div>

      <!-- ══ TAB: LEADERBOARD ══ -->
      <div class="tab-body" v-show="activeTab === 'leaderboard'" v-if="leaderboard">
        <div class="section-card">
          <div class="sc-header" style="justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: .6rem;">
              <span class="sc-icon">🏆</span>
              <h3 style="margin: 0;">Top 10 Leaderboard</h3>
              <span class="sc-sub" v-if="currentLbStats" style="margin-top: 0;">{{ currentLbStats.total_participants }} participants</span>
            </div>
            <div v-if="leaderboard.available_attempts?.length > 1" class="attempt-select-wrap">
              <label>Showing: </label>
              <select v-model.number="selectedAttempt" class="attempt-select">
                <option v-for="att in leaderboard.available_attempts" :key="att" :value="att">Attempt {{ att }}</option>
              </select>
            </div>
          </div>

          <!-- User's own rank highlight -->
          <div class="my-rank-card" v-if="currentLbStats?.rank">
            <div class="mr-left">
              <span class="mr-icon">{{ rankBadge?.icon }}</span>
              <div>
                <div class="mr-name">Your Rank</div>
                <div class="mr-sub">{{ currentLbStats.percentile }}th percentile</div>
              </div>
            </div>
            <div class="mr-right">
              <span class="mr-rank">#{{ currentLbStats.rank }}</span>
              <span class="mr-score">{{ currentLbStats.score }} pts</span>
            </div>
          </div>

          <div class="lb-list" v-if="currentLbList.length">
            <div v-for="entry in currentLbList" :key="entry.rank" class="lb-row"
              :class="{ 'lb-me': entry.user_id == userData.user_id, 'lb-top3': entry.rank <= 3 }">
              <span class="lb-rank">
                {{ entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '#' + entry.rank }}
              </span>
              <div class="lb-avatar">{{ (entry.name || entry.username || '?')[0].toUpperCase() }}</div>
              <div class="lb-name">
                <span class="lb-uname">{{ entry.name || entry.username }}</span>
                <span class="lb-you" v-if="entry.user_id == userData.user_id">You</span>
              </div>
              <span class="lb-score">{{ entry.score }} pts</span>
            </div>
          </div>

          <div class="no-data" v-else>
            <span>📭</span><p>No leaderboard data yet for this attempt.</p>
          </div>
        </div>
      </div>

      <!-- ══ TAB: REVIEW ══ -->
      <div class="tab-body" v-show="activeTab === 'review'" v-if="results.report_visible && results.questions.length">
        <div class="review-toolbar">
          <span class="rv-count">{{ results.questions.length }} Questions</span>
          <div class="rv-btns">
            <button @click="expandAll">Expand All</button>
            <button @click="collapseAll">Collapse All</button>
          </div>
        </div>

        <div class="q-list">
          <div v-for="q in results.questions" :key="q.question_num" class="q-card"
            :class="{ 'qc-ok': q.answered && q.score > 0, 'qc-wrong': q.answered && q.score !== null && q.score <= 0, 'qc-skip': !q.answered }">

            <div class="q-hdr" @click="toggleQ(q.question_num)">
              <div class="q-hl">
                <span class="q-num">Q{{ q.question_num }}</span>
                <span class="q-si">{{ !q.answered ? '⏭️' : q.score > 0 ? '✅' : '❌' }}</span>
                <span class="q-prev">{{ q.question_text.substring(0, 85) }}{{ q.question_text.length > 85 ? '…' : '' }}</span>
              </div>
              <div class="q-hr">
                <span class="q-chip" :class="q.score > 0 ? 'pos' : q.score < 0 ? 'neg' : 'zero'">
                  {{ q.score !== null ? (q.score > 0 ? '+' : '') + q.score : 'N/A' }} / {{ q.max_q_score }}
                </span>
                <span class="q-chev">{{ expandedQ.has(q.question_num) ? '▲' : '▼' }}</span>
              </div>
            </div>

            <div class="q-body" v-if="expandedQ.has(q.question_num)">
              <p class="q-full-text">{{ q.question_text }}</p>

              <div class="ans-list" v-if="q.answers.length">
                <div v-for="a in q.answers" :key="a.id" class="ans-row" :class="ansClass(a)">
                  <span class="ai">{{ ansIcon(a) }}</span>
                  <span class="at">{{ a.description }}</span>
                  <span class="a-tag correct" v-if="a.is_correct">✓ Correct</span>
                  <span class="a-tag selected" v-if="a.was_selected && !a.is_correct">Your Choice</span>
                </div>
              </div>

              <div class="txt-ans" v-if="q.answer_text">
                <strong>Your answer:</strong> {{ q.answer_text }}
              </div>
              <div class="skip-note" v-if="!q.answered">⏭️ You skipped this question.</div>
              <div class="expl" v-if="q.explanation">
                <span class="expl-lbl">💡 Explanation:</span> {{ q.explanation }}
              </div>
            </div>
          </div>
        </div>
      </div>

      </div> <!-- /page-content -->
    </template>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* { box-sizing: border-box; }
.rp {
  font-family: 'Inter', sans-serif;
  background: #f1f5f9;
  min-height: 100vh;
  padding: 0 0 60px;
}

/* ── Center Pad ─────────────── */
.center-pad { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #64748b; }
.spin-ring { width: 44px; height: 44px; border: 4px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.load-txt { font-size: .9rem; color: #94a3b8; }
.err-box { background: #fef2f2; color: #b91c1c; padding: 1rem 1.5rem; border-radius: 12px; border-left: 4px solid #b91c1c; }
.btn-ghost { padding: .5rem 1.25rem; border: 1.5px solid #e2e8f0; border-radius: 8px; background: white; color: #374151; font-weight: 600; font-size: .85rem; cursor: pointer; }

/* ── Sticky Header ─────────────── */
.sticky-header {
  position: sticky; top: 0; z-index: 50; background: white;
  border-bottom: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
}

.top-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 2rem; max-width: 1040px; margin: 0 auto; gap: 1rem;
}

.th-left { display: flex; align-items: center; gap: 1rem; flex: 1; }
.btn-back { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; color: #6b7280; cursor: pointer; transition: all .2s; flex-shrink: 0; }
.btn-back:hover { background: #f3f4f6; color: #111827; }

.th-titles { display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.sub-label { font-size: 0.65rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
.test-name { font-size: 1.2rem; font-weight: 800; color: #111827; margin: 0; line-height: 1.2; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.test-meta-inline { font-size: 0.75rem; color: #9ca3af; font-weight: 500; margin-top: 4px; }

.th-right { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; flex-shrink: 0; }
.attempt-switch-wrap { display: flex; align-items: center; gap: .4rem; background: #f9fafb; padding: .4rem .85rem; border-radius: 8px; border: 1px solid #e5e7eb; }
.attempt-switch-wrap label { font-size: .75rem; font-weight: 700; color: #6b7280; text-transform: uppercase; }
.attempt-switch-sel { background: transparent; border: none; font-size: .85rem; font-weight: 700; color: #111827; outline: none; cursor: pointer; }

.btn-retake { background: #111827; color: white; border: none; padding: .5rem 1.1rem; border-radius: 8px; font-weight: 600; font-size: .85rem; cursor: pointer; transition: background .2s; }
.btn-retake:hover { background: #374151; }

/* ── Tabs ─────────────── */
.tabs-bar { display: flex; gap: 0; max-width: 1040px; margin: 0 auto; padding: 0 2rem; overflow-x: auto; }
.tab { padding: .8rem 1.25rem; border: none; background: none; font-weight: 600; font-size: .88rem; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; transition: all .15s; white-space: nowrap; }
.tab:hover { color: #111827; }
.tab.active { color: #111827; border-bottom-color: #111827; }

/* ── Page Content ─────────────── */
.page-content { padding: 2rem; max-width: 1040px; margin: 0 auto; }

/* ── Score Section ─────────────── */
.score-section {
  background: white; border-radius: 16px; border: 1px solid #f3f4f6; box-shadow: 0 4px 6px rgba(0,0,0,0.02), 0 10px 15px rgba(0,0,0,0.03);
  padding: 2rem; display: flex; gap: 2.5rem; align-items: center; flex-wrap: wrap; margin-bottom: 2rem;
}

/* Gauge */
.gauge-card { position: relative; width: 130px; height: 130px; flex-shrink: 0; }
.gauge-svg  { width: 130px; height: 130px; transform: rotate(-90deg); }
.g-bg  { fill: none; stroke: #f1f5f9; stroke-width: 10; }
.g-fg  { fill: none; stroke-width: 10; stroke-linecap: round; stroke-dasharray: 327; transition: stroke-dashoffset 1s ease, stroke 0.4s; }
.gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.gauge-pct { font-size: 26px; font-weight: 900; color: #1e1b4b; line-height: 1; }
.gauge-sub { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }

/* Score Stats */
.score-stats { flex: 1; min-width: 260px; }
.big-score-row { display: flex; align-items: baseline; gap: .4rem; margin-bottom: 1rem; flex-wrap: wrap; }
.big-num   { font-size: 2.8rem; font-weight: 900; color: #111827; line-height: 1; }
.big-sep   { font-size: 1.5rem; color: #94a3b8; }
.big-max   { font-size: 1.4rem; font-weight: 700; color: #6b7280; }
.big-pts   { font-size: .9rem; color: #94a3b8; }
.pass-pill { padding: .3rem .9rem; border-radius: 20px; font-size: .78rem; font-weight: 700; margin-left: .25rem; }
.pass-pill.pass    { background: #dcfce7; color: #15803d; }
.pass-pill.fail    { background: #fee2e2; color: #b91c1c; }
.pass-pill.neutral { background: #e0e7ff; color: #4338ca; }

/* Questions bar */
.qs-bar { display: flex; align-items: center; gap: 0; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
.qs-item { display: flex; flex-direction: column; align-items: center; padding: .65rem 1.1rem; flex: 1; }
.qs-sep  { width: 1px; background: #e2e8f0; align-self: stretch; }
.qs-val  { font-size: 1.4rem; font-weight: 900; color: #1e1b4b; }
.qs-lbl  { font-size: .68rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 1px; }
.qs-item.g .qs-val { color: #16a34a; }
.qs-item.r .qs-val { color: #dc2626; }
.qs-item.a .qs-val { color: #d97706; }
.qs-item.b .qs-val { color: #4338ca; }

/* Rank row */
.rank-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.rank-badge { display: flex; align-items: center; gap: .65rem; padding: .6rem 1rem; border-radius: 10px; border: 2px solid; }
.rank-badge.gold    { border-color: #fbbf24; background: #fffbeb; }
.rank-badge.silver  { border-color: #94a3b8; background: #f8fafc; }
.rank-badge.bronze  { border-color: #b45309; background: #fef3c7; }
.rank-badge.default { border-color: #6366f1; background: #eef2ff; }
.rank-icon  { font-size: 1.6rem; }
.rank-label { font-size: .9rem; font-weight: 800; color: #1e1b4b; display: block; }
.rank-sub   { font-size: .72rem; color: #64748b; }
.percentile-badge { display: flex; flex-direction: column; align-items: center; padding: .6rem 1rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 10px; }
.pct-big { font-size: 1.3rem; font-weight: 900; color: white; }
.pct-lbl { font-size: .68rem; color: rgba(255,255,255,.8); text-transform: uppercase; font-weight: 700; }

/* Locked Banner */
.locked-banner { background: #fef9c3; border-left: 4px solid #facc15; border-radius: 10px; padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1rem; color: #713f12; margin-bottom: 1.5rem; }
.lock-icon { font-size: 2rem; flex-shrink: 0; }
.locked-banner strong { display: block; font-weight: 700; margin-bottom: .2rem; }
.locked-banner p { margin: 0; font-size: .88rem; }

/* ── Overview ─────────────── */
.overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.ov-card { background: white; border-radius: 14px; padding: 1.25rem 1rem; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
.ov-icon { font-size: 1.5rem; margin-bottom: .4rem; }
.ov-val  { font-size: .95rem; font-weight: 700; color: #111827; }
.ov-lbl  { font-size: .72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-top: .2rem; }

.accuracy-bar-section { background: white; border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; }
.ab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
.ab-title  { font-size: .88rem; font-weight: 700; color: #374151; }
.ab-val    { font-size: 1.3rem; font-weight: 900; }
.ab-track  { background: #f1f5f9; border-radius: 6px; height: 10px; overflow: hidden; }
.ab-fill   { height: 100%; border-radius: 6px; transition: width 1.2s cubic-bezier(.34,1.56,.64,1); }

.comparison-card { background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 14px; padding: 1.1rem 1.5rem; display: flex; align-items: center; gap: 1rem; }
.cmp-icon { font-size: 1.8rem; }
.cmp-text { font-size: .88rem; color: white; display: flex; flex-wrap: wrap; gap: .25rem; }
.cmp-text strong { font-weight: 800; }

/* ── Analytics ─────────────── */
.section-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 1.5rem; margin-bottom: 1.5rem; }
.sc-header { display: flex; align-items: center; gap: .6rem; margin-bottom: 1.25rem; }
.sc-icon { font-size: 1.3rem; }
.sc-header h3 { font-size: 1.05rem; font-weight: 800; color: #1e1b4b; margin: 0; flex: 1; }
.sc-sub { font-size: .78rem; color: #94a3b8; font-weight: 600; }

.weak-list { display: flex; flex-direction: column; gap: .75rem; }
.weak-row { display: flex; align-items: center; gap: .75rem; }
.weak-topic { font-size: .85rem; color: #374151; font-weight: 600; min-width: 150px; }
.weak-bar-wrap { flex: 1; background: #fef2f2; border-radius: 6px; height: 8px; overflow: hidden; }
.weak-bar { height: 100%; background: linear-gradient(90deg, #ef4444, #f97316); border-radius: 6px; transition: width .8s ease; }
.weak-pct { font-size: .82rem; font-weight: 700; color: #dc2626; min-width: 40px; text-align: right; }

.breakdown-table { width: 100%; }
.bt-head, .bt-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: .5rem; padding: .6rem .5rem; }
.bt-head { font-size: .72rem; font-weight: 700; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #f1f5f9; }
.bt-row { font-size: .85rem; border-bottom: 1px solid #f8fafc; align-items: center; }
.bt-row:hover { background: #fafafa; }
.bt-topic { font-weight: 600; color: #374151; }
.bt-cell { font-weight: 700; color: #1e1b4b; }
.bt-cell.green { color: #16a34a; }
.bt-cell.red   { color: #dc2626; }
.bt-cell.amber { color: #d97706; }

.no-data { text-align: center; padding: 3rem; color: #94a3b8; }
.no-data span { font-size: 2.5rem; display: block; margin-bottom: .75rem; }

/* ── Leaderboard ─────────────── */
.my-rank-card { background: linear-gradient(135deg, #1e1b4b, #4338ca); border-radius: 12px; padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.mr-left { display: flex; align-items: center; gap: .8rem; }
.mr-icon  { font-size: 1.8rem; }
.mr-name  { font-size: .95rem; font-weight: 700; color: white; }
.mr-sub   { font-size: .75rem; color: #a5b4fc; }
.mr-rank  { font-size: 1.8rem; font-weight: 900; color: white; }
.mr-score { font-size: .82rem; color: #a5b4fc; text-align: right; display: block; }

.lb-list { display: flex; flex-direction: column; gap: .5rem; }
.lb-row  { display: flex; align-items: center; gap: .85rem; padding: .7rem 1rem; border-radius: 10px; background: #f8fafc; transition: all .15s; }
.lb-row:hover { background: #f1f5f9; }
.lb-row.lb-me  { background: #eef2ff; border: 1.5px solid #6366f1; }
.lb-row.lb-top3 { background: #fffbeb; }
.lb-rank  { font-size: 1.1rem; min-width: 34px; text-align: center; }
.lb-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: .88rem; color: white; flex-shrink: 0; }
.lb-name  { flex: 1; display: flex; align-items: center; gap: .4rem; }
.lb-uname { font-size: .88rem; font-weight: 700; color: #1e1b4b; }
.lb-you   { font-size: .7rem; background: #6366f1; color: white; padding: .1rem .45rem; border-radius: 20px; font-weight: 700; }
.lb-score { font-size: .9rem; font-weight: 800; color: #4338ca; }

.attempt-select-wrap { display: flex; align-items: center; gap: .5rem; font-size: .85rem; color: #64748b; font-weight: 600; }
.attempt-select { padding: .35rem .6rem; border: 1.5px solid #e2e8f0; border-radius: 6px; font-size: .82rem; font-weight: 700; color: #1e1b4b; background: #f8fafc; cursor: pointer; outline: none; }
.attempt-select:focus { border-color: #6366f1; }

/* ── Review ─────────────── */
.review-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.rv-count { font-size: .88rem; font-weight: 700; color: #64748b; }
.rv-btns  { display: flex; gap: .5rem; }
.rv-btns button { padding: .35rem .85rem; border-radius: 7px; border: 1.5px solid #e2e8f0; background: white; font-size: .8rem; font-weight: 600; cursor: pointer; color: #374151; transition: all .15s; }
.rv-btns button:hover { border-color: #6366f1; color: #6366f1; }

.q-list { display: flex; flex-direction: column; gap: .7rem; }
.q-card { background: white; border-radius: 12px; border: 1.5px solid #e2e8f0; overflow: hidden; }
.q-card.qc-ok    { border-left: 4px solid #22c55e; }
.q-card.qc-wrong { border-left: 4px solid #ef4444; }
.q-card.qc-skip  { border-left: 4px solid #f59e0b; }

.q-hdr { display: flex; justify-content: space-between; align-items: center; padding: .85rem 1.1rem; cursor: pointer; gap: .75rem; user-select: none; }
.q-hdr:hover { background: #fafafa; }
.q-hl  { display: flex; align-items: center; gap: .55rem; flex: 1; min-width: 0; }
.q-num { background: #eef2ff; color: #4338ca; font-size: .72rem; font-weight: 800; padding: .18rem .55rem; border-radius: 5px; white-space: nowrap; flex-shrink: 0; }
.q-si  { font-size: 1rem; flex-shrink: 0; }
.q-prev { font-size: .87rem; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.q-hr  { display: flex; align-items: center; gap: .5rem; flex-shrink: 0; }
.q-chip { font-size: .76rem; font-weight: 800; padding: .22rem .65rem; border-radius: 20px; }
.q-chip.pos  { background: #dcfce7; color: #166534; }
.q-chip.neg  { background: #fee2e2; color: #b91c1c; }
.q-chip.zero { background: #f1f5f9; color: #64748b; }
.q-chev { font-size: .68rem; color: #94a3b8; }

.q-body { padding: .75rem 1.1rem 1rem; border-top: 1px solid #f1f5f9; }
.q-full-text { font-size: .95rem; font-weight: 600; color: #1f2937; margin: 0 0 .85rem; line-height: 1.6; }

.ans-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: .85rem; }
.ans-row  { display: flex; align-items: flex-start; gap: .6rem; padding: .55rem .85rem; border-radius: 8px; font-size: .87rem; border: 1px solid transparent; }
.ai { font-size: .85rem; font-weight: 900; flex-shrink: 0; min-width: 14px; }
.at { flex: 1; color: #374151; }
.a-tag { font-size: .7rem; font-weight: 700; padding: .1rem .45rem; border-radius: 4px; white-space: nowrap; }
.a-tag.correct  { background: #dcfce7; color: #15803d; }
.a-tag.selected { background: #fee2e2; color: #b91c1c; }
.ans-ok      { background: #f0fdf4; border-color: #bbf7d0; }
.ans-missed  { background: #fafff4; border-color: #e5e7eb; }
.ans-wrong   { background: #fef2f2; border-color: #fecaca; }
.ans-neutral { background: #f9fafb; border-color: #f3f4f6; }

.txt-ans { background: #f9fafb; border-radius: 8px; padding: .65rem .9rem; font-size: .87rem; color: #374151; margin-bottom: .75rem; }
.skip-note { background: #fef3c7; border-radius: 8px; padding: .65rem .9rem; font-size: .84rem; color: #92400e; margin-bottom: .75rem; }
.expl { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: .65rem .9rem; font-size: .83rem; color: #78350f; display: flex; gap: .5rem; margin-top: .5rem; }
.expl-lbl { font-weight: 700; flex-shrink: 0; }

@media (max-width: 640px) {
  .top-header { flex-direction: column; align-items: stretch; padding: 1rem; gap: 1rem; }
  .th-left { width: 100%; display: flex; align-items: center; }
  .test-name { font-size: 1.1rem; white-space: normal; }
  .th-right { justify-content: space-between; align-items: center; flex-wrap: nowrap; }
  .attempt-switch-wrap { flex: 1; margin-right: .5rem; }
  .btn-retake { flex-shrink: 0; padding: .5rem .75rem; }
  .tabs-bar { padding: 0 1rem; }
  .page-content { padding: 1rem; }
  .score-section { padding: 1.5rem 1rem; flex-direction: column; align-items: center; text-align: center; gap: 1.5rem; }
  .big-score-row { justify-content: center; }
  .rank-row { justify-content: center; }
  .bt-head, .bt-row { grid-template-columns: 1.5fr 1fr 1fr 1fr; }
  .bt-head span:nth-child(4), .bt-row span:nth-child(4) { display: none; }
}
</style>
