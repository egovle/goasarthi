
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { BookingContext } from '@/contexts/BookingContext';
import { WalletContext } from '@/contexts/WalletContext'; 
import { NotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/hooks/useAuth.jsx';
import { generateId, uploadFilesToSupabase } from '@/lib/coreUtils.js';

export const LeadContext = createContext(null);

export function LeadProvider({ children }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const bookingContext = useContext(BookingContext);
  const walletContext = useContext(WalletContext); 
  const notificationContext = useContext(NotificationContext);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLeads = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      if (user && (user.role === 'vle' || user.role === 'admin')) {
        try {
          let query = supabase.from('leads').select('*');
          if (user.role === 'vle') {
            query = query.eq('vle_id', user.id);
          }
          const { data, error } = await query;
          if (error) throw error;
          setLeads(data || []);
        } catch (error) {
          console.error("Error fetching leads from Supabase:", error);
          setLeads([]);
        }
      } else {
        setLeads([]);
      }
      setLoading(false);
    };
    fetchLeads();
  }, [user]);

  const createLead = useCallback(async (serviceId, vleId, customerName, customerPhone, filesToUpload) => {
    if (!supabase || !walletContext || !notificationContext || !bookingContext) {
      return { success: false, error: "Initialization error." };
    }
    const service = bookingContext.services.find(s => s.id === serviceId);
    if (!service) {
        return { success: false, error: "Service not found." };
    }

    const serviceFee = Number(service.fee || 0);
    const canAfford = await walletContext.checkBalance(vleId, serviceFee);
    if (!canAfford) {
      return { success: false, error: `Insufficient wallet balance. Service fee of ₹${serviceFee.toFixed(2)} required.` };
    }
    
    const leadId = generateId('LED');
    const uploadedDocMetadata = await uploadFilesToSupabase(filesToUpload, leadId);
    if (filesToUpload.length > 0 && uploadedDocMetadata.length !== filesToUpload.length) {
        return { success: false, error: "Some files failed to upload. Please try again." };
    }

    const leadData = {
      id: leadId,
      service_id: serviceId,
      service_name: service.name,
      vle_id: vleId, 
      customer_name: customerName,
      customer_phone: customerPhone,
      documents: uploadedDocMetadata, 
      status: 'pending', 
      fee: service.fee, 
      service_fee_paid_by_generator: serviceFee,
      type: 'lead',
      history: [{ status: 'pending', timestamp: new Date().toISOString(), remarks: `Lead created. Service fee ₹${serviceFee.toFixed(2)} deducted.` }]
    };

    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error("Error creating lead in Supabase:", error);
      return { success: false, error: error.message };
    }
    await walletContext.debitUserWallet(vleId, serviceFee, `Lead generation: ${service.name} (Lead ID: ${newLead.id})`);
    setLeads(prev => [...prev, newLead]);
    return { success: true, lead: newLead };
  }, [bookingContext, walletContext, notificationContext]);

  const updateLeadStatusAndHistory = useCallback(async (leadId, newStatus, remarks, newDocs = null) => {
    if (!supabase || !notificationContext) return;
    const leadIndex = leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) return;

    const lead = leads[leadIndex];
    const updatedHistory = [...(lead.history || []), { status: newStatus, timestamp: new Date().toISOString(), remarks }];
    
    let updatePayload = { status: newStatus, history: updatedHistory, updated_at: new Date().toISOString() };
    if (newDocs) {
        const updatedDocsList = [...(lead.documents || []), ...newDocs];
        updatePayload.documents = updatedDocsList;
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error("Error updating lead status in Supabase:", error);
      return;
    }
    setLeads(prev => prev.map(l => l.id === leadId ? data : l));
    if (data.vle_id) {
        notificationContext.addNotification(data.vle_id, `Status of your generated lead for "${data.service_name}" (Customer: ${data.customer_name}) updated to ${newStatus.replace(/_/g, ' ')}. Remark: ${remarks}`, 'info', `/vle-dashboard?tab=my-leads&leadId=${data.id}`, 'Lead Status Update');
    }
  }, [leads, notificationContext]);
  
  const addDocumentsToLead = useCallback(async (leadId, newDocs, remarks, newStatus) => {
    if (!supabase || !notificationContext) return;
    const leadIndex = leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) return;

    const lead = leads[leadIndex];
    const updatedDocsList = [...(lead.documents || []), ...newDocs];
    const historyEntry = { status: newStatus || lead.status, timestamp: new Date().toISOString(), remarks: remarks || `Added ${newDocs.length} new document(s).` };
    const updatedHistory = [...(lead.history || []), historyEntry];
    
    const { data, error } = await supabase
      .from('leads')
      .update({ 
        documents: updatedDocsList, 
        status: newStatus || lead.status, 
        history: updatedHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error("Error adding documents to lead in Supabase:", error);
      return;
    }
    setLeads(prev => prev.map(l => l.id === leadId ? data : l));
    if (data.vle_id) {
        notificationContext.addNotification(data.vle_id, `Documents added to your generated lead for "${data.service_name}". Remark: ${remarks}`, 'info', `/vle-dashboard?tab=my-leads&leadId=${data.id}`, 'Lead Documents Updated');
    }
  }, [leads, notificationContext]);

  const clearLeads = useCallback(async () => {
    if (!user || !supabase || (user.role !== 'vle' && user.role !== 'admin')) return; 
    
    let deleteQuery = supabase.from('leads').delete();
    if (user.role === 'vle') {
      deleteQuery = deleteQuery.eq('vle_id', user.id);
    }
    const { error } = await deleteQuery;
    if (error) {
      console.error("Error clearing leads from Supabase:", error);
    } else {
      setLeads(prev => user.role === 'admin' ? [] : prev.filter(l => l.vle_id !== user.id));
    }
  }, [user]);

  const value = useMemo(() => ({
    leads,
    loading,
    createLead,
    updateLeadStatusAndHistory,
    addDocumentsToLead,
    clearLeads
  }), [leads, loading, createLead, updateLeadStatusAndHistory, addDocumentsToLead, clearLeads]);

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
}
