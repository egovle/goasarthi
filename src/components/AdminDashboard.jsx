
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { TabsContent } from '@/components/ui/tabs';
import { FileText, Clock, CheckCircle, XCircle, User, AlertTriangle, DollarSign, BarChart2 as CommissionIconLucide } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { motion } from 'framer-motion';

import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { AdminAssignTasks } from '@/components/admin/AdminAssignTasks';
import { AdminBookingsList } from '@/components/admin/AdminBookingsList';
import { AdminLeadsList } from '@/components/admin/AdminLeadsList';
import { AdminVLEManagement } from '@/components/admin/AdminVLEManagement';
import { AdminCustomerManagement } from '@/components/admin/AdminCustomerManagement';
import { AdminIssuesManagement } from '@/components/admin/AdminIssuesManagement';
import { AdminSpecialRequests } from '@/components/admin/AdminSpecialRequests';
import { AdminWalletManagement } from '@/components/admin/AdminWalletManagement';
import { AdminCommissionApproval } from '@/components/admin/AdminCommissionApproval';
import { AdminServiceManagement } from '@/components/admin/AdminServiceManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


const AdminComingSoonPlaceholder = ({ title, icon: Icon }) => (
  <Card className="shadow-lg border-dashed border-slate-300 rounded-xl h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50/50">
    <CardHeader>
      <div className="mx-auto bg-slate-200 p-4 rounded-full mb-6">
        <Icon className="h-12 w-12 text-slate-500" />
      </div>
      <CardTitle className="text-2xl font-poppins text-slate-700">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-slate-600 font-inter text-lg">
        This feature is under construction and will be available soon!
      </p>
      <p className="text-sm text-slate-500 mt-2">
        We're working hard to bring you an amazing experience. Stay tuned! 🚀
      </p>
    </CardContent>
  </Card>
);


