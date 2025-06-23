import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { WalletContext } from '@/contexts/WalletContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabaseClient.js';
import { generateId, uploadFilesToSupabase } from '@/lib/coreUtils.js';

export const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const walletContext = useContext(WalletContext);
  const notificationContext = useContext(NotificationContext);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!supabase || !user) {
        setBookings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let query = supabase.from('bookings').select('*');
        if (user.role === 'customer') {
          query = query.eq('customer_id', user.id);
        } else if (user.role !== 'admin') {
          setBookings([]);
          setLoading(false);
          return;
        }

        const { data, error } = await query;
        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const createBooking = useCallback(async (service, customerId, filesToUpload, customerDetails) => {
    if (!supabase || !walletContext || !notificationContext || !service) {
      return { success: false, error: "Initialization error." };
    }

    const fee = Number(service.fee || 0);
    const canAfford = await walletContext.checkBalance(customerId, fee);

    if (!canAfford) {
      return { success: false, error: "Insufficient wallet balance. Please add funds." };
    }

    const bookingId = generateId('BOK');
    const uploadedDocMetadata = await uploadFilesToSupabase(filesToUpload, bookingId);

    if (filesToUpload.length > 0 && uploadedDocMetadata.length !== filesToUpload.length) {
      return { success: false, error: "Some files failed to upload. Please try again." };
    }

    const bookingData = {
      id: bookingId,
      service_id: service.id,
      service_name: service.name,
      customer_id: customerId,
      customer_details: customerDetails,
      documents: uploadedDocMetadata,
      status: 'pending',
      fee: service.fee,
      type: 'booking',
      history: [{ status: 'pending', timestamp: new Date().toISOString(), remarks: 'Booking created and fee deducted from wallet.' }]
    };

    const { data: newBooking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error("Error creating booking:", error);
      return { success: false, error: error.message };
    }

    await walletContext.debitUserWallet(customerId, fee, `Service booking: ${service.name} (ID: ${newBooking.id})`);
    setBookings(prev => [...prev, newBooking]);

    return { success: true, booking: newBooking };
  }, [walletContext, notificationContext]);

  const updateBookingStatusAndHistory = useCallback(async (bookingId, newStatus, remarks, newDocs = null) => {
    if (!supabase || !notificationContext) return;

    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;

    const booking = bookings[bookingIndex];
    const updatedHistory = [...(booking.history || []), { status: newStatus, timestamp: new Date().toISOString(), remarks }];

    let updatePayload = {
      status: newStatus,
      history: updatedHistory,
      updated_at: new Date().toISOString(),
    };

    if (newDocs) {
      updatePayload.documents = [...(booking.documents || []), ...newDocs];
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating booking status:", error);
      return;
    }

    setBookings(prev => prev.map(b => b.id === bookingId ? data : b));

    if (data.customer_id) {
      notificationContext.addNotification(
        data.customer_id,
        `Status of your booking for "${data.service_name}" updated to ${newStatus.replace(/_/g, ' ')}. Remark: ${remarks}`,
        'info',
        `/customer-dashboard?tab=my-bookings&bookingId=${data.id}`,
        'Booking Status Update'
      );
    }
  }, [bookings, notificationContext]);

  const addDocumentsToBooking = useCallback(async (bookingId, newDocs, remarks, newStatus) => {
    if (!supabase || !notificationContext) return;

    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;

    const booking = bookings[bookingIndex];
    const updatedDocsList = [...(booking.documents || []), ...newDocs];
    const historyEntry = { status: newStatus || booking.status, timestamp: new Date().toISOString(), remarks: remarks || `Added ${newDocs.length} new document(s).` };
    const updatedHistory = [...(booking.history || []), historyEntry];

    const { data, error } = await supabase
      .from('bookings')
      .update({
        documents: updatedDocsList,
        status: newStatus || booking.status,
        history: updatedHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error("Error adding documents to booking:", error);
      return;
    }

    setBookings(prev => prev.map(b => b.id === bookingId ? data : b));

    if (data.customer_id) {
      notificationContext.addNotification(
        data.customer_id,
        `Documents added to your booking for "${data.service_name}". Remark: ${remarks}`,
        'info',
        `/customer-dashboard?tab=my-bookings&bookingId=${data.id}`,
        'Documents Updated'
      );
    }
  }, [bookings, notificationContext]);

  const clearBookings = useCallback(async () => {
    if (!user || !supabase) return;

    let deleteQuery = supabase.from('bookings').delete();
    if (user.role === 'customer') {
      deleteQuery = deleteQuery.eq('customer_id', user.id);
    } else if (user.role !== 'admin') {
      return;
    }

    const { error } = await deleteQuery;
    if (error) {
      console.error("Error clearing bookings:", error);
    } else {
      setBookings(prev => user.role === 'admin' ? [] : prev.filter(b => b.customer_id !== user.id));
    }
  }, [user]);

  const value = useMemo(() => ({
    bookings,
    loading,
    createBooking,
    updateBookingStatusAndHistory,
    addDocumentsToBooking,
    clearBookings
  }), [bookings, loading, createBooking, updateBookingStatusAndHistory, addDocumentsToBooking, clearBookings]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
