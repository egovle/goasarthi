
import React from 'react';
import { UserProvider } from './UserContext';
import { NotificationProvider } from './NotificationContext';
import { WalletProvider } from './WalletContext';
import { BookingProvider } from './BookingContext';
import { LeadProvider } from './LeadContext';
import { TaskProvider } from './TaskContext';
import { ComplaintProvider } from './ComplaintContext';
import { SpecialRequestProvider } from './SpecialRequestContext';

export function DataProvider({ children }) {
  return (
    <UserProvider>
      <NotificationProvider>
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
      </NotificationProvider>
    </UserProvider>
  );
}
