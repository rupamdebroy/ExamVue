export const API_BASE_URL = 'http://pro.rundoc.in/api';

export const API_ENDPOINTS = {
  // Auth & General
  LOGIN: `${API_BASE_URL}/login.php`,
  USER_PROFILE: `${API_BASE_URL}/user.php`,
  TESTS: `${API_BASE_URL}/tests.php`,

  // Admin APIs
  ADMIN_USERS: `${API_BASE_URL}/admin/users.php`,
  ADMIN_TESTS: `${API_BASE_URL}/admin/tests.php`,
  ADMIN_MODULES: `${API_BASE_URL}/admin/modules.php`,
  ADMIN_TOPICS: `${API_BASE_URL}/admin/topics.php`,
  ADMIN_QUESTIONS: `${API_BASE_URL}/admin/questions.php`,
  ADMIN_QUESTIONS_LIST: `${API_BASE_URL}/admin/questions_list.php`,
  ADMIN_ANSWERS: `${API_BASE_URL}/admin/answers.php`,
  ADMIN_MANAGE_TEST: `${API_BASE_URL}/admin/manageTest.php`,
  ADMIN_QUESTIONS_POOL: `${API_BASE_URL}/admin/questions_pool.php`,
  ADMIN_TEST_QUESTIONS: `${API_BASE_URL}/admin/test_questions.php`,
};
