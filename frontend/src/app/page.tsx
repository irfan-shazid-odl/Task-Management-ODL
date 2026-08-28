'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { currentUser, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        if (currentUser.role === 'Member' || currentUser.role === 'Lead') {
          router.replace('/board');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [currentUser, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <p className="text-sm font-medium">Authenticating...</p>
      </div>
    </div>
  );
}
