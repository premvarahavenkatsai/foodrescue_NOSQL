import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@foodrescue.org', password: 'password123', label: 'Admin (Vikram Malhotra)' },
  donor: { email: 'donor1@annapurna.in', password: 'password123', label: 'Donor (Annapurna Grand)' },
  ngo: { email: 'ngo1@rotibank.org', password: 'password123', label: 'NGO (Roti Bank Seva Trust)' },
  volunteer: { email: 'volunteer1@foodrescue.org', password: 'password123', label: 'Volunteer (Aarav Sharma)' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('foodrescue_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('foodrescue_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('foodrescue_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const quickLogin = async (role) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('foodrescue_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (e) {
      console.error("Failed to refresh user profile:", e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      quickLogin,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
