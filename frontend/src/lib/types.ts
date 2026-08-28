export type Role = 'super-admin' | 'Admin' | 'Lead' | 'Member';

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  'super-admin': 'Director',
  'Admin': 'Manager',
  'Lead': 'Team Lead',
  'Member': 'Teammate',
};

export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role as Role] || role;
}
export type ProjectCategory = 'Marketplace' | 'BDM' | 'Servicing' | 'Internal' | 'Outside';
export type TaskStatus = 'Todo' | 'Working' | 'On Review' | 'Complete';
export type TaskPriority = 'Low' | 'High' | 'Urgent';
export type ClientStatus = 'Active' | 'Inactive' | 'Lead';
// Per-task category — independent of the parent project's own category.
export type TaskCategory = 'Automation' | 'Website' | 'Landing page' | 'Workflow' | 'Meta' | 'Vibe coding' | 'Research' | 'Documentation' | 'AI Agent' | 'Other';


export interface TeamMember {
  id: string; // This can be the Supabase Auth ID, or a separate ID
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  location?: string;
  department?: string;
  bio?: string;
  avatar_url?: string;
  is_first_login?: boolean;
  is_paused?: boolean;
  created_at?: string;
  // Set when this member was invited by a Lead — puts them "under" that Lead
  // for team-scoped views (e.g. that Lead's Reports page).
  managed_by_id?: string | null;
}

export interface Client {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  contacted_by?: string;
  status: ClientStatus;
  created_at?: string;
}

export interface ProjectCredential {
  id: string;
  project_id: string;
  label: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  url: string;
  doc_type: 'Brief' | 'Spec' | 'Design' | 'Contract' | 'Link' | 'Other';
}

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  project_lead_id: string | null;
  brief?: string;
  client_id?: string;
  client_name?: string;
  start_date?: string;
  status?: 'Active' | 'Paused' | 'Completed';
  priority?: TaskPriority;
  project_type?: string;
  sort_order?: number;
  created_at?: string;
  // Joined
  project_lead?: TeamMember;
  credentials?: ProjectCredential[];
  documents?: ProjectDocument[];
}

export interface Task {
  id: string;
  project_id: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  reference_doc_id?: string | null;
  category?: TaskCategory | null;
  // Manually entered hours — same shape as total_logged_hours/total_billing_hours.
  estimated_time?: number | null;
  total_logged_hours?: number;
  total_billing_hours?: number;
  log_date?: string;
  created_at?: string;
  updated_at?: string;
  // Joined
  project?: Project;
  assignees?: TeamMember[];
  reference_doc?: { id: string; title: string; url: string; doc_type: string } | null;
  // Per-assignment status (overrides tasks.status for a specific member)
  assignment_status?: TaskStatus | null;
}

export interface TaskAssignment {
  task_id: string;
  member_id: string;
  status?: TaskStatus;
}

export interface TimeLog {
  id: string;
  task_id: string;
  member_id: string;
  hours_logged: number;
  billing_hours: number;
  log_date: string;
  created_at?: string;
}

export interface Subscription {
  id: string;
  name: string;
  email: string;
  amount: number;
  status: string;
  start_date: string;
  end_date: string;
  is_free_trial?: boolean;
  trial_expiration_date?: string;
  subscribed_by?: string;
}

export const TASK_STATUSES: TaskStatus[] = ['Todo', 'Working', 'On Review', 'Complete'];
export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'High', 'Urgent'];
export const PROJECT_CATEGORIES: ProjectCategory[] = ['Marketplace', 'BDM', 'Servicing', 'Internal', 'Outside'];
export const TASK_CATEGORIES: TaskCategory[] = ['Automation', 'Website', 'Landing page', 'Workflow', 'Meta', 'Vibe coding', 'Research', 'Documentation', 'AI Agent', 'Other'];

export type TimeRange = 'Today' | 'Yesterday' | 'Last 7 Days' | 'This Month' | 'All Time';

export const SYSTEM_ADMIN_EMAIL = 'system@sys.com';
