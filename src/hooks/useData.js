
import { useContext, useMemo } from 'react';
import { BookingContext } from '@/contexts/BookingContext';
import { LeadContext } from '@/contexts/LeadContext';
import { TaskContext } from '@/contexts/TaskContext';
import { UserContext } from '@/contexts/UserContext';
import { ComplaintContext } from '@/contexts/ComplaintContext';
import { SpecialRequestContext } from '@/contexts/SpecialRequestContext';
import { WalletContext } from '@/contexts/WalletContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabaseClient.js';

export function useData() {
  const bookingContext = useContext(BookingContext);
  const leadContext = useContext(LeadContext);
  const taskContext = useContext(TaskContext);
  const userContext = useContext(UserContext);
  const complaintContext = useContext(ComplaintContext);
  const specialRequestContext = useContext(SpecialRequestContext);
  const walletContext = useContext(WalletContext);
  const notificationContext = useContext(NotificationContext);

  const clearAllData = async () => {
    console.warn("Clearing all data. This is a destructive operation.");
    if (!supabase) {
        console.warn("Supabase client not available. Cannot clear database data.");
        return;
    }
    try {
      await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
      await supabase.from('special_requests').delete().neq('id', '0');
      await supabase.from('complaints').delete().neq('id', '0');
      await supabase.from('tasks').delete().neq('id', '0');
      await supabase.from('leads').delete().neq('id', '0');
      await supabase.from('bookings').delete().neq('id', '0');
      
      console.warn("User deletion from the client-side is disabled for security reasons. Please manage users directly from your Supabase dashboard.");

      await supabase.from('platform_data').update({ value: { balance: 0 } }).eq('id', 'commission_balance');
      
      console.log("All data cleared from Supabase tables (where applicable). Admin users preserved.");
    } catch (error) {
      console.error("Error during clearAllData:", error);
    }
  };

  const downloadFile = async (filePath, fileName) => {
    if (!supabase || !filePath) {
      console.error("Download failed: Supabase client or file path not available.");
      return { success: false, error: "File path is missing." };
    }
    try {
      const { data, error } = await supabase.storage
        .from('task_documents')
        .download(filePath);
      
      if (error) throw error;

      const blob = data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      console.error("Error downloading file:", error);
      return { success: false, error: error.message };
    }
  };
  
  const memoizedValue = useMemo(() => ({
    services: bookingContext?.services || [],
    loadingServices: bookingContext?.loading || true,
    addService: bookingContext?.addService,
    updateService: bookingContext?.updateService,
    removeService: bookingContext?.removeService,
    
    bookings: bookingContext?.bookings || [],
    loadingBookings: bookingContext?.loading || true,
    createBooking: bookingContext?.createBooking,
    addDocumentsToBooking: bookingContext?.addDocumentsToBooking,
    updateBookingStatusAndHistory: bookingContext?.updateBookingStatusAndHistory,
    
    leads: leadContext?.leads || [],
    loadingLeads: leadContext?.loading || true,
    createLead: leadContext?.createLead,
    addDocumentsToLead: leadContext?.addDocumentsToLead,
    updateLeadStatusAndHistory: leadContext?.updateLeadStatusAndHistory,

    tasks: taskContext?.tasks || [],
    loadingTasks: taskContext?.loading || true,
    assignTask: taskContext?.assignTask,
    updateTask: taskContext?.updateTask,
    reassignTask: taskContext?.reassignTask,
    addDocumentsToTask: taskContext?.addDocumentsToTask,
    approveCommission: taskContext?.approveCommission,
    rejectCommission: taskContext?.rejectCommission,
    
    getCustomers: userContext?.getCustomers,
    getVLEs: userContext?.getVLEs,
    getUserById: userContext?.getUserById,
    updateUserDetails: userContext?.updateUserDetails,
    addBankAccount: userContext?.addBankAccount,
    removeBankAccount: userContext?.removeBankAccount,
    loadingUsers: userContext?.loadingUsers || false,
    allUsersForAdmin: userContext?.allUsersForAdmin || [],
    refetchAllUsers: userContext?.refetchAllUsers,

    complaints: complaintContext?.complaints || [],
    loadingComplaints: complaintContext?.loading || true,
    createComplaint: complaintContext?.createComplaint,
    resolveComplaint: complaintContext?.resolveComplaint,
    
    specialRequests: specialRequestContext?.specialRequests || [],
    loadingSpecialRequests: specialRequestContext?.loading || true,
    createSpecialRequest: specialRequestContext?.createSpecialRequest,
    updateSpecialRequestStatus: specialRequestContext?.updateSpecialRequestStatus,
    addDocumentsToSpecialRequest: specialRequestContext?.addDocumentsToSpecialRequest,

    addDemoMoney: walletContext?.addDemoMoney,
    withdrawDemoMoney: walletContext?.withdrawDemoMoney,
    debitUserWallet: walletContext?.debitUserWallet,
    creditUserWallet: walletContext?.creditUserWallet,
    processTaskCompletionPayouts: walletContext?.processTaskCompletionPayouts,
    issueRefundToCustomer: walletContext?.issueRefundToCustomer,
    checkBalance: walletContext?.checkBalance,
    getWalletDetails: walletContext?.getWalletDetails,
    platformCommission: walletContext?.platformCommission || 0,
    loadingWallet: walletContext?.loadingWallet || false,

    notifications: notificationContext?.notifications || [],
    loadingNotifications: notificationContext?.loading || true,
    addNotification: notificationContext?.addNotification,
    markAsRead: notificationContext?.markAsRead,
    markAllAsRead: notificationContext?.markAllAsRead,
    getNotificationsForUser: notificationContext?.getNotificationsForUser,
    getUnreadCountForUser: notificationContext?.getUnreadCountForUser,
    clearNotificationsForUser: notificationContext?.clearNotificationsForUser,

    clearAllData,
    downloadFile,
  }), [bookingContext, leadContext, taskContext, userContext, complaintContext, specialRequestContext, walletContext, notificationContext]);

  return memoizedValue;
}
