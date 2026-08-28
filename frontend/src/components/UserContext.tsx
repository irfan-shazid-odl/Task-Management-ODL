'use client';

import React, { createContext, useContext, useEffect, useCallback, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getToken } from '@/lib/api';
import { TeamMember } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser, patchUser, clearAuth, setStatus, setShowPasswordModal } from '@/store/slices/authSlice';
import { useTeamMembers } from '@/hooks/queries/useTeamMembers';
import { queryKeys } from '@/lib/query/queryKeys';

// Backwards-compatible facade over Redux (auth) + TanStack Query (team members).
// Pages keep calling `useUser()` exactly as before; the internals are now
// standard state management instead of local component state.
interface UserContextType {
  currentUser: TeamMember | null;
  setCurrentUser: (user: TeamMember | null) => void;
  teamMembers: TeamMember[];
  setTeamMembers: (updater: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => void;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  showPasswordModal: boolean;
  setShowPasswordModal: (v: boolean) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  teamMembers: [],
  setTeamMembers: () => {},
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
  showPasswordModal: false,
  setShowPasswordModal: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const qc = useQueryClient();

  const currentUser = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);
  const showPasswordModal = useAppSelector((s) => s.auth.showPasswordModal);
  const loading = status === 'idle' || status === 'loading';

  // Team members come from the server via TanStack Query, gated on auth.
  const { data: teamMembers = [] } = useTeamMembers(status === 'authenticated');

  const loadSession = useCallback(async () => {
    if (!getToken()) {
      dispatch(setUser(null));
      return;
    }
    dispatch(setStatus('loading'));
    try {
      const user = await api.auth.me();
      if (user.is_paused && user.role !== 'super-admin') {
        api.auth.logout();
        dispatch(clearAuth());
        router.replace('/login?paused=true');
        return;
      }
      dispatch(setUser(user));
      const dismissalKey = `pwd_dismissed_${user.id}`;
      if (user.is_first_login && !localStorage.getItem(dismissalKey)) {
        dispatch(setShowPasswordModal(true));
      }
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
    } catch {
      api.auth.logout();
      dispatch(clearAuth());
    }
  }, [dispatch, router, qc]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const setCurrentUser = useCallback(
    (user: TeamMember | null) => dispatch(setUser(user)),
    [dispatch],
  );

  const setTeamMembers = useCallback(
    (updater: TeamMember[] | ((prev: TeamMember[]) => TeamMember[])) => {
      qc.setQueryData<TeamMember[]>(queryKeys.users.all, (old = []) =>
        typeof updater === 'function' ? (updater as (p: TeamMember[]) => TeamMember[])(old) : updater,
      );
    },
    [qc],
  );

  const logout = useCallback(async () => {
    api.auth.logout();
    dispatch(clearAuth());
    qc.clear();
    router.push('/login');
  }, [dispatch, qc, router]);

  // First-login password change (the bottom-right prompt).
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setChangingPass(true);
    try {
      await api.auth.changePassword(newPassword);
      dispatch(patchUser({ is_first_login: false }));
      dispatch(setShowPasswordModal(false));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update password');
    }
    setChangingPass(false);
  };

  return (
    <UserContext.Provider value={{
      currentUser, setCurrentUser, teamMembers, setTeamMembers,
      loading, logout, refreshUser: loadSession,
      showPasswordModal, setShowPasswordModal: (v) => dispatch(setShowPasswordModal(v)),
    }}>
      {children}

      {/* Non-Blocking Password Change Notification */}
      {showPasswordModal && currentUser?.is_first_login && (
        <div className="fixed bottom-6 right-6 z-[100] w-full max-w-sm pointer-events-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Temporary Password</h3>
                <p className="text-xs text-slate-500 mt-1">Please update your password to fully secure your account.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  placeholder="New password (min 6 chars)"
                />
              </div>
              <div className="flex gap-2">
                 <button
                   onClick={() => {
                     if (currentUser) {
                       localStorage.setItem(`pwd_dismissed_${currentUser.id}`, 'true');
                     }
                     dispatch(setShowPasswordModal(false));
                   }}
                   className="flex-1 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                 >
                   Later
                 </button>
                 <button
                   onClick={handlePasswordChange}
                   disabled={changingPass || newPassword.length < 6}
                   className="flex-[2] flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-sm"
                 >
                   {changingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
