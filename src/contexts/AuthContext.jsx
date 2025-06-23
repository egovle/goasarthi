import React, { createContext, useState, useEffect, useContext } from 'react';
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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
};
