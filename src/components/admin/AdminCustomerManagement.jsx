import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminCustomerManagement({ customers }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg sm:text-xl">Customer Management</CardTitle><CardDescription>View and manage customer details</CardDescription></CardHeader>
      <CardContent>
        {customers.length === 0 ? (<p className="text-center text-gray-500 py-8">No customers found.</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th><th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th><th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th><th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Address</th><th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Joined</th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map(customer => (<tr key={customer.id}><td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{customer.email}</td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{customer.address}</td><td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{new Date(customer.joinedDate).toLocaleDateString()}</td></tr>))}
              </tbody>
            </table>
          </div>)}
      </CardContent>
    </Card>
  );
}