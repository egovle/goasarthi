import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function CustomerReUploadDialog({ isOpen, onOpenChange, item, onSubmit }) {
  const [reUploadDocs, setReUploadDocs] = useState([]);
  const reUploadFileInputRef = useRef(null);
  const { toast } = useToast();

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
    setReUploadDocs(prev => [...prev, ...newDocs]);
    toast({ title: "Documents Added", description: `${files.length} document(s) ready for re-upload.` });
    if (reUploadFileInputRef.current) reUploadFileInputRef.current.value = "";
  };

  const removeDocument = (docId) => {
    setReUploadDocs(prev => prev.filter(doc => doc.id !== docId));
  };

  const handleSubmit = () => {
    if (reUploadDocs.length === 0) {
      toast({ title: "No Documents", description: "Please select documents to re-upload.", variant: "destructive" });
      return;
    }
    onSubmit(item, reUploadDocs);
    setReUploadDocs([]); 
    onOpenChange(false); 
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) setReUploadDocs([]); 
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Re-upload Documents for {item.serviceName}</DialogTitle>
          <DialogDescription>The VLE or Department has requested additional/corrected documents. Please upload them here.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reupload-file-input-actual">Upload New Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <Label htmlFor="reupload-file-input-actual" className="cursor-pointer mt-2 block text-sm font-medium text-blue-600 hover:text-blue-500">Click to select files</Label>
              <Input id="reupload-file-input-actual" type="file" multiple className="hidden" onChange={handleFileUpload} ref={reUploadFileInputRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </div>
          </div>
          {reUploadDocs.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Documents for Re-upload</Label>
              {reUploadDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-100 rounded text-xs">
                  <span className="truncate">{doc.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                </div>))}
            </div>)}
          <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={reUploadDocs.length === 0}>Submit Re-uploaded Documents</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}