import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AuthPage, FormField, FormMessage } from './Login';

export default function Register() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Restoring your session...</main>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);
    try {
      await apiClient.post('/api/auth/register', { name: name.trim(), email: email.trim(), password });
      navigate('/login', { replace: true, state: { message: 'Recruiter account created. Sign in to continue.' } });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPage>
      <p className="text-xs font-semibold uppercase text-blue-400">Recruiting workspace</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-50">Create recruiter account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Set up access to candidate screening.</p>
      {errorMessage && <FormMessage>{errorMessage}</FormMessage>}
      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <FormField icon={UserRound} label="Name" type="text" autoComplete="name" value={name} onChange={setName} />
        <FormField icon={Mail} label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <FormField icon={LockKeyhole} label="Password" type="password" autoComplete="new-password" value={password} onChange={setPassword} />
        <p className="-mt-1 text-[11px] text-slate-500">Use at least 8 characters.</p>
        <button disabled={submitting} className="mt-2 w-full border border-blue-400/40 bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-wait disabled:opacity-60">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Already registered? <Link className="font-medium text-blue-300 hover:text-blue-200" to="/login">Sign in</Link>
      </p>
    </AuthPage>
  );
}