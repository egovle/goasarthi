import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUserProfile = async (id) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }
    return data;
  };

  const initializeSession = async () => {
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Session fetch failed:", error.message);
      setLoading(false);
      return;
    }

    if (session?.user?.id) {
      const profile = await fetchUserProfile(session.user.id);
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("Login error:", error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }

    const profile = await fetchUserProfile(data.user.id);
    if (profile) {
      setUser(profile);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async ({ email, password, name, phone, address }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const userId = data.user?.id;
      const { error: profileError } = await supabase.from('profiles').insert([{
        id: userId,
        name,
        email,
        phone,
        address,
        role: 'customer',
        user_id_custom: null,
        wallet_balance: 0,
        bank_accounts: [],
        transaction_history: [],
        is_available: true,
        joined_date: new Date()
      }]);

      if (profileError) throw profileError;

      const profile = await fetchUserProfile(userId);
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (err) {
      console.error("Signup error:", err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signupVLE = async ({ email, password, name, phone, address }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const userId = data.user?.id;
      const { error: profileError } = await supabase.from('profiles').insert([{
        id: userId,
        name,
        email,
        phone,
        address,
        role: 'vle',
        user_id_custom: null,
        wallet_balance: 0,
        bank_accounts: [],
        transaction_history: [],
        is_available: true,
        joined_date: new Date()
      }]);

      if (profileError) throw profileError;

      const profile = await fetchUserProfile(userId);
      if (profile) {
        setUser(profile);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (err) {
      console.error("VLE signup error:", err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).then(profile => {
          setUser(profile);
          setIsAuthenticated(!!profile);
        });
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      listener.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    login,
    signup,
    signupVLE,
    logout,
    isAuthenticated,
    loading
  }), [user, login, signup, signupVLE, logout, isAuthenticated, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
};
