import React from 'react';
import {
  LayoutDashboard,
  KanbanSquare,
  TableProperties,
  Calendar,
  Users,
  CreditCard,
  UserCircle,
  Building2,
  FileBarChart,
  KeyRound,
} from 'lucide-react';

export const navSections: {
  label: string;
  items: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: string[]; secondary?: boolean }[];
}[] = [
  {
    label: 'Workspace',
    items: [
      { href: '/board', label: 'My Board', icon: KanbanSquare, roles: ['super-admin', 'Admin', 'Lead', 'Member'] },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super-admin', 'Admin'] },
      { href: '/projects', label: 'Projects', icon: KanbanSquare, roles: ['super-admin', 'Admin', 'Lead', 'Member'] },
      { href: '/daily', label: 'Daily Planner', icon: Calendar, roles: ['super-admin', 'Admin', 'Lead', 'Member'], secondary: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/reports', label: 'Reports', icon: FileBarChart, roles: ['super-admin', 'Admin', 'Lead', 'Member'] },
      { href: '/clients', label: 'Clients', icon: Building2, roles: ['super-admin', 'Admin', 'Lead'] },
      { href: '/admin/tasks', label: 'Task Manager', icon: TableProperties, roles: ['super-admin', 'Admin', 'Lead'], secondary: true },
      { href: '/admin/users', label: 'Team Directory', icon: Users, roles: ['super-admin', 'Admin'] },
      { href: '/admin/users', label: 'Team Management', icon: Users, roles: ['Lead'] },
      { href: '/subscriptions', label: 'Subscriptions', icon: CreditCard, roles: ['super-admin', 'Admin', 'Lead'] },
      { href: '/password-vault', label: 'Password Vault', icon: KeyRound, roles: ['super-admin', 'Admin', 'Lead', 'Member'] },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: UserCircle, roles: ['super-admin', 'Admin', 'Lead', 'Member'] },
    ],
  },
];
