import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { login as loginService, logout as logoutService, getCurrentUser } from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Manejar correctamente el objeto de retorno de onAuthStateChange
    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    // Extraer la suscripcion del objeto de retorno
    // En versiones modernas: { data: { subscription } }
    // En versiones antiguas: { subscription: ... }
    const subscription = authListener.data?.subscription || authListener.subscription;

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const userData = await loginService(email, password);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isRevisor: user?.role === 'revisor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}