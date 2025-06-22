import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/hooks/useAuth.jsx';
import { NotificationContext } from '@/contexts/NotificationContext';
import { 
  addHistoryToTask,
  notifyAdminForTaskRejection,
  notifyAdminForCommissionApprovalNeeded,
  notifyAdminForTaskCreation
} from '@/contexts/taskHelpers.js'; 
import { uploadFilesToSupabase } from '@/lib/coreUtils.js';

export const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const notificationContext = useContext(NotificationContext);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!supabase || !user) {
        setLoading(false);
        setTasks([]);
        return;
      }
      setLoading(true);
      try {
        let query = supabase.from('tasks').select('*');
        if (user.role === 'vle') {
          query = query.eq('vle_id', user.id);
        } else if (user.role === 'customer') {
          query = query.eq('customer_id', user.id);
        }
        const { data, error } = await query;
        if (error) throw error;
        setTasks(data || []);
      } catch (error) {
        console.error("Error fetching tasks from Supabase:", error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  useEffect(() => {
    if (!supabase || !user || user.role !== 'admin') return;

    const channel = supabase.channel('public:tasks')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, payload => {
        setTasks(currentTasks => {
          if (currentTasks.some(t => t.id === payload.new.id)) {
            return currentTasks;
          }
          return [...currentTasks, payload.new];
        });
        
        if (notificationContext?.addNotification) {
          notifyAdminForTaskCreation(notificationContext.addNotification, payload.new, payload.new.type);
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to tasks table changes!');
        }
        if (err) {
          console.error('Error subscribing to tasks table:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, notificationContext]);

  const updateTaskInDb = useCallback(async (taskId, updates) => {
    if (!supabase) return null;
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', taskId)
      .select()
      .single();
  
    if (error) {
      console.error("Error updating task in Supabase:", error);
      return null;
    }
    return updatedTask;
  }, []);

  const assignTask = useCallback(async (taskId, vleId) => {
    if (!supabase) return null;
    const existingTask = tasks.find(t => t.id === taskId);
    if (!existingTask) return null;

    const historyEntry = { status: 'assigned', timestamp: new Date().toISOString(), remarks: `Assigned to VLE ${vleId}` };
    const updatedHistory = addHistoryToTask(existingTask, historyEntry);
    
    const updates = { 
      vle_id: vleId, 
      status: 'assigned', 
      task_phase: 1, 
      assigned_at: new Date().toISOString(), 
      history: updatedHistory,
    };
    
    const updatedTask = await updateTaskInDb(taskId, updates);
    if (!updatedTask) return null;
    
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    return updatedTask;
  }, [tasks, updateTaskInDb]);

  const updateTask = useCallback(async (taskId, updates) => {
    if (!supabase) return null;
    const oldTask = tasks.find(t => t.id === taskId);
    if (!oldTask) return null;

    const newHistoryEntry = { status: updates.status || oldTask.status, timestamp: new Date().toISOString(), remarks: updates.remarks || `Status updated to ${updates.status}` };
    let taskPayload = { ...updates, history: addHistoryToTask(oldTask, newHistoryEntry) };
    delete taskPayload.remarks; 

    if (updates.status === 'completed') {
      taskPayload.status = 'pending_commission_approval';
      taskPayload.history = addHistoryToTask(taskPayload, { status: 'pending_commission_approval', timestamp: new Date().toISOString(), remarks: 'Task completed by VLE, awaiting commission approval.' });
      notifyAdminForCommissionApprovalNeeded(notificationContext.addNotification, oldTask);
    }
    
    const updatedTask = await updateTaskInDb(taskId, taskPayload);
    if (!updatedTask) return null;

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    
    return updatedTask;
  }, [tasks, notificationContext, updateTaskInDb]);
  
  const reassignTask = useCallback(async (taskId, remarks = 'Task rejected, pending re-assignment') => {
    if (!supabase) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const historyEntry = { status: 'pending_assignment', timestamp: new Date().toISOString(), remarks};
    const updates = { status: 'pending_assignment', task_phase: 0, vle_id: null, history: addHistoryToTask(task, historyEntry) }; 
    
    const updatedTask = await updateTaskInDb(taskId, updates);
    if (!updatedTask) return;

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    notifyAdminForTaskRejection(notificationContext.addNotification, task, remarks);
    if (task.customer_id && notificationContext?.addNotification) {
      notificationContext.addNotification(task.customer_id, `There was an issue with your application for ${task.service_name}. It is being re-assigned.`, 'info', `/customer-dashboard?tab=my-bookings&bookingId=${task.original_id}`, 'Application Update');
    }
  }, [tasks, notificationContext, updateTaskInDb]);

  const addDocumentsToTask = useCallback(async (taskId, filesToUpload, remarks, newStatus) => {
    if (!supabase) return null;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const uploadedDocMetadata = await uploadFilesToSupabase(filesToUpload, taskId);
    if (uploadedDocMetadata.length !== filesToUpload.length) {
      console.error("Some files failed to upload.");
      return null;
    }

    const updatedDocs = [...(task.documents || []), ...uploadedDocMetadata];
    const historyEntry = { status: newStatus || task.status, timestamp: new Date().toISOString(), remarks: remarks || `Added ${filesToUpload.length} new document(s).` };
    let taskPayload = { documents: updatedDocs, history: addHistoryToTask(task, historyEntry), status: newStatus || task.status };
    
    if (newStatus === 'completed') {
        taskPayload.status = 'pending_commission_approval';
        taskPayload.history = addHistoryToTask(taskPayload, { status: 'pending_commission_approval', timestamp: new Date().toISOString(), remarks: 'Task completed by VLE, awaiting commission approval.' });
        notifyAdminForCommissionApprovalNeeded(notificationContext.addNotification, task);
    }

    const updatedTask = await updateTaskInDb(taskId, taskPayload);
    if (!updatedTask) return null;

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    
    return updatedTask;
  }, [tasks, notificationContext, updateTaskInDb]);

  const approveCommission = useCallback(async (taskId, adminRemarks) => {
    if (!supabase) return;
    const task = tasks.find(t => t.id === taskId && t.status === 'pending_commission_approval');
    if (!task) return;

    const historyEntry = { status: 'commission_approved', timestamp: new Date().toISOString(), remarks: adminRemarks || 'Commission approved by admin.' };
    const updates = { status: 'commission_approved', task_phase: 5, history: addHistoryToTask(task, historyEntry) };
    
    const updatedTask = await updateTaskInDb(taskId, updates);
    if (!updatedTask) return;

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    
    if (notificationContext?.addNotification) {
      if (updatedTask.vle_id) {
        notificationContext.addNotification(updatedTask.vle_id, `Commission for task ${updatedTask.id} (${updatedTask.service_name}) has been approved. Payout processed.`, 'success', `/vle-dashboard?tab=vle-wallet&taskId=${updatedTask.id}`, 'Commission Approved');
      }
      if (updatedTask.type === 'lead' && updatedTask.generated_by_vle_id && updatedTask.generated_by_vle_id !== updatedTask.vle_id) {
        notificationContext.addNotification(updatedTask.generated_by_vle_id, `Commission for your generated lead ${updatedTask.original_id} (${updatedTask.service_name}) has been approved. Payout processed.`, 'success', `/vle-dashboard?tab=vle-wallet&leadId=${updatedTask.original_id}`, 'Lead Commission Approved');
      }
    }
  }, [tasks, notificationContext, updateTaskInDb]);

  const rejectCommission = useCallback(async (taskId, adminRemarks) => {
    if (!supabase) return;
    const task = tasks.find(t => t.id === taskId && t.status === 'pending_commission_approval');
    if (!task) return;

    const historyEntry = { status: 'commission_rejected', timestamp: new Date().toISOString(), remarks: adminRemarks || 'Commission rejected by admin.' };
    const updates = { status: 'commission_rejected', history: addHistoryToTask(task, historyEntry) };
    
    const updatedTask = await updateTaskInDb(taskId, updates);
    if (!updatedTask) return;

    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    if (notificationContext?.addNotification) {
      if (updatedTask.vle_id) {
        notificationContext.addNotification(updatedTask.vle_id, `Commission for task ${updatedTask.id} (${updatedTask.service_name}) has been rejected. Reason: ${adminRemarks}`, 'error', `/vle-dashboard?tab=assigned-tasks&taskId=${updatedTask.id}`, 'Commission Rejected');
      }
       if (updatedTask.type === 'lead' && updatedTask.generated_by_vle_id && updatedTask.generated_by_vle_id !== updatedTask.vle_id) {
        notificationContext.addNotification(updatedTask.generated_by_vle_id, `Commission for your generated lead ${updatedTask.original_id} (${updatedTask.service_name}) has been rejected. Reason: ${adminRemarks}`, 'error', `/vle-dashboard?tab=my-leads&leadId=${updatedTask.original_id}`, 'Lead Commission Rejected');
      }
    }
  }, [tasks, notificationContext, updateTaskInDb]);

  const clearTasks = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.from('tasks').delete().neq('id', '0');
    if (error) {
      console.error("Error clearing tasks from Supabase:", error);
    } else {
       setTasks([]);
    }
  }, []);

  const value = useMemo(() => ({
    tasks,
    loading,
    assignTask,
    updateTask,
    reassignTask,
    addDocumentsToTask,
    approveCommission,
    rejectCommission,
    clearTasks,
  }), [tasks, loading, assignTask, updateTask, reassignTask, addDocumentsToTask, approveCommission, rejectCommission, clearTasks]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}