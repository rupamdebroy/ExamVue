/**
 * Central API configuration.
 * All endpoint strings live here — no raw URLs in Vue components.
 *
 * Clean URL structure (Apache-rewritten):
 *   /api/auth/*   — authentication & user
 *   /api/test/*   — student test-taking flow
 *   /api/admin/*  — admin management
 */

export const API_BASE_URL = 'https://pro.rundoc.in/api'

export const API_ENDPOINTS = {

  // ── Auth ──────────────────────────────────────────────────
  LOGIN: `${API_BASE_URL}/auth/login`,
  USER_PROFILE: `${API_BASE_URL}/auth/profile`,
  USER_GROUPS: `${API_BASE_URL}/auth/user-groups`,

  // ── Test flow (core student-facing) ──────────────────────
  TEST_LIST: `${API_BASE_URL}/test/list`,
  TEST_START: `${API_BASE_URL}/test/start`,
  TEST_QUESTIONS: `${API_BASE_URL}/test/questions`,      // GET ?testuser_id=X  → all questions bulk
  TEST_SAVE_ANSWER: `${API_BASE_URL}/test/save-answer`,    // POST per answer click
  TEST_SUBMIT: `${API_BASE_URL}/test/submit`,         // POST → finalize attempt
  TEST_RESULT: `${API_BASE_URL}/test/result`,         // GET ?testuser_id=X
  TEST_ANALYTICS: `${API_BASE_URL}/test/analytics`,      // GET ?testuser_id=X
  TEST_LEADERBOARD: `${API_BASE_URL}/test/leaderboard`,    // GET ?test_id=X
  TEST_PALETTE: `${API_BASE_URL}/test/palette`,        // GET ?testuser_id=X (legacy fallback)

  // ── Admin ─────────────────────────────────────────────────
  ADMIN_USERS: `${API_BASE_URL}/admin/users`,
  ADMIN_GROUPS: `${API_BASE_URL}/admin/groups`,
  ADMIN_TESTS: `${API_BASE_URL}/admin/tests`,
  ADMIN_MODULES: `${API_BASE_URL}/admin/modules`,
  ADMIN_TOPICS: `${API_BASE_URL}/admin/topics`,
  ADMIN_QUESTIONS: `${API_BASE_URL}/admin/questions`,
  ADMIN_QUESTIONS_LIST: `${API_BASE_URL}/admin/questions-list`,
  ADMIN_ANSWERS: `${API_BASE_URL}/admin/answers`,
  ADMIN_MANAGE_TEST: `${API_BASE_URL}/admin/manage-test`,
  ADMIN_QUESTIONS_POOL: `${API_BASE_URL}/admin/questions-pool`,
  ADMIN_TEST_QUESTIONS: `${API_BASE_URL}/admin/test-questions`,
  ADMIN_PASSAGES: `${API_BASE_URL}/admin/passages`,
  ADMIN_RESULTS: `${API_BASE_URL}/admin/results`,
  ADMIN_RESULT_DETAIL: `${API_BASE_URL}/admin/result-detail`,
  ADMIN_DELETE_RESULT: `${API_BASE_URL}/admin/delete-result`,
  ADMIN_EXPORT_MODULES: `${API_BASE_URL}/admin/export-modules`,
  ADMIN_IMPORT_MODULES: `${API_BASE_URL}/admin/import-modules`,
  ADMIN_EXPORT_TOPICS: `${API_BASE_URL}/admin/export-topics`,
  ADMIN_IMPORT_TOPICS: `${API_BASE_URL}/admin/import-topics`,
  ADMIN_EXPORT_QUESTIONS: `${API_BASE_URL}/admin/export-questions`,
  ADMIN_IMPORT_QUESTIONS: `${API_BASE_URL}/admin/import-questions`,
}
