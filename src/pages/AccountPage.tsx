import { useState } from 'react';
import { ArrowLeft, LayoutDashboard, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type AccountPageProps = {
  onBack: () => void;
  onAdmin: () => void;
};

export function AccountPage({ onBack, onAdmin }: AccountPageProps) {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    const result = isRegistering
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error.message);
    } else if (isRegistering) {
      setNotice('Registration received. Check your email if confirmation is enabled.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-slate-500">Loading account...</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={16} /> Back to store
      </button>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {user ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <UserRound size={24} />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-slate-900">Account</h1>
            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <ShieldCheck size={16} className="text-emerald-600" />
              {user.app_metadata.role === 'admin' ? 'Administrator' : 'Customer account'}
            </div>
            {user.app_metadata.role === 'admin' && (
              <button
                onClick={onAdmin}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <LayoutDashboard size={16} /> Open admin dashboard
              </button>
            )}
            <button
              onClick={() => void signOut()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <LogOut size={16} /> Sign out
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-slate-900">
              {isRegistering ? 'Create account' : 'Sign in'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to check out and manage your product reviews.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-blue-500"
                />
              </label>
              {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
              {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                {submitting ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
              </button>
            </form>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setNotice('');
              }}
              className="mt-4 w-full text-sm font-medium text-blue-700 hover:text-blue-800"
            >
              {isRegistering ? 'Already registered? Sign in' : 'New here? Create an account'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}