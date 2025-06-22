
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Star } from 'lucide-react';
import { format } from 'date-fns';

export function CustomerComplaintItem({ complaint }) {
  return (
    <Card className="card-hover animate-fade-in">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-2 sm:mb-0">
            <CardTitle className="text-md sm:text-lg">{complaint.subject || 'Feedback'}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {complaint.type === 'feedback' ? 'Feedback' : 'Complaint'} ID: {complaint.id} | Booking ID: {complaint.booking_id}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {complaint.rating > 0 && (
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < complaint.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
            )}
            <Badge className={`${complaint.status === 'open' ? 'bg-yellow-100 text-yellow-800' : complaint.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} flex items-center gap-1 text-xs px-2 py-1`}>
              {complaint.status === 'open' ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              {complaint.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-700">{complaint.description}</p>
        <p className="text-xs text-gray-500">Created: {complaint.created_at ? format(new Date(complaint.created_at), 'PPpp') : 'Invalid Date'}</p>
        {complaint.resolution_details && (
          <div className="mt-2 p-2 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-xs font-semibold text-green-700">Resolution:</p>
            <p className="text-xs text-green-600">{complaint.resolution_details.remarks}</p>
            {complaint.resolution_details.documents && complaint.resolution_details.documents.length > 0 && (
              <p className="text-xs text-green-600 mt-1">Attached: {complaint.resolution_details.documents.map(d => d.name).join(', ')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
