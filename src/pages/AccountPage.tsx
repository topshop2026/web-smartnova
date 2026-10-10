import { useState } from 'react';
import { ArrowLeft, ClipboardList, LayoutDashboard, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

type AccountPageProps = {
  onBack: () => void;
  onOrders: () => void;
  onAdmin: () => void;
};

export function AccountPage({ onBack, onOrders, onAdmin }: AccountPageProps) {
  const { user, loading, signIn, signUp, resetPassword, updatePassword, signOut } = useAuth();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signin' | 'register' | 'forgot' | 'reset' | 'reset-complete'>(
    () => new URLSearchParams(window.location.search).get('mode') === 'reset' ? 'reset' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    if (mode === 'reset' && password !== confirmPassword) {
      setError(t('Passwords do not match.'));
      setSubmitting(false);
      return;
    }

    const result = mode === 'register'
      ? await signUp(email.trim(), password)
      : mode === 'signin'
        ? await signIn(email.trim(), password)
        : mode === 'forgot'
          ? await resetPassword(email.trim(), 'https://smartnova.site/account?mode=reset')
          : await updatePassword(password);

    if (result.error) {
      setError(result.error.message);
    } else if (mode === 'register') {
      setNotice(t('Registration received. Check your email if confirmation is enabled.'));
    } else if (mode === 'forgot') {
      setNotice(t('If an account exists for this email, a password reset link has been sent.'));
    } else if (mode === 'reset') {
      window.history.replaceState({}, '', '/account');
      setMode('reset-complete');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-slate-500">{t('Loading account...')}</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> {t('Back to store')}
      </button>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {mode === 'reset-complete' ? (
          <>
            <h1 className="text-xl font-semibold text-slate-900">{t('Password updated')}</h1>
            <p role="status" className="mt-2 text-sm text-emerald-700">{t('Your password has been reset successfully.')}</p>
            <button
              onClick={() => setMode('signin')}
              className="mt-5 w-full rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              {t('Continue')}
            </button>
          </>
        ) : user && mode !== 'reset' ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <UserRound size={24} />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-slate-900">{t('Account')}</h1>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <ShieldCheck size={16} className="text-emerald-600" />
              {user.app_metadata.role === 'admin' ? t('Administrator') : t('Customer account')}
            </div>
            <button
              onClick={onOrders}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <ClipboardList size={16} /> {t('My Orders')}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">
              {t('View your order history and current status.')}
            </p>
            {user.app_metadata.role === 'admin' && (
              <button
                onClick={onAdmin}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <LayoutDashboard size={16} /> {t('Open admin dashboard')}
              </button>
            )}
            <button
              onClick={() => void signOut()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} /> {t('Sign out')}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-slate-900">
              {t(mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Forgot password' : mode === 'reset' ? 'Reset password' : 'Sign in')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'forgot'
                ? t('Enter your email address and we will send you a reset link.')
                : mode === 'reset'
                  ? t('Choose a new password for your account.')
                  : t('Sign in to check out and manage your product reviews.')}
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode !== 'reset' && (
                <label className="block text-sm font-medium text-slate-700">
                  {t('Email')}
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"
                  />
                </label>
              )}
              {(mode === 'signin' || mode === 'register' || mode === 'reset') && (
                <label className="block text-sm font-medium text-slate-700">
                  {t(mode === 'reset' ? 'New password' : 'Password')}
                  <input
                    required
                    type="password"
                    minLength={8}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"
                  />
                </label>
              )}
              {mode === 'reset' && (
                <label className="block text-sm font-medium text-slate-700">
                  {t('Confirm new password')}
                  <input
                    required
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"
                  />
                </label>
              )}
              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {t(submitting ? 'Please wait...' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Update password' : 'Sign in')}
              </button>
            </form>
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setNotice(''); }}
                  className="mt-4 w-full text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Forgot password?
                </button>
                <button
                  onClick={() => { setMode('register'); setError(''); setNotice(''); }}
                  className="mt-3 w-full text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  New here? Create an account
                </button>
              </>
            )}
            {(mode === 'register' || mode === 'forgot' || mode === 'reset') && (
              <button
                onClick={() => { setMode('signin'); setError(''); setNotice(''); }}
                className="mt-4 w-full text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                Back to sign in
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}