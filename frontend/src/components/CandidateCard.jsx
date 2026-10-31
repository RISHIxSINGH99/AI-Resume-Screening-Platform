import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Linkedin,
  Github,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  FileText,
  Percent,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import SkillBadge from './SkillBadge';

export default function CandidateCard({ candidate }) {
  const [expanded, setExpanded] = useState(false);

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
    match_badge,
    badge_color,
    skill_score,
    tfidf_score,
    keyword_score,
    skill_analysis = {},
    feedback,
    is_scanned,
    error,
  } = candidate;

  const matchedSkills = skill_analysis?.matched_skills || [];
  const missingSkills = skill_analysis?.missing_skills || [];
  const extraSkills = skill_analysis?.extra_skills || [];

  // Rank styling
  const isTop1 = rank === 1;
  const isTop3 = rank <= 3;
  const rankBorder = isTop1
    ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 via-slate-900/80 to-slate-900/90 shadow-amber-500/10'
    : isTop3
    ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-500/5 via-slate-900/80 to-slate-900/90 shadow-indigo-500/10'
    : 'border-slate-800 bg-slate-900/60 shadow-black/20';

  const rankBadgeBg = isTop1
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : isTop3
    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    : 'bg-slate-800 text-slate-400 border-slate-700';

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xl transition-all duration-200 hover:border-slate-700 ${rankBorder}`}
    >
      {/* Header Row: Rank, Name, Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          {/* Rank Badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${rankBadgeBg}`}
          >
            {isTop1 ? <Award className="w-5 h-5 text-amber-400" /> : `#${rank}`}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-tight">
                {candidate_name || 'Candidate'}
              </h3>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                style={{
                  backgroundColor: `${badge_color}1A`,
                  color: badge_color || '#3B82F6',
                  borderColor: `${badge_color}4D`,
                }}
              >
                {match_badge || match_tier}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs">
                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {filename}
              </span>
              {is_scanned && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  <AlertTriangle className="w-3 h-3" /> Scanned PDF
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
          <div className="flex items-baseline space-x-1">
            <span
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: badge_color || '#3B82F6' }}
            >
              {final_score}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Match</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">{match_tier}</span>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(Math.max(final_score, 0), 100)}%`,
            backgroundColor: badge_color || '#3B82F6',
          }}
        />
      </div>

      {/* Feedback Summary */}
      {feedback && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{feedback}</p>
        </div>
      )}

      {/* Parser warning if any */}
      {error && !is_scanned && (
        <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Contact Info Row */}
      {(email || phone || linkedin || github) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{email}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{phone}</span>
            </a>
          )}
          {linkedin && (
            <a
              href={`https://${linkedin.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-indigo-400 hover:underline"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>{linkedin}</span>
            </a>
          )}
          {github && (
            <a
              href={`https://${github.replace(/^https?:\/\//, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-indigo-400 hover:underline"
            >
              <Github className="w-3.5 h-3.5" />
              <span>{github}</span>
            </a>
          )}
        </div>
      )}

      {/* Primary Skill Matches Preview */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Matched Skills ({matchedSkills.length}):
          </span>
          {matchedSkills.length > 0 ? (
            matchedSkills.slice(0, 6).map((skill, i) => (
              <SkillBadge key={i} name={skill} type="matched" />
            ))
          ) : (
            <span className="text-xs text-slate-500 italic">None detected</span>
          )}
          {matchedSkills.length > 6 && (
            <span className="text-xs text-slate-500 font-medium">+{matchedSkills.length - 6} more</span>
          )}
        </div>

        {missingSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <XCircle className="w-3 h-3 text-rose-400" /> Missing ({missingSkills.length}):
            </span>
            {missingSkills.slice(0, 5).map((skill, i) => (
              <SkillBadge key={i} name={skill} type="missing" />
            ))}
            {missingSkills.length > 5 && (
              <span className="text-xs text-slate-500 font-medium">+{missingSkills.length - 5} more</span>
            )}
          </div>
        )}
      </div>

      {/* Expand/Collapse Breakdown Button */}
      <div className="mt-4 pt-2 border-t border-slate-800/60 flex justify-between items-center">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>
              Hide Technical Breakdown <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              View Detailed Metrics & Extra Skills <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <span className="text-[11px] text-slate-500">
          Rank #{rank} of {candidate.total_candidates || ''}
        </span>
      </div>

      {/* Expandable Breakdown Drawer */}
      {expanded && (
        <div className="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-3.5 animate-fadeIn">
          {/* Subscore Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span>Skill Match</span>
                <span className="text-[10px] text-indigo-400 font-medium">40% weight</span>
              </div>
              <p className="text-lg font-bold text-white">{skill_score}%</p>
              <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${skill_score}%` }} />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span>TF-IDF Semantic</span>
                <span className="text-[10px] text-indigo-400 font-medium">40% weight</span>
              </div>
              <p className="text-lg font-bold text-white">{tfidf_score}%</p>
              <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${tfidf_score}%` }} />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span>Keyword Overlap</span>
                <span className="text-[10px] text-indigo-400 font-medium">20% weight</span>
              </div>
              <p className="text-lg font-bold text-white">{keyword_score}%</p>
              <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5">
                <div className="bg-sky-500 h-full rounded-full" style={{ width: `${keyword_score}%` }} />
              </div>
            </div>
          </div>

          {/* Full Matched Skills */}
          {matchedSkills.length > 0 && (
            <div>
              <p className="font-semibold text-slate-300 mb-1.5">All Matched Skills ({matchedSkills.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map((skill, i) => (
                  <SkillBadge key={i} name={skill} type="matched" />
                ))}
              </div>
            </div>
          )}

          {/* Full Missing Skills */}
          {missingSkills.length > 0 && (
            <div>
              <p className="font-semibold text-slate-300 mb-1.5">Missing Required Skills ({missingSkills.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((skill, i) => (
                  <SkillBadge key={i} name={skill} type="missing" />
                ))}
              </div>
            </div>
          )}

          {/* Extra Skills */}
          {extraSkills.length > 0 && (
            <div>
              <p className="font-semibold text-slate-300 mb-1.5">Additional Candidate Skills ({extraSkills.length}):</p>
              <div className="flex flex-wrap gap-1.5">
                {extraSkills.map((skill, i) => (
                  <SkillBadge key={i} name={skill} type="extra" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
