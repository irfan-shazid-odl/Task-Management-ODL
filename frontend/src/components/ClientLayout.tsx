'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { UserProvider, useUser } from './UserContext';
import ThemeProvider from './ThemeProvider';
import AppProviders from '@/providers/AppProviders';
import Sidebar from './Sidebar';
import { Toaster } from 'sonner';
import { useTheme } from './ThemeProvider';
import { Loader2, Menu, Sun, Moon } from 'lucide-react';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  useEffect(() => {
    if (!loading && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (pathname === '/login') {
    return <main>{children}</main>;
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/80 backdrop-blur-sm z-55 lg:hidden animate-in fade-in duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="fixed top-0 left-0 right-0 lg:hidden h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-50 shadow-sm">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="h-8 w-32 relative">
            <Image
              src="https://assets.cdn.filesafe.space/VrTTgjMoHCZk4jeKOm9F/media/6979d241b9c85bad80c220d1.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-lg transition-all"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </header>

        <main className={`flex-1 min-h-screen grid-bg pt-16 lg:pt-0 lg:ml-64 ${sidebarOpen ? 'blur-[2px] lg:blur-0' : ''} transition-all duration-300`} style={{ backgroundColor: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <ThemeProvider>
        <UserProvider>
          <Toaster richColors position="bottom-right" />
          <ProtectedLayout>{children}</ProtectedLayout>
        </UserProvider>
      </ThemeProvider>
    </AppProviders>
  );
}
