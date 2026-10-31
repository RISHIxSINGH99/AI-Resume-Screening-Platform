import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const STAGES = [
  { label: 'Reading resumes', description: 'Extracting text content from uploaded PDF documents' },
  { label: 'Extracting candidate information', description: 'Parsing contact details, experience, and credentials' },
  { label: 'Matching skills', description: 'Comparing candidate skills against job requirements' },
  { label: 'Calculating candidate scores', description: 'Computing multi-factor match scores and rankings' },
];

export default function LoadingState({ fileCount = 0 }) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="my-6 border border-slate-800 bg-slate-900/50 p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
        <div>
          <h3 className="text-sm font-semibold text-white">
            Analyzing candidate resumes
          </h3>
          <p className="mt-1 text-xs text-slate-500">Processing {fileCount > 0 ? `${fileCount} uploaded resume${fileCount > 1 ? 's' : ''}` : 'candidate documents'}.</p>
        </div>
      </div>

      <div className="space-y-2">
        {STAGES.map((stage, idx) => {
          const isActive = idx === stageIndex;
          const isCompleted = idx < stageIndex;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 border px-3 py-2.5 transition-colors ${
                isActive ? 'border-slate-700 bg-slate-800/60' : 'border-transparent'
              }`}
            >
              <div className="mt-0.5">
                {isActive ? (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-500">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  </div>
                ) : isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-600/20 border border-emerald-600/50 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800" />
                )}
              </div>
              <div>
                <p className={`text-xs font-medium ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                  {stage.label}
                </p>
                {isActive && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{stage.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
