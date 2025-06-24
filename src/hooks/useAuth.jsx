import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Auth state monitor
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error("Error getting session:", error);

      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUser(profile || null);
        setIsAuthenticated(!!profile);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUser(profile || null);
        setIsAuthenticated(!!profile);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'This account has not been confirmed. Please check your email.' };
      }
      return { success: false, error: error.message };
    }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setUser(profile);
      setIsAuthenticated(!!profile);
      setLoading(false);

      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: "Login failed: User profile not found." };
      }
      return { success: true, user: profile };
    }
    setLoading(false);
    return { success: false, error: "An unexpected error occurred." };
  }, []);

  const quickLogin = useCallback(async (email, password) => {
    return await login(email, password);
  }, [login]);

  // Unified Signup (customer or vle based on input)
  const signup = useCallback(async (signupData) => {
    setLoading(true);

    const user_id_custom = `${
      signupData.role === 'vle' ? 'VLE' : 'CUST'
    }${Date.now().toString().slice(-4)}`;

    const { data, error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password
    });

    if (error) {
      setLoading(false);
      return { success: false, error: error.message };
    }

    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    const profilePayload = {
      id: supabaseUser.id,
      name: signupData.name,
      email: signupData.email,
      phone: signupData.phone,
      address: signupData.address,
      role: signupData.role || 'customer',
      user_id_custom,
      wallet_balance: 1000,
      is_available: true,
      center: signupData.center || null, // optional for VLE
    };

    const { error: profileError } = await supabase.from('profiles').insert(profilePayload);

    if (profileError) {
      console.error("Failed to insert profile:", profileError.message);
      await supabase.auth.admin.deleteUser(supabaseUser.id);
      setLoading(false);
      return { success: false, error: "Signup failed: Could not create user profile." };
    }

    setLoading(false);
    return {
      success: true,
      user: supabaseUser,
      message: "Signup successful! Please check your email if confirmation is required."
    };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  // Refresh user session
  const refreshUser = useCallback(async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
      setUser(profile);
      setIsAuthenticated(!!profile);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  // Update profile info
  const updateUserDetailsInSupabase = useCallback(async (userId, updatedProfileData) => {
    const { error } = await supabase.from('profiles').update(updatedProfileData).eq('id', userId);
    if (error) {
      console.error("Error updating profile in Supabase:", error);
      return false;
    }
    await refreshUser();
    return true;
  }, [refreshUser]);

  const value = useMemo(() => ({
    user,
    login,
    quickLogin,
    signup,
    logout,
    loading,
    isAuthenticated,
    refreshUser,
    updateUserDetailsInSupabase,
  }), [
    user,
    login,
    quickLogin,
    signup,
    logout,
    loading,
    isAuthenticated,
    refreshUser,
    updateUserDetailsInSupabase,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
