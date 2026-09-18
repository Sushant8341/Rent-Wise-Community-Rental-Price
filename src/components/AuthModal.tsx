import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ArrowRight, ShieldCheck, KeyRound, AlertCircle, Sparkles, ExternalLink, Copy, Check } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, UserProfile } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  title = "Account Verification",
  subtitle = "Secure Owner & Resident Sign-In for Andhra Pradesh"
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setUnauthorizedDomain(null);
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      if (profile) {
        onLoginSuccess(profile);
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google Sign-In was cancelled.');
      } else if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('auth/unauthorized-domain'))) {
        setUnauthorizedDomain(currentHostname);
        setErrorMsg(`Domain "${currentHostname}" is not yet authorized in your Firebase project.`);
      } else {
        setErrorMsg(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleDemoLogin = (role: 'owner' | 'tenant') => {
    const demoUser: UserProfile = role === 'owner' ? {
      uid: 'demo-owner-101',
      name: 'Ramesh Varma (Verified Owner)',
      email: 'ramesh.varma@demo.rentwise.in',
      phone: '+91 98480 22334',
    } : {
      uid: 'demo-tenant-202',
      name: 'Priya Reddy (Resident)',
      email: 'priya.reddy@demo.rentwise.in',
      phone: '+91 99887 76655',
    };
    onLoginSuccess(demoUser);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (mode === 'signup' && !name) {
      setErrorMsg('Please enter your full name for your account profile.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const profile = await signUpWithEmail(email, password, name, phone);
        if (profile) {
          onLoginSuccess(profile);
          onClose();
        }
      } else {
        const profile = await signInWithEmail(email, password);
        if (profile) {
          onLoginSuccess(profile);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let friendlyError = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        friendlyError = 'Incorrect email or password.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyError = 'No user account found with this email. Please sign up first.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyError = 'An account already exists with this email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyError = 'Password should be at least 6 characters long.';
      } else if (err.message) {
        friendlyError = err.message;
      }
      setErrorMsg(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full my-auto sm:my-6 border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 sm:p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>RentWise Security Portal</span>
          </div>

          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-white">
            {title}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 sm:mt-1">
            {subtitle}
          </p>

          {/* Sign In / Sign Up Mode Switcher Tabs */}
          <div className="flex bg-slate-800 p-1 rounded-xl mt-3 sm:mt-4 border border-slate-700">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'signin' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'signup' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
          {/* Google Sign-In Provider Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 shadow-xs transition-all hover:border-slate-300 cursor-pointer disabled:opacity-60 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
              <span className="bg-white px-2 text-slate-400">or use email credentials</span>
            </div>
          </div>

          {unauthorizedDomain && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">Authorize Domain in Firebase Console</h4>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Google Sign-In requires your current domain to be added to Authorized Domains in Firebase:
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2 bg-white/90 border border-amber-200 rounded-xl font-mono text-[11px] text-slate-800">
                <span className="truncate select-all">{unauthorizedDomain}</span>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-sans font-bold text-[10px] flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedDomain ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <a
                  href="https://console.firebase.google.com/project/rentwise-app-59198/authentication/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                >
                  <span>Open Firebase Auth Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {errorMsg && !unauthorizedDomain && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Demo Access */}
          <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Instant Demo Access (No Setup Needed):
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('owner')}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px] rounded-lg shadow-2xs transition-colors"
              >
                Owner Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('tenant')}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px] rounded-lg shadow-2xs transition-colors"
              >
                Resident Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'signup' && (
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Varma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="owner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-slate-700 font-bold mb-1">Contact Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    placeholder="e.g. +91 98480 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {loading ? 'Verifying Credentials...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Encrypted Cloud Security & Protection</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
