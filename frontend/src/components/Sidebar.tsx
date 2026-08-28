'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from './UserContext';
import { useTheme } from './ThemeProvider';
import { api, subscribeToChanges } from '@/lib/api';

import SidebarHeader from './_sidebarComponents/SidebarHeader';
import SidebarNav from './_sidebarComponents/SidebarNav';
import SidebarUser from './_sidebarComponents/SidebarUser';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  
  const [expiringSubs, setExpiringSubs] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch expiring subscriptions count
    const fetchExpiring = async () => {
      if (!['super-admin', 'Admin'].includes(currentUser.role)) return;
      try {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        const subs = await api.subscriptions.list();
        const expiring = (subs || []).filter(
          s =>
            (s.end_date != null && s.end_date <= nextWeekStr) ||
            (s.trial_expiration_date != null && s.trial_expiration_date <= nextWeekStr)
        );
        
        setExpiringSubs(expiring.length);
      } catch (err) {
        console.error('Failed to fetch subscriptions', err);
      }
    };

    fetchExpiring();

    const unsub = subscribeToChanges(() => {
      fetchExpiring();
    });

    return () => {
      unsub();
    };
  }, [currentUser]);

  return (
    <>
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-[60] shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarHeader onClose={onClose} />
        <SidebarNav currentUser={currentUser} pathname={pathname} expiringSubs={expiringSubs} onClose={onClose} />
        <SidebarUser currentUser={currentUser} theme={theme} toggleTheme={toggleTheme} logout={logout} onClose={onClose} />
      </aside>
    </>
  );
}
