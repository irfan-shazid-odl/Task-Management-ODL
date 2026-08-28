'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'violet' | 'cyan' | 'amber' | 'emerald' | 'rose';
}

const colorMap = {
  violet: {
    bg: 'from-white to-violet-50/50 dark:from-slate-800 dark:to-violet-500/10',
    border: 'border-violet-100 dark:border-violet-500/20',
    icon: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20',
    glow: 'shadow-violet-500/5 dark:shadow-violet-500/10',
  },
  cyan: {
    bg: 'from-white to-cyan-50/50 dark:from-slate-800 dark:to-cyan-500/10',
    border: 'border-cyan-100 dark:border-cyan-500/20',
    icon: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/20',
    glow: 'shadow-cyan-500/5 dark:shadow-cyan-500/10',
  },
  amber: {
    bg: 'from-white to-amber-50/50 dark:from-slate-800 dark:to-amber-500/10',
    border: 'border-amber-100 dark:border-amber-500/20',
    icon: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20',
    glow: 'shadow-amber-500/5 dark:shadow-amber-500/10',
  },
  emerald: {
    bg: 'from-white to-emerald-50/50 dark:from-slate-800 dark:to-emerald-500/10',
    border: 'border-emerald-100 dark:border-emerald-500/20',
    icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20',
    glow: 'shadow-emerald-500/5 dark:shadow-emerald-500/10',
  },
  rose: {
    bg: 'from-white to-rose-50/50 dark:from-slate-800 dark:to-rose-500/10',
    border: 'border-rose-100 dark:border-rose-500/20',
    icon: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20',
    glow: 'shadow-rose-500/5 dark:shadow-rose-500/10',
  },
};

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'violet' }: MetricCardProps) {
  const c = colorMap[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} p-6 
      shadow-sm ${c.glow} transition-all duration-300 hover:scale-[1.02] hover:shadow-md group`}
    >
      {/* Decorative orb */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-white dark:from-slate-800 to-transparent blur-2xl group-hover:opacity-75 transition-opacity" />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${c.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
