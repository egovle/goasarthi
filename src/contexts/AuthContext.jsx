import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchProfile = async (supabaseUser) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
    return profile;
  };

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Supabase auth error:", error.message);
        setUser(null);
        setIsAuthenticated(false);
      } else if (authUser) {
        const profile = await fetchProfile(authUser);
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

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(); // Reload user on login/logout
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    const profile = await fetchProfile(data.user);
    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, error: "Profile not found." };
    }

    setUser(profile);
    setIsAuthenticated(true);
    setLoading(false);
    return { success: true, user: profile };
  }, []);

  const signup = useCallback(async (signupData) => {
    const { email, password, phone, name, address, role = 'customer' } = signupData;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      phone,
      options: {
        data: {
          name,
          role,
          address,
          user_id_custom: `${role.toUpperCase().slice(0, 3)}${Date.now().toString().slice(-4)}`,
          wallet_balance: 1000,
          is_available: true,
        },
      },
    });

    if (error) return { success: false, error: error.message };

    return {
      success: true,
      user: data.user,
      message: "Signup successful. Please check your email to confirm your account.",
    };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const profile = await fetchProfile(authUser);
      setUser(profile);
      setIsAuthenticated(!!profile);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
      refreshUser,
      isAuthenticated,
      loading,
    }),
    [user, login, signup, logout, refreshUser, isAuthenticated, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
