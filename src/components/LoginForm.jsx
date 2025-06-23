import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LogIn, Mail, Lock, PhoneCall, ShieldCheck, UserPlus, UserCircle, UserCog, Briefcase, DatabaseZap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth.jsx';
import { motion } from 'framer-motion';
import QuickLoginButton from '@/components/vle/components/ui/QuickLoginButton';
import { Button } from '@/components/ui/button';

export function LoginForm({ onLogin, onQuickLogin, onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await onLogin(email, password);
    handleAuthResult(result);
    setLoading(false);
  };

  const handleQuickLogin = async (email, password) => {
    setLoading(true);
    const result = await onQuickLogin(email, password);
    handleAuthResult(result);
    setLoading(false);
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await onSignup({ name: signupName, email: signupEmail, password: signupPassword, phone: signupPhone, address: signupAddress });
    if (result.success && result.message) {
      toast({ title: 'Signup Almost Done!', description: result.message, variant: 'default' });
      setIsSignupOpen(false);
    } else {
      handleAuthResult(result, 'Signup Successful!');
    }
    if (result.success) {
      setIsSignupOpen(false);
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupPhone('');
      setSignupAddress('');
    }
    setLoading(false);
  };

  const handleAuthResult = (result, successMessage = 'Login Successful!') => {
    if (result.success) {
      toast({ title: successMessage, description: `Welcome to eGoa Sarathi, ${result.user.name}!`, variant: 'default' });
    } else {
      toast({ title: 'Action Failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleSeedUsers = async () => {
    setLoading(true);
    toast({ title: 'Initializing Database...', description: 'Please wait while we set up the demo users.' });
    const result = await seedUsers();
    setLoading(false);
    toast({
      title: result.errorCount > 0 ? 'Setup Complete!' : 'Database Initialized!',
      description: `${result.successCount} users ready. You can now use Quick Login buttons.`,
      variant: 'default'
    });
    if (result.errors?.length > 0) console.log('Some users may already exist:', result.errors);
  };



  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 overflow-hidden">
      <motion.div className="w-full max-w-sm space-y-6" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <div className="text-center text-white">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}>
            <ShieldCheck className="mx-auto h-16 w-16 mb-3 text-white drop-shadow-lg" />
          </motion.div>
          <h1 className="text-4xl font-poppins font-bold mb-1 drop-shadow-md">eGoa Sarathi</h1>
          <p className="text-lg font-inter opacity-90 drop-shadow-sm">Streamlined Citizen Services</p>
        </div>

        <Card className="glass-effect border-white/20 rounded-xl">
          <CardHeader className="text-center pt-5 pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-xl font-poppins text-white">
              <LogIn className="h-5 w-5" /> Login to Your Portal
            </CardTitle>
            <CardDescription className="text-white/80 font-inter text-xs">Access services with your credentials or quick login.</CardDescription>
          </CardHeader>

          <CardContent className="px-5 pb-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="login-label">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input id="email" type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="login-input rounded-lg h-11 text-sm" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="login-label">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="login-input rounded-lg h-11 text-sm" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-white text-blue-700 hover:bg-white/90 font-semibold text-sm py-2.5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 h-11" disabled={loading}>
                {loading ? 'Verifying...' : 'Secure Sign In'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pt-4 px-5 pb-5">
            <p className="text-xs text-center text-white/70 font-inter">Or login instantly as:</p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {adminUser && (
                <QuickLoginButton role="admin" icon={UserCog} label={`Admin (${adminUser.user_id_custom})`} email={adminUser.email} password={adminUser.password} loading={loading} onClick={handleQuickLogin} spanAll />
              )}
              {vleUsers.map(vle => (
                <QuickLoginButton key={vle.email} role="vle" icon={Briefcase} label={vle.name} email={vle.email} password={vle.password} loading={loading} onClick={handleQuickLogin} />
              ))}
              {customerUsers.map(customer => (
                <QuickLoginButton key={customer.email} role="customer" icon={UserCircle} label={customer.name} email={customer.email} password={customer.password} loading={loading} onClick={handleQuickLogin} />
              ))}
            </div>

            <div className="relative flex py-2 items-center w-full">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink mx-4 text-white/50 text-xs">First Time?</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            <Button variant="secondary" className="w-full bg-teal-500/20 border-teal-500/50 text-teal-100 hover:bg-teal-500/30" onClick={handleSeedUsers} disabled={loading}>
              <DatabaseZap className="mr-2 h-4 w-4" /> Initialize Demo Users
            </Button>

            <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="text-white/80 hover:text-white w-full mt-2 text-xs">
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" /> New Customer? Register Here
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white text-foreground rounded-lg shadow-2xl p-5">
                <DialogHeader className="pb-3">
                  <DialogTitle className="font-poppins text-lg">New Customer Registration</DialogTitle>
                  <DialogDescription className="font-inter text-xs">Create your eGoa Sarathi account.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSignupSubmit} className="grid gap-3 py-2">
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="signup-name" className="text-right font-inter text-xs">Full Name</Label>
                    <Input id="signup-name" placeholder="Your Full Name" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="col-span-3 rounded-md h-9 text-xs" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="signup-email" className="text-right font-inter text-xs">Email</Label>
                    <Input id="signup-email" type="email" placeholder="your.email@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="col-span-3 rounded-md h-9 text-xs" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="signup-password" className="text-right font-inter text-xs">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Choose a strong password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="col-span-3 rounded-md h-9 text-xs" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="signup-phone" className="text-right font-inter text-xs">Phone</Label>
                    <Input id="signup-phone" type="tel" placeholder="Your Mobile Number" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} className="col-span-3 rounded-md h-9 text-xs" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-3">
                    <Label htmlFor="signup-address" className="text-right font-inter text-xs">Address</Label>
                    <Input id="signup-address" placeholder="Your Full Address (Optional)" value={signupAddress} onChange={(e) => setSignupAddress(e.target.value)} className="col-span-3 rounded-md h-9 text-xs" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full mt-3 py-2.5 text-sm rounded-md bg-primary hover:bg-primary/90 text-primary-foreground h-10">
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <div className="text-center text-white/80 text-xs flex items-center justify-center gap-1.5 font-inter">
          <PhoneCall className="h-3.5 w-3.5" /> <span>Helpdesk: 1800-123-4567</span>
        </div>
      </motion.div>
    </div>
  );
}
