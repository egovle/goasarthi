import React, { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

const generateVLEId = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let id = '';
  id += letters.charAt(Math.floor(Math.random() * letters.length));
  id += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) {
    id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return id;
};

const DEMO_USERS_INITIAL_STATE = [
  { id: 'customer-1', userId: 'CUST001', email: 'customer1@example.com', password: 'password', role: 'customer', name: 'Rohan Sharma', phone: '9876543210', address: '123 Beach View, Panaji', walletBalance: 1000, bankAccounts: [], transactionHistory: [], joinedDate: '2024-01-15T10:00:00.000Z' },
  { id: 'customer-2', userId: 'CUST002', email: 'customer2@example.com', password: 'password', role: 'customer', name: 'Priya Fernandes', phone: '9876543211', address: '456 River Side, Margao', walletBalance: 1000, bankAccounts: [], transactionHistory: [], joinedDate: '2024-02-20T11:30:00.000Z' },
  { id: 'customer-3', userId: 'CUST003', email: 'customer3@example.com', password: 'password', role: 'customer', name: 'Amit Naik', phone: '9876543212', address: '789 Hill Top, Vasco', walletBalance: 1000, bankAccounts: [], transactionHistory: [], joinedDate: '2024-03-10T09:00:00.000Z' },
  { id: 'vle-1', email: 'vle1@example.com', password: 'password', role: 'vle', name: 'Rajesh Kumar', center: 'Panaji Center', walletBalance: 1000, bankAccounts: [], transactionHistory: [] },
  { id: 'vle-2', email: 'vle2@example.com', password: 'password', role: 'vle', name: 'Sunita Patil', center: 'Margao Center', walletBalance: 1000, bankAccounts: [], transactionHistory: [] },
  { id: 'vle-3', email: 'vle3@example.com', password: 'password', role: 'vle', name: 'Anil Desai', center: 'Vasco Center', walletBalance: 1000, bankAccounts: [], transactionHistory: [] },
  { id: 'vle-4', email: 'vle4@example.com', password: 'password', role: 'vle', name: 'Deepa Shenoy', center: 'Mapusa Center', walletBalance: 1000, bankAccounts: [], transactionHistory: [] },
  { id: 'admin-1', userId: 'ADMIN001', email: 'admin@example.com', password: 'password', role: 'admin', name: 'Admin Goa', walletBalance: 0, bankAccounts: [], transactionHistory: [] }
];

let DEMO_USERS_RUNTIME = []; 

const initializeDemoUsers = () => {
  const storedUsers = localStorage.getItem('egoa_all_users');
  if (storedUsers) {
    DEMO_USERS_RUNTIME = JSON.parse(storedUsers);
  } else {
    DEMO_USERS_RUNTIME = DEMO_USERS_INITIAL_STATE.map(user => {
      if (user.role === 'vle' && !user.userId) {
        return { ...user, userId: generateVLEId() };
      }
      return user;
    });
    localStorage.setItem('egoa_all_users', JSON.stringify(DEMO_USERS_RUNTIME));
  }
};
initializeDemoUsers();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('egoa_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const fullUser = DEMO_USERS_RUNTIME.find(du => du.id === parsedUser.id);
      setUser(fullUser || parsedUser);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const updateUserInStorage = (userId, updatedDetails) => {
    const userIndex = DEMO_USERS_RUNTIME.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      DEMO_USERS_RUNTIME[userIndex] = { ...DEMO_USERS_RUNTIME[userIndex], ...updatedDetails };
      localStorage.setItem('egoa_all_users', JSON.stringify(DEMO_USERS_RUNTIME));
      
      if (user && user.id === userId) { 
        const updatedLoggedInUser = { ...user, ...updatedDetails };
        setUser(updatedLoggedInUser);
        localStorage.setItem('egoa_user', JSON.stringify(updatedLoggedInUser));
      }
      return true;
    }
    return false;
  };


  const login = (email, password) => {
    const foundUser = DEMO_USERS_RUNTIME.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('egoa_user', JSON.stringify(foundUser));
      return { success: true, user: foundUser };
    }
    return { success: false, error: "Invalid email or password." };
  };

  const quickLogin = (userId) => {
    const foundUser = DEMO_USERS_RUNTIME.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('egoa_user', JSON.stringify(foundUser));
      return { success: true, user: foundUser };
    }
    return { success: false, error: "Invalid quick login user." };
  };
  
  const signup = (signupData) => {
    const existingUser = DEMO_USERS_RUNTIME.find(u => u.email === signupData.email);
    if (existingUser) {
      return { success: false, error: "Email already exists." };
    }
    const newUser = {
      id: `customer-${Date.now()}`,
      userId: `CUST${Date.now().toString().slice(-3)}`,
      email: signupData.email,
      password: signupData.password, 
      role: 'customer',
      name: signupData.name,
      phone: signupData.phone,
      address: signupData.address,
      walletBalance: 1000,
      bankAccounts: [],
      transactionHistory: [],
      joinedDate: new Date().toISOString()
    };
    DEMO_USERS_RUNTIME.push(newUser); 
    localStorage.setItem('egoa_all_users', JSON.stringify(DEMO_USERS_RUNTIME));
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('egoa_user', JSON.stringify(newUser));
    return { success: true, user: newUser };
  };


  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('egoa_user');
  };
  
  const refreshUser = () => {
    if (user && user.id) {
        const refreshedUser = DEMO_USERS_RUNTIME.find(u => u.id === user.id);
        if (refreshedUser) {
            setUser(refreshedUser);
            localStorage.setItem('egoa_user', JSON.stringify(refreshedUser));
        }
    }
  };

  const value = { user, login, quickLogin, signup, logout, loading, isAuthenticated, DEMO_USERS: DEMO_USERS_RUNTIME, updateUserInStorage, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
