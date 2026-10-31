import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, {
  AUTH_EVENTS,
  clearAccessToken,
  getAccessToken,
  storeAccessToken,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getAccessToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    const handleUnauthorized = (event) => {
      clearAccessToken();
      setToken(null);
      setUser(null);
      setLoading(false);
      setAuthMessage(event.detail?.message || 'Please sign in to continue.');
      navigate('/login', { replace: true, state: { message: event.detail?.message } });
    };

    window.addEventListener(AUTH_EVENTS.unauthorized, handleUnauthorized);
    return () => window.removeEventListener(AUTH_EVENTS.unauthorized, handleUnauthorized);
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const savedToken = getAccessToken();
    if (!savedToken) {
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    apiClient.get('/api/auth/me')
      .then(({ data }) => {
        if (!active) return;
        setToken(savedToken);
        setUser(data.user);
      })
      .catch((error) => {
        if (!active || error.response?.status === 401) return;
        setAuthMessage('Unable to verify your session. Please sign in again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    storeAccessToken(data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthMessage('');
    return data.user;
  };

  const logout = () => {
    clearAccessToken();
    setToken(null);
    setUser(null);
    setAuthMessage('');
    navigate('/login', { replace: true });
  };

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    authMessage,
    setAuthMessage,
    login,
    logout,
  }), [user, token, loading, authMessage]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}