import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { FileText, Clock, CheckCircle, XCircle, User, Phone, Upload, Trash2, MessageSquare, Eye, AlertOctagon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { DocumentViewer } from '@/components/DocumentViewer';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  })
};

export function VLEAssignedTasks({ user }) {
  const { tasks, updateTask, reassignTask, addDocumentsToTask } = useData();
  const { toast } = useToast();
  const [currentTask, setCurrentTask] = useState(null);
  const [actionType, setActionType] = useState(''); 
  const [remark, setRemark] = useState('');
  const [ackNo, setAckNo] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState([]); 
  const fileInputRef = useRef(null);

  const userTasks = tasks.filter(t => t.vle_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));


  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newDocs = files.map(file => ({ id: Date.now() + Math.random().toString(36).substring(2,9), name: file.name, size: file.size, type: file.type, fileObject: file, isCertificate: actionType === 'uploadCert' }));
    
    setUploadedDocs(prev => [...prev, ...newDocs]);
    toast({ title: "Documents Added", description: `${files.length} document(s) ready.` });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeUploadedDoc = (docId) => {
    setUploadedDocs(prev => prev.filter(doc => doc.id !== docId));
  };

  const openModal = (task, type) => {
    setCurrentTask(task);
    setActionType(type);
    setRemark('');
    setAckNo('');
    setUploadedDocs([]);
  };

  const handleSubmitAction = async () => {
    if (!currentTask) return;

    if (actionType === 'reject') {
        await reassignTask(currentTask.id, `Task rejected by VLE: ${remark || 'No specific reason provided.'}`);
        toast({ title: "Task Rejected", description: "Task sent for re-assignment." });
    } else if (actionType === 'uploadCert') {
        if (uploadedDocs.length === 0) { 
            toast({ title: "Completion Proof Required", variant: "destructive" }); 
            return; 
        }
        const result = await addDocumentsToTask(currentTask.id, uploadedDocs, `Completion certificate uploaded. ${remark}`, 'completed');
        if (result) {
          toast({ title: "Task Updated", description: `Task ${currentTask.id} status updated.` });
        } else {
          toast({ title: "Upload Failed", description: "Could not upload certificate. Please try again.", variant: "destructive" });
        }
    } else {
        let updates = { status: currentTask.status, task_phase: currentTask.task_phase, remarks: remark || "Action performed." };
        if (actionType === 'accept') {
            updates = { ...updates, status: 'accepted', task_phase: 2, remarks: remark || 'Task accepted by VLE.' };
        } else if (actionType === 'askDocsVle') {
            updates = { ...updates, status: 'additional-docs-vle', remarks: `VLE requesting additional documents from Customer: ${remark}` };
        } else if (actionType === 'ackSubmit') {
            if (!ackNo) { 
                toast({ title: "Acknowledgement No. Required", variant: "destructive" }); 
                return; 
            }
            updates = { ...updates, status: 'ack-submitted', task_phase: 3, ackNo, remarks: `Acknowledgement No. ${ackNo} submitted. ${remark}` };
        } else if (actionType === 'askDocsDept') {
            updates = { ...updates, status: 'additional-docs-dept', remarks: `Department requesting additional documents (via VLE): ${remark}` };
        }
        await updateTask(currentTask.id, updates);
        toast({ title: "Task Updated", description: `Task ${currentTask.id} status updated.` });
    }
    
    setCurrentTask(null);
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      assigned: <User className="h-4 w-4" />,
      accepted: <CheckCircle className="h-4 w-4 text-sky-600" />,
      'additional-docs-vle': <MessageSquare className="h-4 w-4 text-orange-600" />,
      'additional-docs-dept': <AlertOctagon className="h-4 w-4 text-amber-600" />,
      'ack-submitted': <FileText className="h-4 w-4 text-indigo-600" />,
      'in-progress': <Clock className="h-4 w-4" />, 
      completed: <CheckCircle className="h-4 w-4 text-emerald-600" />,
      rejected: <XCircle className="h-4 w-4 text-red-600" />,
    };
    return icons[status] || <Clock className="h-4 w-4" />;
  };
  
  const getStatusBadgeClass = (status) => {
    const base = "text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border shadow-sm";
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      assigned: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      accepted: 'bg-sky-100 text-sky-700 border-sky-300',
      'additional-docs-vle': 'bg-orange-100 text-orange-700 border-orange-300',
      'additional-docs-dept': 'bg-amber-100 text-amber-700 border-amber-300',
      'ack-submitted': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-300',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
    };
    return `${base} ${colors[status] || 'bg-slate-100 text-slate-700 border-slate-300'}`;
  };

  const getLatestRemark = (task) => {
    if (task.history && task.history.length > 0) {
      return task.history[task.history.length - 1].remarks;
    }
    return 'No remarks yet.';
  };

  return (
    <>
      <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {userTasks.length === 0 ? (
          <Card className="md:col-span-1 lg:col-span-2 xl:col-span-3 bg-white border-slate-200 text-slate-700 shadow-lg">
            <CardContent className="text-center py-16">
              <FileText className="mx-auto h-16 w-16 text-slate-400" />
              <h3 className="mt-6 text-xl font-poppins">No tasks assigned</h3>
              <p className="mt-2 text-base text-slate-500">Assigned tasks will appear here. Stay tuned!</p>
            </CardContent>
          </Card>
        ) : (
          userTasks.map((task, index) => (
            <motion.div
  key={task.id}
  custom={index}
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  className="h-full"
  layout
>

            <Card className="bg-white border-slate-200 text-slate-700 shadow-xl h-full flex flex-col card-hover">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-slate-800">{task.service_name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-500">Task ID: {task.id} | Type: {task.type}</CardDescription>
                  </div>
                  <Badge className={getStatusBadgeClass(task.status)}>
                    {getStatusIcon(task.status)} {task.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-grow">
                {task.status === 'assigned' ? (
                    <p className="text-sm text-slate-500 py-4">Please accept this task to view full customer details and attached documents.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm">
                        <div><span className="font-medium text-slate-600">Original ID:</span> {task.original_id}</div>
                        <div><span className="font-medium text-slate-600">Assigned:</span> {new Date(task.assigned_at).toLocaleDateString()}</div>
                        {task.type === 'lead' && task.customer_name && (<><div className="flex items-center gap-1.5 col-span-1 sm:col-span-2"><User className="h-4 w-4 text-primary/80" /><span>{task.customer_name}</span></div>{task.customer_phone && (<div className="flex items-center gap-1.5 col-span-1 sm:col-span-2"><Phone className="h-4 w-4 text-primary/80" /><span>{task.customer_phone}</span></div>)}</>)}
                        <div><span className="font-medium text-slate-600">Docs:</span> {task.documents?.length || 0} <Dialog><DialogTrigger asChild><Button variant="link" size="sm" className="p-0 h-auto text-primary hover:text-primary/80 text-xs ml-1"><Eye className="h-3.5 w-3.5 mr-0.5"/>View</Button></DialogTrigger><DialogContent className="bg-white border-slate-200 text-slate-700"><DialogHeader><DialogTitle className="text-slate-800">View Documents</DialogTitle></DialogHeader><DocumentViewer documents={task.documents} /></DialogContent></Dialog></div>
                        </div>
                        <div className="text-xs sm:text-sm mt-2 pt-2 border-t border-slate-200">
                          <span className="font-medium text-slate-600">Latest Remark:</span> <span className="text-slate-500 italic">{getLatestRemark(task)}</span>
                        </div>
                    </>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t border-slate-200">
                <div className="flex flex-wrap gap-2 w-full">
                  {task.task_phase === 1 && task.status === 'assigned' && (
                    <>
                      <Button size="sm" onClick={() => openModal(task, 'accept')} className="bg-primary hover:bg-primary/90 text-primary-foreground flex-grow sm:flex-grow-0">Accept Task</Button>
                      <Button size="sm" variant="destructive" onClick={() => openModal(task, 'reject')} className="flex-grow sm:flex-grow-0">Reject Task</Button>
                    </>
                  )}
                  {task.task_phase === 2 && task.status === 'accepted' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => openModal(task, 'askDocsVle')} className="border-primary/70 text-primary hover:bg-primary/10">Ask Customer Docs</Button>
                      <Button size="sm" onClick={() => openModal(task, 'ackSubmit')} className="bg-primary/80 hover:bg-primary/70 text-primary-foreground">Submit Ack. No.</Button>
                      <Button size="sm" variant="destructive" onClick={() => openModal(task, 'reject')}>Reject Task</Button>
                    </>
                  )}
                  {task.task_phase === 3 && task.status === 'ack-submitted' && (
                     <>
                      <Button size="sm" variant="outline" onClick={() => openModal(task, 'askDocsDept')} className="border-primary/70 text-primary hover:bg-primary/10">Dept. asks for Docs</Button>
                      <Button size="sm" onClick={() => openModal(task, 'uploadCert')} className="bg-primary/80 hover:bg-primary/70 text-primary-foreground">Upload Certificate</Button>
                      <Button size="sm" variant="destructive" onClick={() => openModal(task, 'reject')}>Reject Task</Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
            </motion.div>
          ))
        )}
      </div>

      {currentTask && (
        <Dialog open={!!currentTask} onOpenChange={(isOpen) => !isOpen && setCurrentTask(null)}>
          <DialogContent className="bg-white border-slate-200 text-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-800">
                {actionType === 'accept' && 'Accept Task'}
                {actionType === 'reject' && 'Reject Task'}
                {actionType === 'askDocsVle' && 'Request Additional Documents from Customer'}
                {actionType === 'ackSubmit' && 'Submit Acknowledgement Number'}
                {actionType === 'askDocsDept' && 'Department Requesting Additional Documents'}
                {actionType === 'uploadCert' && 'Upload Completion Certificate'}
              </DialogTitle>
              <DialogDescription className="text-slate-500">Task ID: {currentTask.id} - {currentTask.service_name}</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {(actionType === 'askDocsVle' || actionType === 'askDocsDept' || actionType === 'reject' || actionType === 'accept' || actionType === 'uploadCert' || actionType === 'ackSubmit') && (
                <div>
                  <Label htmlFor="remark" className="text-slate-700">Remarks</Label>
                  <Textarea id="remark" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Enter remarks (optional for accept, required for others)" className="bg-slate-50 border-slate-300 text-slate-700 placeholder-slate-400 mt-1"/>
                </div>
              )}
              {actionType === 'ackSubmit' && (
                <div>
                  <Label htmlFor="ackNo" className="text-slate-700">Acknowledgement Number</Label>
                  <Input id="ackNo" value={ackNo} onChange={(e) => setAckNo(e.target.value)} placeholder="Enter department acknowledgement no." className="bg-slate-50 border-slate-300 text-slate-700 placeholder-slate-400 mt-1"/>
                </div>
              )}
              {actionType === 'uploadCert' && (
                <div className="space-y-2">
                  <Label htmlFor="completion-cert" className="text-slate-700">Upload Completion Certificate</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-primary/70 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <Label htmlFor="file-upload-cert" className="cursor-pointer mt-2 block text-sm font-medium text-primary hover:text-primary/80">Click to upload</Label>
                    <Input id="file-upload-cert" type="file" multiple className="hidden" onChange={(e) => handleFileUpload(e)} ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                  {uploadedDocs.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {uploadedDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-100 rounded text-xs text-slate-600">
                          <span className="truncate">{doc.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeUploadedDoc(doc.id)} className="text-red-500 hover:text-red-400"><Trash2 className="h-3 w-3" /></Button>
                        </div>))}
                    </div>)}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">Cancel</Button></DialogClose>
              <Button onClick={handleSubmitAction} className="bg-primary hover:bg-primary/90 text-primary-foreground">Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}