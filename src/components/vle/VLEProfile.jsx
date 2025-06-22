
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { User, Edit3, Save, Banknote, PlusCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

export function VLEProfile({ user }) {
  const { updateUserDetails, addBankAccount, removeBankAccount, getUserById } = useData();
  const { toast } = useToast();

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    center: user.center || '',
    phone: user.phone || '',
    email: user.email || '',
    isAvailable: user.is_available !== undefined ? user.is_available : true,
  });
  const [bankAccounts, setBankAccounts] = useState(user.bank_accounts || []);
  const [newBankAccount, setNewBankAccount] = useState({
    bankName: '', accountNumber: '', ifsc: '', accountHolderName: ''
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  useEffect(() => {
    const fetchLatestData = async () => {
      if (user?.id) {
        const latestUserData = await getUserById(user.id);
        if (latestUserData) {
          setProfileData({
            name: latestUserData.name || '',
            center: latestUserData.center || '',
            phone: latestUserData.phone || '',
            email: latestUserData.email || '',
            isAvailable: latestUserData.is_available !== undefined ? latestUserData.is_available : true,
          });
          setBankAccounts(latestUserData.bank_accounts || []);
        }
      }
    };
    fetchLatestData();
  }, [user, getUserById]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankInputChange = (e) => {
    const { name, value } = e.target;
    setNewBankAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleEditDetails = () => setIsEditingDetails(!isEditingDetails);

  const handleSaveDetails = async () => {
    const success = await updateUserDetails(user.id, { 
      name: profileData.name, 
      center: profileData.center,
      phone: profileData.phone,
    });
    if (success) {
      toast({ title: "Profile Updated", description: "Your personal details have been saved." });
      setIsEditingDetails(false);
    } else {
      toast({ title: "Update Failed", description: "Could not save your details.", variant: "destructive" });
    }
  };
  
  const handleToggleAvailability = async (checked) => {
    setProfileData(prev => ({ ...prev, isAvailable: checked }));
    const success = await updateUserDetails(user.id, { is_available: checked });
    if (success) {
      toast({ title: "Availability Updated", description: `You are now ${checked ? 'Available' : 'Unavailable'} for new tasks.` });
    } else {
      toast({ title: "Update Failed", description: "Could not update availability status.", variant: "destructive" });
      setProfileData(prev => ({ ...prev, isAvailable: !checked })); 
    }
  };

  const handleAddBankAccount = async () => {
    if (!newBankAccount.bankName || !newBankAccount.accountNumber || !newBankAccount.ifsc || !newBankAccount.accountHolderName) {
      toast({ title: "Missing Fields", description: "Please fill all bank account details.", variant: "destructive" });
      return;
    }
    const success = await addBankAccount(user.id, newBankAccount);
    if (success) {
      toast({ title: "Bank Account Added", description: "New bank account saved successfully." });
      setNewBankAccount({ bankName: '', accountNumber: '', ifsc: '', accountHolderName: '' });
      setIsAddingAccount(false);
    } else {
      toast({ title: "Failed to Add Account", description: "Could not save bank account.", variant: "destructive" });
    }
  };

  const handleRemoveBankAccount = async (accountNumber) => {
    const success = await removeBankAccount(user.id, accountNumber);
    if (success) {
      toast({ title: "Bank Account Removed", description: "Bank account has been removed." });
    } else {
      toast({ title: "Failed to Remove Account", description: "Could not remove bank account.", variant: "destructive" });
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
      <Card className="lg:col-span-2 shadow-xl border-sky-200 rounded-xl">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-poppins text-sky-800 flex items-center">
              <User className="mr-3 h-6 w-6 text-sky-600" /> Personal Information
            </CardTitle>
            <Button onClick={isEditingDetails ? handleSaveDetails : handleToggleEditDetails} size="sm" variant={isEditingDetails ? "default" : "outline"} className={isEditingDetails ? "bg-sky-600 hover:bg-sky-700 text-white" : "border-sky-500 text-sky-600 hover:bg-sky-50"}>
              {isEditingDetails ? <Save className="mr-2 h-4 w-4" /> : <Edit3 className="mr-2 h-4 w-4" />}
              {isEditingDetails ? 'Save Details' : 'Edit Details'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-slate-600">Full Name</Label>
              <Input id="name" name="name" value={profileData.name} onChange={handleInputChange} readOnly={!isEditingDetails} className="mt-1 read-only:bg-slate-100 read-only:text-slate-500" />
            </div>
            <div>
              <Label htmlFor="center" className="text-slate-600">Center Name</Label>
              <Input id="center" name="center" value={profileData.center} onChange={handleInputChange} readOnly={!isEditingDetails} className="mt-1 read-only:bg-slate-100 read-only:text-slate-500" />
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-600">Email Address</Label>
              <Input id="email" name="email" type="email" value={profileData.email} readOnly className="mt-1 bg-slate-100 text-slate-500" />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <Label htmlFor="phone" className="text-slate-600">Phone Number</Label>
              <Input id="phone" name="phone" value={profileData.phone} onChange={handleInputChange} readOnly={!isEditingDetails} className="mt-1 read-only:bg-slate-100 read-only:text-slate-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 sm:space-y-8">
        <Card className="shadow-xl border-emerald-200 rounded-xl">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200">
                <CardTitle className="text-xl font-poppins text-emerald-800 flex items-center">
                {profileData.isAvailable ? <Eye className="mr-3 h-6 w-6 text-emerald-600" /> : <EyeOff className="mr-3 h-6 w-6 text-red-600" />}
                Availability Status
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex flex-col">
                <Label htmlFor="availability-switch" className={`text-md font-medium ${profileData.isAvailable ? 'text-emerald-700' : 'text-red-700'}`}>
                    {profileData.isAvailable ? 'Available for New Tasks' : 'Unavailable for New Tasks'}
                </Label>
                <p className="text-xs text-slate-500">Toggle to change your availability.</p>
                </div>
                <Switch
                    id="availability-switch"
                    checked={profileData.isAvailable}
                    onCheckedChange={handleToggleAvailability}
                    className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                />
            </CardContent>
        </Card>

        <Card className="shadow-xl border-purple-200 rounded-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-poppins text-purple-800 flex items-center">
                <Banknote className="mr-3 h-6 w-6 text-purple-600" /> Bank Accounts
              </CardTitle>
              <Button onClick={() => setIsAddingAccount(!isAddingAccount)} size="sm" variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                <PlusCircle className="mr-2 h-4 w-4" /> {isAddingAccount ? 'Cancel' : 'Add Account'}
              </Button>
            </div>
            <CardDescription className="font-inter text-purple-700">Manage your bank accounts for payouts.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isAddingAccount && (
              <div className="space-y-4 mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50/30">
                <h4 className="font-medium text-purple-700">Add New Bank Account</h4>
                <div><Label htmlFor="accountHolderName">Account Holder Name</Label><Input id="accountHolderName" name="accountHolderName" value={newBankAccount.accountHolderName} onChange={handleBankInputChange} placeholder="e.g., John Doe" /></div>
                <div><Label htmlFor="bankName">Bank Name</Label><Input id="bankName" name="bankName" value={newBankAccount.bankName} onChange={handleBankInputChange} placeholder="e.g., State Bank of India" /></div>
                <div><Label htmlFor="accountNumber">Account Number</Label><Input id="accountNumber" name="accountNumber" value={newBankAccount.accountNumber} onChange={handleBankInputChange} placeholder="e.g., 12345678901" /></div>
                <div><Label htmlFor="ifsc">IFSC Code</Label><Input id="ifsc" name="ifsc" value={newBankAccount.ifsc} onChange={handleBankInputChange} placeholder="e.g., SBIN0001234" /></div>
                <Button onClick={handleAddBankAccount} className="w-full bg-purple-600 hover:bg-purple-700 text-white">Save Account</Button>
              </div>
            )}
            {bankAccounts.length === 0 && !isAddingAccount ? (
              <p className="text-center text-slate-500">No bank accounts added yet.</p>
            ) : (
              <ul className="space-y-3">
                {bankAccounts.map((acc, index) => (
                  <li key={index} className="flex justify-between items-center p-3 border border-slate-200 rounded-md bg-slate-50/50">
                    <div>
                      <p className="font-medium text-slate-700">{acc.accountHolderName} - {acc.bankName}</p>
                      <p className="text-sm text-slate-500">A/C: ...{acc.accountNumber.slice(-4)} | IFSC: {acc.ifsc}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveBankAccount(acc.accountNumber)} className="text-red-500 hover:text-red-700 hover:bg-red-100">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
