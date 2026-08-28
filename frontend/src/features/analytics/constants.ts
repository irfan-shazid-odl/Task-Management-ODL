import { Crown, Medal, Award } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
export interface MemberStats {
  id: string;
  name: string;
  role: string;
  totalHours: number;
  totalBillingHours: number;
  tasksCompleted: number;
  tasksAssigned: number;
  projectsInvolved: number;
  avgHoursPerTask: number;
  completionRate: number;
  // Composite score: weighted combination of all metrics
  score: number;
}

export interface LeadStats {
  id: string;
  name: string;
  role: string;
  projectsManaged: number;
  totalProjectHours: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  teamSize: number; // unique members across projects
  score: number;
}

export type Period = 'day' | 'month' | 'year';

export function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from: string;
  switch (period) {
    case 'day':
      from = to;
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      break;
    case 'year':
      from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      break;
  }
  return { from, to };
}

export const PERIOD_LABELS: Record<Period, string> = {
  day: 'Today',
  month: 'This Month',
  year: 'This Year',
};

export const RANK_STYLES = [
  { bg: 'bg-gradient-to-r from-amber-400 to-yellow-500', text: 'text-white', icon: Crown, label: '1st' },
  { bg: 'bg-gradient-to-r from-slate-300 to-slate-400', text: 'text-white', icon: Medal, label: '2nd' },
  { bg: 'bg-gradient-to-r from-amber-600 to-amber-700', text: 'text-white', icon: Award, label: '3rd' },
];
