import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { useServices } from '@/contexts/ServiceContext';
import { UserPlus, FileText, Upload, Trash2, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function VLELeadGeneration({ user, onLeadGenerated }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createLead } = useData();
  const { services, loadingServices } = useServices();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      fileObject: file,
      uploadedAt: new Date().toISOString()
    }));

    setDocuments(prevDocs => [...prevDocs, ...newDocuments]);
    toast({
      title: "Documents Added",
      description: `${files.length} document(s) ready for upload.`,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeDocument = (docId) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
    toast({
      title: "Document Removed",
      description: "The selected document has been removed from the list.",
    });
  };

  const handleCreateLead = async () => {
    if (!customerName || !customerPhone || !selectedService) {
      toast({ title: "All Fields Required", description: "Please fill customer details and select a service.", variant: "destructive" });
      return;
    }
    if (documents.length === 0) {
      toast({ title: "Documents Required", description: "Please upload documents for the lead.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createLead(selectedService, user.id, customerName, customerPhone, documents);

      if(result.success && result.lead) {
          toast({ title: "Lead Created Successfully!", description: `Lead ID: ${result.lead.id}. It's now pending admin assignment.` });
          setCustomerName('');
          setCustomerPhone('');
          setSelectedService('');
          setDocuments([]);
          if(onLeadGenerated) onLeadGenerated(result.lead);
      } else {
          toast({ title: "Lead Creation Failed", description: result.error || "Could not create lead. Ensure you have sufficient wallet balance for the service fee.", variant: "destructive" });
      }
    } catch (error) {
        toast({ title: "An Error Occurred", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loadingServices) {
    return <div className="text-center text-slate-500">Loading services...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
    <Card className="bg-white border-slate-200 text-slate-700 shadow-xl card-hover">
      <CardHeader className="border-b border-slate-200 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl text-slate-800">
          <UserPlus className="h-6 w-6 text-primary" /> Generate New Lead
        </CardTitle>
        <CardDescription className="text-slate-500">Create a lead for potential customers to initiate service requests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer-name" className="text-slate-700">Customer Name</Label>
            <Input id="customer-name" placeholder="Enter customer's full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-slate-50 border-slate-300 text-slate-700 placeholder-slate-400 focus:border-primary" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-phone" className="text-slate-700">Customer Phone</Label>
            <Input id="customer-phone" type="tel" placeholder="Enter 10-digit mobile number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-slate-50 border-slate-300 text-slate-700 placeholder-slate-400 focus:border-primary" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="service-lead" className="text-slate-700">Service Interested In</Label>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger id="service-lead" className="w-full bg-slate-50 border-slate-300 text-slate-700 focus:border-primary">
              <SelectValue placeholder="Choose a service..." />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-700">
              {services.map(service => (<SelectItem key={service.id} value={service.id} className="focus:bg-slate-100 focus:text-primary">{service.name} - ₹{service.fee} ({service.category})</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="documents-lead" className="text-slate-700">Upload Documents</Label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary/70 transition-colors duration-200 ease-in-out">
            <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-slate-400" />
            <Label htmlFor="file-upload-lead" className="cursor-pointer mt-4 block text-sm font-medium text-primary hover:text-primary/80">Click to upload documents</Label>
            <Input id="file-upload-lead" type="file" multiple className="hidden" onChange={handleFileUpload} ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            <p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG, DOC up to 10MB each</p>
          </div>
        </div>
        {documents.length > 0 && (
          <div className="space-y-2">
            <Label className="text-slate-700">Selected Documents ({documents.length})</Label>
            {documents.map(doc => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between p-3 bg-slate-100 rounded-lg text-xs sm:text-sm"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                  <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span className="font-medium truncate text-slate-700" title={doc.name}>{doc.name}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <span className="text-slate-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                  <Button variant="ghost" size="icon" onClick={() => removeDocument(doc.id)} className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </motion.div>))}
          </div>)}
        <Button onClick={handleCreateLead} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base py-3 mt-4 rounded-md" disabled={isSubmitting || !customerName || !customerPhone || !selectedService || documents.length === 0}>
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
          {isSubmitting ? 'Generating...' : 'Generate Lead'}
        </Button>
      </CardContent>
    </Card>
    </motion.div>
  );
}
