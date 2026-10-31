import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { getScreenings } from '../services/api';
import { formatDate, getLoadError } from '../utils/candidates';

export default function Screenings() {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    getScreenings()
      .then((response) => { if (active) setScreenings(response.screenings || []); })
      .catch((error) => { if (active) setErrorMessage(getLoadError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="border-b border-slate-800 pb-7">
        <p className="mb-2 text-xs font-semibold uppercase text-blue-400">Recruiting workspace</p>
        <h1 className="text-2xl font-semibold text-slate-50">Screening History</h1>
        <p className="mt-2 text-sm text-slate-400">Review persisted screening runs and candidate rankings.</p>
      </header>

      <section className="mt-7 overflow-hidden border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Recent screenings</h2>
            <p className="mt-1 text-[11px] text-slate-500">Screenings are ordered newest first.</p>
          </div>
          <Clock3 className="h-4 w-4 text-slate-500" />
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading screening history...</p>
        ) : errorMessage ? (
          <p role="alert" className="p-8 text-center text-sm text-rose-300">{errorMessage}</p>
        ) : screenings.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-sm font-semibold text-slate-200">No screening history yet</h2>
            <p className="mt-1 text-xs text-slate-500">Run a candidate screening to see it here.</p>
            <Link to="/dashboard" className="mt-4 inline-flex border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800">Start screening</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-[10px] font-semibold uppercase text-slate-500">
                <tr><th className="px-5 py-3">Screening ID</th><th className="px-3 py-3">Job</th><th className="px-3 py-3">Created Date</th><th className="px-3 py-3">Candidates</th><th className="px-3 py-3">Summary</th><th className="px-3 py-3">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {screenings.map((screening) => (
                  <tr key={screening.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3 font-medium text-slate-200">#{screening.id}</td>
                    <td className="px-3 py-3 text-slate-300">{screening.job_title || 'No linked job'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-400">{formatDate(screening.created_at)}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-300">{screening.candidate_count}</td>
                    <td className="px-3 py-3 text-slate-400">{screening.candidate_count} candidate{screening.candidate_count === 1 ? '' : 's'} ranked</td>
                    <td className="px-3 py-3"><Link to={`/screenings/${screening.id}`} className="inline-flex items-center gap-1 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-500 hover:bg-slate-800">View screening <ArrowUpRight className="h-3.5 w-3.5" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}