import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { isAuthenticated, loading, login, authMessage, setAuthMessage } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const message = location.state?.message || authMessage;

  if (loading) return <AuthLoading />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setAuthMessage('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPage>
      <p className="text-xs font-semibold uppercase text-blue-400">Recruiting workspace</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-50">Welcome back</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to continue screening candidates.</p>
      {(message || errorMessage) && <FormMessage>{errorMessage || message}</FormMessage>}
      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <FormField icon={Mail} label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <FormField icon={LockKeyhole} label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} />
        <button disabled={submitting} className="mt-2 w-full border border-blue-400/40 bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        New to the workspace? <Link className="font-medium text-blue-300 hover:text-blue-200" to="/register">Create an account</Link>
      </p>
    </AuthPage>
  );
}

export function AuthPage({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md border border-slate-800 bg-slate-900/70 p-7 shadow-2xl sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-blue-500/40 bg-blue-500/10 text-blue-300">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">AI Resume Screening</p>
            <p className="text-[11px] text-slate-500">Recruiter sign-in</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}

export function FormField({ icon: Icon, label, type, autoComplete, value, onChange }) {
  const inputId = label.toLowerCase().replaceAll(' ', '-');
  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-xs font-medium text-slate-300">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id={inputId}
          required
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </span>
    </label>
  );
}

export function FormMessage({ children }) {
  return <p role="alert" className="mt-5 border border-rose-900/80 bg-rose-950/30 px-3 py-2.5 text-sm text-rose-200">{children}</p>;
}

function AuthLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Restoring your session...</main>;
}