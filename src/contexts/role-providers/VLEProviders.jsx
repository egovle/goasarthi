
import React from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { LeadProvider } from '@/contexts/LeadContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { SpecialRequestProvider } from '@/contexts/SpecialRequestContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export function VLEProviders({ children }) {
  return (
    <NotificationProvider>
      <UserProvider>
        <ServiceProvider>
          <WalletProvider>
            <LeadProvider>
              <TaskProvider>
                <SpecialRequestProvider>
                  {children}
                </SpecialRequestProvider>
              </TaskProvider>
            </LeadProvider>
          </WalletProvider>
        </ServiceProvider>
      </UserProvider>
    </NotificationProvider>
  );
}
