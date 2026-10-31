import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import CandidateDrawer from '../components/CandidateDrawer';
import { getCandidates, getScreenings } from '../services/api';
import { formatDate, getLoadError, normalizeCandidate } from '../utils/candidates';

const PAGE_SIZE = 15;

function getTierStyle(tier) {
  if (tier === 'Top Candidate' || tier === 'Strong Match') return 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300';
  if (tier === 'Moderate Match') return 'border-amber-800/60 bg-amber-950/30 text-amber-300';
  return 'border-rose-800/60 bg-rose-950/30 text-rose-300';
}

function matchesTier(candidate, filter) {
  if (filter === 'all') return true;
  const score = Number(candidate.final_score) || 0;
  if (filter === 'strong') return score >= 80;
  if (filter === 'good') return score >= 65 && score < 80;
  if (filter === 'moderate') return score >= 50 && score < 65;
  return score < 50;
}

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('all');
  const [sort, setSort] = useState('score-desc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCandidates(), getScreenings()])
      .then(([candidateResponse, screeningResponse]) => {
        if (!active) return;
        const screeningsById = new Map(
          (screeningResponse.screenings || []).map((screening) => [String(screening.id), screening]),
        );
        setCandidates((candidateResponse.candidates || []).map((candidate) => {
          const screening = screeningsById.get(String(candidate.screening_id));
          return { ...normalizeCandidate(candidate), screening };
        }));
      })
      .catch((error) => {
        if (active) setErrorMessage(getLoadError(error, 'Unable to load candidate data.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => {
        const text = [candidate.candidate_name, candidate.email, candidate.filename,
          candidate.screening_id, candidate.screening?.job_title].join(' ').toLowerCase();
        return matchesTier(candidate, tier) && (!search || text.includes(search));
      })
      .sort((left, right) => {
        if (sort === 'score-asc') return (left.final_score || 0) - (right.final_score || 0);
        if (sort === 'date-asc') return new Date(left.screening?.created_at || 0) - new Date(right.screening?.created_at || 0);
        if (sort === 'date-desc') return new Date(right.screening?.created_at || 0) - new Date(left.screening?.created_at || 0);
        return (right.final_score || 0) - (left.final_score || 0);
      });
  }, [candidates, query, tier, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="border-b border-slate-800 pb-7">
        <p className="mb-2 text-xs font-semibold uppercase text-blue-400">Recruiting workspace</p>
        <h1 className="text-2xl font-semibold text-slate-50">Candidate Database</h1>
        <p className="mt-2 text-sm text-slate-400">Persisted candidates across your screening history.</p>
      </header>

      <section className="mt-7 border border-slate-800 bg-slate-900/40">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input aria-label="Search candidates" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search name, email, resume, or job" className="w-full border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Filter match tier" value={tier} onChange={(event) => { setTier(event.target.value); setPage(0); }} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">
              <option value="all">All match tiers</option>
              <option value="strong">Strong (80%+)</option>
              <option value="good">Good (65–79%)</option>
              <option value="moderate">Moderate (50–64%)</option>
              <option value="low">Low (&lt;50%)</option>
            </select>
            <select aria-label="Sort candidates" value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }} className="border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200">
              <option value="score-desc">Score: high to low</option>
              <option value="score-asc">Score: low to high</option>
              <option value="date-desc">Date: newest</option>
              <option value="date-asc">Date: oldest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-slate-400">Loading candidates...</p>
        ) : errorMessage ? (
          <p role="alert" className="p-8 text-center text-sm text-rose-300">{errorMessage}</p>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 h-6 w-6 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-200">No candidates found</h2>
            <p className="mt-1 text-xs text-slate-500">Candidates appear here after a screening run.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No candidates match these filters.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-[10px] font-semibold uppercase text-slate-500">
                  <tr>
                    {['Candidate', 'Email', 'Match Score', 'Skill Match', 'Text Similarity', 'Keyword Match', 'Match Tier', 'Screening', 'Date', 'Action'].map((heading) => <th key={heading} className="px-3 py-3 first:pl-5">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {visible.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-800/40">
                      <td className="px-3 py-3 pl-5 font-medium text-slate-100">{candidate.candidate_name || 'Unknown'}</td>
                      <td className="px-3 py-3 text-slate-400">{candidate.email || '—'}</td>
                      <td className="px-3 py-3 font-semibold tabular-nums text-slate-100">{candidate.final_score}%</td>
                      <td className="px-3 py-3 tabular-nums text-slate-300">{candidate.skill_score}%</td>
                      <td className="px-3 py-3 tabular-nums text-slate-300">{candidate.tfidf_score}%</td>
                      <td className="px-3 py-3 tabular-nums text-slate-300">{candidate.keyword_score}%</td>
                      <td className="px-3 py-3"><span className={`inline-flex border px-2 py-1 text-[10px] ${getTierStyle(candidate.match_tier)}`}>{candidate.match_tier}</span></td>
                      <td className="px-3 py-3">
                        <span className="text-blue-300">#{candidate.screening_id}</span>
                        {candidate.screening?.job_title && <span className="mt-0.5 block max-w-40 truncate text-[10px] text-slate-500">{candidate.screening.job_title}</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-400">{formatDate(candidate.screening?.created_at)}</td>
                      <td className="px-3 py-3"><button type="button" onClick={() => setSelected(candidate)} className="border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-500 hover:bg-slate-800">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
              <span>{filtered.length} candidates · Page {page + 1} of {pageCount}</span>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="border border-slate-700 p-1.5 text-slate-300 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <button type="button" aria-label="Next page" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} className="border border-slate-700 p-1.5 text-slate-300 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </>
        )}
      </section>

      {selected && <CandidateDrawer candidate={selected} screening={selected.screening} onClose={() => setSelected(null)} />}
    </div>
  );
}