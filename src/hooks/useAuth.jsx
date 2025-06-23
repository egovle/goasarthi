
import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient.js';

const AuthContext = createContext(null);



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const login = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'This account has not been confirmed. Please check your email for a confirmation link or contact support.' };
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
          return { success: false, error: "Login failed: User profile not found. Please contact support." };
      }
      return { success: true, user: profile };
    }
    setLoading(false);
    return { success: false, error: "An unexpected error occurred." };
  }, []);
  
  const quickLogin = useCallback(async (email, password) => {
    return await login(email, password);
  }, [login]);

  const signup = useCallback(async (signupData) => {
    setLoading(true);
    const user_id_custom = `CUST${Date.now().toString().slice(-4)}`;
    const { data, error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      phone: signupData.phone,
      options: { 
        data: { 
          name: signupData.name, 
          role: 'customer', 
          address: signupData.address, 
          user_id_custom, 
          wallet_balance: 1000, 
          is_available: true 
        } 
      }
    });
    setLoading(false);
    if (error) return { success: false, error: error.message };
    return { success: true, user: data.user, message: "Signup successful! If email confirmation is enabled, please check your inbox."};
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

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

  const updateUserDetailsInSupabase = useCallback(async (userId, updatedProfileData) => {
    const { error } = await supabase.from('profiles').update(updatedProfileData).eq('id', userId);
    if (error) { 
      console.error("Error updating profile in Supabase:", error); 
      return false; 
    }
    await refreshUser();
    return true;
  }, [refreshUser]);

  const seedUsers = useCallback(async () => {
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
   

    for (const userToSeed of usersToCreate) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: userToSeed.email,
          password: userToSeed.password,
          phone: userToSeed.phone,
          options: {
            data: {
              name: userToSeed.name,
              role: userToSeed.role,
              user_id_custom: userToSeed.user_id_custom,
              center: userToSeed.center,
              address: userToSeed.address,
              is_available: userToSeed.is_available !== false,
              wallet_balance: 1000,
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Error creating ${userToSeed.email}: ${error.message}`);
          }
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
        errors.push(`Exception creating ${userToSeed.email}: ${err.message}`);
      }
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);

    setLoading(false);
    return { successCount, errorCount, errors };
  }, []);

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
    
    seedUsers 
  }), [user, loading, isAuthenticated, login, quickLogin, signup, logout, refreshUser, updateUserDetailsInSupabase, seedUsers]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
