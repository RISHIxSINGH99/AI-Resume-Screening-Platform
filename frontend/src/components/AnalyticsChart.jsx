import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { BarChart3, Layers } from 'lucide-react';

const CustomOverallTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="space-y-1 border border-slate-700 bg-slate-950 p-3 text-xs shadow-xl">
        <p className="font-semibold text-white text-sm">{data.name}</p>
        <p className="text-slate-300">Score: <span className="text-white font-bold">{data.final_score}%</span></p>
      </div>
    );
  }
  return null;
};

const CustomMultiTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="space-y-1.5 border border-slate-700 bg-slate-950 p-3 text-xs shadow-xl">
        <p className="font-semibold text-white border-b border-slate-800 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold text-white">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function getBarColor(score) {
  if (score >= 80) return '#34d399';
  if (score >= 65) return '#60a5fa';
  if (score >= 50) return '#fbbf24';
  return '#f87171';
}

export default function AnalyticsChart({ candidates = [] }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!candidates || candidates.length === 0) {
    return (
      <div className="border border-slate-800 bg-slate-900/50 p-8 text-center shadow-sm">
        <BarChart3 className="w-6 h-6 mx-auto mb-2 text-slate-600" />
        <p className="text-xs font-medium text-slate-400">No screening analytics available</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Screen candidates to generate comparative charts</p>
      </div>
    );
  }

  // Overall score data (sorted ascending for horizontal bars, highest at top)
  const overallData = [...candidates]
    .sort((a, b) => (a.final_score || 0) - (b.final_score || 0))
    .map((c) => ({
      name: c.candidate_name || c.filename || 'Candidate',
      final_score: Number(c.final_score) || 0,
      color: getBarColor(Number(c.final_score) || 0),
    }));

  // Breakdown data (sorted by rank)
  const breakdownData = [...candidates]
    .sort((a, b) => a.rank - b.rank)
    .map((c) => {
      const nameParts = (c.candidate_name || 'Candidate').split(' ');
      return {
        name: nameParts.length > 1 ? `${nameParts[0]} ${nameParts[1].charAt(0)}.` : nameParts[0],
        'Skill Match (40%)': Number(c.skill_score) || 0,
        'Text Similarity (40%)': Number(c.tfidf_score) || 0,
        'Keyword Match (20%)': Number(c.keyword_score) || 0,
      };
    });

  // Skill coverage data: aggregate across all candidates
  const allMatchedSkills = {};
  const allMissingSkills = {};
  candidates.forEach((c) => {
    const sa = c.skill_analysis || {};
    (sa.matched_skills || []).forEach((s) => { allMatchedSkills[s] = (allMatchedSkills[s] || 0) + 1; });
    (sa.missing_skills || []).forEach((s) => { allMissingSkills[s] = (allMissingSkills[s] || 0) + 1; });
  });

  const barHeight = Math.max(240, overallData.length * 44);
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'breakdown', label: 'Score Breakdown' },
    { key: 'skills', label: 'Skills' },
  ];

  return (
    <div className="overflow-hidden border border-slate-800 bg-slate-900/50 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Screening Analytics</h2>
          <p className="mt-1 text-[11px] text-slate-500">Compare candidate scores and scoring components.</p>
        </div>

        <div className="flex items-center border border-slate-800 bg-slate-950 p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              Candidate Match Score (0–100%)
            </p>
            <div style={{ height: `${barHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overallData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" unit="%" />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#e2e8f0', fontSize: 11 }} stroke="#334155" width={120} />
                  <Tooltip content={<CustomOverallTooltip />} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
                  <Bar dataKey="final_score" name="Match Score" radius={[0, 4, 4, 0]} barSize={18}>
                    {overallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab: Score Breakdown */}
        {activeTab === 'breakdown' && (
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Multi-Factor Score Comparison
            </p>
            <div style={{ height: `${barHeight}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdownData} margin={{ top: 5, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#e2e8f0', fontSize: 11 }} stroke="#334155" />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" unit="%" />
                  <Tooltip content={<CustomMultiTooltip />} cursor={{ fill: 'rgba(100,116,139,0.06)' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="Skill Match (40%)" fill="#60a5fa" radius={[2, 2, 0, 0]} barSize={14} />
                  <Bar dataKey="Text Similarity (40%)" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={14} />
                  <Bar dataKey="Keyword Match (20%)" fill="#06b6d4" radius={[3, 3, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab: Skills */}
        {activeTab === 'skills' && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-medium text-slate-400">
                Required Skills Matched ({Object.keys(allMatchedSkills).length} unique across cohort)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(allMatchedSkills)
                  .sort((a, b) => b[1] - a[1])
                  .map(([skill, count]) => (
                    <span key={skill} className="inline-flex items-center gap-1 border border-emerald-800/60 bg-emerald-950/30 px-2 py-1 text-[11px] font-medium text-emerald-300">
                      {skill}
                      {candidates.length > 1 && (
                        <span className="text-[10px] text-emerald-500/60 ml-0.5">{count}/{candidates.length}</span>
                      )}
                    </span>
                  ))}
                {Object.keys(allMatchedSkills).length === 0 && (
                  <span className="text-xs text-slate-500 italic">No matched skills detected.</span>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-medium text-slate-400">
                Required Skills Missing ({Object.keys(allMissingSkills).length} unique across cohort)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(allMissingSkills)
                  .sort((a, b) => b[1] - a[1])
                  .map(([skill, count]) => (
                    <span key={skill} className="inline-flex items-center gap-1 border border-rose-800/60 bg-rose-950/30 px-2 py-1 text-[11px] font-medium text-rose-300">
                      {skill}
                      {candidates.length > 1 && (
                        <span className="text-[10px] text-rose-500/60 ml-0.5">{count}/{candidates.length}</span>
                      )}
                    </span>
                  ))}
                {Object.keys(allMissingSkills).length === 0 && (
                  <span className="text-xs text-slate-500 italic">No missing skills — all requirements met.</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
