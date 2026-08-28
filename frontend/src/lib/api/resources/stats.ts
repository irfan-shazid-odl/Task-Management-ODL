import { apiFetch } from '../client';

export interface DashboardStats {
  totalActiveTasks: number;
  statusCounts: { status: string; count: number }[];
  totalWorkingHours: number;
  totalBillingHours: number;
  projectHours: { id: string; name: string; category: string; hours: number }[];
  totalProjects: number;
  totalMembers: number;
}

export interface ProjectsStats {
  [projectId: string]: {
    working: number;
    billing: number;
    taskCount: number;
  };
}

export const statsApi = {
  dashboard(params: { memberId?: string; startDate?: string; endDate?: string } = {}): Promise<DashboardStats> {
    return apiFetch<DashboardStats>('/stats/dashboard', { query: params as any });
  },

  projects(): Promise<ProjectsStats> {
    return apiFetch<ProjectsStats>('/stats/projects');
  },
};
