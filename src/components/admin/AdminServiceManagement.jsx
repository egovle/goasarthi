
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { ListChecks, PlusCircle, Edit3, Trash2, AlertTriangle } from 'lucide-react';

export function AdminServiceManagement() {
  const { services, addService, updateService, removeService } = useData(); 
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  
  const [currentService, setCurrentService] = useState(null);
  const [serviceData, setServiceData] = useState({ id: '', name: '', category: '', fee: '' });

  const serviceCategories = ['Civil', 'Revenue', 'Social Welfare', 'Food & Supplies', 'Election', 'Income Tax', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({ ...prev, [name]: name === 'fee' ? (value ? parseFloat(value) : '') : value }));
  };

  const handleCategoryChange = (value) => {
    setServiceData(prev => ({ ...prev, category: value }));
  };

  const openAddDialog = () => {
    setServiceData({ id: '', name: '', category: '', fee: '' });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (service) => {
    setCurrentService(service);
    setServiceData({ id: service.id, name: service.name, category: service.category, fee: service.fee.toString() });
    setIsEditDialogOpen(true);
  };

  const openRemoveDialog = (service) => {
    setCurrentService(service);
    setIsRemoveDialogOpen(true);
  };

  const handleAddService = () => {
    if (!serviceData.name || !serviceData.category || serviceData.fee === '') {
      toast({ title: "Missing Fields", description: "Please fill all service details.", variant: "destructive" });
      return;
    }
    const result = addService(serviceData.name, serviceData.category, parseFloat(serviceData.fee));
    if (result.success) {
      toast({ title: "Service Added", description: `${serviceData.name} has been added.` });
      setIsAddDialogOpen(false);
    } else {
      toast({ title: "Failed to Add Service", description: result.error, variant: "destructive" });
    }
  };

  const handleUpdateService = () => {
    if (!serviceData.name || !serviceData.category || serviceData.fee === '') {
      toast({ title: "Missing Fields", description: "Please fill all service details.", variant: "destructive" });
      return;
    }
    const result = updateService(currentService.id, serviceData.name, serviceData.category, parseFloat(serviceData.fee));
    if (result.success) {
      toast({ title: "Service Updated", description: `${serviceData.name} has been updated.` });
      setIsEditDialogOpen(false);
      setCurrentService(null);
    } else {
      toast({ title: "Failed to Update Service", description: result.error, variant: "destructive" });
    }
  };

  const handleRemoveService = () => {
    const result = removeService(currentService.id);
    if (result.success) {
      toast({ title: "Service Removed", description: `${currentService.name} has been removed.` });
      setIsRemoveDialogOpen(false);
      setCurrentService(null);
    } else {
      toast({ title: "Failed to Remove Service", description: result.error, variant: "destructive" });
    }
  };

  return (
    <Card className="shadow-xl border-sky-200 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-poppins text-sky-800 flex items-center">
              <ListChecks className="mr-3 h-7 w-7 text-sky-600" /> Service Management
            </CardTitle>
            <CardDescription className="font-inter text-sky-700">
              Add, edit, or remove services offered on the platform.
            </CardDescription>
          </div>
          <Button onClick={openAddDialog} className="bg-sky-600 hover:bg-sky-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {services.length === 0 ? (
          <p className="p-10 text-center text-slate-500 font-inter text-lg">
            No services configured yet. Click "Add New Service" to begin.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {services.map(service => (
              <div key={service.id} className="p-4 md:p-6 hover:bg-sky-50/30 transition-colors duration-150">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                  <div className="mb-2 sm:mb-0">
                    <h4 className="font-semibold text-slate-800 text-md md:text-lg">{service.name}</h4>
                    <p className="text-xs text-slate-500">ID: {service.id} | Category: {service.category} | Fee: ₹{service.fee}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(service)} className="text-xs border-sky-500 text-sky-600 hover:bg-sky-50">
                      <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openRemoveDialog(service)} className="text-xs">
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Service Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-slate-800">Add New Service</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label htmlFor="add-service-name">Service Name</Label><Input id="add-service-name" name="name" value={serviceData.name} onChange={handleInputChange} placeholder="e.g., Driving License Application" /></div>
            <div>
              <Label htmlFor="add-service-category">Category</Label>
              <Select name="category" value={serviceData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="add-service-category"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>{serviceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="add-service-fee">Fee (₹)</Label><Input id="add-service-fee" name="fee" type="number" value={serviceData.fee} onChange={handleInputChange} placeholder="e.g., 150" /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAddService} className="bg-sky-600 hover:bg-sky-700 text-white">Add Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-slate-800">Edit Service: {currentService?.name}</DialogTitle></DialogHeader>
           <div className="space-y-4 py-4">
            <div><Label htmlFor="edit-service-name">Service Name</Label><Input id="edit-service-name" name="name" value={serviceData.name} onChange={handleInputChange} /></div>
            <div>
              <Label htmlFor="edit-service-category">Category</Label>
              <Select name="category" value={serviceData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="edit-service-category"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>{serviceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label htmlFor="edit-service-fee">Fee (₹)</Label><Input id="edit-service-fee" name="fee" type="number" value={serviceData.fee} onChange={handleInputChange} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleUpdateService} className="bg-sky-600 hover:bg-sky-700 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Service Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600"><AlertTriangle className="mr-2 h-6 w-6" />Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the service "<strong>{currentService?.name}</strong>"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleRemoveService}>Remove Service</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  );
}
