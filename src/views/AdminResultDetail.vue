<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_ENDPOINTS } from '../config/constant.js'

const route  = useRoute()
const router = useRouter()

const testuser_id = ref(parseInt(route.params.testuser_id))
const token = localStorage.getItem('tce_token')
const authH = { 'Authorization': `Bearer ${token}` }

const data      = ref(null)
const loading   = ref(true)
const errorMsg  = ref('')
const expandedQ = ref(new Set())

const fetchDetail = async (tuid) => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`${API_ENDPOINTS.ADMIN_RESULT_DETAIL}?testuser_id=${tuid}`, { headers: authH })
    const json = await res.json()
    if (json.status === 'success') {
      data.value = json
    } else {
      errorMsg.value = json.message || 'Failed to load detail'
    }
  } catch {
    errorMsg.value = 'Network error loading result detail'
  } finally {
    loading.value = false
    expandedQ.value = new Set()
  }
}

const switchAttempt = (tuid) => {
  testuser_id.value = tuid
  router.replace({ params: { testuser_id: tuid } })
  fetchDetail(tuid)
}

const toggleQ = (num) => {
  if (expandedQ.value.has(num)) expandedQ.value.delete(num)
  else expandedQ.value.add(num)
}
const expandAll  = () => data.value?.questions.forEach(q => expandedQ.value.add(q.question_num))
const collapseAll = () => expandedQ.value.clear()

const scorePercent = computed(() => {
  if (!data.value || !data.value.max_score) return 0
  return Math.min(100, Math.round((data.value.user_score / data.value.max_score) * 100))
})

const passColor = computed(() => {
  if (!data.value) return '#6366f1'
  if (data.value.passed === true)  return '#16a34a'
  if (data.value.passed === false) return '#dc2626'
  return '#6366f1'
})

