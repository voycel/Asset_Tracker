import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAppContext } from '@/context/app-context';

// Predefined workflow status templates
const workflowStatusTemplates = {
  manufacturing: [
    { name: 'Production', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'QA Testing', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { name: 'Packaging', color: 'bg-green-100 text-green-800 border-green-200' },
    { name: 'Ready for Shipping', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  ],
  sales: [
    { name: 'Demo', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { name: 'Shipped to Customer', color: 'bg-green-100 text-green-800 border-green-200' },
    { name: 'RMA Requested', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { name: 'RMA Approved', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { name: 'Returned', color: 'bg-red-100 text-red-800 border-red-200' },
  ]
};

export function WorkflowStatusCreator() {
  const { toast } = useToast();
  const { currentWorkspace } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<'manufacturing' | 'sales'>('manufacturing');
  const queryClient = useQueryClient();

  // Create status mutation
  const createStatusMutation = useMutation({
    mutationFn: async (statusData: any) => {
      const response = await apiRequest('POST', '/api/statuses', statusData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
    }
  });

  const handleCreateWorkflowStatuses = async () => {
    if (!currentWorkspace) {
      toast({
        title: "Error",
        description: "No workspace selected.",
        variant: "destructive"
      });
      return;
    }

    const statuses = workflowStatusTemplates[selectedWorkflow];
    
    try {
      for (const status of statuses) {
        await createStatusMutation.mutateAsync({
          name: status.name,
          color: status.color,
          workspaceId: currentWorkspace.id,
          description: `${selectedWorkflow.charAt(0).toUpperCase() + selectedWorkflow.slice(1)} workflow status`
        });
      }
      
      toast({
        title: "Success",
        description: `${selectedWorkflow.charAt(0).toUpperCase() + selectedWorkflow.slice(1)} workflow statuses created successfully.`
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create workflow statuses.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="ml-2">
        <PlusCircle className="mr-2 h-4 w-4" /> Add Workflow Statuses
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Workflow Statuses</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-type">Workflow Type</Label>
              <Select 
                value={selectedWorkflow} 
                onValueChange={(value: 'manufacturing' | 'sales') => setSelectedWorkflow(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workflow type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="sales">Sales & RMA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statuses to be created:</Label>
              <Card>
                <CardContent className="p-4">
                  <ul className="space-y-2">
                    {workflowStatusTemplates[selectedWorkflow].map((status, index) => (
                      <li key={index} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${status.color.split(' ')[0]}`}></div>
                        <span>{status.name}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={createStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkflowStatuses}
              disabled={createStatusMutation.isPending}
            >
              {createStatusMutation.isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Statuses'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
