
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useData } from '@/hooks/useData';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, User, Phone, Clock, CheckCircle, XCircle, FileText, AlertOctagon, Download } from 'lucide-react';
import { motion } from 'framer-motion';

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

export function VLEMyLeads({ user }) {
  const { leads, tasks, downloadFile } = useData();
  const { toast } = useToast();
  const userLeads = leads.filter(l => l.vle_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getLeadDisplayStatus = (lead) => {
    const task = tasks.find(t => t.original_id === lead.id && t.type === 'lead');
    if (task) {
      if (task.status === 'pending_commission_approval' || task.status === 'commission_approved' || task.status === 'commission_rejected') {
        return 'completed';
      }
      return task.status;
    }
    return lead.status;
  };
  
  const handleDownloadCertificate = async (lead) => {
    const task = tasks.find(t => t.original_id === lead.id && t.type === 'lead');
    const certificateDoc = task?.documents?.find(doc => doc.isCertificate === true);
    
    if (certificateDoc && certificateDoc.path) {
      toast({ title: "Certificate Download Initiated", description: `Downloading ${certificateDoc.name}.` });
      const result = await downloadFile(certificateDoc.path, certificateDoc.name);
      if (!result.success) {
        toast({
          title: "Download Failed",
          description: result.error || "Could not download the certificate. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({ title: "Certificate Not Available", description: "No certificate is currently available for this lead or the task is not yet marked as completed by the assigned VLE.", variant: "destructive" });
    }
  };


  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="h-4 w-4" />,
      assigned: <User className="h-4 w-4" />,
      accepted: <CheckCircle className="h-4 w-4 text-sky-600" />,
      'additional-docs-vle': <FileText className="h-4 w-4 text-orange-600" />,
      'additional-docs-dept': <AlertOctagon className="h-4 w-4 text-amber-600" />,
      'ack-submitted': <FileText className="h-4 w-4 text-indigo-600" />,
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
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
    };
    return `${base} ${colors[status] || 'bg-slate-100 text-slate-700 border-slate-300'}`;
  };

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {userLeads.length === 0 ? (
        <Card className="md:col-span-1 lg:col-span-2 xl:col-span-3 bg-white border-slate-200 text-slate-700 shadow-lg">
          <CardContent className="text-center py-16">
            <UserPlus className="mx-auto h-16 w-16 text-slate-400" />
            <h3 className="mt-6 text-xl font-poppins">No leads generated yet</h3>
            <p className="mt-2 text-base text-slate-500">Start by generating leads for customers to see them here.</p>
          </CardContent>
        </Card>
      ) : (
        userLeads.map((lead, index) => {
          const displayStatus = getLeadDisplayStatus(lead);
          const associatedTask = tasks.find(t => t.original_id === lead.id && t.type === 'lead');
          const canDownloadCertificate = displayStatus === 'completed' && associatedTask?.documents?.some(doc => doc.isCertificate === true);

          return (
            <motion.custom
              key={lead.id}
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
                    <CardTitle className="text-lg sm:text-xl text-slate-800">{lead.service_name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-500">Lead ID: {lead.id}</CardDescription>
                  </div>
                  <Badge className={getStatusBadgeClass(displayStatus)}>
                    {getStatusIcon(displayStatus)} {displayStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs sm:text-sm flex-grow">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-primary/80" /><span>{lead.customer_name}</span></div>
                  <div className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary/80" /><span>{lead.customer_phone}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 mt-2">
                  <div><span className="font-medium text-slate-600">Fee:</span> ₹{lead.fee}</div>
                  <div><span className="font-medium text-slate-600">Created:</span> {new Date(lead.created_at).toLocaleDateString()}</div>
                  <div className="col-span-2"><span className="font-medium text-slate-600">Documents:</span> {lead.documents?.length || 0} files</div>
                </div>
                {canDownloadCertificate && (
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleDownloadCertificate(lead)}>
                      <Download className="mr-2 h-4 w-4" />Download Certificate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.custom>
          )
        })
      )}
    </div>
  );
}
