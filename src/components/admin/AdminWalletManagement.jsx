
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/hooks/useData';
import { DollarSign, Users, IndianRupee, ArrowDownCircle, ArrowUpCircle, History, Search, Landmark } from 'lucide-react';
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
import { supabase } from '@/lib/supabaseClient';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminWalletManagement() {
  const { toast } = useToast();
  const { 
    getVLEs, getCustomers, creditUserWallet, issueRefundToCustomer, 
    platformCommission, getWalletDetails, allUsersForAdmin, refetchAllUsers,
    loadingUsers 
  } = useData();

  const [vles, setVles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedUserForTx, setSelectedUserForTx] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  
  const [isCreditVLEDialogOpen, setIsCreditVLEDialogOpen] = useState(false);
  const [selectedVLEForCredit, setSelectedVLEForCredit] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditRemarks, setCreditRemarks] = useState('');

  const [isRefundCustomerDialogOpen, setIsRefundCustomerDialogOpen] = useState(false);
  const [selectedCustomerForRefund, setSelectedCustomerForRefund] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundServiceId, setRefundServiceId] = useState('');
  const [refundServiceName, setRefundServiceName] = useState('');
  const [refundRemarks, setRefundRemarks] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [platformTransactions, setPlatformTransactions] = useState([]);
  const [loadingPlatformTx, setLoadingPlatformTx] = useState(true);

  useEffect(() => {
    const fetchPlatformTransactions = async () => {
      setLoadingPlatformTx(true);
      const { data, error } = await supabase
        .from('platform_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error("Error fetching platform transactions:", error);
        toast({ title: "Error", description: "Could not fetch platform commission history.", variant: "destructive" });
      } else {
        setPlatformTransactions(data || []);
      }
      setLoadingPlatformTx(false);
    };
    fetchPlatformTransactions();
  }, []);

  useEffect(() => {
    setVles(getVLEs());
    setCustomers(getCustomers());
  }, [allUsersForAdmin]);

  useEffect(() => {
    const allUsers = [...vles, ...customers];
    if (searchTerm) {
      setFilteredUsers(
        allUsers.filter(u => 
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.user_id_custom?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchTerm, vles, customers]);

  const handleCreditVLE = async () => {
    const amount = parseFloat(creditAmount);
    if (!selectedVLEForCredit || isNaN(amount) || amount <= 0 || !creditRemarks.trim()) {
      toast({ title: "Invalid Input", description: "Please select a VLE, enter a valid positive amount, and provide remarks.", variant: "destructive" });
      return;
    }
    const result = await creditUserWallet(selectedVLEForCredit, amount, creditRemarks);
    if (result) {
      toast({ title: "VLE Wallet Credited", description: `₹${amount.toFixed(2)} credited to VLE.` });
      await refetchAllUsers();
      setIsCreditVLEDialogOpen(false);
      setCreditAmount(''); setCreditRemarks(''); setSelectedVLEForCredit('');
    } else {
      toast({ title: "Credit Failed", description: "Could not credit VLE wallet.", variant: "destructive" });
    }
  };

  const handleRefundCustomer = async () => {
    const amount = parseFloat(refundAmount);
    if (!selectedCustomerForRefund || isNaN(amount) || amount <= 0 || !refundRemarks.trim() || !refundServiceId.trim() || !refundServiceName.trim()) {
      toast({ title: "Invalid Input", description: "Please select a customer, enter valid details for amount, service, and remarks.", variant: "destructive" });
      return;
    }
    const result = await issueRefundToCustomer(selectedCustomerForRefund, amount, refundServiceId, refundServiceName, refundRemarks);
    if (result.success) {
      toast({ title: "Refund Processed", description: `₹${amount.toFixed(2)} refunded to customer.` });
      await refetchAllUsers();
      setIsRefundCustomerDialogOpen(false);
      setRefundAmount(''); setRefundRemarks(''); setSelectedCustomerForRefund(''); setRefundServiceId(''); setRefundServiceName('');
    } else {
      toast({ title: "Refund Failed", description: result.error || "Could not process refund.", variant: "destructive" });
    }
  };

  const handleViewTransactions = async (userId) => {
    const userForTx = allUsersForAdmin.find(u => u.id === userId);
    const details = await getWalletDetails(userId);
    setSelectedUserForTx(userForTx);
    setTransactionHistory(details ? details.transactions : []);
  };
  
  const getTransactionTypeStyle = (type) => {
    switch (type) {
      case 'deposit': case 'credit': case 'refund': case 'payout': return 'text-emerald-600';
      case 'debit': case 'withdrawal': return 'text-red-600';
      case 'commission': return 'text-blue-600';
      default: return 'text-slate-600';
    }
  };


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Card className="shadow-xl border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <CardTitle className="text-2xl font-poppins text-sky-800 flex items-center">
            <DollarSign className="mr-3 h-7 w-7 text-sky-600" /> Admin Wallet Operations
          </CardTitle>
          <CardDescription className="text-sky-700">Manage VLE credits, customer refunds, and view platform commissions.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Dialog open={isCreditVLEDialogOpen} onOpenChange={setIsCreditVLEDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white"><ArrowUpCircle className="mr-2 h-5 w-5" /> Credit VLE Wallet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Credit VLE Wallet</DialogTitle></DialogHeader>
              <div className="py-4 space-y-3">
                <div><Label htmlFor="selectVLE">Select VLE</Label>
                  <Select value={selectedVLEForCredit} onValueChange={setSelectedVLEForCredit}>
                    <SelectTrigger id="selectVLE"><SelectValue placeholder="Choose VLE" /></SelectTrigger>
                    <SelectContent>{vles.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.user_id_custom})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="creditAmount">Amount (₹)</Label><Input id="creditAmount" type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} /></div>
                <div><Label htmlFor="creditRemarks">Remarks</Label><Input id="creditRemarks" value={creditRemarks} onChange={e => setCreditRemarks(e.target.value)} /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><Button onClick={handleCreditVLE} className="bg-green-500 hover:bg-green-600 text-white">Credit VLE</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isRefundCustomerDialogOpen} onOpenChange={setIsRefundCustomerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white"><ArrowDownCircle className="mr-2 h-5 w-5" /> Refund Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Refund Customer Wallet</DialogTitle></DialogHeader>
              <div className="py-4 space-y-3">
                <div><Label htmlFor="selectCustomer">Select Customer</Label>
                  <Select value={selectedCustomerForRefund} onValueChange={setSelectedCustomerForRefund}>
                    <SelectTrigger id="selectCustomer"><SelectValue placeholder="Choose Customer" /></SelectTrigger>
                    <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.user_id_custom})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="refundAmount">Amount (₹)</Label><Input id="refundAmount" type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} /></div>
                <div><Label htmlFor="refundServiceId">Original Service/Booking ID</Label><Input id="refundServiceId" value={refundServiceId} onChange={e => setRefundServiceId(e.target.value)} /></div>
                <div><Label htmlFor="refundServiceName">Original Service Name</Label><Input id="refundServiceName" value={refundServiceName} onChange={e => setRefundServiceName(e.target.value)} /></div>
                <div><Label htmlFor="refundRemarks">Refund Remarks</Label><Input id="refundRemarks" value={refundRemarks} onChange={e => setRefundRemarks(e.target.value)} /></div>
              </div>
              <DialogFooter><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><Button onClick={handleRefundCustomer} className="bg-orange-500 hover:bg-orange-600 text-white">Process Refund</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-slate-200 h-full">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="text-xl font-poppins text-slate-800 flex items-center"><Users className="mr-3 h-6 w-6 text-primary" /> User Wallet Balances</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search users by name, email, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="pt-4 max-h-[500px] overflow-y-auto">
              {loadingUsers ? (<p className="text-center text-slate-500 py-6">Loading Users...</p>) :
              filteredUsers.length === 0 ? (<p className="text-center text-slate-500 py-6">No users found.</p>) : (
                <ul className="divide-y divide-slate-100">
                  {filteredUsers.map(u => (
                    <li key={u.id} className="py-3 px-1 flex justify-between items-center hover:bg-slate-50 rounded">
                      <div>
                        <p className="font-medium text-slate-700">{u.name} <span className="text-xs text-slate-500">({u.role}, ID: {u.user_id_custom})</span></p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <p className="text-lg font-semibold text-slate-800">₹{(u.wallet_balance || 0).toFixed(2)}</p>
                        <Button variant="ghost" size="sm" onClick={() => handleViewTransactions(u.id)} className="text-primary hover:text-primary/80"><History className="h-4 w-4"/></Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="shadow-xl border-blue-200 h-full">
            <CardHeader className="border-b border-blue-200 bg-blue-50/50">
              <CardTitle className="text-xl font-poppins text-blue-800 flex items-center"><Landmark className="mr-3 h-6 w-6 text-blue-600" /> Platform Wallet</CardTitle>
              <CardDescription>Total commission earned and history.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="bg-blue-100/70 p-4 rounded-lg text-center mb-4">
                <p className="text-sm text-blue-700 font-medium">Total Commission Balance</p>
                <p className="text-3xl font-bold text-blue-800 flex items-center justify-center"><IndianRupee className="h-7 w-7 mr-1" />{platformCommission.toFixed(2)}</p>
              </div>
              <h4 className="text-sm font-semibold text-slate-600 mb-2">Commission History</h4>
              <div className="max-h-[380px] overflow-y-auto pr-2 space-y-2">
                {loadingPlatformTx ? (
                  [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : platformTransactions.length === 0 ? (
                  <p className="text-center text-slate-500 py-4 text-sm">No commission transactions yet.</p>
                ) : (
                  platformTransactions.map(tx => (
                    <div key={tx.id} className="p-2 border rounded-md bg-slate-50/80 text-xs">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-blue-600">Commission: +₹{tx.amount.toFixed(2)}</p>
                        <p className="text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="text-slate-500 truncate">From: {tx.description}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {selectedUserForTx && (
        <Dialog open={!!selectedUserForTx} onOpenChange={() => setSelectedUserForTx(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction History for {selectedUserForTx.name}</DialogTitle>
              <DialogDescription>Wallet Balance: ₹{(selectedUserForTx.wallet_balance || 0).toFixed(2)}</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto py-2 pr-1">
              {transactionHistory.length === 0 ? <p className="text-center text-slate-500 py-4">No transactions found.</p> : (
                <ul className="space-y-2">
                  {transactionHistory.map(tx => (
                    <li key={tx.id} className="p-2.5 border rounded-md bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium text-sm ${getTransactionTypeStyle(tx.type)}`}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}: ₹{(tx.amount || 0).toFixed(2)}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{tx.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                       <p className="text-xs text-slate-500 mt-1">Balance After: ₹{(tx.balanceAfterTransaction || 0).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </motion.div>
  );
}
