import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Upload, Trash2, User, Phone, MapPin, Mail } from 'lucide-react';

const GOA_CITIES = [
  "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Canacona", "Curchorem", "Cuncolim", "Quepem", "Sanquelim", "Valpoi", "Pernem"
];

export function CustomerBookingForm({ services, onBookService, user }) {
  const [selectedService, setSelectedService] = useState('');
  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerMobile, setCustomerMobile] = useState(user?.phone || '');
  const [customerLocation, setCustomerLocation] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');


  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newDocs = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      fileObject: file,
      uploadedAt: new Date().toISOString()
    }));

    setDocuments(prevDocs => [...prevDocs, ...newDocs]);
    toast({
      title: "Documents Added",
      description: `${files.length} document(s) ready.`,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeDocument = (docId) => {
    setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== docId));
    toast({
      title: "Document Removed",
      description: "The selected document has been removed.",
    });
  };

  const handleFormSubmit = () => {
    if (!selectedService) {
      toast({ title: "Service Required", description: "Please select a service.", variant: "destructive" });
      return;
    }
    if (!customerName || !customerMobile || !customerLocation) {
      toast({ title: "Customer Details Required", description: "Please fill in Name, Mobile, and Location.", variant: "destructive" });
      return;
    }
    if (documents.length === 0) {
      toast({ title: "Documents Required", description: "Please upload documents.", variant: "destructive" });
      return;
    }
    
    const customerDetails = {
      name: customerName,
      mobile: customerMobile,
      location: customerLocation,
      email: customerEmail
    };

    onBookService(selectedService, customerDetails, documents);
    setSelectedService('');
    setDocuments([]);
    setCustomerName(user?.name || '');
    setCustomerMobile(user?.phone || '');
    setCustomerLocation('');
    setCustomerEmail(user?.email || '');
  };

  return (
    <Card className="card-hover animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <FileText className="h-5 w-5" /> Book a New Service
        </CardTitle>
        <CardDescription>Select a service, provide your details, and upload documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName"><User className="inline h-4 w-4 mr-1" />Name (Mandatory)</Label>
            <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your full name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerMobile"><Phone className="inline h-4 w-4 mr-1" />Mobile (Mandatory)</Label>
            <Input id="customerMobile" type="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} placeholder="Your mobile number" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerLocation"><MapPin className="inline h-4 w-4 mr-1" />Location (Mandatory)</Label>
            <Select value={customerLocation} onValueChange={setCustomerLocation}>
              <SelectTrigger id="customerLocation" className="w-full">
                <SelectValue placeholder="Select your city/town..." />
              </SelectTrigger>
              <SelectContent>
                {GOA_CITIES.map(city => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail"><Mail className="inline h-4 w-4 mr-1" />Email (Optional)</Label>
            <Input id="customerEmail" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Your email address" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service">Select Service (Mandatory)</Label>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger id="service" className="w-full">
              <SelectValue placeholder="Choose a service..." />
            </SelectTrigger>
            <SelectContent>
              {services.map(service => (<SelectItem key={service.id} value={service.id}>{service.name} - ₹{service.fee} ({service.category})</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="documents">Upload Documents (Mandatory)</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <Label htmlFor="file-upload" className="cursor-pointer mt-4 block text-sm font-medium text-blue-600 hover:text-blue-500">Click to upload documents</Label>
            <Input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            <p className="mt-1 text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB each</p>
          </div>
        </div>
        {documents.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Documents</Label>
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs sm:text-sm">
                <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                  <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium truncate" title={doc.name}>{doc.name}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <span className="text-gray-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                  <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>))}
          </div>)}
        <Button onClick={handleFormSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedService || documents.length === 0 || !customerName || !customerMobile || !customerLocation}>Book Service</Button>
      </CardContent>
    </Card>
  );
}