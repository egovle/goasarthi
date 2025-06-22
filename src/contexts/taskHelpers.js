import { supabase } from '@/lib/supabaseClient.js'; // Will be null

export const createTaskInDb = async (taskData) => {
  // This function is intended for Supabase. If supabase is null, it shouldn't be called
  // or should have a more explicit check here. For now, assuming TaskContext handles the supabase check.
  if (!supabase) {
    console.error("createTaskInDb called but Supabase client is null.");
    return null;
  }
  const payload = {
    ...taskData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(`Error creating task from ${taskData.type} in Supabase:`, error);
    return null;
  }
  return newTask;
};

export const updateTaskInDb = async (taskId, updates) => {
  // Similar to createTaskInDb, assumes TaskContext checks for supabase.
  if (!supabase) {
    console.error("updateTaskInDb called but Supabase client is null.");
    return null;
  }
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
};

// Fallback functions for when Supabase is not available
export const createTaskInDbFallback = async (taskData, setTasksState) => {
  console.log("Using createTaskInDbFallback (local).");
  const newTask = { ...taskData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  setTasksState(prev => [...prev, newTask]);
  return newTask;
};

export const updateTaskInDbFallback = async (taskId, updates, currentTasks, setTasksState) => {
  console.log("Using updateTaskInDbFallback (local).");
  const taskIndex = currentTasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    console.error("Task not found locally for update:", taskId);
    return null;
  }
  const updatedTask = { ...currentTasks[taskIndex], ...updates, updated_at: new Date().toISOString() };
  setTasksState(prev => prev.map(t => t.id === taskId ? updatedTask : t));
  return updatedTask;
};


export const addHistoryToTask = (task, historyEntry) => {
  return [...(task.history || []), historyEntry];
};


export const notifyRelevantUsersForTaskUpdate = (dataHooks, oldTask, updatedTask, finalStatusForOriginalItem, remarkForOriginalItem, isCompleted, newDocs = null) => {
  const { addNotification, updateBookingStatusAndHistory, updateLeadStatusAndHistory } = dataHooks;
  if (!addNotification) return; // addNotification itself handles local/supabase

  const customerNotificationMessage = newDocs 
    ? `Documents updated for your application "${oldTask.service_name}".`
    : `Status of your application for "${oldTask.service_name}" updated to ${finalStatusForOriginalItem.replace(/_/g, ' ')}.`;
  
  const vleNotificationMessage = newDocs
    ? `Documents updated for task ${oldTask.id} (${oldTask.service_name}).`
    : `Task ${oldTask.id} (${oldTask.service_name}) status updated to ${finalStatusForOriginalItem.replace(/_/g, ' ')}.`;

  const generatingVleNotificationMessage = newDocs
    ? `Documents updated for task related to your lead ${oldTask.original_id} (${oldTask.service_name}).`
    : `Task for your lead ${oldTask.original_id} (${oldTask.service_name}) status updated to ${finalStatusForOriginalItem.replace(/_/g, ' ')}.`;

  // These context functions (updateBookingStatusAndHistory, etc.) should also handle local/Supabase state
  if (updatedTask.type === 'booking' && updateBookingStatusAndHistory) {
    updateBookingStatusAndHistory(updatedTask.original_id, finalStatusForOriginalItem, remarkForOriginalItem, newDocs);
    if (updatedTask.customer_id && oldTask.status !== finalStatusForOriginalItem) {
      addNotification(updatedTask.customer_id, customerNotificationMessage, 'info', `/customer-dashboard?tab=my-bookings&bookingId=${updatedTask.original_id}`, 'Application Update');
    }
  } else if (updatedTask.type === 'lead' && updateLeadStatusAndHistory) {
    updateLeadStatusAndHistory(updatedTask.original_id, finalStatusForOriginalItem, remarkForOriginalItem, newDocs);
     if (updatedTask.generated_by_vle_id && oldTask.status !== finalStatusForOriginalItem) {
      addNotification(updatedTask.generated_by_vle_id, generatingVleNotificationMessage, 'info', `/vle-dashboard?tab=my-leads&leadId=${updatedTask.original_id}`, 'Lead Task Update');
    }
  }
  
  if (updatedTask.vle_id && oldTask.status !== finalStatusForOriginalItem && !isCompleted) {
     addNotification(updatedTask.vle_id, vleNotificationMessage, 'info', `/vle-dashboard?tab=assigned-tasks&taskId=${updatedTask.id}`, 'Task Status Update');
  }
  if (isCompleted && updatedTask.vle_id) {
     addNotification(updatedTask.vle_id, `Task ${oldTask.id} (${oldTask.service_name}) completed. Pending commission approval.`, 'success', `/vle-dashboard?tab=assigned-tasks&taskId=${updatedTask.id}`, 'Task Completed');
  }
};

export const notifyAdminForTaskCreation = (addNotification, newTask, type) => {
  if (!addNotification) return;
  addNotification('admin', `New task created from ${type} ${newTask.original_id} for ${newTask.service_name}. Needs assignment.`, 'info', `/admin-dashboard?tab=assign-tasks&taskId=${newTask.id}`, 'New Task for Assignment');
};

export const notifyAdminForTaskRejection = (addNotification, task, remarks) => {
  if (!addNotification) return;
  addNotification('admin', `Task ${task.id} (${task.service_name}) was rejected by VLE and needs re-assignment. Reason: ${remarks}`, 'warning', `/admin-dashboard?tab=assign-tasks&taskId=${task.id}`, 'Task Rejected - Needs Re-assignment');
};

export const notifyAdminForCommissionApprovalNeeded = (addNotification, task) => {
  if (!addNotification) return;
  addNotification('admin', `Task ${task.id} (${task.service_name}) completed by VLE. Pending commission approval.`, 'info', `/admin-dashboard?tab=commissions&taskId=${task.id}`, 'Task Completed - Needs Approval');
};
