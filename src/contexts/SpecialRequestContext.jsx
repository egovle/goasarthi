
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/hooks/useAuth.jsx';

export const SpecialRequestContext = createContext(null);

const generateId = (prefix = 'EGS') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

export function SpecialRequestProvider({ children }) {
  const [specialRequests, setSpecialRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSpecialRequests = async () => {
      if (!supabase) {
        console.log("Supabase client not available. Skipping SpecialRequestContext fetch.");
        setLoading(false);
        return;
      }
      setLoading(true);
      if (user) {
        try {
          let query = supabase.from('special_requests').select('*');
          if (user.role === 'vle') {
            query = query.eq('vle_id', user.id);
          }
          const { data, error } = await query;
          if (error) throw error;
          setSpecialRequests(data || []);
        } catch (error) {
          console.error("Error fetching special requests from Supabase:", error);
          setSpecialRequests([]);
        }
      } else {
        setSpecialRequests([]);
      }
      setLoading(false);
    };
    fetchSpecialRequests();
  }, [user]);

  const createSpecialRequest = useCallback(async (vleId, requestType, serviceName, description, customerDetails, documents) => {
    if (!supabase) return null;
    const requestId = generateId('SR');
    const requestData = {
      id: requestId,
      vle_id: vleId,
      request_type: requestType, 
      service_name: requestType === 'special_service' ? serviceName : null,
      description,
      customer_details: requestType === 'special_service' ? customerDetails : null,
      documents: documents || [], 
      status: 'pending_admin_review',
      admin_remarks: null,
      history: [{ status: 'pending_admin_review', timestamp: new Date().toISOString(), remarks: 'Request submitted by VLE.' }]
    };

    const { data: newRequest, error } = await supabase
      .from('special_requests')
      .insert(requestData)
      .select()
      .single();

    if (error) {
      console.error("Error creating special request in Supabase:", error);
      return null;
    }
    setSpecialRequests(prev => [...prev, newRequest]);
    return newRequest;
  }, []);

  const updateSpecialRequestStatus = useCallback(async (requestId, status, adminRemarks, newDocuments = []) => {
    if (!supabase) return;
    const requestIndex = specialRequests.findIndex(sr => sr.id === requestId);
    if (requestIndex === -1) return;

    const request = specialRequests[requestIndex];
    const updatedDocs = [...(request.documents || []), ...newDocuments.map(d => ({...d, uploadedBy: 'admin'}))];
    const updatedHistory = [...(request.history || []), { status, timestamp: new Date().toISOString(), remarks: adminRemarks || `Status updated to ${status}. ${newDocuments.length > 0 ? `Added ${newDocuments.length} document(s).` : ''}`.trim() }];
    
    const { data, error } = await supabase
      .from('special_requests')
      .update({
        status,
        admin_remarks: adminRemarks,
        documents: updatedDocs,
        updated_at: new Date().toISOString(),
        history: updatedHistory
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error("Error updating special request status in Supabase:", error);
      return;
    }
    setSpecialRequests(prev => prev.map(sr => sr.id === requestId ? data : sr));
  }, [specialRequests]);
  
  const addDocumentsToSpecialRequest = useCallback(async (requestId, documents, remarks = "Documents added by Admin.") => {
    if (!supabase) return;
    const requestIndex = specialRequests.findIndex(sr => sr.id === requestId);
    if (requestIndex === -1) return;

    const request = specialRequests[requestIndex];
    const updatedDocs = [...(request.documents || []), ...documents.map(d => ({...d, uploadedBy: 'admin'}))];
    const updatedHistory = [...(request.history || []), { status: request.status, timestamp: new Date().toISOString(), remarks: remarks }];
    
    const { data, error } = await supabase
      .from('special_requests')
      .update({
        documents: updatedDocs,
        updated_at: new Date().toISOString(),
        history: updatedHistory
      })
      .eq('id', requestId)
      .select()
      .single();
    
    if (error) {
      console.error("Error adding documents to special request in Supabase:", error);
      return;
    }
    setSpecialRequests(prev => prev.map(sr => sr.id === requestId ? data : sr));
  }, [specialRequests]);

  const clearSpecialRequests = useCallback(async () => {
    if (!user || !supabase) return;
    
    let deleteQuery = supabase.from('special_requests').delete();
     if (user.role === 'vle') {
      deleteQuery = deleteQuery.eq('vle_id', user.id);
    } else if (user.role !== 'admin') {
      console.warn("User does not have permission to clear all special requests.");
      return;
    }
    const { error } = await deleteQuery;
    if (error) {
      console.error("Error clearing special requests from Supabase:", error);
    } else {
      setSpecialRequests(prev => user.role === 'admin' ? [] : prev.filter(sr => sr.vle_id !== user.id));
    }
  }, [user]);

  const value = useMemo(() => ({
    specialRequests,
    loading,
    createSpecialRequest,
    updateSpecialRequestStatus,
    addDocumentsToSpecialRequest,
    clearSpecialRequests
  }), [specialRequests, loading, createSpecialRequest, updateSpecialRequestStatus, addDocumentsToSpecialRequest, clearSpecialRequests]);

  return <SpecialRequestContext.Provider value={value}>{children}</SpecialRequestContext.Provider>;
}
