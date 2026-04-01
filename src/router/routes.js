import Login from '../views/Login.vue'
import AdminDashboard from '../views/Dashboard.vue'
import UserManagement from '../views/UserManagement.vue'
import ModuleManagement from '../views/ModuleManagement.vue'
import TopicManagement from '../views/TopicManagement.vue'
import QuestionManagement from '../views/QuestionManagement.vue'
import AnswerManagement from '../views/AnswerManagement.vue'
import QuestionsListBulk from '../views/QuestionsListBulk.vue'
import TestManagement from '../views/TestManagement.vue'
import TestTaking from '../views/TestTaking.vue'
import Results from '../views/Results.vue'
import TestQuestionManager from '../views/TestQuestionManager.vue'
import PassageManagement from '../views/PassageManagement.vue'
import AdminResults from '../views/AdminResults.vue'
import AdminResultDetail from '../views/AdminResultDetail.vue'
import UserGroups from '../views/UserGroups.vue'
import CategoryManagement from '../views/CategoryManagement.vue'

export const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login },
  { path: '/dashboard', name: 'dashboard', component: AdminDashboard, meta: { requiresAuth: true, layout: 'admin' } },
  { path: '/groups', name: 'UserGroups', component: UserGroups, meta: { requiresAuth: true, layout: 'admin' } },
  { path: '/admin/users', name: 'UserManagement', component: UserManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/modules', name: 'ModuleManagement', component: ModuleManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/topics', name: 'AdminTopics', component: TopicManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/questions', name: 'AdminQuestions', component: QuestionManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/questions/:questionId/answers', name: 'AdminAnswers', component: AnswerManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/questions-list', name: 'QuestionsListBulk', component: QuestionsListBulk, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/passages', name: 'PassageManagement', component: PassageManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/tests', name: 'AdminTests', component: TestManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/tests/:id/questions', name: 'TestQuestionManager', component: TestQuestionManager, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/results', name: 'AdminResults', component: AdminResults, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/results/:testuser_id', name: 'AdminResultDetail', component: AdminResultDetail, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/admin/categories', name: 'CategoryManagement', component: CategoryManagement, meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' } },
  { path: '/test/:id', name: 'TestTaking', component: TestTaking, meta: { requiresAuth: true } },
  { path: '/results/:testuser_id', name: 'Results', component: Results, meta: { requiresAuth: true, layout: 'admin' } },
]
