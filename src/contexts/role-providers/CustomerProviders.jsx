
import React from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { ServiceProvider } from '@/contexts/ServiceContext';
import { BookingProvider } from '@/contexts/BookingContext';
import { ComplaintProvider } from '@/contexts/ComplaintContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { TaskProvider } from '@/contexts/TaskContext';

export function CustomerProviders({ children }) {
  return (
    <NotificationProvider>
      <UserProvider>
        <ServiceProvider>
          <WalletProvider>
            <BookingProvider>
              <TaskProvider>
                <ComplaintProvider>
                  {children}
                </ComplaintProvider>
              </TaskProvider>
            </BookingProvider>
          </WalletProvider>
        </ServiceProvider>
      </UserProvider>
    </NotificationProvider>
  );
}
