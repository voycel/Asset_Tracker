import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAppContext } from "@/context/app-context";

interface QuickAddAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAssignmentId: number, newAssignmentName: string) => void;
}

export function QuickAddAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickAddAssignmentModalProps) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
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

      const data = {
        workspaceId: user?.workspaceId,
        name,
        details: details || null,
      };

      const response = await apiRequest("POST", "/api/assignments", data);
      
      if (!response.ok) {
        throw new Error("Failed to create assignment");
      }

      const newAssignment = await response.json();
      
      toast({
        title: "Success",
        description: "Assignment created successfully.",
      });

      // Refresh data in context
      refreshData();
      
      // Call onSuccess with the new assignment
      onSuccess(newAssignment.id, newAssignment.name);
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDetails('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Assignment</DialogTitle>
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="details" className="text-right">Details</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="col-span-3"
                disabled={loading}
              />
            </div>
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
