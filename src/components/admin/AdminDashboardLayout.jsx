
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Settings, Users, FileText, UserCheck, AlertTriangle, BarChart3, Trash2, Sparkles as SparklesIcon, Menu, DollarSign, BarChart2 as CommissionIcon, ListChecks } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu.jsx";
import { NotificationBell } from '@/components/NotificationBell';
import { Badge } from '@/components/ui/badge';


const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-4 rounded-xl shadow-lg flex items-center space-x-3 bg-white border-l-4 ${color}`}>
    <div className={`p-2.5 rounded-full bg-opacity-20 ${color.replace('border-', 'bg-')}`}>
      {React.cloneElement(icon, { className: `h-6 w-6 ${color.replace('border-', 'text-')}` })}
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export function AdminDashboardLayout({ user, onLogout, stats, activeTab, setActiveTab, handleClearData, children }) {
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const showNotImplementedToast = (feature = "This feature") => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `${feature} isn't implemented yet—but we're working on it! 🚀`,
      variant: "default",
    });
  };

  const TABS_CONFIG = [
    { value: "assign-tasks", label: "Assign Tasks", icon: <FileText className="mr-2 h-4 w-4" />, badgeCount: stats.pendingAssignments },
    { value: "all-bookings", label: "All Bookings", icon: <FileText className="mr-2 h-4 w-4" /> },
    { value: "all-leads", label: "All Leads", icon: <Users className="mr-2 h-4 w-4" /> },
    { value: "vle-management", label: "VLEs", icon: <UserCheck className="mr-2 h-4 w-4" /> },
    { value: "customer-management", label: "Customers", icon: <Users className="mr-2 h-4 w-4" /> },
    { value: "service-management", label: "Services", icon: <ListChecks className="mr-2 h-4 w-4" /> },
    { value: "issues-management", label: "Issues", icon: <AlertTriangle className="mr-2 h-4 w-4" />, badgeCount: stats.openIssues },
    { value: "vle-special-requests", label: "VLE Requests", icon: <SparklesIcon className="mr-2 h-4 w-4" />, badgeCount: stats.pendingSpecialRequests },
    { value: "accounting", label: "Wallet Mgmt", icon: <DollarSign className="mr-2 h-4 w-4" /> },
    { value: "commissions", label: "Commissions", icon: <CommissionIcon className="mr-2 h-4 w-4" />, badgeCount: stats.pendingCommissions },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 font-inter">
      <header className="bg-white/90 backdrop-blur-md shadow-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-sky-600" />
              <h1 className="ml-2 sm:ml-3 text-2xl sm:text-3xl font-poppins font-bold text-slate-800">eGoa Sarathi</h1>
              <span className="ml-3 sm:ml-4 text-xs sm:text-sm text-slate-500 font-medium hidden md:inline-block">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="hidden sm:flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200">
                    <Trash2 className="h-4 w-4" /> Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all bookings, leads, tasks, and complaints data from the system. Wallet balances will also be reset.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Yes, delete all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="hidden sm:inline-flex">
                <NotificationBell />
              </div>
              <Button variant="ghost" size="icon" onClick={() => showNotImplementedToast("Settings")} aria-label="Settings" className="hidden sm:inline-flex">
                <Settings className="h-5 w-5 text-slate-600 hover:text-sky-600 transition-colors"/>
              </Button>
              <div className="text-right hidden md:block">
                <span className="text-sm text-slate-700 font-medium">Admin: {user.name}</span>
                <p className="text-xs text-slate-500">ID: {user.user_id_custom}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout} className="border-sky-600 text-sky-600 hover:bg-sky-600/10">
                <LogOut className="mr-1 sm:mr-2 h-4 w-4"/>Logout
              </Button>
              <div className="lg:hidden">
                <DropdownMenu open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6 text-slate-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    {TABS_CONFIG.map(tab => (
                      <DropdownMenuItem key={tab.value} onClick={() => { setActiveTab(tab.value); setIsMobileMenuOpen(false); }} className={`flex items-center justify-between ${activeTab === tab.value ? "bg-sky-100 text-sky-700" : ""}`}>
                        <div className="flex items-center">{tab.icon} {tab.label}</div>
                        {tab.badgeCount > 0 && <Badge variant="destructive" className="h-5 px-1.5">{tab.badgeCount}</Badge>}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={() => {setIsMobileMenuOpen(false);}} className="flex items-center">
                        <NotificationBell /> <span className="ml-2">Notifications</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {showNotImplementedToast("Settings"); setIsMobileMenuOpen(false);}} className="flex items-center">
                        <Settings className="mr-2 h-4 w-4"/> Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { 
                        setIsMobileMenuOpen(false);
                        setTimeout(() => {
                           const triggerButton = document.getElementById('mobile-clear-data-trigger');
                           if (triggerButton) triggerButton.click();
                        }, 100);
                       }} className="text-red-600 focus:bg-red-50 focus:text-red-700 flex items-center">
                        <Trash2 className="mr-2 h-4 w-4"/> Clear All Data
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button id="mobile-clear-data-trigger" className="hidden">Hidden Trigger</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete all bookings, leads, tasks, and complaints data from the system. Wallet balances will also be reset.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                          Yes, delete all data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard title="Pending Assignments" value={stats.pendingAssignments} icon={<FileText />} color="border-yellow-500" />
          <StatCard title="Total Bookings" value={stats.totalBookings} icon={<FileText />} color="border-blue-500" />
          <StatCard title="Total Leads" value={stats.totalLeads} icon={<Users />} color="border-purple-500" />
          <StatCard title="Active Tasks" value={stats.totalTasks} icon={<UserCheck />} color="border-teal-500" />
          <StatCard title="Open Issues" value={stats.openIssues} icon={<AlertTriangle />} color="border-red-500" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto pb-2 lg:pb-0 admin-tabs-container">
            <TabsList className="hidden lg:inline-flex min-w-max h-auto p-1 bg-sky-100/80 rounded-lg space-x-1">
              {TABS_CONFIG.map(tab => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-md text-xs sm:text-sm py-2 px-3 sm:py-2.5 sm:px-4 flex items-center justify-center whitespace-nowrap"
                >
                  {tab.icon} <span className="ml-1.5">{tab.label}</span>
                  {tab.badgeCount > 0 && <Badge variant="destructive" className="ml-2 h-5 px-2 animate-pulse">{tab.badgeCount}</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="mt-4 sm:mt-6">
            {children}
          </div>
        </Tabs>
      </main>
      <footer className="text-center py-6 sm:py-8 border-t border-slate-200">
          <p className="text-xs sm:text-sm text-slate-500">&copy; {new Date().getFullYear()} eGoa Sarathi. Admin Control Panel.</p>
      </footer>
    </div>
  );
}