export function AdminDashboard({ user, onLogout }) {
  const { 
    bookings, leads, tasks, assignTask, getCustomers, getVLEs,
    complaints, clearAllData, resolveComplaint, 
    specialRequests, updateSpecialRequestStatus, addNotification
  } = useData();
  const { toast } = useToast();
  
  const VLES = getVLEs();

  const [allCustomers, setAllCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState("assign-tasks");

  const memoizedGetCustomers = useCallback(() => getCustomers(), []);

  useEffect(() => {
    setAllCustomers(memoizedGetCustomers());
  }, [memoizedGetCustomers, activeTab]);

  if (!user) {
    return null;
  }

  const unassignedItems = tasks
    .filter(task => task.status === 'pending_assignment')
    .map(task => {
      const originalItem = task.type === 'booking'
        ? bookings.find(b => b.id === task.original_id)
        : leads.find(l => l.id === task.original_id);
      
      if (!originalItem) return null;

      const allDocs = [...(originalItem.documents || []), ...(task.documents || [])];
      const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.path || doc.name, doc])).values());
      
      return { ...originalItem, ...task, id: task.id, original_id: originalItem.id, documents: uniqueDocs };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));


  const handleAssignTask = (task, vleId) => {
    const selectedVle = VLES.find(v => v.id === vleId);
    if (!selectedVle) {
        toast({ title: "Error: VLE Not Found", description: "The selected VLE could not be found. Please refresh and try again.", variant: "destructive" });
        return;
    }
    
    if (task.type === 'lead' && task.generated_by_vle_id === vleId && task.history.filter(h => h.status === 'assigned').length === 0) { 
      toast({
        title: "Assignment Constraint",
        description: "A lead cannot be initially assigned to the VLE who generated it. This rule can be bypassed for re-assigning tasks if VLE rejected it.",
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    const assignedTask = assignTask(task.id, vleId);
    if (assignedTask) {
      toast({
        title: "Task Successfully Assigned",
        description: `Task for ${task.service_name} has been assigned to VLE ${selectedVle.name} (${selectedVle.user_id_custom}).`,
        variant: 'default'
      });
      
      addNotification(selectedVle.id, `New task assigned: ${task.service_name} for ${task.customer_name || 'customer'}.`, 'info', `/vle-dashboard?tab=assigned-tasks&taskId=${assignedTask.id}`, 'New Task Assignment');
      
      if (task.customer_id) {
        addNotification(task.customer_id, `Your application for ${task.service_name} has been assigned to a VLE.`, 'info', `/customer-dashboard?tab=my-bookings&bookingId=${task.original_id}`, 'Application Update');
      }
      if (task.type === 'lead' && task.generated_by_vle_id && task.generated_by_vle_id !== selectedVle.id) {
        addNotification(task.generated_by_vle_id, `Your generated lead for ${task.service_name} (Customer: ${task.customer_name}) has been assigned to VLE ${selectedVle.name}.`, 'info', `/vle-dashboard?tab=my-leads&leadId=${task.original_id}`, 'Lead Update');
      }
    } else {
       toast({ title: "Task Assignment Failed", description: "Could not assign the task. Please try again.", variant: "destructive" });
    }
  };

  const handleClearData = () => {
    clearAllData();
    toast({
      title: "All Data Cleared",
      description: "All application bookings, leads, tasks, and customer complaints have been cleared from the system.",
      variant: 'default'
    });
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      pending: <Clock className="h-4 w-4 text-yellow-600" />,
      pending_assignment: <Clock className="h-4 w-4 text-orange-500" />,
      assigned: <User className="h-4 w-4 text-cyan-600" />,
      accepted: <CheckCircle className="h-4 w-4 text-sky-600" />,
      'additional-docs-vle': <FileText className="h-4 w-4 text-orange-600" />,
      'additional-docs-dept': <AlertTriangle className="h-4 w-4 text-amber-600" />,
      'ack-submitted': <FileText className="h-4 w-4 text-indigo-600" />,
      'in-progress': <Clock className="h-4 w-4 text-blue-600" />,
      completed: <CheckCircle className="h-4 w-4 text-green-600" />,
      pending_commission_approval: <DollarSign className="h-4 w-4 text-purple-600" />,
      commission_approved: <CheckCircle className="h-4 w-4 text-green-700" />,
      commission_rejected: <XCircle className="h-4 w-4 text-red-700" />,
      rejected: <XCircle className="h-4 w-4 text-red-600" />,
    };
    return iconMap[status] || <Clock className="h-4 w-4 text-slate-500" />;
  };
  
  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'status-pending',
      pending_assignment: 'bg-orange-100 text-orange-700 border-orange-300',
      assigned: 'status-assigned',
      accepted: 'status-accepted',
      'additional-docs-vle': 'status-additional-docs-vle',
      'additional-docs-dept': 'status-additional-docs-dept',
      'ack-submitted': 'status-ack-submitted',
      'in-progress': 'status-in-progress',
      completed: 'status-completed',
      pending_commission_approval: 'bg-purple-100 text-purple-700 border-purple-300',
      commission_approved: 'bg-green-200 text-green-800 border-green-400',
      commission_rejected: 'bg-red-200 text-red-800 border-red-400',
      rejected: 'status-rejected',
    };
    return colorMap[status] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getLatestRemark = (item) => {
    const task = tasks.find(t => t.original_id === item.original_id && t.type === item.type);
    const source = task || item; 
    if (source.history && source.history.length > 0) {
      return source.history[source.history.length - 1].remarks || 'No remarks yet.';
    }
    return 'No remarks recorded yet.';
  };

  const stats = {
    totalBookings: bookings.length,
    totalLeads: leads.length,
    totalTasks: tasks.filter(t => t.status !== 'rejected' && t.status !== 'pending_assignment').length, 
    completedTasks: tasks.filter(t => t.status === 'commission_approved').length,
    pendingAssignments: unassignedItems.length,
    totalCustomers: allCustomers.length,
    openIssues: complaints.filter(c => c.status === 'open').length,
    pendingSpecialRequests: specialRequests.filter(sr => sr.status === 'pending_admin_review').length,
    pendingCommissions: tasks.filter(t => t.status === 'pending_commission_approval').length,
  };

  const allBookingsWithDetails = bookings.map(b => {
    const task = tasks.find(t => t.original_id === b.id && t.type === 'booking');
    const vle = task && task.vle_id ? VLES.find(v => v.id === task.vle_id) : null;
    const taskDocs = task?.documents || [];
    const bookingDocs = b.documents || [];
    const allDocs = [...bookingDocs, ...taskDocs];
    const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.path || doc.name, doc])).values());
    
    return { 
      ...b, 
      documents: uniqueDocs,
      status: task ? task.status : b.status,
      assignedVleName: vle ? `${vle.name} (${vle.user_id_custom})` : 'N/A',
      history: task ? task.history : b.history
    };
  }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  const allLeadsWithDetails = leads.map(l => {
    const task = tasks.find(t => t.original_id === l.id && t.type === 'lead');
    const assignedVle = task && task.vle_id ? VLES.find(v => v.id === task.vle_id) : null;
    const generatedByVle = l.vle_id ? VLES.find(v => v.id === l.vle_id) : null;
    const taskDocs = task?.documents || [];
    const leadDocs = l.documents || [];
    const allDocs = [...leadDocs, ...taskDocs];
    const uniqueDocs = Array.from(new Map(allDocs.map(doc => [doc.path || doc.name, doc])).values());

    return { 
      ...l, 
      documents: uniqueDocs,
      status: task ? task.status : l.status,
      assignedVleName: assignedVle ? `${assignedVle.name} (${assignedVle.user_id_custom})` : 'N/A',
      history: task ? task.history : l.history,
      generatedByVleName: generatedByVle ? generatedByVle.name : 'N/A'
    };
  }).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));


  return (
    <AdminDashboardLayout 
        user={user} 
        onLogout={onLogout} 
        stats={stats} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        handleClearData={handleClearData}
    >
      <motion.div 
        key={activeTab} 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        <TabsContent value="assign-tasks" className="space-y-6 mt-0">
            <AdminAssignTasks items={unassignedItems} onAssignTask={handleAssignTask} getLatestRemark={getLatestRemark} />
        </TabsContent>

        <TabsContent value="all-bookings" className="space-y-6 mt-0">
            <AdminBookingsList bookings={allBookingsWithDetails} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getLatestRemark={getLatestRemark} />
        </TabsContent>

        <TabsContent value="all-leads" className="space-y-6 mt-0">
            <AdminLeadsList leads={allLeadsWithDetails} getStatusIcon={getStatusIcon} getStatusColor={getStatusColor} getLatestRemark={getLatestRemark} />
        </TabsContent>

        <TabsContent value="vle-management" className="space-y-6 mt-0">
            <AdminVLEManagement />
        </TabsContent>
        
        <TabsContent value="customer-management" className="space-y-6 mt-0">
            <AdminCustomerManagement customers={allCustomers} />
        </TabsContent>

        <TabsContent value="issues-management" className="space-y-6 mt-0">
            <AdminIssuesManagement complaints={complaints} onResolveComplaint={resolveComplaint} />
        </TabsContent>

        <TabsContent value="vle-special-requests" className="space-y-6 mt-0">
            <AdminSpecialRequests 
              specialRequests={specialRequests} 
              onUpdateStatus={updateSpecialRequestStatus} 
              vleUsers={VLES}
            />
        </TabsContent>
        <TabsContent value="accounting" className="space-y-6 mt-0">
            <AdminWalletManagement />
        </TabsContent>
        <TabsContent value="commissions" className="space-y-6 mt-0">
            <AdminCommissionApproval />
        </TabsContent>
        <TabsContent value="service-management" className="space-y-6 mt-0">
            <AdminServiceManagement />
        </TabsContent>
      </motion.div>
    </AdminDashboardLayout>
  );
}
