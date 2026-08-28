'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useUser } from '@/components/UserContext';
import { useTheme } from '@/components/ThemeProvider';
import { KeyRound, Shield, Loader2, Mail, Ban, Sun, Moon, X } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { currentUser, refreshUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPaused = searchParams.get('paused') === 'true';

  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fpEmail, setFpEmail] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');
  const fpSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the "reset password succeeded" auto-close timer on unmount so it
  // never fires against an unmounted component.
  useEffect(() => {
    return () => {
      if (fpSuccessTimerRef.current) clearTimeout(fpSuccessTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'Member' || currentUser.role === 'Lead') {
        router.push('/board');
      } else {
        router.push('/dashboard');
      }
    }
  }, [currentUser, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      await api.auth.login(email, password);
      setRedirecting(true);
      // Load the session into context so the redirect effect can run.
      await refreshUser();
      toast.success('Login successful! Redirecting...');
      // Note: We don't set loading to false here so the spinner stays active during the redirect.
    } catch (error) {
      // If login succeeded but loading the session failed (e.g. a transient
      // network error), make sure we don't leave `redirecting` true — otherwise
      // the "Entering Command Center" screen would render forever with no way back.
      setRedirecting(false);
      setErrorMsg(error instanceof Error ? error.message : 'Login failed.');
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    setFpEmail(email);
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpError('');
    setFpSuccess('');
    setShowForgotPassword(true);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    setFpSuccess('');

    if (!fpEmail.trim()) { setFpError('Email is required.'); return; }
    if (!fpNewPassword) { setFpError('New password is required.'); return; }
    if (fpNewPassword.length < 6) { setFpError('Password must be at least 6 characters.'); return; }
    if (fpNewPassword !== fpConfirmPassword) { setFpError('Passwords do not match.'); return; }

    setFpLoading(true);
    try {
      await api.auth.resetPassword(fpEmail.trim(), fpNewPassword);
      setFpSuccess('Password reset successfully! You can now log in with your new password.');
      if (fpSuccessTimerRef.current) clearTimeout(fpSuccessTimerRef.current);
      fpSuccessTimerRef.current = setTimeout(() => {
        setShowForgotPassword(false);
        setFpSuccess('');
        fpSuccessTimerRef.current = null;
      }, 3000);
    } catch (err) {
      setFpError(err instanceof Error ? err.message : 'Failed to reset password.');
    }
    setFpLoading(false);
  };

  if (currentUser || redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
        <Loader2 className="w-12 h-12 animate-spin text-violet-600 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Entering Command Center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 p-2.5 text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/20 transition-all shadow-sm"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full mix-blend-multiply" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="w-40 h-12 relative flex items-center justify-center">
            <Image
              src="https://assets.cdn.filesafe.space/j53xn6YJHwIdPImV00rn/media/69c3d852c144037c25328132.png"
              alt="Octopi Digital Logo"
              fill
              sizes="(max-width: 768px) 160px, 160px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-violet-500" />
            Ops Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
        </div>

        {isPaused && (
          <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <Ban className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-base font-bold text-red-700 mb-1">Access Revoked</h2>
            <p className="text-xs text-red-600 leading-relaxed">
              Your access to the Operations Command Center has been revoked by an administrator. <br />
              Please contact your team lead if you believe this is a mistake.
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 transition-all shadow-sm"
                placeholder="Ex. you@octopidigital.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200 transition-all shadow-sm"
                placeholder="********"
              />
            </div>
            <div className="mt-1 text-right">
              <button
                type="button"
                onClick={openForgotPassword}
                className="text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-medium rounded-xl hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In Securely'}
          </button>
        </form>
      </div>
      {/* ── Forgot Password Modal ─────────────────────────────────────── */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-violet-500" />
                Reset Password
              </h3>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">Enter your email and a new password to reset your account.</p>

              {fpError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium">
                  {fpError}
                </div>
              )}

              {fpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl text-center font-medium">
                  {fpSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={fpEmail}
                    onChange={e => setFpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={fpNewPassword}
                    onChange={e => setFpNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-all"
                    placeholder="Min. 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={fpConfirmPassword}
                    onChange={e => setFpConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-500 transition-all"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fpLoading || !!fpSuccess}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {fpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
