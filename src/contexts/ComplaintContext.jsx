
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/hooks/useAuth.jsx';

export const ComplaintContext = createContext(null);

const generateId = (prefix = 'EGS') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export function ComplaintProvider({ children }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!supabase) {
        console.log("Supabase client not available. Skipping ComplaintContext fetch.");
        setLoading(false);
        return;
      }
      setLoading(true);
      if (user) {
        try {
          let query = supabase.from('complaints').select('*');
          if (user.role === 'customer') {
            query = query.eq('customer_id', user.id);
          }
          const { data, error } = await query;
          if (error) throw error;
          setComplaints(data || []);
        } catch (error) {
          console.error("Error fetching complaints from Supabase:", error);
          setComplaints([]);
        }
      } else {
        setComplaints([]);
      }
      setLoading(false);
    };
    fetchComplaints();
  }, [user]);

  const createComplaint = useCallback(async (bookingId, customerId, subject, description, rating, type = 'complaint') => {
    if (!supabase) return { success: false, error: "Database connection not available." };
    const complaintId = `${type.toUpperCase()}-${generateId()}`;
    const complaintData = {
      id: complaintId,
      booking_id: bookingId,
      customer_id: customerId,
      subject,
      description,
      rating,
      type, 
      status: 'open',
      history: [{ status: 'open', timestamp: new Date().toISOString(), remarks: `${type.charAt(0).toUpperCase() + type.slice(1)} registered.` }]
    };

    const { data: newComplaint, error } = await supabase
      .from('complaints')
      .insert(complaintData)
      .select()
      .single();

    if (error) {
      console.error("Error creating complaint in Supabase:", error);
      return { success: false, error: error.message };
    }
    setComplaints(prev => [...prev, newComplaint]);
    return { success: true, complaint: newComplaint };
  }, []);

  const resolveComplaint = useCallback(async (complaintId, remarks, documents) => {
    if (!supabase) return;
    const complaintIndex = complaints.findIndex(c => c.id === complaintId);
    if (complaintIndex === -1) return;

    const complaint = complaints[complaintIndex];
    const resolutionDetails = { remarks, documents, resolvedAt: new Date().toISOString() };
    const updatedHistory = [...(complaint.history || []), { status: 'resolved', timestamp: new Date().toISOString(), remarks: `Resolved: ${remarks}` }];
    
    const { data, error } = await supabase
      .from('complaints')
      .update({ 
        status: 'resolved', 
        resolution_details: resolutionDetails, 
        history: updatedHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', complaintId)
      .select()
      .single();

    if (error) {
      console.error("Error resolving complaint in Supabase:", error);
      return;
    }
    setComplaints(prev => prev.map(c => c.id === complaintId ? data : c));
  }, [complaints]);

  const clearComplaints = useCallback(async () => {
    if (!user || !supabase) return;
    
    let deleteQuery = supabase.from('complaints').delete();
    if (user.role === 'customer') {
      deleteQuery = deleteQuery.eq('customer_id', user.id);
    } else if (user.role !== 'admin') {
      console.warn("User does not have permission to clear all complaints.");
      return;
    }
    const { error } = await deleteQuery;
    if (error) {
      console.error("Error clearing complaints from Supabase:", error);
    } else {
      setComplaints(prev => user.role === 'admin' ? [] : prev.filter(c => c.customer_id !== user.id));
    }
  }, [user]);

  const value = useMemo(() => ({
    complaints,
    loading,
    createComplaint,
    resolveComplaint,
    clearComplaints
  }), [complaints, loading, createComplaint, resolveComplaint, clearComplaints]);

  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>;
}
