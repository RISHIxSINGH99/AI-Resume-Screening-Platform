import React from 'react';
import { X, Mail, Phone, Linkedin, Github } from 'lucide-react';
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

export default function CandidateDrawer({ candidate, screening, onClose }) {
  if (!candidate) return null;

  const {
    rank,
    candidate_name,
    email,
    phone,
    linkedin,
    github,
    filename,
    final_score,
    match_tier,
    skill_score,
    tfidf_score,
    keyword_score,
    skill_analysis = {},
    feedback,
    is_scanned,
    page_count,
    char_count,
  } = candidate;

  const matchedSkills = skill_analysis?.matched_skills || [];
  const missingSkills = skill_analysis?.missing_skills || [];
  const extraSkills = skill_analysis?.extra_skills || [];
  const matchStyle = getMatchColor(final_score || 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-[1px]" onClick={onClose} />

      {/* Drawer */}
      <aside role="dialog" aria-modal="true" aria-label="Candidate profile" className="fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto border-l border-slate-700 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Candidate Profile</h2>
            <p className="text-[11px] text-slate-500">Candidate profile and screening result</p>
          </div>
          <button
            onClick={onClose}
            className="border border-transparent p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-6">
          {/* Candidate Identity */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-white">{candidate_name || 'Unknown Candidate'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{filename}</p>
              {is_scanned && (
                <span className="inline-block mt-1 text-[10px] text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40">
                  Scanned PDF — limited text extraction
                </span>
              )}
            </div>
            <div className="text-right">
              <span className={`border px-2 py-1 text-xs font-medium ${matchStyle.bg} ${matchStyle.border} ${matchStyle.text}`}>
                Rank #{rank}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-3 border border-slate-800 bg-slate-900/50 p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Candidate Information</h4>
            <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <InfoField label="Name" value={candidate_name} />
              <InfoField label="Email" value={email} href={email ? `mailto:${email}` : null} icon={Mail} />
              <InfoField label="Phone" value={phone} href={phone ? `tel:${phone}` : null} icon={Phone} />
              <InfoField label="LinkedIn" value={linkedin} href={linkedin ? `https://${linkedin.replace(/^https?:\/\//, '')}` : null} icon={Linkedin} />
              <InfoField label="GitHub" value={github} href={github ? `https://${github.replace(/^https?:\/\//, '')}` : null} icon={Github} />
            </dl>
          </div>

          {screening && (
            <div className="space-y-3 border border-slate-800 bg-slate-900/50 p-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Screening Information</h4>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <InfoField label="Screening ID" value={screening.id ? `#${screening.id}` : '—'} />
                <InfoField label="Job" value={screening.job_title || 'No linked job'} />
                <InfoField label="Screening Date" value={formatDate(screening.created_at)} />
              </dl>
            </div>
          )}

          {/* Match Summary */}
          <div className="border border-slate-800 bg-slate-900/50 p-4">
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Match Summary</h4>

            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-xs text-slate-400">Overall Score</span>
                <p className={`text-2xl font-bold ${matchStyle.text}`}>{final_score}%</p>
              </div>
              <span className={`border px-2.5 py-1 text-xs font-medium ${matchStyle.bg} ${matchStyle.border} ${matchStyle.text}`}>
                {getMatchLabel(match_tier)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(Math.max(final_score, 0), 100)}%`,
                  backgroundColor: final_score >= 80 ? '#34d399' : final_score >= 65 ? '#60a5fa' : final_score >= 50 ? '#fbbf24' : '#f87171',
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[10px] text-slate-500 mb-0.5">Skill Match</p>
                <p className="text-sm font-bold text-white">{skill_score}%</p>
                <p className="text-[10px] text-slate-600 mt-0.5">40% weight</p>
              </div>
              <div className="border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[10px] text-slate-500 mb-0.5">Text Similarity</p>
                <p className="text-sm font-bold text-white">{tfidf_score}%</p>
                <p className="text-[10px] text-slate-600 mt-0.5">40% weight</p>
              </div>
              <div className="border border-slate-800 bg-slate-950 p-2.5">
                <p className="text-[10px] text-slate-500 mb-0.5">Keyword Match</p>
                <p className="text-sm font-bold text-white">{keyword_score}%</p>
                <p className="text-[10px] text-slate-600 mt-0.5">20% weight</p>
              </div>
            </div>
          </div>

          {/* Recruiter Insight */}
          {feedback && (
            <div className="border border-slate-800 bg-slate-900/50 p-4">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Recruiter Insight</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{feedback}</p>
            </div>
          )}

          {/* Skills Analysis */}
          <div className="space-y-3 border border-slate-800 bg-slate-900/50 p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Skills</h4>

            {matchedSkills.length > 0 && (
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Matched Skills ({matchedSkills.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkills.map((skill, i) => (
                    <SkillBadge key={i} name={skill} type="matched" />
                  ))}
                </div>
              </div>
            )}

            {missingSkills.length > 0 && (
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Missing Skills ({missingSkills.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkills.map((skill, i) => (
                    <SkillBadge key={i} name={skill} type="missing" />
                  ))}
                </div>
              </div>
            )}

            {extraSkills.length > 0 && (
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Additional Skills ({extraSkills.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {extraSkills.map((skill, i) => (
                    <SkillBadge key={i} name={skill} type="extra" />
                  ))}
                </div>
              </div>
            )}

            {matchedSkills.length === 0 && missingSkills.length === 0 && extraSkills.length === 0 && (
              <p className="text-xs text-slate-500 italic">No skills data available.</p>
            )}
          </div>

          {/* Resume Metadata */}
          <div className="border border-slate-800 bg-slate-900/50 p-4">
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Document</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-500">Pages</p>
                <p className="font-medium text-slate-200">{page_count || '—'}</p>
              </div>
              <div>
                <p className="text-slate-500">Characters</p>
                <p className="font-medium text-slate-200">{char_count ? char_count.toLocaleString() : '—'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 pb-4">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors text-center"
            >
              Close
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function InfoField({ label, value, href, icon: Icon }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-200">
        {href ? <a href={href} className="inline-flex items-center gap-1.5 text-blue-300 hover:underline">{Icon && <Icon className="h-3 w-3" />}{value}</a> : value || 'Not provided'}
      </dd>
    </div>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
