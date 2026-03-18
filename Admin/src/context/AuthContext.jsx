import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tz_admin_token'));
  const [loading, setLoading] = useState(true);

  // On mount — verify token if exists
  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.data?.role === 'admin') {
        setUser(data.data);
      } else {
        // Not admin or token invalid — clear everything
        logout(false);
      }
    } catch {
      logout(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || 'Login failed.');
    }

    // Role check — only admin allowed
    if (data.user?.role !== 'admin') {
      throw new Error('Access denied. Admin accounts only.');
    }

    localStorage.setItem('tz_admin_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = (redirect = true) => {
    localStorage.removeItem('tz_admin_token');
    setToken(null);
    setUser(null);
    if (redirect) window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);