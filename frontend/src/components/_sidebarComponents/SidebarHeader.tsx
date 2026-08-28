import React from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface SidebarHeaderProps {
  onClose: () => void;
}

export default function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
        <div className="relative px-5 pt-6 pb-5 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-b from-white dark:from-slate-900 via-white dark:via-slate-900 to-slate-50/40 dark:to-slate-800/40 overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-violet-200/40 to-cyan-200/30 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="relative group shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
              <div className="relative w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:scale-[1.03]">
                <Image
                  src="/logo.png"
                  alt="logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[11px] font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-[0.22em] leading-tight">
                Ops <span className="text-violet-600">Command</span>
              </h2>
              <div className="mt-1 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[9px] text-emerald-700 font-bold tracking-wider uppercase">Live</span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold tracking-widest uppercase">v1.5.0</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden absolute top-3 right-3 p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
  );
}
