
import React from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { BookingProvider } from '@/contexts/BookingContext';
import { LeadProvider } from '@/contexts/LeadContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { ComplaintProvider } from '@/contexts/ComplaintContext';
import { SpecialRequestProvider } from '@/contexts/SpecialRequestContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export function AdminProviders({ children }) {
  return (
    <NotificationProvider>
      <UserProvider>
        <ServiceProvider>
          <WalletProvider>
            <BookingProvider>
              <LeadProvider>
                <TaskProvider>
                  <ComplaintProvider>
                    <SpecialRequestProvider>
                      {children}
                    </SpecialRequestProvider>
                  </ComplaintProvider>
                </TaskProvider>
              </LeadProvider>
            </BookingProvider>
          </WalletProvider>
        </ServiceProvider>
      </UserProvider>
    </NotificationProvider>
  );
}