const formatDate = (s) => s ? new Date(s).toLocaleString() : 'N/A'
const formatDur  = (sec) => {
  if (!sec) return 'N/A'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

const ansClass = (a) => {
  if (a.is_correct && a.was_selected)  return 'ans-ok'
  if (a.is_correct && !a.was_selected) return 'ans-missed'
  if (!a.is_correct && a.was_selected) return 'ans-wrong'
  return 'ans-neutral'
}
const ansIcon = (a) => {
  if (a.is_correct && a.was_selected)  return '✓'
  if (a.is_correct && !a.was_selected) return '○'
  if (!a.is_correct && a.was_selected) return '✗'
  return ''
}

onMounted(() => fetchDetail(testuser_id.value))
</script>

<template>
  <div class="ard-page">
    <!-- Back nav -->
    <div class="top-bar">
      <button class="back-btn" @click="router.push('/admin/results')">← Back to Results</button>
      <span class="breadcrumb" v-if="data">
        {{ data.test_name }} · {{ data.user_firstname }} {{ data.user_lastname }}
      </span>
    </div>

    <div class="center-pad" v-if="loading">
      <div class="spinner"></div>
      <p>Loading result…</p>
    </div>

    <div class="error-banner" v-else-if="errorMsg">{{ errorMsg }}</div>

    <template v-else-if="data">

      <!-- ── Hero Strip ──────────────────────────────────── -->
      <div class="hero-strip">
        <!-- Gauge -->
        <div class="gauge-wrap">
          <svg viewBox="0 0 100 100" class="gauge-svg">
            <circle cx="50" cy="50" r="42" class="gauge-bg" />
            <circle cx="50" cy="50" r="42" class="gauge-fg"
              :style="{ strokeDashoffset: 264 - (264 * scorePercent / 100), stroke: passColor }" />
          </svg>
          <div class="gauge-inner">
            <span class="gauge-pct">{{ scorePercent }}%</span>
            <span class="gauge-sub">score</span>
          </div>
        </div>

        <!-- Core stats -->
        <div class="hero-info">
          <div class="hero-name">
            {{ data.user_firstname }} {{ data.user_lastname }}
            <span class="uname">@{{ data.user_name }}</span>
          </div>
          <div class="hero-test">{{ data.test_name }}</div>
          <div class="hero-score">
            <span class="big-score">{{ data.user_score ?? '—' }}</span>
            <span class="max-score"> / {{ data.max_score ?? '?' }}</span>
            <span class="pass-badge" :class="data.passed === true ? 'pass' : data.passed === false ? 'fail' : 'neutral'">
              {{ data.passed === true ? '✓ Passed' : data.passed === false ? '✗ Failed' : 'Completed' }}
            </span>
            <span class="threshold-note" v-if="data.threshold">Pass: {{ data.threshold }} pts</span>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="quick-stats">
          <div class="qs-item green">
            <div class="qs-val">{{ data.correct_count }}</div>
            <div class="qs-label">Correct</div>
          </div>
          <div class="qs-item red">
            <div class="qs-val">{{ data.wrong_count }}</div>
            <div class="qs-label">Wrong</div>
          </div>
          <div class="qs-item gray">
            <div class="qs-val">{{ data.skipped_count }}</div>
            <div class="qs-label">Skipped</div>
          </div>
          <div class="qs-item blue">
            <div class="qs-val">{{ data.question_count }}</div>
            <div class="qs-label">Total</div>
          </div>
        </div>

        <!-- Meta -->
        <div class="hero-meta">
          <div class="meta-row"><span>Duration</span><strong>{{ formatDur(data.duration_seconds) }}</strong></div>
          <div class="meta-row"><span>Started</span><strong>{{ formatDate(data.start_time) }}</strong></div>
          <div class="meta-row"><span>Ended</span><strong>{{ formatDate(data.end_time) }}</strong></div>
          <div class="meta-row"><span>Marking</span>
            <strong>+{{ data.score_right }} / {{ data.score_wrong }} / {{ data.score_unanswered }}</strong>
          </div>
        </div>
      </div>

      <!-- ── Attempt Switcher ───────────────────────────── -->
      <div class="attempt-bar" v-if="data.total_attempts > 1">
        <span class="attempt-label">🔁 Reattempts:</span>
        <button
          v-for="att in data.attempts" :key="att.testuser_id"
          class="att-btn" :class="{ active: att.is_current }"
          @click="switchAttempt(att.testuser_id)"
        >
          Attempt {{ att.attempt_number }}
          <span class="att-score">{{ att.score }} / {{ att.max_score ?? '?' }}</span>
          <span class="att-date">{{ formatDate(att.start_time) }}</span>
        </button>
      </div>
      <div class="attempt-bar single" v-else>
        <span class="attempt-label">📝 Attempt 1 of 1 (single attempt test)</span>
      </div>

      <!-- ── Questions Breakdown ────────────────────────── -->
      <div class="breakdown-header">
        <h2>Question-by-Question Review
          <span class="attempt-chip">Attempt {{ data.attempt_number }} of {{ data.total_attempts }}</span>
        </h2>
        <div class="expand-btns">
          <button @click="expandAll">Expand All</button>
          <button @click="collapseAll">Collapse All</button>
        </div>
      </div>

      <div class="questions-list">
        <div
          v-for="q in data.questions" :key="q.question_num"
          class="q-card" :class="{
            'q-correct': q.answered && q.score > 0,
            'q-wrong':   q.answered && q.score !== null && q.score <= 0,
            'q-skipped': !q.answered
          }"
        >
          <!-- Q header (always visible) -->
          <div class="q-header" @click="toggleQ(q.question_num)">
            <div class="q-left">
              <span class="q-num">Q{{ q.question_num }}</span>
              <span class="q-status-icon">
                {{ !q.answered ? '⏭️' : q.score > 0 ? '✅' : '❌' }}
              </span>
              <span class="q-text-preview">{{ q.question_text.substring(0, 100) }}{{ q.question_text.length > 100 ? '…' : '' }}</span>
            </div>
            <div class="q-right">
              <span class="q-score-chip" :class="q.score > 0 ? 'pos' : q.score < 0 ? 'neg' : 'zero'">
                {{ q.score !== null ? (q.score > 0 ? '+' : '') + q.score : 'N/A' }} / {{ q.max_q_score }}
              </span>
              <span class="q-toggle">{{ expandedQ.has(q.question_num) ? '▲' : '▼' }}</span>
            </div>
          </div>

          <!-- Q body (expanded) -->
          <div class="q-body" v-if="expandedQ.has(q.question_num)">
            <p class="q-full-text">{{ q.question_text }}</p>

            <!-- MCQ Answers -->
            <div v-if="q.answers.length" class="ans-list">
              <div v-for="a in q.answers" :key="a.id" class="ans-row" :class="ansClass(a)">
                <span class="ans-icon">{{ ansIcon(a) }}</span>
                <span class="ans-text">{{ a.description }}</span>
                <span class="ans-tag" v-if="a.is_correct">Correct</span>
                <span class="ans-tag sel" v-if="a.was_selected && !a.is_correct">User selected</span>
              </div>
            </div>

            <!-- Text answer -->
            <div class="text-ans" v-if="q.answer_text">
              <span class="ta-label">User's Answer:</span> {{ q.answer_text }}
            </div>

            <!-- Skipped note -->
            <div class="skipped-note" v-if="!q.answered">
              ⏭️ This question was not answered (skipped).
            </div>

            <!-- Explanation -->
            <div class="explanation" v-if="q.explanation">
              <span class="exp-label">💡 Explanation:</span> {{ q.explanation }}
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
.ard-page { max-width: 1100px; margin: 0 auto; padding-bottom: 60px; font-family: 'Inter', sans-serif; }

