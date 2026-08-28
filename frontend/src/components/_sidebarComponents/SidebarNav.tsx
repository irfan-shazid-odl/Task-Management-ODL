import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { navSections } from './constants';
import { TeamMember } from '@/lib/types';

interface SidebarNavProps {
  currentUser: TeamMember | null;
  pathname: string;
  expiringSubs: number;
  onClose: () => void;
}

export default function SidebarNav({ currentUser, pathname, expiringSubs, onClose }: SidebarNavProps) {
  const [showMore, setShowMore] = useState(false);

  return (
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {navSections.map((section) => {
            const visible = section.items.filter(item =>
              currentUser &&
              item.roles.includes(currentUser.role) &&
              !item.secondary
            );
            if (visible.length === 0) return null;
            return (
              <div key={section.label} className="space-y-1.5">
                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold mb-2 px-3">{section.label}</p>
                {visible.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                      className={`relative flex items-center justify-between pl-3 pr-3 py-2 rounded-xl text-sm font-medium border shadow-sm transition-all duration-200 group overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-50 dark:from-violet-500/20 to-white dark:to-slate-800 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30 shadow-violet-100/60'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-md hover:-translate-y-px'
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-violet-600 transition-all duration-200 ${
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                        }`}
                      />
                      <span className="flex items-center gap-2.5">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-200 ${
                          isActive
                            ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-300 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-500/20 group-hover:border-violet-200 dark:group-hover:border-violet-500/30 group-hover:text-violet-600 dark:group-hover:text-violet-300'
                        }`}>
                          <item.icon className="w-3.5 h-3.5" />
                        </span>
                        {item.label}
                      </span>
                      <span className="flex items-center gap-2">
                        {item.href === '/subscriptions' && expiringSubs > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm">
                            {expiringSubs}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-all duration-200 ${
                            isActive
                              ? 'text-violet-500 opacity-100 translate-x-0'
                              : 'text-slate-400 dark:text-slate-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                          }`}
                        />
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {(() => {
            const secondaryVisible = navSections
              .flatMap(s => s.items)
              .filter(item => item.secondary && currentUser && item.roles.includes(currentUser.role));
            if (secondaryVisible.length === 0) return null;
            return (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                {showMore && (
                  <>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 font-bold mb-2 px-3">More</p>
                    {secondaryVisible.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                          className={`relative flex items-center justify-between pl-3 pr-3 py-2 rounded-xl text-sm font-medium border shadow-sm transition-all duration-200 group overflow-hidden ${
                            isActive
                              ? 'bg-gradient-to-r from-violet-50 dark:from-violet-500/20 to-white dark:to-slate-800 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30 shadow-violet-100/60'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-md hover:-translate-y-px'
                          }`}
                        >
                          <span
                            className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-violet-600 transition-all duration-200 ${
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
                            }`}
                          />
                          <span className="flex items-center gap-2.5">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-200 ${
                              isActive
                                ? 'bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-300 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 group-hover:bg-violet-50 dark:group-hover:bg-violet-500/20 group-hover:border-violet-200 dark:group-hover:border-violet-500/30 group-hover:text-violet-600 dark:group-hover:text-violet-300'
                            }`}>
                              <item.icon className="w-3.5 h-3.5" />
                            </span>
                            {item.label}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-all duration-200 ${
                              isActive
                                ? 'text-violet-500 opacity-100 translate-x-0'
                                : 'text-slate-400 dark:text-slate-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                            }`}
                          />
                        </Link>
                      );
                    })}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowMore(v => !v)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-600 hover:bg-violet-50 dark:hover:bg-violet-500/20 hover:text-violet-700 dark:hover:text-violet-300 hover:border-violet-200 dark:hover:border-violet-500/30 transition-colors"
                >
                  {showMore ? 'Show less' : 'Show more'}
                  <ChevronRight
                    className={`w-3 h-3 transition-transform duration-200 ${showMore ? 'rotate-90' : 'rotate-0'}`}
                  />
                </button>
              </div>
            );
          })()}
        </nav>

  );
}

