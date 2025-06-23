import React, { createContext, useContext } from 'react';

export const ServiceContext = createContext(null);

const SERVICES = [
  { id: 'birth-cert', name: 'Birth Certificate', category: 'Civil', fee: 50 },
  { id: 'death-cert', name: 'Death Certificate', category: 'Civil', fee: 50 },
  { id: 'income-cert', name: 'Income Certificate', category: 'Revenue', fee: 100 },
  { id: 'caste-cert', name: 'Caste Certificate', category: 'Social Welfare', fee: 75 },
  { id: 'domicile-cert', name: 'Domicile Certificate', category: 'Revenue', fee: 100 },
  { id: 'ration-card', name: 'Ration Card', category: 'Food & Supplies', fee: 25 },
  { id: 'voter-id', name: 'Voter ID Card', category: 'Election', fee: 0 },
  { id: 'pan-card', name: 'PAN Card', category: 'Income Tax', fee: 110 }
];

export const ServiceProvider = ({ children }) => {
  const value = {
    services: SERVICES,
  };
  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
};

// ✅ ADD THIS EXPORT TO FIX THE BUILD ISSUE
export function useServices() {
  return useContext(ServiceContext);
}
