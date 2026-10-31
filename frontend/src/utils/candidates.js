export function normalizeCandidate(candidate) {
  return {
    ...candidate,
    skill_analysis: candidate.skill_analysis || {
      matched_skills: candidate.matched_skills || [],
      missing_skills: candidate.missing_skills || [],
      extra_skills: candidate.extra_skills || [],
    },
  };
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function getLoadError(error, fallback = 'Unable to load screening data.') {
  if (!error.response) return 'Unable to connect to screening service.';
  if (error.response.status === 401) return 'Your session has expired. Please sign in again.';
  if (error.response.status === 404) return 'Screening not found.';
  if (error.response.status >= 500) return fallback;
  return error.response.data?.error || fallback;
}