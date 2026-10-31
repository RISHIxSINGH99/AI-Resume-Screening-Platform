import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Candidates from './pages/Candidates';
import Screenings from './pages/Screenings';
import ScreeningDetails from './pages/ScreeningDetails';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Restoring your session...</main>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="mt-8 border-t border-slate-800 py-6 text-center text-[11px] text-slate-600">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} AI Resume Screening</p>
          <p className="mt-1 text-slate-600">Candidate screening and job-fit analysis</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
      <Route path="/candidates" element={<ProtectedRoute><DashboardLayout><Candidates /></DashboardLayout></ProtectedRoute>} />
      <Route path="/screenings" element={<ProtectedRoute><DashboardLayout><Screenings /></DashboardLayout></ProtectedRoute>} />
      <Route path="/screenings/:id" element={<ProtectedRoute><DashboardLayout><ScreeningDetails /></DashboardLayout></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
