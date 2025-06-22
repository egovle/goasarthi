import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Eye } from 'lucide-react';
import { DocumentViewer } from '@/components/DocumentViewer';

export function AdminBookingsList({ bookings, getStatusIcon, getStatusColor, getLatestRemark }) {
  return (
    <div className="grid gap-4 sm:gap-6">
      {bookings.length === 0 ? (
        <Card><CardContent className="text-center py-12"><FileText className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-4 text-lg font-medium">No bookings yet</h3></CardContent></Card>
      ) : (
        bookings.map(booking => (
          <Card key={booking.id} className="card-hover animate-fade-in">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <CardTitle className="text-md sm:text-lg">{booking.service_name}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Booking ID: {booking.id}</CardDescription>
                </div>
                <Badge className={`${getStatusColor(booking.status)} flex items-center gap-1 text-xs px-2 py-1`}>
                  {getStatusIcon(booking.status)} {booking.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div><span className="font-medium">Customer ID:</span> {booking.customer_id}</div>
                <div><span className="font-medium">Fee:</span> ₹{booking.fee}</div>
                <div><span className="font-medium">Created:</span> {new Date(booking.created_at).toLocaleDateString()}</div>
                <div>
                  <span className="font-medium">Documents:</span> {booking.documents?.length || 0}
                  <Dialog>
                    <DialogTrigger asChild><Button variant="link" size="sm" className="p-0 h-auto ml-1"><Eye className="h-3 w-3"/></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>View Documents for {booking.service_name}</DialogTitle></DialogHeader>
                      <DocumentViewer documents={booking.documents} />
                    </DialogContent>
                  </Dialog>
                </div>
                {booking.assignedVleName !== 'N/A' && (<div><span className="font-medium">Assigned VLE:</span> {booking.assignedVleName}</div>)}
              </div>
              <p className="text-xs text-gray-500 mt-2"><span className="font-medium">Latest Remark:</span> {getLatestRemark(booking)}</p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}