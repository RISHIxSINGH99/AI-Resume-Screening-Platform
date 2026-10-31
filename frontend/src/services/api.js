import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for batch PDF processing
});

const AUTH_TOKEN_KEY = 'resume-screening-access-token';
const AUTH_UNAUTHORIZED_EVENT = 'resume-screening:unauthorized';

export const getAccessToken = () => sessionStorage.getItem(AUTH_TOKEN_KEY);

export const storeAccessToken = (token) => {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
};

export const AUTH_EVENTS = {
  unauthorized: AUTH_UNAUTHORIZED_EVENT,
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isCredentialRequest = /\/api\/auth\/(login|register)\/?$/.test(requestUrl);
    if (error.response?.status === 401 && !isCredentialRequest) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
        detail: { message: 'Your session expired or is no longer valid. Please sign in again.' },
      }));
    }
    return Promise.reject(error);
  },
);

/**
 * Checks the status of the Flask backend.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.error || `Server responded with status ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Flask server is unreachable. Please verify that the backend is running on ' + API_BASE_URL);
    } else {
      throw new Error(error.message || 'Error checking server health');
    }
  }
};

export const getCandidates = async () => {
  const response = await apiClient.get('/api/candidates');
  return response.data;
};

export const getScreenings = async () => {
  const response = await apiClient.get('/api/screenings');
  return response.data;
};

export const getScreening = async (id) => {
  const response = await apiClient.get(`/api/screenings/${encodeURIComponent(id)}`);
  return response.data;
};

/**
 * Uploads resumes and job description to the screening endpoint.
 * @param {string} jobDescription 
 * @param {File[]} resumeFiles 
 * @returns {Promise<{success: boolean, count: number, results: Array, errors?: Array}>}
 */
export const screenResumes = async (jobDescription, resumeFiles) => {
  const formData = new FormData();
  formData.append('job_description', jobDescription);

  resumeFiles.forEach((file) => {
    formData.append('resumes', file);
  });

  try {
    const response = await apiClient.post('/api/resume/screen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      const errorMsg = data?.error || data?.message || `Request failed with status ${error.response.status}`;
      const errObj = new Error(errorMsg);
      errObj.data = data;
      errObj.status = error.response.status;
      throw errObj;
    } else if (error.request) {
      throw new Error('Unable to connect to Flask backend at ' + API_BASE_URL + '. Check if backend server is running.');
    } else {
      throw new Error(error.message || 'Failed to send screening request.');
    }
  }
};

export default apiClient;
