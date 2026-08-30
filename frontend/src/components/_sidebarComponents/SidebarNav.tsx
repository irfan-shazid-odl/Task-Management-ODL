import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { navSections } from './constants';
import { TeamMember } from '@/lib/types';

interface SidebarNavProps {
  currentUser: TeamMember | null;
  pathname: string;
  expiringSubs: number;
  onClose: () => void;
}

// Flat, minimal nav-item style shared by every role.
const ITEM_BASE =
  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150';
const ITEM_ACTIVE = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
const ITEM_INACTIVE =
  'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white';

export default function SidebarNav({ currentUser, pathname, expiringSubs, onClose }: SidebarNavProps) {
  const [showMore, setShowMore] = useState(false);

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
      {navSections.map((section) => {
        const visible = section.items.filter(item =>
          currentUser &&
          item.roles.includes(currentUser.role) &&
          !item.secondary
        );
        if (visible.length === 0) return null;
        return (
          <React.Fragment key={section.label}>
            {visible.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeOnMobile}
                  className={`${ITEM_BASE} ${isActive ? ITEM_ACTIVE : ITEM_INACTIVE}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.href === '/subscriptions' && expiringSubs > 0 && (
                    <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {expiringSubs}
                    </span>
                  )}
                </Link>
              );
            })}
          </React.Fragment>
        );
      })}

      {(() => {
        const secondaryVisible = navSections
          .flatMap(s => s.items)
          .filter(item => item.secondary && currentUser && item.roles.includes(currentUser.role));
        if (secondaryVisible.length === 0) return null;
        return (
          <div className="pt-1">
            {showMore && (
              <div className="space-y-1 pb-1">
                {secondaryVisible.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeOnMobile}
                      className={`${ITEM_BASE} ${isActive ? ITEM_ACTIVE : ITEM_INACTIVE}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowMore(v => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
            >
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`} />
              <span className="flex-1 text-left truncate">{showMore ? 'Show less' : 'Show more'}</span>
            </button>
          </div>
        );
      })()}
    </nav>
  );
}
