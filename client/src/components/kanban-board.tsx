import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { AssetCard } from "./asset-card";
import { Status, Location, Assignment, Asset } from "@shared/schema";
import { useAppContext } from "@/context/app-context";
import { apiRequest } from "@/lib/queryClient";
import { AssetDetailWrapper } from "@/pages/asset-detail-wrapper";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreVertical, Edit, Trash2, MoveVertical } from "lucide-react";

interface KanbanBoardProps {
  assets: Asset[];
  groupBy: "status" | "location" | "assignment";
  onAssetUpdated: () => void;
}

export function KanbanBoard({ assets, groupBy, onAssetUpdated }: KanbanBoardProps) {
  const { statuses, locations, assignments, refreshData, user, currentWorkspace } = useAppContext();
  const [columns, setColumns] = useState<{ [key: string]: Asset[] }>({});
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  // Status management state
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [loading, setLoading] = useState(false);

  // Group assets based on the selected groupBy parameter
  useEffect(() => {
    const grouped: { [key: string]: Asset[] } = {};

    if (groupBy === "status") {
      statuses.forEach(status => {
        grouped[status.id.toString()] = [];
      });

      assets.forEach(asset => {
        const statusId = asset.currentStatusId?.toString();
        if (statusId && grouped[statusId]) {
          grouped[statusId].push(asset);
        } else if (asset.currentStatusId) {
          // Status exists in asset but not in our list
          grouped[asset.currentStatusId.toString()] = [asset];
        } else {
          // No status assigned
          if (!grouped["unassigned"]) {
            grouped["unassigned"] = [];
          }
          grouped["unassigned"].push(asset);
        }
      });
    } else if (groupBy === "location") {
      locations.forEach(location => {
        grouped[location.id.toString()] = [];
      });

      assets.forEach(asset => {
        const locationId = asset.currentLocationId?.toString();
        if (locationId && grouped[locationId]) {
          grouped[locationId].push(asset);
        } else if (asset.currentLocationId) {
          // Location exists in asset but not in our list
          grouped[asset.currentLocationId.toString()] = [asset];
        } else {
          // No location assigned
          if (!grouped["unassigned"]) {
            grouped["unassigned"] = [];
          }
          grouped["unassigned"].push(asset);
        }
      });
    } else { // assignment
      assignments.forEach(assignment => {
        grouped[assignment.id.toString()] = [];
      });

      assets.forEach(asset => {
        const assignmentId = asset.currentAssignmentId?.toString();
        if (assignmentId && grouped[assignmentId]) {
          grouped[assignmentId].push(asset);
        } else if (asset.currentAssignmentId) {
          // Assignment exists in asset but not in our list
          grouped[asset.currentAssignmentId.toString()] = [asset];
        } else {
          // No assignment assigned
          if (!grouped["unassigned"]) {
            grouped["unassigned"] = [];
          }
          grouped["unassigned"].push(asset);
        }
      });
    }

    setColumns(grouped);
  }, [assets, groupBy, statuses, locations, assignments]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside of a column
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the moved asset
    const assetId = parseInt(draggableId);
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    // Get the source and destination columns
    const sourceColumn = columns[source.droppableId];
    const destinationColumn = columns[destination.droppableId];

    // If it's the same column, just reorder items in our state (not in the database)
    if (source.droppableId === destination.droppableId) {
      const newColumnItems = Array.from(sourceColumn);
      const [movedItem] = newColumnItems.splice(source.index, 1);
      newColumnItems.splice(destination.index, 0, movedItem);

      const newColumns = {
        ...columns,
        [source.droppableId]: newColumnItems
      };

      setColumns(newColumns);
      return;
    }

    // Create optimistic update for UI responsiveness
    const sourceItems = Array.from(sourceColumn);
    const [movedItem] = sourceItems.splice(source.index, 1);
    const destItems = Array.from(destinationColumn);
    destItems.splice(destination.index, 0, movedItem);

    // Apply optimistic update to state
    const optimisticColumns = {
      ...columns,
      [source.droppableId]: sourceItems,
      [destination.droppableId]: destItems
    };
    setColumns(optimisticColumns);

    // Move between columns - update the database
    try {
      let updateEndpoint = "";
      let updateData = {};
      const userId = user?.id || 1; // Fallback to 1 if no user ID is available

      if (groupBy === "status") {
        updateEndpoint = `/api/assets/${assetId}/status`;
        updateData = {
          statusId: destination.droppableId === "unassigned" ? null : parseInt(destination.droppableId),
          userId
        };
      } else if (groupBy === "location") {
        updateEndpoint = `/api/assets/${assetId}/location`;
        updateData = {
          locationId: destination.droppableId === "unassigned" ? null : parseInt(destination.droppableId),
          userId
        };
      } else { // assignment
        updateEndpoint = `/api/assets/${assetId}/assignment`;
        updateData = {
          assignmentId: destination.droppableId === "unassigned" ? null : parseInt(destination.droppableId),
          userId
        };
      }

      // Make the API request
      const response = await fetch(updateEndpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include'
      });

      if (!response.ok) {
        // If the request failed, throw an error with details
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      // Notify parent of the update
      onAssetUpdated();

      toast({
        title: "Asset updated",
        description: `Asset ${asset.name} moved successfully.`,
      });
    } catch (error) {
      console.error("Error updating asset:", error);

      // Revert the optimistic update on error
      setColumns({...columns});

      // Show detailed error message
      toast({
        title: "Update failed",
        description: error instanceof Error
          ? `Error: ${error.message}`
          : "There was a problem updating the asset. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  const getColumnTitle = (columnId: string) => {
    if (columnId === "unassigned") return "Unassigned";

    if (groupBy === "status") {
      const status = statuses.find(s => s.id.toString() === columnId);
      return status?.name || "Unknown";
    } else if (groupBy === "location") {
      const location = locations.find(l => l.id.toString() === columnId);
      return location?.name || "Unknown";
    } else { // assignment
      const assignment = assignments.find(a => a.id.toString() === columnId);
      return assignment?.name || "Unknown";
    }
  };

  const getColumnColor = (columnId: string) => {
    if (columnId === "unassigned") return "bg-neutral-500";

    if (groupBy === "status") {
      const status = statuses.find(s => s.id.toString() === columnId);
      return status?.color ? status.color : "bg-neutral-500";
    }

    return "bg-neutral-500";
  };

  const handleAssetUpdated = () => {
    setIsDetailModalOpen(false);
    onAssetUpdated();
  };

  // Status management functions
  const handleStatusAction = (action: 'rename' | 'delete' | 'move', status: Status) => {
    setSelectedStatus(status);

    if (action === 'rename') {
      setNewStatusName(status.name);
      setIsRenameDialogOpen(true);
    } else if (action === 'delete') {
      setIsDeleteDialogOpen(true);
    } else if (action === 'move') {
      setIsMoveDialogOpen(true);
    }
  };

  const handleRenameStatus = async () => {
    if (!selectedStatus || !newStatusName.trim() || !currentWorkspace) return;

    setLoading(true);
    try {
      await apiRequest('PUT', `/api/statuses/${selectedStatus.id}`, {
        name: newStatusName.trim(),
        workspaceId: currentWorkspace.id,
        color: selectedStatus.color
      });

      toast({
        title: "Status renamed",
        description: `Status renamed to "${newStatusName}" successfully.`
      });

      refreshData();
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error("Error renaming status:", error);
      toast({
        title: "Error",
        description: "Failed to rename status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!selectedStatus) return;

    setLoading(true);
    try {
      await apiRequest('DELETE', `/api/statuses/${selectedStatus.id}`);

      toast({
        title: "Status deleted",
        description: `Status "${selectedStatus.name}" deleted successfully.`
      });

      refreshData();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting status:", error);
      toast({
        title: "Error",
        description: "Failed to delete status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to move a status in a specific direction
  const handleMoveStatus = async (direction: 'left' | 'right' | 'up' | 'down') => {
    if (!selectedStatus || !currentWorkspace) return;

    // Get the current order of statuses
    const statusList = [...statuses].filter(s => s.workspaceId === currentWorkspace.id);

    // Find the current index of the selected status
    const currentIndex = statusList.findIndex(s => s.id === selectedStatus.id);
    if (currentIndex === -1) return;

    // Calculate the new index based on the direction
    let newIndex = currentIndex;

    // In a grid layout, left/right moves within the row, up/down moves between rows
    // For simplicity, we'll treat it as a linear list where:
    // - left/up: move earlier in the list
    // - right/down: move later in the list
    if (direction === 'left' || direction === 'up') {
      newIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'right' || direction === 'down') {
      newIndex = Math.min(statusList.length - 1, currentIndex + 1);
    }

    // If the index didn't change, no need to do anything
    if (newIndex === currentIndex) {
      toast({
        title: "Cannot move",
        description: `Status "${selectedStatus.name}" cannot be moved ${direction}.`
      });
      return;
    }

    setLoading(true);

    try {
      // Get the status we're swapping with
      const statusToSwapWith = statusList[newIndex];

      // Since we don't have a position field in the database, we'll use a workaround
      // We'll rename both statuses temporarily with a prefix, then rename them back
      // This will effectively swap their positions in the UI

      // Step 1: Rename the first status with a temporary name
      const tempName1 = `__TEMP1__${selectedStatus.name}`;
      await apiRequest('PUT', `/api/statuses/${selectedStatus.id}`, {
        name: tempName1,
        workspaceId: currentWorkspace.id,
        color: selectedStatus.color
      });

      // Step 2: Rename the second status with a temporary name
      const tempName2 = `__TEMP2__${statusToSwapWith.name}`;
      await apiRequest('PUT', `/api/statuses/${statusToSwapWith.id}`, {
        name: tempName2,
        workspaceId: currentWorkspace.id,
        color: statusToSwapWith.color
      });

      // Step 3: Rename the first status to the second status's original name
      await apiRequest('PUT', `/api/statuses/${selectedStatus.id}`, {
        name: statusToSwapWith.name,
        workspaceId: currentWorkspace.id,
        color: selectedStatus.color
      });

      // Step 4: Rename the second status to the first status's original name
      await apiRequest('PUT', `/api/statuses/${statusToSwapWith.id}`, {
        name: selectedStatus.name,
        workspaceId: currentWorkspace.id,
        color: statusToSwapWith.color
      });

      toast({
        title: "Status moved",
        description: `Status moved ${direction} successfully.`
      });

      // Refresh the data to get the updated order
      refreshData();
      setIsMoveDialogOpen(false);
    } catch (error) {
      console.error("Error moving status:", error);
      toast({
        title: "Error",
        description: "Failed to move status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(columns).map(([columnId, columnAssets]) => (
            <div key={columnId} className="bg-white border border-neutral-200 shadow-md rounded-xl flex flex-col overflow-hidden dark:bg-neutral-800 dark:border-neutral-700 dark:shadow-lg">
              <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getColumnColor(columnId) }}
                    ></span>
                    <h3 className="text-sm font-medium text-foreground">
                      {getColumnTitle(columnId)}
                    </h3>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground mr-2">
                      {columnAssets.length}
                    </span>

                    {/* Only show the menu for status columns and not for unassigned */}
                    {groupBy === "status" && columnId !== "unassigned" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              const status = statuses.find(s => s.id.toString() === columnId);
                              if (status) handleStatusAction('rename', status);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const status = statuses.find(s => s.id.toString() === columnId);
                              if (status) handleStatusAction('move', status);
                            }}
                          >
                            <MoveVertical className="mr-2 h-4 w-4" />
                            <span>Move</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              const status = statuses.find(s => s.id.toString() === columnId);
                              if (status) handleStatusAction('delete', status);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-3 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                    style={{ minHeight: '100px' }}
                  >
                    {columnAssets.map((asset, index) => (
                      <Draggable
                        key={asset.id.toString()}
                        draggableId={asset.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleAssetClick(asset)}
                            className={`mb-3 transition-transform duration-200 ${snapshot.isDragging ? 'shadow-lg scale-105 z-10' : ''}`}
                          >
                            <AssetCard asset={asset} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <AssetDetailWrapper
        asset={selectedAsset}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAssetUpdated={handleAssetUpdated}
      />

      {/* Rename Status Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Status</DialogTitle>
            <DialogDescription>
              Enter a new name for the status "{selectedStatus?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameStatus}
              disabled={loading || !newStatusName.trim()}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Status Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the status "{selectedStatus?.name}"?
              Assets with this status will have their status set to null.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStatus}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Status Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Move Status</DialogTitle>
            <DialogDescription>
              Choose a direction to move the status "{selectedStatus?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4 justify-items-center">
            <div className="col-start-2">
              <Button
                variant="outline"
                onClick={() => handleMoveStatus('up')}
                disabled={loading}
                className="w-full"
              >
                Up
              </Button>
            </div>
            <div className="col-start-1 col-end-2">
              <Button
                variant="outline"
                onClick={() => handleMoveStatus('left')}
                disabled={loading}
                className="w-full"
              >
                Left
              </Button>
            </div>
            <div className="col-start-3 col-end-4">
              <Button
                variant="outline"
                onClick={() => handleMoveStatus('right')}
                disabled={loading}
                className="w-full"
              >
                Right
              </Button>
            </div>
            <div className="col-start-2">
              <Button
                variant="outline"
                onClick={() => handleMoveStatus('down')}
                disabled={loading}
                className="w-full"
              >
                Down
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMoveDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
