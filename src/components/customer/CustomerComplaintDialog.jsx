import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function CustomerComplaintDialog({ isOpen, onOpenChange, booking, onSubmit, type = 'complaint' }) {
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintRating, setComplaintRating] = useState(0);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (type === 'complaint' && !complaintSubject) {
      toast({ title: "Complaint Incomplete", description: "Please provide a subject for your complaint.", variant: "destructive" });
      return;
    }
    if (!complaintDescription) {
      toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Incomplete`, description: "Please provide a description.", variant: "destructive" });
      return;
    }
    if (type === 'feedback' && complaintRating === 0) {
      toast({ title: "Feedback Incomplete", description: "Please provide a star rating for your feedback.", variant: "destructive" });
      return;
    }

    onSubmit(booking, type === 'complaint' ? complaintSubject : '', complaintDescription, type === 'feedback' ? complaintRating : 0);
    setComplaintSubject('');
    setComplaintDescription('');
    setComplaintRating(0);
    onOpenChange(false);
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setComplaintSubject('');
        setComplaintDescription('');
        setComplaintRating(0);
      }
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a {type.charAt(0).toUpperCase() + type.slice(1)} for Booking ID: {booking.id}</DialogTitle>
          <DialogDescription>
            {type === 'complaint' ? 'Describe the issue you are facing.' : 'Provide your feedback and a star rating.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {type === 'complaint' && (
            <div>
              <Label htmlFor="complaint-subject">Subject</Label>
              <Input id="complaint-subject" value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)} placeholder="e.g., Delay in processing, Incorrect information" />
            </div>
          )}
          <div>
            <Label htmlFor="complaint-description">Description / Comments</Label>
            <Textarea id="complaint-description" value={complaintDescription} onChange={(e) => setComplaintDescription(e.target.value)} placeholder={type === 'complaint' ? 'Provide details about your issue...' : 'Share your thoughts on the service...'} />
          </div>
          {type === 'feedback' && (
            <div>
              <Label>Rating (1-5 Stars)</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Button key={star} variant="ghost" size="icon" onClick={() => setComplaintRating(star)}>
                    <Star className={`h-6 w-6 ${star <= complaintRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Submit {type.charAt(0).toUpperCase() + type.slice(1)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}