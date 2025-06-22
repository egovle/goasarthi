
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { Sparkles, HelpCircle, Send, ListChecks, UserCircle, Phone, FileText as FileTextIcon, Upload, Trash2, Eye, Info, CheckSquare, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';


const PREDEFINED_SPECIAL_SERVICES = [
  { id: 'pan-find-aadhaar', name: 'PAN Number Find through Aadhaar' },
  { id: 'dl-pdf', name: 'Driving License PDF Download' },
  { id: 'rc-download', name: 'Vehicle RC Download' },
];

const getStatusBadgeClass = (status) => {
  const base = "text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border shadow-sm";
  switch (status) {
    case 'pending_admin_review':
      return `${base} bg-yellow-100 text-yellow-700 border-yellow-300`;
    case 'admin_in_progress':
      return `${base} bg-blue-100 text-blue-700 border-blue-300`;
    case 'admin_resolved':
    case 'admin_information_provided':
      return `${base} bg-emerald-100 text-emerald-700 border-emerald-300`;
    case 'admin_rejected':
      return `${base} bg-red-100 text-red-700 border-red-300`;
    default:
      return `${base} bg-slate-100 text-slate-700 border-slate-300`;
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
}


export function VLESpecialServices({ user }) {
  const { toast } = useToast();
  const { createSpecialRequest, specialRequests } = useData();
  const fileInputRef = useRef(null);

  const [requestType, setRequestType] = useState('special_service'); 
  const [selectedSpecialService, setSelectedSpecialService] = useState('');
  const [otherServiceName, setOtherServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAadhaar, setCustomerAadhaar] = useState('');
  const [documents, setDocuments] = useState([]);

  const vleRequests = specialRequests.filter(sr => sr.vle_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newDocs = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substring(2, 9), 
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    }));

    setDocuments(prevDocs => [...prevDocs, ...newDocs]);
    toast({
      title: "Documents Added",
      description: `${files.length} document(s) ready for the request.`,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDocument = (docId) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
    toast({
      title: "Document Removed",
      description: "The selected document has been removed from the list.",
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: "Description Required", description: "Please provide a description for your request.", variant: "destructive" });
      return;
    }

    let serviceToSubmit = selectedSpecialService;
    if (requestType === 'special_service' && selectedSpecialService === 'other' && !otherServiceName.trim()) {
      toast({ title: "Service Name Required", description: "Please enter the name for the 'Other' service.", variant: "destructive" });
      return;
    }
    if (requestType === 'special_service' && selectedSpecialService === 'other') {
      serviceToSubmit = otherServiceName.trim();
    }
    
    const customerDetails = requestType === 'special_service' ? { name: customerName, phone: customerPhone, aadhaar: customerAadhaar } : null;
    const documentDetails = documents.map(doc => ({ name: doc.name, size: doc.size, type: doc.type, uploadedAt: doc.uploadedAt, uploadedBy: 'vle' }));


    createSpecialRequest(user.id, requestType, serviceToSubmit, description, customerDetails, documentDetails);
    toast({ title: "Request Submitted Successfully!", description: `Your ${requestType === 'special_service' ? 'special service request' : 'query'} has been sent to the admin.`, variant: "default" });

    setSelectedSpecialService('');
    setOtherServiceName('');
    setDescription('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAadhaar('');
    setDocuments([]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="bg-white border-slate-200 text-slate-700 shadow-xl card-hover">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-xl sm:text-2xl font-poppins text-slate-800 flex items-center">
            <Sparkles className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" /> Request Special Services or Ask a Query
          </CardTitle>
          <CardDescription className="font-inter text-slate-500">
            Submit requests for admin-handled services or ask general queries. Attach documents if needed.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="requestType" className="text-sm font-medium text-slate-700">Request Type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger id="requestType" className="w-full mt-1.5 rounded-md bg-slate-50 border-slate-300 text-slate-700 focus:border-primary">
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-700">
                  <SelectItem value="special_service" className="focus:bg-slate-100 focus:text-primary">
                    <div className="flex items-center"><Sparkles className="mr-2 h-4 w-4 text-yellow-500" />Special Service Request</div>
                  </SelectItem>
                  <SelectItem value="query" className="focus:bg-slate-100 focus:text-primary">
                    <div className="flex items-center"><HelpCircle className="mr-2 h-4 w-4 text-sky-500" />General Query</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {requestType === 'special_service' && (
              <>
                <div>
                  <Label htmlFor="specialService" className="text-sm font-medium text-slate-700">Select Special Service</Label>
                  <Select value={selectedSpecialService} onValueChange={setSelectedSpecialService}>
                    <SelectTrigger id="specialService" className="w-full mt-1.5 rounded-md bg-slate-50 border-slate-300 text-slate-700 focus:border-primary">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 text-slate-700">
                      {PREDEFINED_SPECIAL_SERVICES.map(service => (
                        <SelectItem key={service.id} value={service.name} className="focus:bg-slate-100 focus:text-primary">{service.name}</SelectItem>
                      ))}
                      <SelectItem value="other" className="focus:bg-slate-100 focus:text-primary">Other (Specify Below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedSpecialService === 'other' && (
                  <div>
                    <Label htmlFor="otherServiceName" className="text-sm font-medium text-slate-700">Other Service Name</Label>
                    <Input
                      id="otherServiceName"
                      value={otherServiceName}
                      onChange={(e) => setOtherServiceName(e.target.value)}
                      placeholder="Enter custom service name"
                      className="mt-1.5 rounded-md bg-slate-50 border-slate-300 text-slate-700 placeholder-slate-400 focus:border-primary"
                    />
                  </div>
                )}
                <Card className="p-4 bg-slate-50 border-slate-200 rounded-lg">
                    <h4 className="text-md font-semibold text-slate-700 mb-3 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-slate-500"/>Customer Details (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="customerName" className="text-xs font-medium text-slate-500">Customer Name</Label>
                            <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name" className="mt-1 text-sm rounded-md bg-white border-slate-300 text-slate-700 placeholder-slate-400 focus:border-primary"/>
                        </div>
                        <div>
                            <Label htmlFor="customerPhone" className="text-xs font-medium text-slate-500">Customer Phone</Label>
                            <Input id="customerPhone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Mobile Number" className="mt-1 text-sm rounded-md bg-white border-slate-300 text-slate-700 placeholder-slate-400 focus:border-primary"/>
                        </div>
                        <div className="md:col-span-2">
                            <Label htmlFor="customerAadhaar" className="text-xs font-medium text-slate-500">Customer Aadhaar (if applicable)</Label>
                            <Input id="customerAadhaar" value={customerAadhaar} onChange={(e) => setCustomerAadhaar(e.target.value)} placeholder="Aadhaar Number" className="mt-1 text-sm rounded-md bg-white border-slate-300 text-slate-700 placeholder-slate-400 focus:border-primary"/>
                        </div>
                    </div>
                </Card>
              </>
            )}

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                {requestType === 'special_service' ? 'Service Description / Requirements' : 'Your Query / Details'}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={requestType === 'special_service' ? 'Provide all necessary details for the service...' : 'Type your question or issue here...'}
                className="mt-1.5 min-h-[120px] rounded-md bg-slate-50 border-slate-300 text-slate-700 placeholder-slate-400 focus:border-primary"
                required
              />
            </div>
             <div className="space-y-2">
                <Label htmlFor="documents-special" className="text-sm font-medium text-slate-700">Upload Supporting Documents (Optional)</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-primary/70 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <Label htmlFor="file-upload-special" className="cursor-pointer mt-2 block text-xs font-medium text-primary hover:text-primary/80">Click to upload files</Label>
                    <Input id="file-upload-special" type="file" multiple className="hidden" onChange={handleFileUpload} ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG, DOC up to 10MB each</p>
                </div>
            </div>
            {documents.length > 0 && (
            <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Selected Documents ({documents.length})</Label>
                {documents.map(doc => (
                <motion.div 
                    key={doc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-2 bg-slate-100 rounded-md text-xs"
                >
                    <div className="flex items-center space-x-2 overflow-hidden">
                    <FileTextIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="font-medium truncate text-slate-700" title={doc.name}>{doc.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-slate-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="p-1 h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    </div>
                </motion.div>))}
            </div>)}
          </CardContent>
          <CardFooter className="p-6 bg-slate-50 border-t border-slate-200">
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 rounded-md shadow-lg hover:shadow-primary/40 transition-shadow">
              <Send className="mr-2 h-5 w-5" /> Submit Request
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-white border-slate-200 text-slate-700 shadow-xl">
        <CardHeader className="border-b border-slate-200 pb-4">
          <CardTitle className="text-xl sm:text-2xl font-poppins text-slate-800 flex items-center">
            <ListChecks className="mr-3 h-6 w-6 sm:h-7 sm:h-7 text-primary" /> My Submitted Requests
          </CardTitle>
          <CardDescription className="font-inter text-slate-500">
            Track the status of your special service requests and queries.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {vleRequests.length === 0 ? (
            <p className="p-6 text-center text-slate-500 font-inter">You haven't submitted any special requests or queries yet.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {vleRequests.map((req, index) => (
                <motion.div 
                  key={req.id} 
                  className="p-4 hover:bg-slate-50 transition-colors duration-150"
                  initial={{ opacity: 0, y:10 }}
                  animate={{ opacity: 1, y:0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                    <h4 className="font-semibold text-slate-800 text-sm">
                      {req.request_type === 'special_service' ? (req.service_name || 'Custom Service') : 'General Query'}
                      <span className="ml-2 text-xs text-slate-400 font-normal">(ID: {req.id})</span>
                    </h4>
                    <Badge className={`${getStatusBadgeClass(req.status)} text-xs px-2 py-0.5`}>
                      {getStatusIcon(req.status)} {req.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-1 line-clamp-2">{req.description}</p>
                  {req.customer_details && req.customer_details.name && (
                    <p className="text-xs text-slate-400 mb-1">
                      <UserCircle className="inline mr-1 h-3 w-3" /> For: {req.customer_details.name}
                      {req.customer_details.phone && <><Phone className="inline ml-2 mr-1 h-3 w-3" /> {req.customer_details.phone}</>}
                    </p>
                  )}
                  {req.documents && req.documents.length > 0 && (
                    <div className="mt-1 mb-1">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary hover:text-primary/80">
                                    <Eye className="mr-1 h-3 w-3"/>View {req.documents.length} Document(s)
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white border-slate-200 text-slate-700">
                                <DialogHeader><DialogTitle className="text-slate-800">Documents for Request: {req.id}</DialogTitle></DialogHeader>
                                <div className="py-2 max-h-60 overflow-y-auto text-xs space-y-1">
                                    {req.documents.map((doc, idx) => (
                                        <div key={idx} className="p-1.5 bg-slate-100 rounded">
                                            {doc.name} ({(doc.size / 1024).toFixed(1)} KB) - Uploaded by: {doc.uploadedBy || 'VLE'}
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                  )}
                  <p className="text-xs text-slate-400">Submitted: {req.created_at ? format(new Date(req.created_at), 'PPpp') : 'Invalid Date'}</p>
                  {req.admin_remarks && (
                    <div className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600 border border-slate-200">
                      <strong className="text-slate-700">Admin Remarks:</strong> {req.admin_remarks} (Updated: {req.updated_at ? format(new Date(req.updated_at), 'PPpp') : 'Invalid Date'})
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
