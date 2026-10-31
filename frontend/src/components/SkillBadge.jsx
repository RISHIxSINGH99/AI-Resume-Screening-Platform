import React from 'react';

export default function SkillBadge({ name, type = 'matched' }) {
  let badgeStyle = 'border-slate-700 bg-slate-800 text-slate-300';

  if (type === 'matched') {
    badgeStyle = 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300';
  } else if (type === 'missing') {
    badgeStyle = 'border-rose-800/60 bg-rose-950/30 text-rose-300';
  } else if (type === 'extra') {
    badgeStyle = 'border-slate-700 bg-slate-800/80 text-slate-300';
  }

  return (
    <span
      className={`inline-flex items-center border px-2 py-1 text-[11px] font-medium ${badgeStyle}`}
    >
      {name}
    </span>
  );
}
