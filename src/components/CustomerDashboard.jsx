import { lazy, Suspense } from 'react';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { FileText, MessageSquare, ShieldCheck, LogOut, Settings, Wallet, Menu as MenuIcon, PlusCircle, ListChecks, UserCircle as ProfileIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu.jsx";

import { CustomerBookingForm } from '@/components/customer/CustomerBookingForm';
import { CustomerBookingItem } from '@/components/customer/CustomerBookingItem';
import { CustomerComplaintItem } from '@/components/customer/CustomerComplaintItem';
import { CustomerReUploadDialog } from '@/components/customer/CustomerReUploadDialog';
import { CustomerComplaintDialog } from '@/components/customer/CustomerComplaintDialog';
import { CustomerWallet } from '@/components/customer/CustomerWallet';
import { CustomerProfile } from '@/components/customer/CustomerProfile';
import { NotificationBell } from '@/components/NotificationBell';

const CUSTOMER_TABS_CONFIG = [
  { value: "my-bookings", label: "My Bookings", icon: <ListChecks className="mr-1.5 h-4 w-4" /> },
  { value: "book-service", label: "Book New Service", icon: <PlusCircle className="mr-1.5 h-4 w-4" /> },
  { value: "my-wallet", label: "My Wallet", icon: <Wallet className="mr-1.5 h-4 w-4" /> },
  { value: "my-complaints", label: "My Issues", icon: <MessageSquare className="mr-1.5 h-4 w-4" /> },
  { value: "my-profile", label: "My Profile", icon: <ProfileIcon className="mr-1.5 h-4 w-4" /> },
];

export function CustomerDashboard({ user, onLogout }) {
  const { services,bookings, createBooking, addDocumentsToTask, tasks, createComplaint, complaints, addDocumentsToBooking, addNotification } = useData();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentReUploadItem, setCurrentReUploadItem] = useState(null);
  const [isReUploadDialogOpen, setIsReUploadDialogOpen] = useState(false);
  
  const [currentComplaintBooking, setCurrentComplaintBooking] = useState(null);
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false);
  const [complaintType, setComplaintType] = useState('complaint'); 
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "my-bookings");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const bookingIdFromUrl = searchParams.get('bookingId');
    const complaintIdFromUrl = searchParams.get('complaintId');

    if (tabFromUrl && CUSTOMER_TABS_CONFIG.find(t => t.value === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
    
    if (tabFromUrl === 'my-bookings' && bookingIdFromUrl) {
      const element = document.getElementById(`booking-${bookingIdFromUrl}`);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    } else if (tabFromUrl === 'my-complaints' && complaintIdFromUrl) {
      const element = document.getElementById(`complaint-${complaintIdFromUrl}`);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    }
  }, [searchParams]);

  if (!user) {
    return null;
  }

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };


  const userBookings = bookings.filter(b => b.customer_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const userComplaintsAndFeedbacks = complaints.filter(c => c.customer_id === user.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const handleBookService = async (serviceId, customerDetails, serviceDocuments) => {
    const result = await createBooking(serviceId, user.id, serviceDocuments, customerDetails);
    if (result.success) {
        toast({ title: "Service Booked Successfully!", description: `Your booking ID is ${result.booking.id}. You can track its status in 'My Bookings'.`, variant: "default" });
        handleTabChange("my-bookings");
        addNotification(user.id, `Service "${result.booking.service_name}" booked successfully. ID: ${result.booking.id}`, 'success', `/customer-dashboard?tab=my-bookings&bookingId=${result.booking.id}`, 'Booking Confirmed');
        addNotification('admin', `New booking by ${user.name} for service "${result.booking.service_name}". ID: ${result.booking.id}`, 'info', `/admin-dashboard?tab=all-bookings&bookingId=${result.booking.id}`, 'New Booking Alert');
    } else {
        toast({ title: "Booking Failed", description: result.error || "Could not book service.", variant: "destructive" });
    }
  };

  const handleOpenReUploadDialog = (booking) => {
    setCurrentReUploadItem(booking);
    setIsReUploadDialogOpen(true);
  };

  const handleSubmitReUpload = async (item, reUploadedDocs) => {
    const task = tasks.find(t => t.original_id === item.id && (t.type === item.type || (item.type === 'booking' && t.type === 'lead' && t.original_id === item.id)));
    if (!task) {
      toast({ title: "Error Processing Request", description: "Associated task not found. Please contact support.", variant: "destructive" });
      return;
    }
    
    let newStatus = 'accepted'; 
    if (task.status === 'additional-docs-vle' || task.status === 'additional-docs-dept') {
        newStatus = task.task_phase === 2 ? 'accepted' : 'ack-submitted';
    }

    const result = await addDocumentsToTask(task.id, reUploadedDocs, "Customer re-uploaded documents as requested.", newStatus);

    if (result) {
      toast({ title: "Documents Submitted", description: "Your additional documents have been submitted. The task status is updated and is now under process." });
      addNotification(user.id, `Additional documents submitted for ${item.service_name}.`, 'info', `/customer-dashboard?tab=my-bookings&bookingId=${item.id}`, 'Documents Submitted');
      if (task.vle_id) {
        addNotification(task.vle_id, `Customer submitted additional documents for task ${task.id} (${item.service_name}).`, 'info', `/vle-dashboard?tab=assigned-tasks&taskId=${task.id}`, 'Customer Update');
      }
      addNotification('admin', `Customer submitted additional documents for task ${task.id} (${item.service_name}).`, 'info', `/admin-dashboard?tab=all-bookings&bookingId=${item.id}`, 'Customer Update');
    } else {
        toast({ title: "Upload Failed", description: "There was an error submitting your documents. Please try again.", variant: "destructive" });
    }
    
    setIsReUploadDialogOpen(false);
    setCurrentReUploadItem(null);
  };
  
  const handleOpenComplaintDialog = (booking, type) => {
    setCurrentComplaintBooking(booking);
    setComplaintType(type);
    setIsComplaintDialogOpen(true);
  };

  const handleSubmitComplaint = async (booking, subject, description, rating) => {
    const complaintResult = await createComplaint(booking.id, user.id, subject, description, rating, complaintType);
    if(complaintResult.success) {
      toast({ title: `${complaintType.charAt(0).toUpperCase() + complaintType.slice(1)} Submitted`, description: `Thank you! Your ${complaintType} has been recorded.` });
      addNotification(user.id, `Your ${complaintType} for booking ${booking.id} has been submitted.`, 'info', `/customer-dashboard?tab=my-complaints&complaintId=${complaintResult.complaint.id}`, `${complaintType.charAt(0).toUpperCase() + complaintType.slice(1)} Submitted`);
      addNotification('admin', `New ${complaintType} submitted by ${user.name} for booking ${booking.id}.`, 'warning', `/admin-dashboard?tab=issues-management&complaintId=${complaintResult.complaint.id}`, `New ${complaintType.charAt(0).toUpperCase() + complaintType.slice(1)}`);
      
      setIsComplaintDialogOpen(false);
      setCurrentComplaintBooking(null);
      handleTabChange("my-complaints");
    } else {
      toast({ title: "Submission Failed", description: complaintResult.error, variant: "destructive" });
    }
  };

  const getCustomerFacingStatus = (item) => {
    const task = tasks.find(t => t.original_id === item.id && (t.type === item.type || (item.type === 'booking' && t.type === 'lead' && t.original_id === item.id)));
    if (task) {
      if (task.status === 'rejected' && task.history && task.history.length > 0) {
          const latestRemarkEntry = task.history[task.history.length - 1];
          if (latestRemarkEntry && latestRemarkEntry.remarks && latestRemarkEntry.remarks.startsWith('Task rejected by VLE:')) {
              return 'pending_assignment'; 
          }
      }
      if (task.status === 'pending_commission_approval' || task.status === 'commission_approved' || task.status === 'commission_rejected') {
        return 'completed';
      }
      return task.status;
    }
    return item.status; 
  };

  const getLatestRemark = (item) => {
    const task = tasks.find(t => t.original_id === item.id && (t.type === item.type || (item.type === 'booking' && t.type === 'lead' && t.original_id === item.id)));
    const source = task || item;
    if (source.history && source.history.length > 0) {
      const latest = source.history[source.history.length - 1];
      
      const internalRemarksKeywords = ['commission', 'payout', 'VLE internal'];
      if (latest.remarks && internalRemarksKeywords.some(keyword => latest.remarks.toLowerCase().includes(keyword.toLowerCase()))) {
        if (source.status === 'completed' || source.status === 'pending_commission_approval' || source.status === 'commission_approved' || source.status === 'commission_rejected') {
            return "Application processed and completed.";
        }
        for (let i = source.history.length - 2; i >= 0; i--) {
            const prevRemark = source.history[i].remarks;
            if (prevRemark && !internalRemarksKeywords.some(keyword => prevRemark.toLowerCase().includes(keyword.toLowerCase()))) {
                return prevRemark;
            }
        }
        return "Application is under review."; 
      }

      if (source.status === 'rejected' && latest.remarks && latest.remarks.startsWith('Task rejected by VLE:')) {
        return 'Your application is pending initial review. Please check back or contact support for assistance.';
      }
      return latest.remarks || 'No remarks yet.';
    }
    return 'No remarks yet.';
  };
  
  const showNotImplementedToast = (feature = "This feature") => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `${feature} isn't implemented yet—but we're working on it! 🚀`,
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-inter">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center">
              <ShieldCheck className="h-7 w-7 sm:h-8 text-primary" />
              <h1 className="ml-2 text-xl sm:text-2xl font-poppins font-bold text-slate-800">eGoa Sarathi</h1>
              <span className="ml-2 text-[10px] sm:text-xs text-slate-500 font-medium hidden md:inline-block">Customer Portal</span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="hidden sm:inline-flex">
                <NotificationBell />
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleTabChange("my-wallet")} aria-label="Wallet" className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 hover:text-primary transition-colors"/>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => showNotImplementedToast("Settings")} aria-label="Settings" className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 hover:text-primary transition-colors"/>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleTabChange("my-profile")} aria-label="Profile" className="hidden sm:inline-flex h-8 w-8 sm:h-9 sm:w-9">
                <ProfileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 hover:text-primary transition-colors"/>
              </Button>
              <div className="text-right hidden md:block">
                <span className="text-xs sm:text-sm text-slate-700">Hello, <span className="font-medium">{user.name}</span></span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout} className="border-primary text-primary hover:bg-primary/10 h-8 px-2 sm:h-9 sm:px-3 text-xs">
                <LogOut className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4"/>Logout
              </Button>
              <div className="sm:hidden">
                <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MenuIcon className="h-5 w-5 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {CUSTOMER_TABS_CONFIG.map(tab => (
                       <DropdownMenuItem key={tab.value} onClick={() => { handleTabChange(tab.value); setIsMobileMenuOpen(false); }} className={`flex items-center text-xs ${activeTab === tab.value ? "bg-slate-100 text-primary" : ""}`}>
                         {React.cloneElement(tab.icon, {className: "mr-1.5 h-3.5 w-3.5"})} {tab.label}
                       </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {setIsMobileMenuOpen(false);}} className="flex items-center text-xs">
                       <NotificationBell /> <span className="ml-1.5">Notifications</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => {showNotImplementedToast("Settings"); setIsMobileMenuOpen(false);}} className="flex items-center text-xs">
                      <Settings className="mr-1.5 h-3.5 w-3.5"/> Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:hidden gap-1 p-1 bg-slate-200/70 rounded-lg">
            {CUSTOMER_TABS_CONFIG.slice(0,3).map(tab => ( // Show first 3 for very small screens
              <TabsTrigger key={tab.value} value={tab.value} className="text-[10px] py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm flex items-center justify-center">
                {React.cloneElement(tab.icon, {className: "mr-1 h-3.5 w-3.5"})} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="hidden sm:grid w-full grid-cols-3 md:grid-cols-5 gap-1 sm:gap-2 p-1 bg-slate-200/70 rounded-lg">
            {CUSTOMER_TABS_CONFIG.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md flex items-center justify-center">
                 {React.cloneElement(tab.icon, {className: "mr-1 h-4 w-4"})} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y:10 }} 
            animate={{ opacity:1, y:0 }} 
            transition={{duration: 0.3}}
            className="mt-0 sm:mt-4" 
          >
            <Suspense fallback={<div>Loading...</div>}><TabsContent value="book-service" className="space-y-4 mt-0">
              <CustomerBookingForm services={services} onBookService={handleBookService} user={user} />
            </TabsContent></Suspense>

            <Suspense fallback={<div>Loading...</div>}><TabsContent value="my-bookings" className="space-y-4 mt-0">
              {userBookings.length === 0 ? (
                <Card className="shadow-sm border-slate-200 rounded-xl"><CardContent className="text-center py-12 sm:py-16"><FileText className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-slate-400" /><h3 className="mt-4 text-lg sm:text-xl font-poppins text-slate-700">No Bookings Found</h3><p className="mt-1 text-xs sm:text-base text-slate-500">Ready to start? Click 'Book New Service' to begin.</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {userBookings.map(booking => (
                  <CustomerBookingItem
                    key={booking.id}
                    booking={booking}
                    tasks={tasks}
                    onOpenReUploadDialog={handleOpenReUploadDialog}
                    onOpenComplaintDialog={handleOpenComplaintDialog}
                    getCustomerFacingStatus={getCustomerFacingStatus}
                    getLatestRemark={getLatestRemark}
                    id={`booking-${booking.id}`}
                  />
                ))}
                </div>
              )}
            </TabsContent></Suspense>
            
            <Suspense fallback={<div>Loading...</div>}><TabsContent value="my-complaints" className="space-y-4 mt-0">
              {userComplaintsAndFeedbacks.length === 0 ? (
                <Card className="shadow-sm border-slate-200 rounded-xl"><CardContent className="text-center py-12 sm:py-16"><MessageSquare className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-slate-400" /><h3 className="mt-4 text-lg sm:text-xl font-poppins text-slate-700">No Issues Logged</h3><p className="mt-1 text-xs sm:text-base text-slate-500">You haven't raised any complaints or provided feedback yet.</p></CardContent></Card>
              ) : (
                <div className="space-y-3">
                {userComplaintsAndFeedbacks.map(item => (
                  <CustomerComplaintItem key={item.id} complaint={item} id={`complaint-${item.id}`} />
                ))}
                </div>
              )}
            </TabsContent></Suspense>
            <Suspense fallback={<div>Loading...</div>}><TabsContent value="my-wallet" className="mt-0">
                <CustomerWallet user={user} />
            </TabsContent></Suspense>
            <Suspense fallback={<div>Loading...</div>}><TabsContent value="my-profile" className="mt-0">
                <CustomerProfile user={user} />
            </TabsContent></Suspense>
          </motion.div>
        </Tabs>

        <CustomerReUploadDialog
            isOpen={isReUploadDialogOpen}
            onOpenChange={setIsReUploadDialogOpen}
            item={currentReUploadItem}
            onSubmit={handleSubmitReUpload}
        />
        
        <CustomerComplaintDialog
            isOpen={isComplaintDialogOpen}
            onOpenChange={setIsComplaintDialogOpen}
            booking={currentComplaintBooking}
            onSubmit={handleSubmitComplaint}
            type={complaintType}
        />
      </main>
      <footer className="text-center py-4 sm:py-6 border-t border-slate-200">
          <p className="text-[10px] sm:text-xs text-slate-500">&copy; {new Date().getFullYear()} eGoa Sarathi. Government of Goa. All rights reserved.</p>
      </footer>
    </div>
  );
}