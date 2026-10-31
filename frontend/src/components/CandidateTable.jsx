import React from 'react';
import { Download, Eye } from 'lucide-react';
import SkillBadge from './SkillBadge';

function getMatchLabel(tier) {
  const map = {
    'Top Candidate': 'Strong Match',
    'Strong Match': 'Good Match',
    'Moderate Match': 'Moderate Match',
    'Low Match': 'Low Match',
  };
  return map[tier] || tier;
}

function getMatchColor(score) {
  if (score >= 80) return { text: 'text-emerald-300', bg: 'bg-emerald-950/30', border: 'border-emerald-800/60' };
  if (score >= 65) return { text: 'text-blue-300', bg: 'bg-blue-950/30', border: 'border-blue-800/60' };
  if (score >= 50) return { text: 'text-amber-300', bg: 'bg-amber-950/30', border: 'border-amber-800/60' };
  return { text: 'text-rose-300', bg: 'bg-rose-950/30', border: 'border-rose-800/60' };
}

export default function CandidateTable({ candidates, onSelectCandidate }) {
  const exportToCSV = () => {
    if (!candidates || candidates.length === 0) return;

    const headers = [
      'Rank', 'Candidate Name', 'Final Score (%)', 'Match Tier',
      'Skill Score (%)', 'TF-IDF Score (%)', 'Keyword Score (%)',
      'Matched Skills', 'Missing Skills', 'Email', 'Phone', 'Filename',
    ];

    const rows = candidates.map((c) => [
      c.rank,
      `"${(c.candidate_name || '').replace(/"/g, '""')}"`,
      c.final_score,
      `"${getMatchLabel(c.match_tier) || ''}"`,
      c.skill_score,
      c.tfidf_score,
      c.keyword_score,
      c.skill_analysis?.matched_count || 0,
      c.skill_analysis?.missing_count || 0,
      `"${c.email || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.filename || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'candidate_rankings_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overflow-hidden border border-slate-800 bg-slate-900/50 shadow-sm">
      {/* Table Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Candidate Ranking</h3>
          <p className="mt-1 text-[11px] text-slate-500">{candidates.length} candidates shown</p>
        </div>
        <button
          type="button"
          onClick={exportToCSV}
          className="inline-flex items-center gap-1.5 border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            <tr>
              <th className="pl-5 pr-2 py-3 w-12">Rank</th>
              <th className="px-3 py-3">Candidate</th>
              <th className="px-3 py-3 text-right w-24">Match Score</th>
              <th className="px-3 py-3 text-center w-20">Skills</th>
              <th className="px-3 py-3 text-center w-24">Text Similarity</th>
              <th className="px-3 py-3 text-center w-24">Keyword Match</th>
              <th className="px-3 py-3 w-36">Missing Skills</th>
              <th className="px-3 py-3 text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {candidates.map((cand) => {
              const matchStyle = getMatchColor(cand.final_score);
              const missingSkills = cand.skill_analysis?.missing_skills || [];

              return (
                <tr
                  key={cand.rank}
                  className="cursor-pointer transition-colors hover:bg-slate-800/50"
                  onClick={() => onSelectCandidate && onSelectCandidate(cand)}
                >
                  <td className="pl-5 pr-2 py-3 text-slate-300 font-medium">
                    {cand.rank}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">{cand.candidate_name || 'Unknown'}</span>
                      <span className={`inline-block border px-1.5 py-0.5 text-[9px] font-medium ${matchStyle.bg} ${matchStyle.border} ${matchStyle.text}`}>
                        {getMatchLabel(cand.match_tier)}
                      </span>
                    </div>
                    <div className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-500">{cand.filename}</div>
                  </td>

                  <td className="px-3 py-3 text-right">
                    <span className={`font-bold text-sm tabular-nums ${matchStyle.text}`}>
                      {cand.final_score}%
                    </span>
                  </td>

                  <td className="px-3 py-3 text-center text-slate-200 tabular-nums">
                    {cand.skill_score}%
                  </td>

                  <td className="px-3 py-3 text-center text-slate-200 tabular-nums">
                    {cand.tfidf_score}%
                  </td>

                  <td className="px-3 py-3 text-center text-slate-200 tabular-nums">
                    {cand.keyword_score}%
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {missingSkills.length > 0 ? (
                        <>
                          {missingSkills.slice(0, 2).map((skill, i) => (
                            <SkillBadge key={i} name={skill} type="missing" />
                          ))}
                          {missingSkills.length > 2 && (
                            <span className="text-[10px] text-slate-500 self-center">
                              +{missingSkills.length - 2}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500">None</span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCandidate && onSelectCandidate(cand);
                      }}
                      title="View candidate details"
                      className="border border-transparent p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
