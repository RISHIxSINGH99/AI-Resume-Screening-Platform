import React, { useEffect, useState } from 'react';
import { Activity, Layers, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Candidates', to: '/candidates' },
  { label: 'Screenings', to: '/screenings' },
];

export default function Navbar() {
  const [serverStatus, setServerStatus] = useState('checking');
  const { logout, user } = useAuth();

  useEffect(() => {
    let mounted = true;
    const verifyServer = async () => {
      try {
        const response = await checkHealth();
        if (mounted) setServerStatus(response?.success ? 'online' : 'offline');
      } catch {
        if (mounted) setServerStatus('offline');
      }
    };

    verifyServer();
    const interval = window.setInterval(verifyServer, 30000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const statusLabel = serverStatus === 'online' ? 'API Connected' : serverStatus === 'offline' ? 'API Unavailable' : 'Checking API';
  const statusColor = serverStatus === 'online' ? 'bg-emerald-400' : serverStatus === 'offline' ? 'bg-rose-400' : 'bg-amber-400';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-5 lg:gap-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-blue-500/40 bg-blue-500/10 text-blue-300">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-100">AI Resume Screening</p>
              <p className="hidden text-[11px] text-slate-500 sm:block">AI-assisted candidate screening and job-fit analysis</p>
            </div>
          </div>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 border-l border-slate-800 pl-5 md:flex">
            {NAV_ITEMS.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) => `border-b px-3 py-1.5 text-xs font-medium transition-colors ${isActive ? 'border-blue-400 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-200'}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2 border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-300" title="AI Matching Engine connection status">
            <Activity className="h-3.5 w-3.5 text-slate-500" />
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor} ${serverStatus === 'checking' ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{statusLabel}</span>
          </div>
          <span className="hidden max-w-36 truncate text-xs text-slate-400 lg:block" title={user?.email}>{user?.name}</span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