/* ── Top Bar ─────────────────────────── */
.top-bar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.back-btn { background: white; border: 1.5px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; color: #374151; font-size: 0.88rem; transition: all 0.15s; }
.back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
.breadcrumb { color: #64748b; font-size: 0.85rem; }

.center-pad { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; gap: 12px; color: #64748b; }
.spinner { width: 36px; height: 36px; border: 4px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-banner { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 10px; border-left: 4px solid #b91c1c; margin-bottom: 1rem; }

/* ── Hero Strip ──────────────────────── */
.hero-strip {
  background: white; border-radius: 16px; border: 1px solid #e2e8f0;
  padding: 1.5rem 2rem; margin-bottom: 1.25rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;
}
.gauge-wrap { position: relative; width: 110px; height: 110px; flex-shrink: 0; }
.gauge-svg { width: 110px; height: 110px; transform: rotate(-90deg); }
.gauge-bg { fill: none; stroke: #f3f4f6; stroke-width: 10; }
.gauge-fg { fill: none; stroke-width: 10; stroke-linecap: round; stroke-dasharray: 264; transition: stroke-dashoffset 0.8s ease, stroke 0.4s; }
.gauge-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.gauge-pct { font-size: 22px; font-weight: 900; color: #111827; line-height: 1; }
.gauge-sub { font-size: 10px; color: #9ca3af; font-weight: 600; text-transform: uppercase; }

.hero-info { flex: 1; min-width: 180px; }
.hero-name { font-size: 1.15rem; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.uname { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }
.hero-test { font-size: 0.88rem; color: #64748b; margin: 0.2rem 0 0.6rem; }
.hero-score { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.big-score { font-size: 2rem; font-weight: 900; color: #111827; }
.max-score { font-size: 1.1rem; color: #64748b; }
.pass-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
.pass-badge.pass { background: #dcfce7; color: #15803d; }
.pass-badge.fail { background: #fee2e2; color: #b91c1c; }
.pass-badge.neutral { background: #e0e7ff; color: #3730a3; }
.threshold-note { font-size: 0.78rem; color: #9ca3af; }

.quick-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.qs-item { display: flex; flex-direction: column; align-items: center; padding: 0.65rem 1rem; border-radius: 10px; min-width: 68px; }
.qs-item.green { background: #f0fdf4; }
.qs-item.red   { background: #fff1f2; }
.qs-item.gray  { background: #f8fafc; }
.qs-item.blue  { background: #eff6ff; }
.qs-val { font-size: 1.5rem; font-weight: 900; color: #111827; line-height: 1; }
.qs-label { font-size: 0.72rem; color: #64748b; font-weight: 600; margin-top: 2px; text-transform: uppercase; }

.hero-meta { display: flex; flex-direction: column; gap: 0.4rem; min-width: 200px; }
.meta-row { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.84rem; color: #6b7280; }
.meta-row strong { color: #111827; }

/* ── Attempt Switcher ────────────────── */
.attempt-bar {
  background: white; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 0.85rem 1.25rem; margin-bottom: 1.25rem;
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.attempt-bar.single { color: #64748b; font-size: 0.88rem; }
.attempt-label { font-size: 0.82rem; font-weight: 700; color: #374151; white-space: nowrap; }
.att-btn {
  display: flex; flex-direction: column; align-items: center;
  background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 0.4rem 0.85rem; cursor: pointer; transition: all 0.2s;
  font-size: 0.8rem; font-weight: 600; color: #374151; gap: 2px;
}
.att-btn:hover { border-color: #4f46e5; background: #eff6ff; }
.att-btn.active { border-color: #4f46e5; background: #4f46e5; color: white; }
.att-score { font-size: 0.72rem; font-weight: 800; }
.att-date { font-size: 0.65rem; opacity: 0.75; font-weight: 400; white-space: nowrap; }

/* ── Breakdown header ────────────────── */
.breakdown-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;
}
.breakdown-header h2 { font-size: 1.15rem; font-weight: 800; color: #111827; margin: 0; display: flex; align-items: center; gap: 0.6rem; }
.attempt-chip { background: #e0e7ff; color: #4338ca; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 6px; }
.expand-btns { display: flex; gap: 0.5rem; }
.expand-btns button { padding: 0.35rem 0.8rem; border-radius: 7px; border: 1.5px solid #e2e8f0; background: white; font-size: 0.78rem; font-weight: 600; cursor: pointer; color: #374151; transition: all 0.15s; }
.expand-btns button:hover { border-color: #4f46e5; color: #4f46e5; }

/* ── Q Cards ─────────────────────────── */
.questions-list { display: flex; flex-direction: column; gap: 0.65rem; }
.q-card {
  background: white; border-radius: 12px; border: 1.5px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03); overflow: hidden; transition: box-shadow 0.2s;
}
.q-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); }
.q-card.q-correct { border-left: 4px solid #22c55e; }
.q-card.q-wrong   { border-left: 4px solid #ef4444; }
.q-card.q-skipped { border-left: 4px solid #f59e0b; }

.q-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1rem; cursor: pointer; user-select: none; gap: 0.75rem;
}
.q-header:hover { background: #fafafa; }
.q-left { display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 0; }
.q-num { font-size: 0.75rem; font-weight: 800; color: #4338ca; background: #eef2ff; padding: 0.15rem 0.5rem; border-radius: 5px; white-space: nowrap; }
.q-status-icon { font-size: 1rem; flex-shrink: 0; }
.q-text-preview { font-size: 0.88rem; color: #374151; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.q-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
.q-score-chip { font-size: 0.78rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 20px; white-space: nowrap; }
.q-score-chip.pos  { background: #dcfce7; color: #166534; }
.q-score-chip.neg  { background: #fee2e2; color: #b91c1c; }
.q-score-chip.zero { background: #f1f5f9; color: #64748b; }
.q-toggle { font-size: 0.7rem; color: #94a3b8; }

.q-body { padding: 0 1rem 1rem; border-top: 1px solid #f1f5f9; }
.q-full-text { font-size: 0.96rem; font-weight: 600; color: #1f2937; margin: 0.75rem 0 1rem; line-height: 1.6; }

/* Answer rows */
.ans-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 0.85rem; }
.ans-row { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.88rem; border: 1px solid transparent; }
.ans-icon { font-size: 0.85rem; font-weight: 900; flex-shrink: 0; min-width: 14px; }
.ans-text { flex: 1; color: #374151; }
.ans-tag { font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; white-space: nowrap; background: #dcfce7; color: #15803d; }
.ans-tag.sel { background: #fee2e2; color: #b91c1c; }
.ans-ok      { background: #f0fdf4; border-color: #bbf7d0; }
.ans-missed  { background: #fafff4; border-color: #e5e7eb; color: #4b7c3f; }
.ans-wrong   { background: #fef2f2; border-color: #fecaca; }
.ans-neutral { background: #f9fafb; border-color: #f3f4f6; color: #6b7280; }

.text-ans { background: #f9fafb; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.88rem; color: #374151; margin-bottom: 0.75rem; }
.ta-label { font-weight: 700; color: #64748b; }
.skipped-note { background: #fef3c7; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.85rem; color: #92400e; margin-bottom: 0.75rem; }
.explanation { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.65rem 0.85rem; font-size: 0.84rem; color: #78350f; display: flex; gap: 0.5rem; }
.exp-label { font-weight: 700; flex-shrink: 0; }
</style>
