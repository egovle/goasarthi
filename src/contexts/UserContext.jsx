
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { supabase } from '@/lib/supabaseClient.js';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { user: loggedInUser, refreshUser, updateUserDetailsInSupabase } = useAuth(); 
  const [allUsersForAdmin, setAllUsersForAdmin] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllUsersForAdmin = useCallback(async () => {
    if (!supabase) {
      console.log("Supabase client not available. Skipping UserContext admin fetch.");
      setAllUsersForAdmin([]);
      return;
    }
    if (loggedInUser && loggedInUser.role === 'admin') {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) {
        console.error("Error fetching all users for admin from Supabase:", error);
        setAllUsersForAdmin([]);
      } else {
        setAllUsersForAdmin(data || []);
      }
      setLoading(false);
    } else {
      setAllUsersForAdmin([]);
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchAllUsersForAdmin();
  }, [fetchAllUsersForAdmin]);

  const getCustomers = useCallback(() => {
    if (loggedInUser && loggedInUser.role === 'admin') {
      return allUsersForAdmin.filter(u => u.role === 'customer');
    }
    return []; 
  }, [loggedInUser, allUsersForAdmin]);

  const getVLEs = useCallback(() => {
     if (loggedInUser && loggedInUser.role === 'admin') {
      return allUsersForAdmin.filter(u => u.role === 'vle');
    }
    return [];
  }, [loggedInUser, allUsersForAdmin]);
  
  const getUserById = useCallback(async (userId) => {
    if (!supabase || !userId) return null;
    if (loggedInUser && loggedInUser.id === userId) return loggedInUser;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setLoading(false);
    if (error && error.code !== 'PGRST116') { 
      console.error(`Error fetching profile for ${userId} from Supabase:`, error);
    }
    return data || null; 
  }, [loggedInUser]);

  const updateUserDetails = useCallback(async (userId, updatedDetails) => {
    if (!supabase) return false;
    setLoading(true);
    const success = await updateUserDetailsInSupabase(userId, updatedDetails); 
    setLoading(false);

    if (success && loggedInUser && loggedInUser.role === 'admin') {
      await fetchAllUsersForAdmin();
    }
    return success;
  }, [updateUserDetailsInSupabase, loggedInUser, fetchAllUsersForAdmin]);

  const addBankAccount = useCallback(async (userId, bankAccountDetails) => {
    if (!supabase) return false;
    const userProfile = await getUserById(userId);
    if (userProfile) {
      const updatedBankAccounts = [...(userProfile.bank_accounts || []), bankAccountDetails];
      return updateUserDetails(userId, { bank_accounts: updatedBankAccounts });
    }
    return false;
  }, [getUserById, updateUserDetails]);

  const removeBankAccount = useCallback(async (userId, accountNumber) => {
    if (!supabase) return false;
    const userProfile = await getUserById(userId);
    const currentBankAccounts = userProfile?.bank_accounts || [];
    if (userProfile && currentBankAccounts) {
      const updatedBankAccounts = currentBankAccounts.filter(acc => acc.accountNumber !== accountNumber);
      return updateUserDetails(userId, { bank_accounts: updatedBankAccounts });
    }
    return false;
  }, [getUserById, updateUserDetails]);

  const value = useMemo(() => ({
    getCustomers,
    getVLEs,
    getUserById,
    updateUserDetails,
    addBankAccount,
    removeBankAccount,
    allUsersForAdmin, 
    loadingUsers: loading,
    refetchAllUsers: fetchAllUsersForAdmin,
  }), [getCustomers, getVLEs, getUserById, updateUserDetails, addBankAccount, removeBankAccount, allUsersForAdmin, loading, fetchAllUsersForAdmin]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
