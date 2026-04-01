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
  LOGIN: `${API_BASE_URL}/login.php`,
  USER_PROFILE: `${API_BASE_URL}/user.php`,
  USER_GROUPS: `${API_BASE_URL}/user_groups.php`,

  // ── Test flow (core student-facing) ──────────────────────
  TEST_LIST: `${API_BASE_URL}/tests.php`,
  TEST_START: `${API_BASE_URL}/test_start.php`,
  TEST_QUESTIONS: `${API_BASE_URL}/test_questions_bulk.php`,   
  TEST_SAVE_ANSWER: `${API_BASE_URL}/test_answer.php`,    
  TEST_SUBMIT: `${API_BASE_URL}/test_end.php`,         
  TEST_RESULT: `${API_BASE_URL}/test_results.php`,         
  TEST_ANALYTICS: `${API_BASE_URL}/test_analytics.php`,      
  TEST_LEADERBOARD: `${API_BASE_URL}/test_leaderboard.php`,    
  TEST_PALETTE: `${API_BASE_URL}/test_palette.php`,        

  // ── Admin ─────────────────────────────────────────────────
  ADMIN_USERS: `${API_BASE_URL}/admin/users.php`,
  ADMIN_GROUPS: `${API_BASE_URL}/admin/groups.php`,
  ADMIN_TESTS: `${API_BASE_URL}/admin/tests.php`,
  ADMIN_MODULES: `${API_BASE_URL}/admin/modules.php`,
  ADMIN_TOPICS: `${API_BASE_URL}/admin/topics.php`,
  ADMIN_QUESTIONS: `${API_BASE_URL}/admin/questions.php`,
  ADMIN_QUESTIONS_LIST: `${API_BASE_URL}/admin/questions_list.php`,
  ADMIN_ANSWERS: `${API_BASE_URL}/admin/answers.php`,
  ADMIN_MANAGE_TEST: `${API_BASE_URL}/admin/manageTest.php`,
  ADMIN_QUESTIONS_POOL: `${API_BASE_URL}/admin/questions_pool.php`,
  ADMIN_TEST_QUESTIONS: `${API_BASE_URL}/admin/test_questions.php`,
  ADMIN_PASSAGES: `${API_BASE_URL}/admin/passages.php`,
  ADMIN_RESULTS: `${API_BASE_URL}/admin/results.php`,
  ADMIN_RESULT_DETAIL: `${API_BASE_URL}/admin/result_detail.php`,
  ADMIN_DELETE_RESULT: `${API_BASE_URL}/admin/delete_result.php`,
  ADMIN_EXPORT_MODULES: `${API_BASE_URL}/admin/export_modules.php`,
  ADMIN_IMPORT_MODULES: `${API_BASE_URL}/admin/import_modules.php`,
  ADMIN_EXPORT_TOPICS: `${API_BASE_URL}/admin/export_topics.php`,
  ADMIN_IMPORT_TOPICS: `${API_BASE_URL}/admin/import_topics.php`,
  ADMIN_EXPORT_QUESTIONS: `${API_BASE_URL}/admin/export_questions.php`,
  ADMIN_IMPORT_QUESTIONS: `${API_BASE_URL}/admin/import_questions.php`,
}
