
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Wallet, Landmark, PlusCircle, MinusCircle, History, IndianRupee } from 'lucide-react';
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
import { Skeleton } from "@/components/ui/skeleton";

export function CustomerWallet({ user }) {
  const { toast } = useToast();
  const { addDemoMoney, withdrawDemoMoney, getWalletDetails } = useData();
  const { refreshUser } = useAuth();

  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [isAddMoneyDialogOpen, setIsAddMoneyDialogOpen] = useState(false);
  const [isWithdrawMoneyDialogOpen, setIsWithdrawMoneyDialogOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoadingWallet(true);
      const details = await getWalletDetails(user.id);
      if (details) {
        setWalletData({
          balance: details.balance ?? 0,
          transactions: details.transactions || [],
        });
      }
      setLoadingWallet(false);
    };
    if (user?.id) {
      fetchDetails();
    }
  }, [user.id, getWalletDetails, user.wallet_balance]);

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    const result = await addDemoMoney(user.id, amount);
    if (result.success) {
      toast({ title: "Money Added", description: `₹${amount.toFixed(2)} added to your demo wallet.` });
      await refreshUser();
      setIsAddMoneyDialogOpen(false);
      setAddAmount('');
    } else {
      toast({ title: "Failed to Add Money", description: result.error || "An unknown error occurred.", variant: "destructive" });
    }
  };

  const handleWithdrawMoney = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }
    if (!selectedBankAccount) {
      toast({ title: "No Bank Account Selected", description: "Please select a bank account for withdrawal.", variant: "destructive" });
      return;
    }
    const result = await withdrawDemoMoney(user.id, amount, selectedBankAccount);
    if (result.success) {
      toast({ title: "Withdrawal Successful", description: `₹${amount.toFixed(2)} withdrawn from your demo wallet.` });
      await refreshUser();
      setIsWithdrawMoneyDialogOpen(false);
      setWithdrawAmount('');
      setSelectedBankAccount('');
    } else {
      toast({ title: "Withdrawal Failed", description: result.error || "An unknown error occurred.", variant: "destructive" });
    }
  };

  const getTransactionTypeStyle = (type) => {
    switch (type) {
      case 'deposit': case 'credit': case 'refund': case 'payout': return 'text-emerald-600';
      case 'debit': case 'withdrawal': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };
  
  const renderContent = () => {
    if (loadingWallet) {
      return (
        <div className="space-y-8">
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-primary/10 to-sky-50/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <Skeleton className="h-8 w-48" />
                <div className="mt-2 sm:mt-0 text-right">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-x-0 sm:space-x-4 flex flex-col sm:flex-row gap-3 sm:gap-0">
              <Skeleton className="h-10 w-full sm:w-44" />
              <Skeleton className="h-10 w-full sm:w-52" />
            </CardContent>
          </Card>
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="border-b border-slate-200">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border rounded-md flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-5 w-24 ml-auto" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-8">
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-primary/10 to-sky-50/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <CardTitle className="text-2xl font-poppins text-primary flex items-center">
                <Wallet className="mr-3 h-7 w-7" /> My Demo Wallet
              </CardTitle>
              <div className="mt-2 sm:mt-0 text-right">
                <p className="text-sm text-slate-500">Current Balance</p>
                <p className="text-3xl font-bold text-slate-800 flex items-center justify-end">
                  <IndianRupee className="h-6 w-6 mr-1" />{(walletData.balance ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-x-0 sm:space-x-4 flex flex-col sm:flex-row gap-3 sm:gap-0">
            <Dialog open={isAddMoneyDialogOpen} onOpenChange={setIsAddMoneyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white">
                  <PlusCircle className="mr-2 h-5 w-5" /> Add Demo Money
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Demo Money to Wallet</DialogTitle></DialogHeader>
                <div className="py-4 space-y-2">
                  <Label htmlFor="addAmount">Amount (₹)</Label>
                  <Input id="addAmount" type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="Enter amount" />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                  <Button onClick={handleAddMoney} className="bg-emerald-500 hover:bg-emerald-600 text-white">Add Money</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isWithdrawMoneyDialogOpen} onOpenChange={setIsWithdrawMoneyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-500/10">
                  <MinusCircle className="mr-2 h-5 w-5" /> Withdraw Demo Money
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Withdraw Demo Money</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <Label htmlFor="withdrawAmount">Amount (₹)</Label>
                    <Input id="withdrawAmount" type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Enter amount" />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Select Bank Account</Label>
                    <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                      <SelectTrigger id="bankAccount">
                        <SelectValue placeholder="Choose account for withdrawal" />
                      </SelectTrigger>
                      <SelectContent>
                        {user.bank_accounts && user.bank_accounts.length > 0 ? (
                          user.bank_accounts.map((acc, index) => (
                            <SelectItem key={acc.accountNumber || index} value={acc.accountNumber}>
                              {acc.bankName} - ****{acc.accountNumber.slice(-4)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-sm text-center text-slate-500">No bank accounts added. Please add one in your profile.</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                  <Button onClick={handleWithdrawMoney} variant="destructive" disabled={!user.bank_accounts || user.bank_accounts.length === 0}>Withdraw</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-slate-200">
          <CardHeader className="border-b border-slate-200">
            <CardTitle className="text-xl font-poppins text-slate-800 flex items-center">
              <History className="mr-3 h-6 w-6 text-primary" /> Transaction History
            </CardTitle>
            <CardDescription className="text-slate-500">Your recent wallet activity.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {walletData.transactions.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No transactions yet.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {walletData.transactions.map(tx => (
                  <li key={tx.id} className="p-3 border border-slate-200 rounded-md flex justify-between items-center bg-slate-50/70 hover:bg-slate-100 transition-colors">
                    <div>
                      <p className={`font-medium text-sm ${getTransactionTypeStyle(tx.type)}`}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}: ₹{(tx.amount ?? 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-600">{tx.description}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs text-slate-500">Balance After</p>
                       <p className="text-sm font-medium text-slate-700">₹{(tx.balanceAfterTransaction ?? 0).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {renderContent()}
    </motion.div>
  );
}
