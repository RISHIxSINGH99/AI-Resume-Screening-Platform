import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import AnalyticsChart from '../components/AnalyticsChart';
import CandidateDrawer from '../components/CandidateDrawer';
import CandidateTable from '../components/CandidateTable';
import { getScreening } from '../services/api';
import { formatDate, getLoadError, normalizeCandidate } from '../utils/candidates';

export default function ScreeningDetails() {
  const { id } = useParams();
  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setScreening(null);
    setErrorMessage('');
    getScreening(id)
      .then((response) => {
        if (active) setScreening({
          ...response.screening,
          candidates: (response.screening?.candidates || []).map(normalizeCandidate),
        });
      })
      .catch((error) => { if (active) setErrorMessage(getLoadError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link to="/screenings" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100"><ArrowLeft className="h-3.5 w-3.5" />Screening history</Link>
      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading screening details...</p>
      ) : errorMessage ? (
        <div role="alert" className="mt-6 border border-rose-900/70 bg-rose-950/20 p-5 text-sm text-rose-200">{errorMessage}</div>
      ) : screening ? (
        <>
          <header className="mt-5 border-b border-slate-800 pb-7">
            <p className="mb-2 text-xs font-semibold uppercase text-blue-400">Screening #{screening.id}</p>
            <h1 className="text-2xl font-semibold text-slate-50">{screening.job_title || 'Manual screening'}</h1>
            <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-400">{screening.job_description}</p>
          </header>

          <section className="mt-6 grid grid-cols-1 divide-y divide-slate-800 border border-slate-800 bg-slate-900/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Summary label="Screening ID" value={`#${screening.id}`} />
            <Summary label="Created" value={formatDate(screening.created_at)} />
            <Summary label="Candidates" value={screening.candidates.length} icon={Users} />
          </section>

          <section className="mt-8 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Candidate Ranking</h2>
              <p className="mt-1 text-xs text-slate-500">Scores and rank are from this screening only.</p>
            </div>
            {screening.candidates.length > 0 ? (
              <CandidateTable candidates={screening.candidates} onSelectCandidate={setSelected} />
            ) : (
              <div className="border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">No candidates were saved for this screening.</div>
            )}
          </section>

          <section className="mt-8 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Screening Analytics</h2>
              <p className="mt-1 text-xs text-slate-500">Analytics are calculated from candidates in screening #{screening.id} only.</p>
            </div>
            <AnalyticsChart candidates={screening.candidates} />
          </section>
        </>
      ) : null}
      {selected && <CandidateDrawer candidate={selected} screening={screening} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Summary({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
      <div><p className="text-[10px] font-medium uppercase text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-100">{value}</p></div>
      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
    </div>
  );
}