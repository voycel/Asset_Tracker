import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export function CustomersPage() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      console.log('Fetching customers...');
      const response = await apiRequest('GET', '/api/customers');
      const data = await response.json();
      console.log('Customers data received:', data);
      return data;
    },
    staleTime: 0, // Always refetch when invalidated
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => {
      console.log('Creating customer:', customerData);
      try {
        const response = await apiRequest('POST', '/api/customers', customerData);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response from server:', errorText);
          throw new Error(`Failed to create customer: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        console.log('Customer creation response:', data);
        return data;
      } catch (error) {
        console.error('Error in customer creation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Customer created successfully, data:', data);
      // Force a refetch of the customers data
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.refetchQueries({ queryKey: ['/api/customers'] });
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
    }
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>> }) => {
      const response = await apiRequest('PUT', `/api/customers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setEditingCustomer(null);
      setIsModalOpen(false);
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      setCustomerToDelete(null);
    }
  });

  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => {
    console.log('Saving customer:', customerData);

    if (editingCustomer) {
      // Update existing customer
      updateCustomerMutation.mutate({
        id: editingCustomer.id,
        data: customerData
      }, {
        onSuccess: (updatedCustomer) => {
          console.log('Customer updated successfully:', updatedCustomer);
          toast({ title: "Customer Updated", description: `${customerData.name} updated successfully.` });
          // Force a manual refetch to ensure UI is updated
          refetch();
        },
        onError: (err) => {
          console.error('Error updating customer:', err);
          toast({ title: "Error", description: "Failed to update customer.", variant: "destructive" });
        }
      });
    } else {
      // Add new customer
      createCustomerMutation.mutate(customerData, {
        onSuccess: (newCustomer) => {
          console.log('Customer created successfully:', newCustomer);
          toast({ title: "Customer Created", description: `${customerData.name} created successfully.` });
          // Force a manual refetch to ensure UI is updated
          refetch();
        },
        onError: (err) => {
          console.error('Error creating customer:', err);
          toast({ title: "Error", description: "Failed to create customer.", variant: "destructive" });
        }
      });
    }
  };

  const handleDeleteCustomer = () => {
    if (customerToDelete) {
      console.log('Deleting customer:', customerToDelete);
      deleteCustomerMutation.mutate(customerToDelete.id, {
        onSuccess: () => {
          console.log('Customer deleted successfully');
          toast({ title: "Customer Deleted", description: `${customerToDelete.name} deleted successfully.`, variant: "destructive" });
          // Force a manual refetch to ensure UI is updated
          refetch();
        },
        onError: (err) => {
          console.error('Error deleting customer:', err);
          toast({ title: "Error", description: "Failed to delete customer.", variant: "destructive" });
        }
      });
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customers</CardTitle>
          <Button onClick={openNewModal} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading customers. Please try again.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer: Customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(customer)}
                          disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending || deleteCustomerMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteConfirm(customer)}
                          disabled={createCustomerMutation.isPending || updateCustomerMutation.isPending || deleteCustomerMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {customers.length === 0 && <p className="text-center text-gray-500 py-4">No customers found.</p>}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        isLoading={createCustomerMutation.isPending || updateCustomerMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the customer "{customerToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCustomerToDelete(null)}
              disabled={deleteCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCustomer}
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add/Edit Customer Modal Component
interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>) => void;
  customer: Customer | null;
  isLoading: boolean;
}

function CustomerModal({ isOpen, onClose, onSave, customer, isLoading }: CustomerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (customer) {
      setName(customer.name);
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
    } else {
      // Reset form for new customer
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
  }, [customer, isOpen]); // Depend on isOpen to reset form when opening for 'new'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!name) {
      // TODO: Add proper form validation feedback
      alert("Name is required");
      return;
    }
    // Create customer data object with proper handling of empty strings
    const customerData = {
      name,
      // Only include non-empty values, otherwise use null
      email: email.trim() !== '' ? email : null,
      phone: phone.trim() !== '' ? phone : null,
      address: address.trim() !== '' ? address : null,
      notes: notes.trim() !== '' ? notes : null
    };

    console.log('Submitting customer data:', customerData);
    onSave(customerData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
