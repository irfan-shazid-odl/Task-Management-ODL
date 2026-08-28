// Central API facade. Import `api` anywhere in the frontend and call
// `api.tasks.list(...)`, `api.projects.create(...)`, etc. This replaces the
// direct Supabase client that pages used previously.

import { authApi } from './resources/auth';
import { usersApi } from './resources/users';
import { projectsApi } from './resources/projects';
import { tasksApi } from './resources/tasks';
import { taskAssignmentsApi } from './resources/taskAssignments';
import { timeLogsApi } from './resources/timeLogs';
import { vaultApi } from './resources/vault';
import { activityApi } from './resources/activity';
import { filesApi } from './resources/files';
import { statsApi } from './resources/stats';
import { clientsApi, subscriptionsApi, credentialsApi, documentsApi } from './resources/misc';

export const api = {
  auth: authApi,
  users: usersApi,
  projects: projectsApi,
  tasks: tasksApi,
  taskAssignments: taskAssignmentsApi,
  timeLogs: timeLogsApi,
  clients: clientsApi,
  subscriptions: subscriptionsApi,
  activity: activityApi,
  credentials: credentialsApi,
  documents: documentsApi,
  vault: vaultApi,
  files: filesApi,
  stats: statsApi,
};

export { ApiError, getToken, setToken, clearToken, API_BASE_URL } from './client';
export { subscribeToChanges } from './realtime';
export type { Unsubscribe } from './realtime';
