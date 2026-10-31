import React from 'react';
import { Play, Loader2 } from 'lucide-react';

export default function ScreeningButton({ onClick, loading, disabled, fileCount }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border border-slate-800 bg-slate-900/50 p-4 shadow-sm sm:flex-row sm:items-center">
      <div>
        <h3 className="text-xs font-semibold text-slate-200">
          Ready to screen
        </h3>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          {fileCount > 0
            ? `${fileCount} candidate resume${fileCount > 1 ? 's' : ''} queued for evaluation against role requirements.`
            : 'Provide job requirements and upload PDF resumes to initiate screening.'}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={`flex w-full items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold transition-colors sm:w-auto ${
          disabled || loading
            ? 'cursor-not-allowed border border-slate-800 bg-slate-800 text-slate-500'
            : 'border border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing Resumes...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Candidate Screening</span>
          </>
        )}
      </button>
    </div>
  );
}
