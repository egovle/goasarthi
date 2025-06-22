
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { User, UserPlus, Trash2, EyeOff, Eye, CheckCircle2, XCircle as XCircleIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useData } from '@/hooks/useData';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const VLECard = ({ vle, leads, tasks, onRemoveVLE, onToggleAvailability }) => {
  const vleLeadsGenerated = leads.filter(l => l.vle_id === vle.id);
  const vleTasksAssigned = tasks.filter(t => t.vle_id === vle.id);
  const completedTasks = vleTasksAssigned.filter(t => t.status === 'commission_approved');

  const getAvailabilityStyle = (isAvailable) => {
    return isAvailable ? 'text-emerald-600' : 'text-red-600';
  };
  const getAvailabilityIcon = (isAvailable) => {
    return isAvailable ? <CheckCircle2 className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />;
  };

  return (
    <Card className="card-hover animate-fade-in shadow-lg border-slate-200 rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-md sm:text-lg text-slate-800">
              <User className="h-5 w-5 text-primary" />{vle.name}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-500">ID: {vle.user_id_custom} | {vle.center}</CardDescription>
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium p-1.5 rounded-md ${getAvailabilityStyle(vle.is_available)} bg-opacity-10 ${vle.is_available ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {getAvailabilityIcon(vle.is_available)}
            {vle.is_available ? 'Available' : 'Unavailable'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
          {[
            { label: "Leads Gen.", value: vleLeadsGenerated.length, color: "text-blue-600" },
            { label: "Tasks Assigned", value: vleTasksAssigned.length, color: "text-purple-600" },
            { label: "Tasks Done", value: completedTasks.length, color: "text-green-600" },
            { label: "Success Rate", value: `${vleTasksAssigned.length > 0 ? Math.round((completedTasks.length / vleTasksAssigned.length) * 100) : 0}%`, color: "text-orange-600" }
          ].map(stat => (
            <div key={stat.label} className="text-center p-2 bg-slate-50 rounded-md">
              <p className={`text-lg sm:text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
         <Button variant="outline" size="sm" className="text-xs border-slate-300 hover:bg-slate-100" onClick={() => onToggleAvailability(vle.id, !vle.is_available)}>
          {vle.is_available ? <EyeOff className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
          Mark {vle.is_available ? 'Unavailable' : 'Available'}
        </Button>
        <Button variant="destructive" size="sm" className="text-xs" onClick={() => onRemoveVLE(vle.id)}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />Remove VLE
        </Button>
      </CardFooter>
    </Card>
  );
};


export function AdminVLEManagement() {
  const { leads, tasks, getVLEs, updateUserDetails, refetchAllUsers } = useData();
  const { toast } = useToast();

  const [vles, setVles] = useState([]);
  const [isAddVLEDialogOpen, setIsAddVLEDialogOpen] = useState(false);
  const [newVLEData, setNewVLEData] = useState({
    name: '', email: '', password: '', center: '', phone: ''
  });

  useEffect(() => {
    setVles(getVLEs());
  }, [getVLEs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVLEData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddVLE = async () => {
    if (!newVLEData.name || !newVLEData.email || !newVLEData.password || !newVLEData.center) {
      toast({ title: "Missing Fields", description: "Please fill all required VLE details.", variant: "destructive" });
      return;
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: newVLEData.email,
      password: newVLEData.password,
      phone: newVLEData.phone,
      options: {
        data: {
          name: newVLEData.name,
          role: 'vle',
          user_id_custom: `VLE${Date.now().toString().slice(-4)}`,
          center: newVLEData.center,
          is_available: true,
          wallet_balance: 1000,
        }
      }
    });

    if (error) {
      toast({ title: "Failed to Add VLE", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "VLE Added Successfully", description: `${newVLEData.name} has been added. They may need to confirm their email.` });
      await refetchAllUsers();
      setIsAddVLEDialogOpen(false);
      setNewVLEData({ name: '', email: '', password: '', center: '', phone: '' });
    }
  };
  
  const handleRemoveVLE = async (vleId) => {
    const vleTasks = tasks.filter(t => t.vle_id === vleId && !['completed', 'commission_approved', 'commission_rejected', 'rejected'].includes(t.status));
    if(vleTasks.length > 0){
        toast({ title: "Cannot Remove VLE", description: "This VLE has active tasks assigned. Please reassign them first.", variant: "destructive", duration: 5000 });
        return;
    }
    
    toast({ title: "Action Not Implemented", description: "VLE user deletion from the client is disabled for security. Please remove users from the Supabase dashboard.", variant: "destructive" });
  };

  const handleToggleAvailability = async (vleId, newAvailability) => {
    const success = await updateUserDetails(vleId, { is_available: newAvailability });
    if(success){
        toast({ title: "VLE Availability Updated", description: `VLE is now ${newAvailability ? 'Available' : 'Unavailable'}.` });
        await refetchAllUsers();
    } else {
        toast({ title: "Update Failed", description: "Could not update VLE availability.", variant: "destructive" });
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-800">VLE Management</h2>
        <Dialog open={isAddVLEDialogOpen} onOpenChange={setIsAddVLEDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <UserPlus className="mr-2 h-4 w-4" /> Add New VLE
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Add New VLE</DialogTitle>
              <DialogDescription>Enter the details for the new VLE.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label htmlFor="vle-name">Name</Label><Input id="vle-name" name="name" value={newVLEData.name} onChange={handleInputChange} placeholder="Full Name" /></div>
              <div><Label htmlFor="vle-email">Email</Label><Input id="vle-email" name="email" type="email" value={newVLEData.email} onChange={handleInputChange} placeholder="Email Address" /></div>
              <div><Label htmlFor="vle-password">Password</Label><Input id="vle-password" name="password" type="password" value={newVLEData.password} onChange={handleInputChange} placeholder="Set Password" /></div>
              <div><Label htmlFor="vle-center">Center Name</Label><Input id="vle-center" name="center" value={newVLEData.center} onChange={handleInputChange} placeholder="e.g., Panaji Center" /></div>
              <div><Label htmlFor="vle-phone">Phone (Optional)</Label><Input id="vle-phone" name="phone" type="tel" value={newVLEData.phone} onChange={handleInputChange} placeholder="Mobile Number" /></div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddVLE} className="bg-primary hover:bg-primary/90 text-primary-foreground">Add VLE</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {vles.map(vle => (
          <VLECard key={vle.id} vle={vle} leads={leads} tasks={tasks} onRemoveVLE={handleRemoveVLE} onToggleAvailability={handleToggleAvailability} />
        ))}
         {vles.length === 0 && <p className="col-span-full text-center text-slate-500 py-10">No VLEs found. Add VLEs to manage them here.</p>}
      </div>
    </div>
  );
}
