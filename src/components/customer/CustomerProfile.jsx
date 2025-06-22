
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { User, Edit3, Banknote, PlusCircle, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

export function CustomerProfile({ user }) {
  const { toast } = useToast();
  const { updateUserDetails, addBankAccount, removeBankAccount } = useData();
  const { refreshUser } = useAuth(); 

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
  });

  const [bankAccounts, setBankAccounts] = useState(user.bank_accounts || []);
  const [isAddBankDialogOpen, setIsAddBankDialogOpen] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    ifsc: '',
    accountHolderName: user.name || '',
  });

  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
    });
    setBankAccounts(user.bank_accounts || []);
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankInputChange = (e) => {
    const { name, value } = e.target;
    setNewBankAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDetails = async () => {
    if (!formData.name || !formData.phone || !formData.address) {
      toast({ title: "Missing Information", description: "Name, phone, and address are required.", variant: "destructive" });
      return;
    }
    const success = await updateUserDetails(user.id, { 
        name: formData.name, 
        phone: formData.phone, 
        address: formData.address 
    });
    if (success) {
      toast({ title: "Profile Updated", description: "Your personal details have been saved." });
      setIsEditingDetails(false);
    } else {
      toast({ title: "Update Failed", description: "Could not update profile details.", variant: "destructive" });
    }
  };

  const handleAddBankAccount = async () => {
    if (!newBankAccount.bankName || !newBankAccount.accountNumber || !newBankAccount.ifsc || !newBankAccount.accountHolderName) {
      toast({ title: "All Bank Fields Required", variant: "destructive" });
      return;
    }
    const success = await addBankAccount(user.id, newBankAccount);
    if (success) {
      toast({ title: "Bank Account Added", description: `${newBankAccount.bankName} account ending in ${newBankAccount.accountNumber.slice(-4)} added.` });
      setIsAddBankDialogOpen(false);
      setNewBankAccount({ bankName: '', accountNumber: '', ifsc: '', accountHolderName: user.name || '' });
    } else {
      toast({ title: "Failed to Add Bank Account", variant: "destructive" });
    }
  };

  const handleRemoveBankAccount = async (accountNumber) => {
    const success = await removeBankAccount(user.id, accountNumber);
    if (success) {
      toast({ title: "Bank Account Removed", description: `Account ending in ${accountNumber.slice(-4)} removed.` });
    } else {
      toast({ title: "Failed to Remove Bank Account", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="shadow-xl border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-poppins text-slate-800 flex items-center">
              <User className="mr-3 h-7 w-7 text-primary" /> Personal Details
            </CardTitle>
            {!isEditingDetails && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingDetails(true)} className="text-primary border-primary hover:bg-primary/10">
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
          </div>
          <CardDescription className="text-slate-500">View and update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {isEditingDetails ? (
            <>
              <div>
                <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 bg-slate-50 border-slate-300" />
              </div>
              <div>
                <Label htmlFor="email" className="text-slate-700">Email (Cannot be changed)</Label>
                <Input id="email" name="email" value={formData.email} disabled className="mt-1 bg-slate-200 border-slate-300 cursor-not-allowed" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 bg-slate-50 border-slate-300" />
              </div>
              <div>
                <Label htmlFor="address" className="text-slate-700">Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} className="mt-1 bg-slate-50 border-slate-300" />
              </div>
            </>
          ) : (
            <>
              <p><strong className="text-slate-600">Name:</strong> {user.name}</p>
              <p><strong className="text-slate-600">Email:</strong> {user.email}</p>
              <p><strong className="text-slate-600">Phone:</strong> {user.phone}</p>
              <p><strong className="text-slate-600">Address:</strong> {user.address}</p>
            </>
          )}
        </CardContent>
        {isEditingDetails && (
          <CardFooter className="border-t border-slate-200 pt-6 flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => { setIsEditingDetails(false); setFormData({ name: user.name, email: user.email, phone: user.phone, address: user.address }); }}>Cancel</Button>
            <Button onClick={handleSaveDetails} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card className="shadow-xl border-slate-200">
        <CardHeader className="border-b border-slate-200">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-poppins text-slate-800 flex items-center">
              <Banknote className="mr-3 h-7 w-7 text-primary" /> Bank Accounts
            </CardTitle>
            <Dialog open={isAddBankDialogOpen} onOpenChange={setIsAddBankDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Bank Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Bank Account</DialogTitle>
                  <DialogDescription>Enter your bank account details for withdrawals.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div><Label htmlFor="accountHolderName">Account Holder Name</Label><Input id="accountHolderName" name="accountHolderName" value={newBankAccount.accountHolderName} onChange={handleBankInputChange} /></div>
                  <div><Label htmlFor="bankName">Bank Name</Label><Input id="bankName" name="bankName" value={newBankAccount.bankName} onChange={handleBankInputChange} /></div>
                  <div><Label htmlFor="accountNumber">Account Number</Label><Input id="accountNumber" name="accountNumber" value={newBankAccount.accountNumber} onChange={handleBankInputChange} /></div>
                  <div><Label htmlFor="ifsc">IFSC Code</Label><Input id="ifsc" name="ifsc" value={newBankAccount.ifsc} onChange={handleBankInputChange} /></div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                  <Button onClick={handleAddBankAccount}>Add Account</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="text-slate-500">Manage your linked bank accounts for withdrawals.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {bankAccounts.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No bank accounts added yet.</p>
          ) : (
            <ul className="space-y-3">
              {bankAccounts.map((acc, index) => (
                <li key={index} className="p-3 border border-slate-200 rounded-md flex justify-between items-center bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-700">{acc.bankName} - <span className="text-slate-600">A/C: ****{acc.accountNumber.slice(-4)}</span></p>
                    <p className="text-xs text-slate-500">Holder: {acc.accountHolderName}, IFSC: {acc.ifsc}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveBankAccount(acc.accountNumber)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
