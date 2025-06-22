
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, XCircle, User, MessageSquare, Download, AlertTriangle, Smile, Frown, Eye } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { useToast } from '@/components/ui/use-toast';
import { DocumentViewer } from '@/components/DocumentViewer';


const getStatusIcon = (status) => {
  const icons = {
    pending: <Clock className="h-4 w-4" />,
    assigned: <User className="h-4 w-4" />,
    accepted: <CheckCircle className="h-4 w-4 text-sky-600" />,
    'additional-docs-vle': <MessageSquare className="h-4 w-4 text-orange-600" />,
    'additional-docs-dept': <MessageSquare className="h-4 w-4 text-amber-600" />,
    'ack-submitted': <FileText className="h-4 w-4 text-indigo-600" />,
    'in-progress': <Clock className="h-4 w-4" />,
    completed: <CheckCircle className="h-4 w-4 text-green-600" />,
    rejected: <XCircle className="h-4 w-4 text-red-600" />,
  };
  return icons[status] || <Clock className="h-4 w-4" />;
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'status-pending',
    assigned: 'status-assigned',
    accepted: 'status-accepted',
    'additional-docs-vle': 'status-additional-docs-vle',
    'additional-docs-dept': 'status-additional-docs-dept',
    'ack-submitted': 'status-ack-submitted',
    'in-progress': 'status-in-progress',
    completed: 'status-completed',
    rejected: 'status-rejected',
  };
  return colors[status] || 'status-pending';
};

export function CustomerBookingItem({ booking, tasks, onOpenReUploadDialog, onOpenComplaintDialog, getCustomerFacingStatus, getLatestRemark }) {
  const { downloadFile } = useData();
  const { toast } = useToast();
  const displayStatus = getCustomerFacingStatus(booking);
  const associatedTask = tasks.find(t => t.original_id === booking.id && (t.type === 'booking' || t.type === 'lead'));
  const { QUICK_LOGIN_USERS } = useAuth();
  
  const canDownloadCertificate = displayStatus === 'completed' && associatedTask?.documents?.some(doc => doc.isCertificate === true);
  
  const assignedVle = associatedTask?.vle_id ? QUICK_LOGIN_USERS.find(u => u.id === associatedTask.vle_id) : null;

  const taskDocuments = associatedTask?.documents || [];
  const bookingDocuments = booking.documents || [];
  
  const allDocs = [...bookingDocuments, ...taskDocuments];
  const allDisplayableDocuments = Array.from(new Map(allDocs.map(doc => [doc.path || doc.name, doc])).values());

  const handleDownloadCertificate = async () => {
    const certificateDoc = associatedTask?.documents?.find(doc => doc.isCertificate === true);
    
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
      toast({ title: "Certificate Not Available", description: "No certificate is currently available for download.", variant: "destructive" });
    }
  };


  return (
    <Card className="card-hover animate-fade-in">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-2 sm:mb-0">
            <CardTitle className="text-md sm:text-lg">{booking.service_name}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Booking ID: {booking.id}</CardDescription>
          </div>
          <Badge className={`${getStatusColor(displayStatus)} flex items-center gap-1 text-xs px-2 py-1`}>
            {getStatusIcon(displayStatus)} {displayStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div><span className="font-medium">Fee:</span> ₹{booking.fee}</div>
          <div><span className="font-medium">Created:</span> {new Date(booking.created_at).toLocaleDateString()}</div>
          <div>
            <span className="font-medium">Documents:</span> {allDisplayableDocuments.length} files
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="link" size="sm" className="p-0 h-auto ml-1"><Eye className="h-3 w-3"/></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>View Documents for {booking.service_name}</DialogTitle></DialogHeader>
                    <DocumentViewer documents={allDisplayableDocuments} />
                </DialogContent>
            </Dialog>
          </div>
          {assignedVle && (<div><span className="font-medium">Assigned VLE ID:</span> {assignedVle.user_id_custom}</div>)}
        </div>
        <div className="text-xs sm:text-sm">
          <span className="font-medium">Latest Remark:</span> <span className="text-gray-600">{getLatestRemark(booking)}</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {(displayStatus === 'additional-docs-vle' || displayStatus === 'additional-docs-dept') && (
            <Button variant="outline" size="sm" onClick={() => onOpenReUploadDialog(booking)}>Re-upload Documents</Button>
          )}
          {canDownloadCertificate && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleDownloadCertificate}><Download className="mr-2 h-4 w-4" />Download Certificate</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onOpenComplaintDialog(booking, 'complaint')}><Frown className="mr-2 h-4 w-4"/>Raise Complaint</Button>
          <Button size="sm" variant="outline" onClick={() => onOpenComplaintDialog(booking, 'feedback')}><Smile className="mr-2 h-4 w-4"/>Give Feedback</Button>
        </div>
      </CardContent>
    </Card>
  );
}
