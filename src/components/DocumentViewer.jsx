import React from 'react';
import { useData } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export function DocumentViewer({ documents }) {
  const { downloadFile } = useData();
  const { toast } = useToast();

  const handleDownload = async (doc) => {
    if (!doc.path) {
      toast({
        title: "Download Unavailable",
        description: "This file does not have a valid path.",
        variant: "destructive",
      });
      return;
    }
    const result = await downloadFile(doc.path, doc.name);
    if (!result.success) {
      toast({
        title: "Download Failed",
        description: result.error || "Could not download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!documents || documents.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">No documents available.</p>;
  }

  return (
    <div className="py-4 max-h-80 overflow-y-auto space-y-2">
      {documents.map((doc, i) => (
        <div key={doc.path || i} className="flex items-center justify-between p-2 bg-slate-100 rounded-md hover:bg-slate-200/60 transition-colors">
          <div className="flex items-center gap-3 truncate">
            <FileText className="h-5 w-5 text-slate-500 flex-shrink-0" />
            <div className="truncate">
              <p className="text-sm text-slate-800 font-medium truncate">{doc.name}</p>
              {doc.size && <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.isCertificate && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">Certificate</Badge>}
            <Button size="icon" variant="ghost" onClick={() => handleDownload(doc)} disabled={!doc.path} className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}