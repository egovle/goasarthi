import { lazy, Suspense } from 'react';

import React, { useState, useEffect } from 'react';
import { VLELeadGeneration } from '@/components/vle/VLELeadGeneration.jsx';
import { VLEMyLeads } from '@/components/vle/VLEMyLeads.jsx';
import { VLEAssignedTasks } from '@/components/vle/VLEAssignedTasks.jsx';
import { VLESpecialServices } from '@/components/vle/VLESpecialServices.jsx';
import { VLEWallet } from '@/components/vle/VLEWallet.jsx';
import { VLEProfile } from '@/components/vle/VLEProfile.jsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilePlus, Users, Sparkles, Wallet, BarChart2, Zap, Award, LogOut, Settings, Menu as MenuIcon, Briefcase, CheckSquare, AlertCircle, DollarSign as EarningsIcon, UserCircle as ProfileIcon, CheckCircle2, XCircle as XCircleIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/hooks/useData';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu.jsx";
import { NotificationBell } from '@/components/NotificationBell';

const StatCardVLE = ({ title, value, icon, color, bgColor, subtext, isAvailable }) => (
  <motion.div 
    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg flex items-center space-x-2 sm:space-x-3 border-l-4 ${color} ${bgColor}`}
    whileHover={{ y: -3, scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className={`p-2 sm:p-2.5 rounded-full bg-opacity-20 ${color.replace('border-', 'bg-')}`}>
      {React.cloneElement(icon, { className: `h-5 w-5 sm:h-6 sm:w-6 ${color.replace('border-', 'text-')}` })}
    </div>
    <div>
      <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{title}</p>
      <p className="text-lg sm:text-2xl font-bold text-slate-800">{value}</p>
      {subtext && (
        <div className={`flex items-center text-[10px] sm:text-xs mt-0.5 ${isAvailable ? 'text-emerald-600' : 'text-red-600'}`}>
          {isAvailable ? <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1"/> : <XCircleIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1"/>}
          {subtext}
        </div>
      )}
    </div>
  </motion.div>
);


const VLEComingSoonPlaceholder = ({ title, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="shadow-lg border-dashed border-slate-300 rounded-xl h-full flex flex-col items-center justify-center text-center p-6 sm:p-10 bg-slate-50/50">
      <CardHeader className="p-3 sm:p-4">
        <div className="mx-auto bg-slate-200 p-3 sm:p-4 rounded-full mb-4 sm:mb-6 ring-1 ring-slate-300">
          <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-slate-500" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-poppins text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <p className="text-slate-600 font-inter text-sm sm:text-lg">
          Exciting new feature coming soon!
        </p>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-2">
          We're building something great for you. Keep an eye out! 🚀
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

const VLE_TABS_CONFIG = [
  { value: "assigned-tasks", label: "Assigned Tasks", icon: <Briefcase className="mr-1.5 h-4 w-4" /> },
  { value: "generate-leads", label: "Generate Leads", icon: <FilePlus className="mr-1.5 h-4 w-4" /> },
  { value: "my-leads", label: "My Generated Leads", icon: <Users className="mr-1.5 h-4 w-4" /> },
  { value: "vle-wallet", label: "My Wallet", icon: <Wallet className="mr-1.5 h-4 w-4" /> },
  { value: "special-services", label: "Special Services", icon: <Sparkles className="mr-1.5 h-4 w-4" /> },
  { value: "commission-chart", label: "Commission Chart", icon: <BarChart2 className="mr-1.5 h-4 w-4" />, comingSoon: true },
  { value: "my-profile", label: "My Profile", icon: <ProfileIcon className="mr-1.5 h-4 w-4" /> },
];


export function VLEDashboard({ user, onLogout }) {
  const { toast } = useToast();
  const { tasks, leads, getWalletDetails, addNotification, getUserById } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "assigned-tasks");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [vleStats, setVleStats] = useState({
    assignedTasks: 0,
    completedTasks: 0,
    pendingLeads: 0,
    walletBalance: "0.00",
    isAvailable: true,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        const data = await getUserById(user.id);
        setCurrentUserData(data);
      }
    };
    fetchUserData();
  }, [user?.id, getUserById]);


  useEffect(() => {
    const updateStats = async () => {
      if (currentUserData && user) {
        const userTasks = tasks.filter(t => t.vle_id === user.id);
        const userLeads = leads.filter(l => l.vle_id === user.id);
        const wallet = await getWalletDetails(user.id);

        setVleStats({
          assignedTasks: userTasks.filter(t => !['completed', 'rejected', 'pending_commission_approval', 'commission_approved', 'commission_rejected'].includes(t.status)).length,
          completedTasks: userTasks.filter(t => t.status === 'commission_approved').length,
          pendingLeads: userLeads.filter(l => ['pending', 'pending_assignment'].includes(l.status)).length,
          walletBalance: wallet && typeof wallet.balance === 'number' ? wallet.balance.toFixed(2) : "0.00",
          isAvailable: currentUserData.is_available !== undefined ? currentUserData.is_available : true,
        });
      }
    };

    if (user?.id) {
      updateStats();
    }
  }, [tasks, leads, user, getWalletDetails, currentUserData]);


  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const taskIdFromUrl = searchParams.get('taskId');
    const leadIdFromUrl = searchParams.get('leadId');

    if (tabFromUrl && VLE_TABS_CONFIG.find(t => t.value === tabFromUrl && !t.comingSoon)) {
      setActiveTab(tabFromUrl);
    }
    
    if (tabFromUrl === 'assigned-tasks' && taskIdFromUrl) {
      const element = document.getElementById(`task-${taskIdFromUrl}`);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
    } else if (tabFromUrl === 'my-leads' && leadIdFromUrl) {
      const element = document.getElementById(`lead-${leadIdFromUrl}`);
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

  const showNotImplementedToast = (feature = "This feature") => {
    toast({
      title: "🚧 Feature Coming Soon!",
      description: `${feature} isn't implemented yet—but we're working on it! 🚀`,
      variant: "default",
    });
  };
  
  const handleLeadGenerated = (lead) => {
    if (!lead || !lead.service_name || !lead.customer_name || !lead.id) {
      console.error("handleLeadGenerated called with invalid lead object:", lead);
      toast({
        title: "Notification Error",
        description: "Could not properly notify about the new lead due to missing lead details.",
        variant: "destructive"
      });
      handleTabChange("my-leads"); 
      return;
    }
    handleTabChange("my-leads");
    addNotification(user.id, `You generated a new lead for ${lead.service_name} (Customer: ${lead.customer_name}).`, 'success', `/vle-dashboard?tab=my-leads&leadId=${lead.id}`, 'Lead Generated');
    addNotification('admin', `VLE ${user.name} generated a new lead for ${lead.service_name} (Customer: ${lead.customer_name}).`, 'info', `/admin-dashboard?tab=all-leads&leadId=${lead.id}`, 'New Lead by VLE');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 font-inter text-slate-800">
      <header className="bg-white/90 backdrop-blur-md shadow-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <Zap className="h-7 w-7 sm:h-8 text-primary animate-pulse" />
              <h1 className="ml-1.5 sm:ml-2 text-xl sm:text-2xl font-poppins font-bold text-slate-800">eGoa Sarathi</h1>
              <span className="ml-2 sm:ml-3 text-[10px] sm:text-xs text-primary/80 font-medium hidden md:inline-block border-l border-primary/30 pl-2 sm:pl-3">VLE Portal</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-1 sm:space-x-2"
            >
              <div className="hidden sm:inline-flex">
                <NotificationBell />
              </div>
              <Button variant="ghost" size="icon" onClick={() => showNotImplementedToast("Settings")} aria-label="Settings" className="hidden sm:inline-flex text-slate-600 hover:text-primary hover:bg-primary/10 h-8 w-8 sm:h-9 sm:w-9">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5"/>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleTabChange("my-profile")} aria-label="Profile" className="hidden sm:inline-flex text-slate-600 hover:text-primary hover:bg-primary/10 h-8 w-8 sm:h-9 sm:w-9">
                <ProfileIcon className="h-4 w-4 sm:h-5 sm:w-5"/>
              </Button>
              <div className="text-right hidden md:block">
                <span className="text-xs sm:text-sm text-slate-700 font-medium">Welcome, {user.name}</span>
                <p className="text-[10px] sm:text-xs text-slate-500">ID: {user.user_id_custom} | {user.center}</p>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout} className="border-primary text-primary hover:bg-primary hover:text-primary-foreground h-8 px-2 sm:h-9 sm:px-3 text-xs">
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
                    {VLE_TABS_CONFIG.map(tab => (
                       <DropdownMenuItem 
                         key={tab.value} 
                         onClick={() => { 
                           if (tab.comingSoon) {
                             showNotImplementedToast(tab.label);
                           } else {
                             handleTabChange(tab.value);
                           }
                           setIsMobileMenuOpen(false); 
                         }} 
                         className={`flex items-center text-xs ${activeTab === tab.value && !tab.comingSoon ? "bg-slate-100 text-primary" : ""}`}
                       >
                         {React.cloneElement(tab.icon, { className: "mr-1.5 h-3.5 w-3.5"})} {tab.label}
                         {tab.comingSoon && <Award className="ml-auto h-3 w-3 text-yellow-500" />}
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
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <StatCardVLE title="Active Tasks" value={vleStats.assignedTasks} icon={<Briefcase />} color="border-sky-500" bgColor="bg-white" />
          <StatCardVLE title="Tasks Done" value={vleStats.completedTasks} icon={<CheckSquare />} color="border-emerald-500" bgColor="bg-white" />
          <StatCardVLE title="Wallet" value={`₹${vleStats.walletBalance}`} icon={<EarningsIcon />} color="border-purple-500" bgColor="bg-white" />
          <StatCardVLE title="Availability" value={vleStats.isAvailable ? "Available" : "Unavailable"} icon={vleStats.isAvailable ? <CheckCircle2 /> : <XCircleIcon />} color={vleStats.isAvailable ? "border-emerald-500" : "border-red-500"} bgColor="bg-white" subtext={vleStats.isAvailable ? "Accepting tasks" : "Not accepting"} isAvailable={vleStats.isAvailable} />
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="overflow-x-auto pb-1.5 vle-tabs-container">
            <TabsList className="inline-flex min-w-max h-auto p-1 bg-slate-200/80 rounded-lg space-x-0.5 sm:space-x-1 backdrop-blur-sm">
              {VLE_TABS_CONFIG.map(tab => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md text-slate-600 hover:bg-slate-300/50 hover:text-slate-700 text-[10px] sm:text-xs py-2 px-2.5 sm:py-2.5 sm:px-3 flex items-center justify-center whitespace-nowrap rounded-md transition-all duration-200 ease-in-out"
                  onClick={tab.comingSoon ? () => showNotImplementedToast(tab.label) : undefined}
                  disabled={tab.comingSoon && tab.value !== activeTab} 
                >
                  {React.cloneElement(tab.icon, { className: "mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4"})} 
                  {tab.label}
                  {tab.comingSoon && <Award className="ml-1.5 h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-0 sm:mt-4" 
            >
              <Suspense fallback={<div>Loading...</div>}><TabsContent value="generate-leads" className="mt-0">
                <VLELeadGeneration user={user} onLeadGenerated={handleLeadGenerated} />
              </TabsContent></Suspense>

              <Suspense fallback={<div>Loading...</div>}><TabsContent value="my-leads" className="mt-0">
                <VLEMyLeads user={user} />
              </TabsContent></Suspense>

              <Suspense fallback={<div>Loading...</div>}><TabsContent value="assigned-tasks" className="mt-0">
                <VLEAssignedTasks user={user} />
              </TabsContent></Suspense>

              <Suspense fallback={<div>Loading...</div>}><TabsContent value="special-services" className="mt-0">
                <VLESpecialServices user={user} />
              </TabsContent></Suspense>
              <Suspense fallback={<div>Loading...</div>}><TabsContent value="vle-wallet" className="mt-0">
                <VLEWallet user={user} />
              </TabsContent></Suspense>
              <Suspense fallback={<div>Loading...</div>}><TabsContent value="commission-chart" className="mt-0">
                <VLEComingSoonPlaceholder title="Commission Chart" icon={BarChart2} />
              </TabsContent></Suspense>
              <Suspense fallback={<div>Loading...</div>}><TabsContent value="my-profile" className="mt-0">
                <VLEProfile user={user} />
              </TabsContent></Suspense>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>
      <footer className="text-center py-4 sm:py-6 border-t border-slate-200">
          <p className="text-[10px] sm:text-xs text-slate-500">&copy; {new Date().getFullYear()} eGoa Sarathi. VLE Network Support.</p>
      </footer>
    </div>
  );
}
