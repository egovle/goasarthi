import React from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx'; // ✅ Correct source
import { LoginForm } from '@/components/LoginForm';
import { CustomerDashboard } from '@/components/CustomerDashboard';
import { VLEDashboard } from '@/components/VLEDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { Toaster } from '@/components/ui/toaster';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { CustomerProviders } from '@/contexts/role-providers/CustomerProviders.jsx';
import { VLEProviders } from '@/contexts/role-providers/VLEProviders.jsx';
import { AdminProviders } from '@/contexts/role-providers/AdminProviders.jsx';
import { ServiceProvider } from '@/contexts/ServiceContext.jsx'; // ✅ Ensure correct extension

function ProtectedRoute({ children, user, isAuthenticated, targetRole }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== targetRole) {
    const correctPath = 
      user.role === 'customer' ? "/customer-dashboard" :
      user.role === 'vle' ? "/vle-dashboard" :
      user.role === 'admin' ? "/admin-dashboard" : "/login";
    return <Navigate to={correctPath} replace />;
  }

  return children;
}

function App() {
  const { user, login, quickLogin, signup, logout, loading, isAuthenticated } = useAuth();
  console.log("App initialized", { user, loading, isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-sky-100">
        <motion.div 
          className="w-20 h-20 border-4 border-t-transparent border-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/login" 
            element={
              !isAuthenticated || !user ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <LoginForm onLogin={login} onQuickLogin={quickLogin} onSignup={signup} />
                </motion.div>
              ) : (
                <Navigate to={
                  user?.role === 'customer' ? "/customer-dashboard" :
                  user?.role === 'vle' ? "/vle-dashboard" :
                  user?.role === 'admin' ? "/admin-dashboard" : "/login"
                } replace />
              )
            } 
          />
          <Route 
            path="/customer-dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} user={user} targetRole="customer">
                <CustomerProviders>
                  <CustomerDashboard user={user} onLogout={logout} />
                </CustomerProviders>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vle-dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} user={user} targetRole="vle">
                <ServiceProvider>
                  <VLEProviders>
                    <VLEDashboard user={user} onLogout={logout} />
                  </VLEProviders>
                </ServiceProvider>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated} user={user} targetRole="admin">
                <AdminProviders>
                  <AdminDashboard user={user} onLogout={logout} />
                </AdminProviders>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="*" 
            element={
              <Navigate to={
                isAuthenticated && user ? (
                  user?.role === 'customer' ? "/customer-dashboard" :
                  user?.role === 'vle' ? "/vle-dashboard" :
                  user?.role === 'admin' ? "/admin-dashboard" : "/login"
                ) : "/login"
              } replace />
            } 
          />
        </Routes>
      </AnimatePresence>
      <Toaster />
    </>
  );
}

export default App;
