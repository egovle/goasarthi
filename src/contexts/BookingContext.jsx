
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { WalletContext } from '@/contexts/WalletContext';
import { NotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabaseClient.js';
import { generateId, uploadFilesToSupabase } from '@/lib/coreUtils.js';

export const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const walletContext = useContext(WalletContext);
  const notificationContext = useContext(NotificationContext);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');
        if (servicesError) throw servicesError;
        setServices(servicesData || []);

        if (user) {
          let query = supabase.from('bookings').select('*');
          if (user.role === 'customer') {
            query = query.eq('customer_id', user.id);
          } else if (user.role !== 'admin') {
            setBookings([]);
            setLoading(false);
            return;
          }
          
          const { data: bookingsData, error: bookingsError } = await query;
          if (bookingsError) throw bookingsError;
          setBookings(bookingsData || []);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error("Error fetching initial booking data from Supabase:", error);
        setServices([]); 
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  const createBooking = useCallback(async (serviceId, customerId, filesToUpload, customerDetails) => {
    if (!supabase || !walletContext || !notificationContext) {
      return { success: false, error: "Initialization error." }; 
    }
    const service = services.find(s => s.id === serviceId);
    if (!service) {
        return { success: false, error: "Service not found." };
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
      service_id: serviceId,
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
      console.error("Error creating booking in Supabase:", error);
      return { success: false, error: error.message };
    }
    await walletContext.debitUserWallet(customerId, fee, `Service booking: ${service.name} (ID: ${newBooking.id})`);
    setBookings(prev => [...prev, newBooking]);
    return { success: true, booking: newBooking };
  }, [services, walletContext, notificationContext]);
  
  const updateBookingStatusAndHistory = useCallback(async (bookingId, newStatus, remarks, newDocs = null) => {
    if (!supabase || !notificationContext) return;
    
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) return;
    const booking = bookings[bookingIndex];
    const updatedHistory = [...(booking.history || []), { status: newStatus, timestamp: new Date().toISOString(), remarks }];
    
    let updatePayload = { status: newStatus, history: updatedHistory, updated_at: new Date().toISOString() };
    if (newDocs) {
        const updatedDocsList = [...(booking.documents || []), ...newDocs];
        updatePayload.documents = updatedDocsList;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating booking status in Supabase:", error);
      return;
    }
    setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
    if (data.customer_id) {
      notificationContext.addNotification(data.customer_id, `Status of your booking for "${data.service_name}" updated to ${newStatus.replace(/_/g, ' ')}. Remark: ${remarks}`, 'info', `/customer-dashboard?tab=my-bookings&bookingId=${data.id}`, 'Booking Status Update');
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
      console.error("Error adding documents to booking in Supabase:", error);
      return;
    }
    setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
    if (data.customer_id) {
        notificationContext.addNotification(data.customer_id, `Documents added to your booking for "${data.service_name}". Remark: ${remarks}`, 'info', `/customer-dashboard?tab=my-bookings&bookingId=${data.id}`, 'Documents Updated');
    }
  }, [bookings, notificationContext]);

  const addService = useCallback(async (name, category, fee) => {
    if (!supabase) return { success: false, error: "Supabase client not available." };
    const newServiceData = {
        id: generateId('SRV'),
        name,
        category,
        fee,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    const { data: newService, error } = await supabase
      .from('services')
      .insert(newServiceData)
      .select()
      .single();

    if (error) {
      console.error("Error adding service to Supabase:", error);
      return { success: false, error: error.message };
    }
    setServices(prev => [...prev, newService]);
    return { success: true, service: newService };
  }, []);

  const updateService = useCallback(async (serviceId, name, category, fee) => {
    if (!supabase) return { success: false, error: "Supabase client not available." };
    const { data, error } = await supabase
      .from('services')
      .update({ name, category, fee, updated_at: new Date().toISOString() })
      .eq('id', serviceId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating service in Supabase:", error);
      return { success: false, error: error.message };
    }
    setServices(prev => prev.map(s => s.id === serviceId ? data : s));
    return { success: true };
  }, []);

  const removeService = useCallback(async (serviceId) => {
    if (!supabase) return { success: false, error: "Supabase client not available." };
    const { count, error: checkError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId)
      .not('status', 'in', '("completed","rejected")');

    if (checkError) {
      console.error("Error checking active bookings for service (Supabase):", checkError);
      return { success: false, error: "Failed to check active bookings." };
    }
    if (count > 0) {
        return { success: false, error: "Cannot remove service with active bookings. Please resolve them first." };
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error("Error removing service from Supabase:", error);
      return { success: false, error: error.message };
    }
    setServices(prev => prev.filter(s => s.id !== serviceId));
    return { success: true };
  }, []);

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
      console.error("Error clearing bookings from Supabase:", error);
    } else {
      setBookings(prev => user.role === 'admin' ? [] : prev.filter(b => b.customer_id !== user.id));
    }
  }, [user]);

  const value = useMemo(() => ({
    services,
    bookings,
    loading,
    createBooking,
    updateBookingStatusAndHistory,
    addDocumentsToBooking,
    addService,
    updateService,
    removeService,
    clearBookings
  }), [services, bookings, loading, createBooking, updateBookingStatusAndHistory, addDocumentsToBooking, addService, updateService, removeService, clearBookings]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
