import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Users,
  AlertCircle,
} from 'lucide-react';
import JobDescription from '../components/JobDescription';
import ResumeUpload from '../components/ResumeUpload';
import ScreeningButton from '../components/ScreeningButton';
import CandidateTable from '../components/CandidateTable';
import CandidateDrawer from '../components/CandidateDrawer';
import AnalyticsChart from '../components/AnalyticsChart';
import LoadingState from '../components/LoadingState';
import { screenResumes } from '../services/api';

const TIER_FILTERS = [
  { value: 'all', label: 'All match levels' },
  { value: 'strong', label: 'Strong Match (80%+)' },
  { value: 'good', label: 'Good Match (65–79%)' },
  { value: 'moderate', label: 'Moderate Match (50–64%)' },
  { value: 'low', label: 'Low Match (below 50%)' },
];

function matchesTier(candidate, tier) {
  const score = Number(candidate.final_score) || 0;
  if (tier === 'strong') return score >= 80;
  if (tier === 'good') return score >= 65 && score < 80;
  if (tier === 'moderate') return score >= 50 && score < 65;
  if (tier === 'low') return score < 50;
  return true;
}

export default function Dashboard() {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFiles, setResumeFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [batchErrors, setBatchErrors] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sortOption, setSortOption] = useState('rank-asc');
  const [tierFilter, setTierFilter] = useState('all');
  const [candidateQuery, setCandidateQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const totalScreened = results ? results.length : 0;
  const avgScore = totalScreened
    ? (results.reduce((total, candidate) => total + (Number(candidate.final_score) || 0), 0) / totalScreened).toFixed(1)
    : '0.0';
  const highestScore = results?.length ? Math.max(...results.map((candidate) => Number(candidate.final_score) || 0)) : null;
  const strongMatchesCount = results ? results.filter((candidate) => (Number(candidate.final_score) || 0) >= 65).length : 0;

  const displayedCandidates = useMemo(() => {
    const query = candidateQuery.trim().toLowerCase();
    const candidates = (results || []).filter((candidate) => {
      const searchableText = `${candidate.candidate_name || ''} ${candidate.filename || ''}`.toLowerCase();
      return matchesTier(candidate, tierFilter) && (!query || searchableText.includes(query));
    });

    return candidates.sort((a, b) => {
      if (sortOption === 'score-desc') return b.final_score - a.final_score;
      if (sortOption === 'score-asc') return a.final_score - b.final_score;
      if (sortOption === 'name-asc') return (a.candidate_name || '').localeCompare(b.candidate_name || '');
      return a.rank - b.rank;
    });
  }, [candidateQuery, results, sortOption, tierFilter]);

  const handleScreenResumes = async () => {
    setErrorMessage(null);
    setBatchErrors([]);

    if (!jobDescription.trim()) {
      setErrorMessage('Please provide a job description before running the screening.');
      return;
    }
    if (resumeFiles.length === 0) {
      setErrorMessage('Please upload at least one PDF resume to screen.');
      return;
    }

    setLoading(true);
    setResults(null);
    setSelectedCandidate(null);

    try {
      const response = await screenResumes(jobDescription.trim(), resumeFiles);
      if (response?.success) {
        setResults(response.results || []);
        setBatchErrors(response.errors || []);
      } else {
        setErrorMessage(response?.message || 'Screening returned no results. Please check the uploaded documents.');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Unable to connect to the screening service.');
      setBatchErrors(error.data?.errors || []);
    } finally {
      setLoading(false);
    }
  };

  const handleNewScreening = () => {
    setResults(null);
    setBatchErrors([]);
    setErrorMessage(null);
    setSelectedCandidate(null);
    setTierFilter('all');
    setCandidateQuery('');
    setSortOption('rank-asc');
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header className="flex flex-col gap-5 border-b border-slate-800 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Recruiting workspace</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">AI Resume Screening &amp; Candidate Ranking</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Evaluate candidate resumes against job requirements using explainable AI-assisted matching.
          </p>
        </div>
        {results && (
          <button
            type="button"
            onClick={handleNewScreening}
            className="inline-flex w-fit items-center gap-2 border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-200 shadow-sm transition-colors hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Start New Screening
          </button>
        )}
      </header>

      <section aria-labelledby="screening-setup" className="pt-8">
        <div className="mb-4">
          <h2 id="screening-setup" className="text-base font-semibold text-slate-100">Screening Setup</h2>
          <p className="mt-1 text-xs text-slate-500">Add the role requirements and candidate resumes for this screening run.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <JobDescription
            jobTitle={jobTitle}
            onJobTitleChange={setJobTitle}
            value={jobDescription}
            onChange={setJobDescription}
            disabled={loading}
          />
          <ResumeUpload files={resumeFiles} onFilesChange={setResumeFiles} disabled={loading} />
        </div>

        <div className="mt-5">
          <ScreeningButton
            onClick={handleScreenResumes}
            loading={loading}
            disabled={loading || !jobDescription.trim() || resumeFiles.length === 0}
            fileCount={resumeFiles.length}
          />
        </div>
      </section>

      {errorMessage && (
        <div role="alert" className="mt-5 flex items-start gap-3 border border-rose-900/80 bg-rose-950/25 px-4 py-3 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div>
            <p className="font-medium">Screening could not be completed</p>
            <p className="mt-0.5 text-xs leading-5 text-rose-300/85">{errorMessage}</p>
          </div>
        </div>
      )}

      {batchErrors.length > 0 && (
        <div role="status" className="mt-5 border border-amber-900/70 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-medium"><AlertCircle className="h-4 w-4 text-amber-400" />Some documents need attention</div>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-200/80">
            {batchErrors.map((error, index) => <li key={`${error.filename}-${index}`}><span className="font-medium text-amber-100">{error.filename}:</span> {error.error}</li>)}
          </ul>
        </div>
      )}

      {loading && <LoadingState fileCount={resumeFiles.length} />}

      {!results && !loading && (
        <section className="mt-10 border-y border-slate-800 py-14 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center border border-slate-700 bg-slate-900 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-200">Start a Candidate Screening</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Add the job requirements and upload candidate resumes to compare profiles against the role.
          </p>
        </section>
      )}

      {results && !loading && (
        <section className="mt-10 space-y-8" aria-labelledby="screening-results">
          <div>
            <h2 id="screening-results" className="text-base font-semibold text-slate-100">Screening Results</h2>
            <p className="mt-1 text-xs text-slate-500">Results are ranked using skill coverage, text similarity, and keyword matching.</p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-800 overflow-hidden border border-slate-800 lg:grid-cols-4 lg:divide-y-0">
            <Metric icon={Users} label="Candidates Screened" value={totalScreened} description="Across current screening batch" />
            <Metric icon={TrendingUp} label="Average Match" value={`${avgScore}%`} description="Mean candidate score" />
            <Metric icon={Award} label="Highest Match" value={highestScore === null ? '—' : `${highestScore}%`} description="Highest score in this run" />
            <Metric icon={CheckCircle2} label="Strong Matches" value={strongMatchesCount} description="Candidates meeting strong-match threshold" />
          </div>

          <AnalyticsChart candidates={displayedCandidates} />

          <div className="border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Candidate Ranking</h3>
                <p className="mt-1 text-xs text-slate-500">Search, filter, and review ranked candidates.</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[680px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <span className="sr-only">Search candidates</span>
                  <input value={candidateQuery} onChange={(event) => setCandidateQuery(event.target.value)} placeholder="Search candidate" className="w-full border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="relative block">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <span className="sr-only">Filter by match tier</span>
                  <select value={tierFilter} onChange={(event) => setTierFilter(event.target.value)} className="w-full appearance-none border border-slate-700 bg-slate-950 py-2 pl-8 pr-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {TIER_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
                  </select>
                </label>
                <select value={sortOption} onChange={(event) => setSortOption(event.target.value)} aria-label="Sort candidates" className="w-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="rank-asc">Sort: Rank</option>
                  <option value="score-desc">Sort: Score, high to low</option>
                  <option value="score-asc">Sort: Score, low to high</option>
                  <option value="name-asc">Sort: Candidate name</option>
                </select>
              </div>
            </div>
          </div>

          {displayedCandidates.length ? (
            <CandidateTable candidates={displayedCandidates} onSelectCandidate={setSelectedCandidate} />
          ) : (
            <div className="border border-dashed border-slate-700 py-10 text-center text-sm text-slate-500">No candidates match the current search and filters.</div>
          )}
        </section>
      )}

      {selectedCandidate && <CandidateDrawer candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />}
    </div>
  );
}

function Metric({ icon: Icon, label, value, description }) {
  return (
    <div className="min-w-0 bg-slate-900/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-100 tabular-nums">{value}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{description}</p>
    </div>
  );
}
