import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TeamMember } from '@/lib/types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: TeamMember | null;
  status: AuthStatus;
  showPasswordModal: boolean;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  showPasswordModal: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<AuthStatus>) {
      state.status = action.payload;
    },
    setUser(state, action: PayloadAction<TeamMember | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
    patchUser(state, action: PayloadAction<Partial<TeamMember>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
    clearAuth(state) {
      state.user = null;
      state.status = 'unauthenticated';
      state.showPasswordModal = false;
    },
    setShowPasswordModal(state, action: PayloadAction<boolean>) {
      state.showPasswordModal = action.payload;
    },
  },
});

export const { setStatus, setUser, patchUser, clearAuth, setShowPasswordModal } = authSlice.actions;
export default authSlice.reducer;
