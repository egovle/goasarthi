
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx'; 
import { supabase } from '@/lib/supabaseClient.js';

export const WalletContext = createContext(null);

const generateId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

const _updateWalletAndHistory = async (
  userId, 
  amount, 
  type, 
  description, 
  serviceId, 
  commission, 
  loggedInUserFromHook,
  refreshUserFunc, 
  setLoadingFunc
) => {
  if (!supabase) {
    console.error("_updateWalletAndHistory called but Supabase client is null.");
    return false;
  }
  setLoadingFunc(true);
  
  const { data: userProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('wallet_balance, transaction_history')
    .eq('id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { 
    console.error("Error fetching user profile for wallet update (Supabase):", fetchError);
    setLoadingFunc(false);
    return false;
  }
  
  if (!userProfile && !fetchError) { 
    console.error("User profile not found in Supabase for wallet update.");
    setLoadingFunc(false);
    return false;
  }

  const currentBalance = userProfile?.wallet_balance || 0;
  const currentHistory = userProfile?.transaction_history || [];
  const newBalance = currentBalance + amount; 

  const transaction = {
    id: generateId(),
    type,
    amount: Math.abs(amount),
    description,
    serviceId,
    commission,
    timestamp: new Date().toISOString(),
    balanceAfterTransaction: newBalance
  };
  
  const updatedTransactionHistory = [transaction, ...currentHistory];
  const walletUpdatePayload = { wallet_balance: newBalance, transaction_history: updatedTransactionHistory, updated_at: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from('profiles')
    .update(walletUpdatePayload)
    .eq('id', userId);
  
  setLoadingFunc(false);

  if (updateError) {
    console.error("Error updating wallet in Supabase:", updateError);
    return false;
  }
  
  if (loggedInUserFromHook && loggedInUserFromHook.id === userId) {
    await refreshUserFunc(); 
  }
  return true;
};


export function WalletProvider({ children }) {
  const { user: loggedInUser, refreshUser } = useAuth();
  const [platformCommission, setPlatformCommission] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlatformData = async () => {
      if (!supabase) {
        console.log("Supabase client not available. Skipping WalletContext platform data fetch.");
        setPlatformCommission(0);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_data')
        .select('value')
        .eq('id', 'commission_balance')
        .single();
      setLoading(false);
      if (error && error.code !== 'PGRST116') { 
        console.error("Error fetching platform commission from Supabase, defaulting to 0:", error);
        setPlatformCommission(0);
      } else if (data) {
        setPlatformCommission(data.value?.balance || 0);
      } else {
        const { error: insertError } = await supabase.from('platform_data').insert({ id: 'commission_balance', value: {balance: 0}});
        if (insertError) console.error("Error initializing platform commission:", insertError);
        setPlatformCommission(0); 
      }
    };
    fetchPlatformData();
  }, []);

  const updateWalletAndHistory = useCallback((userId, amount, type, description, serviceId = null, commission = null) => {
    return _updateWalletAndHistory(userId, amount, type, description, serviceId, commission, loggedInUser, refreshUser, setLoading);
  }, [loggedInUser, refreshUser]);

  const addDemoMoney = useCallback(async (userId, amount, remarks = "Demo money added by user.") => {
    if (amount <= 0) return { success: false, error: "Amount must be positive." };
    const success = await updateWalletAndHistory(userId, amount, 'deposit', remarks);
    return { success };
  }, [updateWalletAndHistory]);

  const withdrawDemoMoney = useCallback(async (userId, amount, bankAccountNumber, remarks = "Withdrawal request.") => {
    if (!supabase) return { success: false, error: "Supabase client not available." };
    if (amount <= 0) return { success: false, error: "Amount must be positive." };
    
    setLoading(true);
    const { data: userProfileData, error: fetchError } = await supabase
        .from('profiles')
        .select('wallet_balance, bank_accounts')
        .eq('id', userId)
        .single();
    setLoading(false);

    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching user for withdrawal (Supabase):", fetchError);
        return { success: false, error: "Failed to fetch user details." };
    }
    if (!userProfileData) {
      return { success: false, error: "User not found." };
    }
    if ((userProfileData.wallet_balance || 0) < amount) {
      return { success: false, error: "Insufficient balance." };
    }
    if (!userProfileData.bank_accounts || !userProfileData.bank_accounts.find(acc => acc.accountNumber === bankAccountNumber)) {
        return { success: false, error: "Selected bank account not found." };
    }
    const success = await updateWalletAndHistory(userId, -amount, 'withdrawal', `${remarks} to A/C: ${bankAccountNumber}`);
    return { success };
  }, [updateWalletAndHistory]);
  
  const debitUserWallet = useCallback(async (userId, amount, description) => {
    if (amount <= 0) return false;
    return await updateWalletAndHistory(userId, -amount, 'debit', description);
  }, [updateWalletAndHistory]);

  const creditUserWallet = useCallback(async (userId, amount, description) => {
    if (amount <= 0) return false;
    return await updateWalletAndHistory(userId, amount, 'credit', description);
  }, [updateWalletAndHistory]);

  const processTaskCompletionPayouts = useCallback(async (taskDetails) => {
    if (!supabase) return { success: false, error: "Supabase client not available." };
    const { vle_id: assignedVleId, fee: serviceFee, id: serviceId, service_name: serviceName, type, generated_by_vle_id: generatedByVleId } = taskDetails;

    const adminCommissionRate = 0.10;
    const adminCommissionAmount = serviceFee * adminCommissionRate;
    let assignedVlePayout = 0;
    let generatingVlePayout = 0;
    let allPayoutsSuccessful = true;

    if (type === 'lead' && generatedByVleId) {
      const leadVleShare = 0.45;
      const assignedVleShare = 0.45;
      assignedVlePayout = serviceFee * assignedVleShare;
      generatingVlePayout = serviceFee * leadVleShare;

      if (assignedVleId) {
        const assignedVleCreditSuccess = await updateWalletAndHistory(assignedVleId, assignedVlePayout, 'payout', `Payout (assigned) for lead: ${serviceName} (ID: ${serviceId})`, serviceId, adminCommissionAmount);
        if (!assignedVleCreditSuccess) allPayoutsSuccessful = false;
      }
      
      const generatingVleCreditSuccess = await updateWalletAndHistory(generatedByVleId, generatingVlePayout, 'payout', `Payout (generated) for lead: ${serviceName} (ID: ${serviceId})`, serviceId, null);
      if (!generatingVleCreditSuccess) allPayoutsSuccessful = false;

    } else { 
      const assignedVleShare = 0.90;
      assignedVlePayout = serviceFee * assignedVleShare;
      if (assignedVleId) {
        const assignedVleCreditSuccess = await updateWalletAndHistory(assignedVleId, assignedVlePayout, 'payout', `Payout for service: ${serviceName} (ID: ${serviceId})`, serviceId, adminCommissionAmount);
        if (!assignedVleCreditSuccess) allPayoutsSuccessful = false;
      }
    }
    
    if (allPayoutsSuccessful) {
      const newTotalCommission = platformCommission + adminCommissionAmount;
      setLoading(true);
      const { error: updatePlatformDataError } = await supabase
        .from('platform_data')
        .update({ value: { balance: newTotalCommission }, updated_at: new Date().toISOString() })
        .eq('id', 'commission_balance');
      
      const { error: logCommissionError } = await supabase
        .from('platform_transactions')
        .insert({
          type: 'commission',
          amount: adminCommissionAmount,
          related_task_id: serviceId,
          description: `Commission from ${type}: ${serviceName}`
        });

      setLoading(false);
      if (updatePlatformDataError) {
        console.error("Error updating platform commission (Supabase):", updatePlatformDataError);
      } else {
        setPlatformCommission(newTotalCommission);
      }
      if (logCommissionError) {
        console.error("Error logging platform commission transaction:", logCommissionError);
      }
      return { success: true, assignedVlePayout, generatingVlePayout, adminCommissionAmount };
    }
    return { success: false, error: "One or more VLE payouts failed." };
  }, [platformCommission, updateWalletAndHistory]);

  const issueRefundToCustomer = useCallback(async (customerId, amount, serviceId, serviceName, remarks = "Refund processed by admin.") => {
    if (amount <= 0) return { success: false, error: "Refund amount must be positive." };
    const success = await updateWalletAndHistory(customerId, amount, 'refund', `${remarks} For Service: ${serviceName} (ID: ${serviceId})`, serviceId);
    return { success };
  }, [updateWalletAndHistory]);

  const checkBalance = useCallback(async (userId, amount) => {
    if (!supabase) return false;
    const { data: userProfileData, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error checking balance (Supabase):", error);
        return false;
    }
    if (!userProfileData) {
      return false;
    }
    return (userProfileData.wallet_balance || 0) >= amount;
  }, []);

  const getWalletDetails = useCallback(async (userId) => {
    if (!supabase || !userId) return null;
    setLoading(true);
    const { data: userProfileData, error } = await supabase
        .from('profiles')
        .select('wallet_balance, transaction_history')
        .eq('id', userId)
        .single();
    setLoading(false);

    if (error && error.code !== 'PGRST116') {
        console.error("Error getting wallet details (Supabase):", error);
        return null;
    }
    if (!userProfileData) {
      return null;
    }
    return {
      balance: userProfileData.wallet_balance || 0,
      transactions: userProfileData.transaction_history || []
    };
  }, []);

  const value = useMemo(() => ({
    addDemoMoney,
    withdrawDemoMoney,
    debitUserWallet,
    creditUserWallet,
    processTaskCompletionPayouts,
    issueRefundToCustomer,
    checkBalance,
    getWalletDetails,
    platformCommission,
    loadingWallet: loading
  }), [addDemoMoney, withdrawDemoMoney, debitUserWallet, creditUserWallet, processTaskCompletionPayouts, issueRefundToCustomer, checkBalance, getWalletDetails, platformCommission, loading]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
