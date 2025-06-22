
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Clock, CheckCircle, Star, Upload, Trash2, Smile, Frown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export function AdminIssuesManagement({ complaints, onResolveComplaint }) {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionDocs, setResolutionDocs] = useState([]);
  const resolutionFileInputRef = useRef(null);
  const { toast } = useToast();

  const handleResolutionFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newDocs = files.map(file => ({ id: Date.now() + Math.random().toString(36).substring(2,9), name: file.name, size: file.size, type: file.type, fileObject: file }));
    setResolutionDocs(prev => [...prev, ...newDocs]);
    toast({ title: "Documents Added", description: `${files.length} document(s) ready for resolution.`});
    if (resolutionFileInputRef.current) resolutionFileInputRef.current.value = "";
  };

  const removeResolutionDoc = (docId) => {
    setResolutionDocs(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleOpenResolveModal = (complaint) => {
    setSelectedComplaint(complaint);
    setResolutionRemarks('');
    setResolutionDocs([]);
  };

  const handleSubmitResolution = () => {
    if (!selectedComplaint || !resolutionRemarks) {
      toast({ title: "Resolution Incomplete", description: "Please provide resolution remarks.", variant: "destructive" });
      return;
    }
    const docDetails = resolutionDocs.map(d => ({ name: d.name, size: d.size, type: d.type }));
    const complaintTypeString = selectedComplaint.type || 'issue'; 
    onResolveComplaint(selectedComplaint.id, resolutionRemarks, docDetails);
    toast({ title: `${complaintTypeString.charAt(0).toUpperCase() + complaintTypeString.slice(1)} Resolved`, description: `${complaintTypeString.charAt(0).toUpperCase() + complaintTypeString.slice(1)} ID: ${selectedComplaint.id} marked as resolved.`});
    setSelectedComplaint(null);
  };
  
  const getComplaintTypeString = (complaint) => {
    return complaint.type || 'issue';
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-lg sm:text-xl">Complaints & Feedback Management</CardTitle><CardDescription>View and manage customer complaints and feedback</CardDescription></CardHeader>
        <CardContent>
          {complaints.length === 0 ? (<p className="text-center text-gray-500 py-8">No complaints or feedback found.</p>) : (
            <div className="space-y-4">
              {complaints.map(complaint => {
                const complaintTypeString = getComplaintTypeString(complaint);
                return (
                <Card key={complaint.id} className="animate-fade-in">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="mb-2 sm:mb-0">
                        <CardTitle className="text-md flex items-center">
                          {complaintTypeString === 'feedback' ? <Smile className="mr-2 h-5 w-5 text-green-600" /> : <Frown className="mr-2 h-5 w-5 text-red-600" />}
                          {complaint.subject || 'Feedback'}
                        </CardTitle>
                        <CardDescription className="text-xs">{complaintTypeString.charAt(0).toUpperCase() + complaintTypeString.slice(1)} ID: {complaint.id} | Booking ID: {complaint.booking_id}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                          {complaint.rating > 0 && (
                              <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`h-4 w-4 ${i < complaint.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                  ))}
                              </div>
                          )}
                          <Badge className={`${complaint.status === 'open' ? 'bg-yellow-100 text-yellow-800' : complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
                          {complaint.status === 'open' ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          {complaint.status.toUpperCase()}
                          </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-2">{complaint.description}</p>
                    <p className="text-xs text-gray-500">Customer ID: {complaint.customer_id}</p>
                    <p className="text-xs text-gray-500">Created: {complaint.created_at ? format(new Date(complaint.created_at), 'PPpp') : 'Invalid Date'}</p>
                    {complaint.status === 'open' && (
                      <Button size="sm" className="mt-2" onClick={() => handleOpenResolveModal(complaint)}>Resolve {complaintTypeString.charAt(0).toUpperCase() + complaintTypeString.slice(1)}</Button>
                    )}
                    {complaint.status === 'resolved' && complaint.resolution_details && (
                       <div className="mt-2 p-2 bg-green-50 border-l-4 border-green-500 rounded">
                          <p className="text-xs font-semibold text-green-700">Resolution Details:</p>
                          <p className="text-xs text-green-600">{complaint.resolution_details.remarks}</p>
                          {complaint.resolution_details.documents && complaint.resolution_details.documents.length > 0 && (
                              <p className="text-xs text-green-600 mt-1">Attached: {complaint.resolution_details.documents.map(d => d.name).join(', ')}</p>
                          )}
                       </div>
                    )}
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedComplaint && (
        <Dialog open={!!selectedComplaint} onOpenChange={(isOpen) => !isOpen && setSelectedComplaint(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Resolve {(selectedComplaint.type || 'issue').charAt(0).toUpperCase() + (selectedComplaint.type || 'issue').slice(1)} ID: {selectedComplaint.id}</DialogTitle>
                    <DialogDescription>Provide resolution details and attach any relevant documents.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="resolution-remarks">Resolution Remarks</Label>
                        <Textarea id="resolution-remarks" value={resolutionRemarks} onChange={(e) => setResolutionRemarks(e.target.value)} placeholder="Enter resolution comments (mandatory)" />
                    </div>
                    <div>
                        <Label htmlFor="resolution-docs">Upload Resolution Documents (Optional)</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <Label htmlFor="file-upload-resolution" className="cursor-pointer mt-2 block text-sm font-medium text-blue-600 hover:text-blue-500">Click to upload</Label>
                            <Input id="file-upload-resolution" type="file" multiple className="hidden" onChange={handleResolutionFileUpload} ref={resolutionFileInputRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                        </div>
                        {resolutionDocs.length > 0 && (
                        <div className="space-y-1 mt-2">
                            {resolutionDocs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs">
                                <span className="truncate">{doc.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => removeResolutionDoc(doc.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>))}
                        </div>)}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmitResolution} disabled={!resolutionRemarks}>Mark as Resolved</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
