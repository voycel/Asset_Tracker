import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/context/app-context";

interface QuickAddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomerId: number, newCustomerName: string) => void;
  title: string;
  description: string;
  type: 'manufacturer' | 'customer'; // Type of entity to create
}

export function QuickAddCustomerModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
  type,
}: QuickAddCustomerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { user, refreshData } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      let endpoint = '';
      let data = {};

      if (type === 'manufacturer') {
        endpoint = '/api/manufacturers';
        data = {
          workspaceId: user?.workspaceId,
          name,
          contactInfo,
        };
      } else {
        endpoint = '/api/customers';
        data = {
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
          notes: notes || null,
        };
      }

      const response = await apiRequest("POST", endpoint, data);
      
      if (!response.ok) {
        throw new Error(`Failed to create ${type}`);
      }

      const newEntity = await response.json();
      
      toast({
        title: "Success",
        description: `${title} created successfully.`,
      });

      // Refresh data in context
      refreshData();
      
      // Call onSuccess with the new entity
      onSuccess(newEntity.id, newEntity.name);
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to create ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setContactInfo('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="col-span-3" 
                required 
                disabled={loading}
              />
            </div>

            {type === 'manufacturer' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contactInfo" className="text-right">Contact Info</Label>
                <Textarea
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="col-span-3"
                  disabled={loading}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="col-span-3"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="col-span-3"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="col-span-3"
                    disabled={loading}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
