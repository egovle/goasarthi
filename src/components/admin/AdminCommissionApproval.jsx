import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, IndianRupee, User, FileText, Users2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';


export function AdminCommissionApproval() {
  const { toast } = useToast();
  const { tasks, approveCommission, rejectCommission, processTaskCompletionPayouts, getVLEs } = useData();
  const { refreshUser } = useAuth();

  const [pendingApprovalTasks, setPendingApprovalTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [actionType, setActionType] = useState(''); 
  const [adminRemarks, setAdminRemarks] = useState('');
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const VLEs = getVLEs();

  useEffect(() => {
    setPendingApprovalTasks(tasks.filter(t => t.status === 'pending_commission_approval'));
  }, [tasks]);

  const openActionDialog = (task, type) => {
    setSelectedTask(task);
    setActionType(type);
    setAdminRemarks('');
    setIsActionDialogOpen(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedTask || !actionType) return;
    if (!adminRemarks.trim()) {
        toast({title: "Remarks Required", description: "Please provide remarks for this action.", variant: "destructive"});
        return;
    }

    if (actionType === 'approve') {
      const assignedVle = VLEs.find(v => v.id === selectedTask.vle_id);
      if (!assignedVle && selectedTask.type !== 'lead') { // For bookings, assignedVle is mandatory
        toast({ title: "Assigned VLE Not Found", description: "Cannot process commission, assigned VLE details missing.", variant: "destructive" });
        return;
      }
      
      const payoutDetails = {
        vle_id: selectedTask.vle_id,
        fee: selectedTask.fee,
        id: selectedTask.id,
        service_name: selectedTask.service_name,
        type: selectedTask.type,
        generated_by_vle_id: selectedTask.generated_by_vle_id 
      };

      const commissionResult = await processTaskCompletionPayouts(payoutDetails);

      if (commissionResult.success) {
        await approveCommission(selectedTask.id, adminRemarks);
        let toastDescription = `Admin commission: ₹${commissionResult.adminCommissionAmount.toFixed(2)}.`;
        if (commissionResult.assignedVlePayout > 0) {
            toastDescription += ` Assigned VLE payout: ₹${commissionResult.assignedVlePayout.toFixed(2)}.`;
        }
        if (commissionResult.generatingVlePayout > 0) {
            toastDescription += ` Generating VLE payout: ₹${commissionResult.generatingVlePayout.toFixed(2)}.`;
        }
        toast({ title: "Commission Approved & Payouts Processed", description: toastDescription, duration: 7000 });
        refreshUser(); 
      } else {
        toast({ title: "Payout Failed", description: commissionResult.error || "Could not process VLE payout(s).", variant: "destructive" });
        return; 
      }
    } else if (actionType === 'reject') {
      await rejectCommission(selectedTask.id, adminRemarks);
      toast({ title: "Commission Rejected", description: `Commission for task ${selectedTask.id} has been rejected.` });
    }
    
    setIsActionDialogOpen(false);
    setSelectedTask(null);
    setAdminRemarks('');
  };
  
  const getVleName = (vleId) => VLEs.find(v => v.id === vleId)?.name || 'Unknown VLE';

  const renderPayoutDetails = (task) => {
    const adminShare = task.fee * 0.10;
    if (task.type === 'lead' && task.generated_by_vle_id) {
      const assignedVleShare = task.fee * 0.45;
      const generatingVleShare = task.fee * 0.45;
      return (
        <>
          <p><Users2 className="inline h-4 w-4 mr-1.5 text-primary/80" />Assigned VLE ({getVleName(task.vle_id)}): ₹{assignedVleShare.toFixed(2)} (45%)</p>
          <p><Users2 className="inline h-4 w-4 mr-1.5 text-primary/80" />Generating VLE ({getVleName(task.generated_by_vle_id)}): ₹{generatingVleShare.toFixed(2)} (45%)</p>
          <p><IndianRupee className="inline h-4 w-4 mr-1.5 text-primary/80" />Admin Commission: ₹{adminShare.toFixed(2)} (10%)</p>
        </>
      );
    } else {
      const assignedVleShare = task.fee * 0.90;
      return (
        <>
          <p><User className="inline h-4 w-4 mr-1.5 text-primary/80" />Assigned VLE ({getVleName(task.vle_id)}): ₹{assignedVleShare.toFixed(2)} (90%)</p>
          <p><IndianRupee className="inline h-4 w-4 mr-1.5 text-primary/80" />Admin Commission: ₹{adminShare.toFixed(2)} (10%)</p>
        </>
      );
    }
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="shadow-xl border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <CardTitle className="text-2xl font-poppins text-sky-800 flex items-center">
            <IndianRupee className="mr-3 h-7 w-7 text-sky-600" /> VLE Commission Approval
          </CardTitle>
          <CardDescription className="text-sky-700">Review completed tasks and approve or reject VLE commissions.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {pendingApprovalTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-xl font-semibold text-slate-700">All Clear!</h3>
              <p className="mt-1 text-slate-500">No tasks are currently pending commission approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovalTasks.map(task => (
                <Card key={task.id} className="bg-white border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                            <CardTitle className="text-lg text-slate-800">{task.service_name} <span className="text-sm font-normal text-slate-500">({task.type})</span></CardTitle>
                            <CardDescription className="text-xs text-slate-500">Task ID: {task.id} | Original ID: {task.original_id}</CardDescription>
                        </div>
                        <Badge variant="outline" className="mt-2 sm:mt-0 text-yellow-600 border-yellow-400 bg-yellow-50">Pending Approval</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 space-y-1.5">
                    <p><FileText className="inline h-4 w-4 mr-1.5 text-primary/80" />Total Service Fee: ₹{task.fee.toFixed(2)}</p>
                    <div className="pl-2 border-l-2 border-sky-200 ml-2 space-y-1">
                        {renderPayoutDetails(task)}
                    </div>
                    <p className="text-xs text-slate-500 pt-1 border-t mt-2">Completed: {new Date(task.updated_at).toLocaleString()}</p>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-3 pt-4 border-t">
                    <Button variant="destructiveOutline" size="sm" onClick={() => openActionDialog(task, 'reject')} className="border-red-500 text-red-500 hover:bg-red-50">
                      <XCircle className="mr-2 h-4 w-4" /> Reject Commission
                    </Button>
                    <Button size="sm" onClick={() => openActionDialog(task, 'approve')} className="bg-green-500 hover:bg-green-600 text-white">
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve Commission
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTask && (
        <Dialog open={isActionDialogOpen} onOpenChange={(open) => { if(!open) setSelectedTask(null); setIsActionDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-poppins text-xl">
                {actionType === 'approve' ? 'Approve Commission' : 'Reject Commission'} for Task: {selectedTask.id}
              </DialogTitle>
              <DialogDescription>
                Service: {selectedTask.service_name} | Fee: ₹{selectedTask.fee.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="adminRemarks" className="font-medium">Admin Remarks <span className="text-red-500">*</span></Label>
              <Textarea
                id="adminRemarks"
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder={`Enter remarks for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
                className="mt-1 min-h-[80px]"
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button 
                onClick={handleSubmitAction} 
                className={actionType === 'approve' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}
              >
                {actionType === 'approve' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
