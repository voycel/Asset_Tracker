import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAppContext } from '@/context/app-context';
import { Asset } from '@shared/schema';

// Define relationship types
const relationshipTypes = [
  { id: 'part_of', name: 'Part of', description: 'This asset is a component of the related asset' },
  { id: 'accessory_to', name: 'Accessory to', description: 'This asset is an accessory to the related asset' },
  { id: 'replacement_for', name: 'Replacement for', description: 'This asset is a replacement for the related asset' },
  { id: 'depends_on', name: 'Depends on', description: 'This asset depends on the related asset to function' },
  { id: 'paired_with', name: 'Paired with', description: 'This asset is paired with the related asset' },
  { id: 'parent_of', name: 'Parent of', description: 'This asset is a parent of the related asset' },
  { id: 'child_of', name: 'Child of', description: 'This asset is a child of the related asset' },
  { id: 'connected_to', name: 'Connected to', description: 'This asset is connected to the related asset' },
  { id: 'installed_in', name: 'Installed in', description: 'This asset is installed in the related asset' },
  { id: 'contains', name: 'Contains', description: 'This asset contains the related asset' },
];

interface RelatedAsset {
  id: number;
  name: string;
  uniqueIdentifier: string;
}

interface AssetRelationship {
  id: number;
  sourceAssetId: number;
  targetAssetId: number;
  relationshipType: string;
  notes?: string;
  workspaceId?: number;
  createdAt: Date;
  updatedAt?: Date;
  sourceAsset?: RelatedAsset;
  targetAsset?: RelatedAsset;
}

interface AssetRelationshipManagerProps {
  assetId: number;
  isOpen: boolean;
  onClose: () => void;
  onRelationshipsUpdated: () => void;
}

export function AssetRelationshipManager({
  assetId,
  isOpen,
  onClose,
  onRelationshipsUpdated
}: AssetRelationshipManagerProps) {
  const { toast } = useToast();
  const { currentWorkspace } = useAppContext();
  const queryClient = useQueryClient();

  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>(relationshipTypes[0].id);
  const [notes, setNotes] = useState<string>('');

  // Fetch all assets except the current one
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets', { workspaceId: currentWorkspace?.id }],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const response = await apiRequest('GET', `/api/assets?workspaceId=${currentWorkspace.id}`);
      const allAssets = await response.json();
      // Filter out the current asset
      return allAssets.filter((asset: Asset) => asset.id !== assetId);
    },
    enabled: isOpen && !!currentWorkspace?.id
  });

  // Fetch existing relationships for this asset
  const {
    data: relationships = [],
    isLoading: relationshipsLoading,
    refetch: refetchRelationships
  } = useQuery<AssetRelationship[]>({
    queryKey: ['/api/asset-relationships', assetId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/asset-relationships?assetId=${assetId}&includeReverse=true`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching relationships:', error);
        return [];
      }
    },
    enabled: isOpen && !!assetId
  });

  // Create relationship mutation
  const createRelationshipMutation = useMutation({
    mutationFn: async (data: {
      sourceAssetId: number,
      targetAssetId: number,
      relationshipType: string,
      notes?: string,
      workspaceId?: number
    }) => {
      const response = await apiRequest('POST', '/api/asset-relationships', {
        ...data,
        workspaceId: currentWorkspace?.id
      });
      return response.json();
    },
    onSuccess: () => {
      refetchRelationships();
      toast({
        title: "Relationship created",
        description: "Asset relationship has been created successfully."
      });
      setSelectedAssetId(null);
      onRelationshipsUpdated(); // Notify parent component
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create asset relationship.",
        variant: "destructive"
      });
    }
  });

  // Delete relationship mutation
  const deleteRelationshipMutation = useMutation({
    mutationFn: async (relationshipId: number) => {
      await apiRequest('DELETE', `/api/asset-relationships/${relationshipId}`, {
        userId: null // We don't have user ID in the client, server will handle this
      });
    },
    onSuccess: () => {
      refetchRelationships();
      toast({
        title: "Relationship deleted",
        description: "Asset relationship has been deleted successfully."
      });
      onRelationshipsUpdated(); // Notify parent component
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete asset relationship.",
        variant: "destructive"
      });
    }
  });

  const handleCreateRelationship = () => {
    if (!selectedAssetId) {
      toast({
        title: "Error",
        description: "Please select an asset to create a relationship.",
        variant: "destructive"
      });
      return;
    }

    createRelationshipMutation.mutate({
      sourceAssetId: assetId,
      targetAssetId: selectedAssetId,
      relationshipType: selectedRelationshipType,
      notes: notes.trim() || undefined
    });

    // Reset the notes field
    setNotes('');
  };

  const handleDeleteRelationship = (relationshipId: number) => {
    deleteRelationshipMutation.mutate(relationshipId);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAssetId(null);
      setSelectedRelationshipType(relationshipTypes[0].id);
      setNotes('');
    }
  }, [isOpen]);

  const isLoading = assetsLoading || relationshipsLoading;
  const isPending = createRelationshipMutation.isPending || deleteRelationshipMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Asset Relationships</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="asset" className="text-right">Related Asset</Label>
                <div className="col-span-3">
                  <Select
                    value={selectedAssetId?.toString() || ""}
                    onValueChange={(value) => setSelectedAssetId(value ? Number(value) : null)}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.name} {asset.serialNumber ? `(${asset.serialNumber})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="relationship-type" className="text-right">Relationship Type</Label>
                <div className="col-span-3">
                  <Select
                    value={selectedRelationshipType}
                    onValueChange={setSelectedRelationshipType}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship type" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                <div className="col-span-3">
                  <Textarea
                    id="notes"
                    placeholder="Optional notes about this relationship"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isPending}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateRelationship}
                  disabled={!selectedAssetId || isPending}
                >
                  {createRelationshipMutation.isPending ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : 'Create Relationship'}
                </Button>
              </div>

              {relationships.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Existing Relationships</h3>
                  <div className="border rounded-md divide-y">
                    {relationships.map((relationship) => {
                      // Determine if this asset is the source or target
                      const isSource = relationship.sourceAssetId === assetId;

                      // Get the related asset (either source or target depending on which side this asset is on)
                      const relatedAsset = isSource
                        ? relationship.targetAsset
                        : relationship.sourceAsset;

                      // Get the relationship type
                      const relType = relationshipTypes.find(t => t.id === relationship.relationshipType);

                      // For display purposes, we might want to invert the relationship name if this asset is the target
                      let displayRelationship = relType?.name;
                      if (!isSource) {
                        // Invert relationship name for better readability when this asset is the target
                        switch (relationship.relationshipType) {
                          case 'part_of': displayRelationship = 'Has part'; break;
                          case 'parent_of': displayRelationship = 'Child of'; break;
                          case 'child_of': displayRelationship = 'Parent of'; break;
                          case 'contains': displayRelationship = 'Contained in'; break;
                          case 'installed_in': displayRelationship = 'Has installed'; break;
                          default: displayRelationship = `${relType?.name} (inverse)`;
                        }
                      }

                      return (
                        <div key={relationship.id} className="p-3 flex justify-between items-center">
                          <div className="flex items-center">
                            <LinkIcon className="h-4 w-4 mr-2 text-blue-500" />
                            <div>
                              <span className="font-medium">{relatedAsset?.name}</span>
                              <span className="text-sm text-neutral-500 ml-2">({displayRelationship})</span>
                              {relationship.notes && (
                                <div className="text-xs text-neutral-500 mt-1">{relationship.notes}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRelationship(relationship.id)}
                            disabled={deleteRelationshipMutation.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-neutral-500">
                  No relationships defined for this asset.
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
