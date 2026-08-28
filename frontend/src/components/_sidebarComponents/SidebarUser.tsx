import React from 'react';
import Link from 'next/link';
import Avatar from '../Avatar';
import { LogOut, Sun, Moon, Shield, Star, User } from 'lucide-react';
import { TeamMember, getRoleDisplayName } from '@/lib/types';

interface SidebarUserProps {
  currentUser: TeamMember | null;
  theme: string | undefined;
  toggleTheme: () => void;
  logout: () => void;
  onClose: () => void;
}

export default function SidebarUser({ currentUser, theme, toggleTheme, logout, onClose }: SidebarUserProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30';
      case 'Admin': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
      case 'Lead': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
      default: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super-admin': return <Shield className="w-3 h-3" />;
      case 'Admin': return <Shield className="w-3 h-3" />;
      case 'Lead': return <Star className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  return (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50/50 dark:from-slate-800/50 to-slate-50 dark:to-slate-800">
          {currentUser && (
            <div className="flex flex-col gap-2">
              <Link
                href="/profile"
                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 shadow-sm hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-md transition-all group"
              >
                <div className="relative shrink-0">
                  <Avatar
                    path={currentUser.avatar_url}
                    name={currentUser.name}
                    className="w-9 h-9 rounded-full border border-violet-200 bg-violet-100 text-violet-700 text-sm"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">{currentUser.name}</p>
                  <span className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeColor(currentUser.role)}`}>
                    {getRoleIcon(currentUser.role)}
                    {getRoleDisplayName(currentUser.role)}
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-9 h-9 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-lg transition-all shrink-0"
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => logout()}
                  className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 hover:shadow-sm rounded-lg transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
  );
}

