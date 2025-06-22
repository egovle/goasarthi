
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, HelpCircle, UserCircle, Phone, Eye, Info, CheckSquare, AlertOctagon } from 'lucide-react';
import { format } from 'date-fns';

const getStatusBadgeClass = (status) => {
  const base = "text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border shadow-sm";
  switch (status) {
    case 'pending_admin_review': return `${base} bg-yellow-100 text-yellow-700 border-yellow-300`;
    case 'admin_in_progress': return `${base} bg-blue-100 text-blue-700 border-blue-300`;
    case 'admin_resolved':
    case 'admin_information_provided': return `${base} bg-emerald-100 text-emerald-700 border-emerald-300`;
    case 'admin_rejected': return `${base} bg-red-100 text-red-700 border-red-300`;
    default: return `${base} bg-slate-100 text-slate-700 border-slate-300`;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending_admin_review': return <Info className="h-3 w-3" />;
    case 'admin_in_progress': return <Sparkles className="h-3 w-3" />;
    case 'admin_resolved':
    case 'admin_information_provided': return <CheckSquare className="h-3 w-3" />;
    case 'admin_rejected': return <AlertOctagon className="h-3 w-3" />;
    default: return <HelpCircle className="h-3 w-3" />;
  }
};

export function AdminSpecialRequests({ specialRequests, onUpdateStatus, vleUsers }) {
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [newStatus, setNewStatus] = React.useState('');
  const [adminRemarks, setAdminRemarks] = React.useState('');

  const handleOpenUpdateModal = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAdminRemarks(request.adminRemarks || '');
  };

  const handleUpdate = () => {
    if (!selectedRequest || !newStatus) return;
    onUpdateStatus(selectedRequest.id, newStatus, adminRemarks);
    setSelectedRequest(null);
  };

  const getVleName = (vleId) => {
    const vle = vleUsers.find(v => v.id === vleId);
    return vle ? `${vle.name} (${vle.user_id_custom})` : 'Unknown VLE (N/A)';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">VLE Special Requests & Queries</CardTitle>
          <CardDescription>Manage special service requests and queries submitted by VLEs.</CardDescription>
        </CardHeader>
        <CardContent>
          {specialRequests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No special requests or queries found.</p>
          ) : (
            <div className="space-y-4">
              {specialRequests.map(req => (
                <Card key={req.id} className="animate-fade-in">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-md flex items-center gap-2">
                          {req.requestType === 'special_service' ? <Sparkles className="h-5 w-5 text-yellow-500" /> : <HelpCircle className="h-5 w-5 text-sky-500" />}
                          {req.serviceName || 'General Query'}
                        </CardTitle>
                        <CardDescription className="text-xs">Request ID: {req.id} | VLE: {getVleName(req.vleId)}</CardDescription>
                      </div>
                      <Badge className={getStatusBadgeClass(req.status)}>
                        {getStatusIcon(req.status)} {req.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-3">{req.description}</p>
                    {req.customerDetails && req.customerDetails.name && (
                      <div className="text-xs text-gray-500 space-y-1 mb-3 p-2 bg-slate-50 rounded-md border">
                        <p className="flex items-center gap-1.5"><UserCircle className="h-4 w-4" /> Customer: {req.customerDetails.name}</p>
                        <p className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> Phone: {req.customerDetails.phone}</p>
                      </div>
                    )}
                    {req.documents && req.documents.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary hover:text-primary/80">
                            <Eye className="mr-1 h-3 w-3" />View {req.documents.length} Attached Document(s)
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Documents for Request: {req.id}</DialogTitle></DialogHeader>
                          <div className="py-2 max-h-60 overflow-y-auto text-xs space-y-1">
                            {req.documents.map((doc, idx) => (
                              <div key={idx} className="p-1.5 bg-slate-100 rounded">{doc.name}</div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <div className="flex justify-between items-end mt-3">
                      <div className="text-xs text-gray-400">
                        <p>Submitted: {req.createdAt ? format(new Date(req.createdAt), 'PPpp') : 'Invalid Date'}</p>
                        <p>Last Updated: {req.updatedAt ? format(new Date(req.updatedAt), 'PPpp') : 'Invalid Date'}</p>
                      </div>
                      <Button size="sm" onClick={() => handleOpenUpdateModal(req)}>Update Status / Add Remarks</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={(isOpen) => !isOpen && setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Request: {selectedRequest.id}</DialogTitle>
              <DialogDescription>Update the status and add remarks for this request.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="status-select">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_admin_review">Pending Admin Review</SelectItem>
                    <SelectItem value="admin_in_progress">In Progress</SelectItem>
                    <SelectItem value="admin_information_provided">Information Provided</SelectItem>
                    <SelectItem value="admin_resolved">Resolved</SelectItem>
                    <SelectItem value="admin_rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="admin-remarks">Admin Remarks</Label>
                <Textarea id="admin-remarks" value={adminRemarks} onChange={(e) => setAdminRemarks(e.target.value)} placeholder="Enter remarks for the VLE..." />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleUpdate}>Update Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
