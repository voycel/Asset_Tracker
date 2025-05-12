import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { AssetCard } from "./asset-card";
import { Status, Location, Assignment, Asset } from "@shared/schema";
import { useAppContext } from "@/context/app-context";
import { apiRequest } from "@/lib/queryClient";
import { AssetDetailModal } from "./asset-detail-modal";
import { useToast } from "@/hooks/use-toast";

interface KanbanBoardProps {
  assets: Asset[];
  groupBy: "status" | "location" | "assignment";
  onAssetUpdated: () => void;
}

export function KanbanBoard({ assets, groupBy, onAssetUpdated }: KanbanBoardProps) {
  const { statuses, locations, assignments, refreshData, user } = useAppContext();
  const [columns, setColumns] = useState<{ [key: string]: Asset[] }>({});
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

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

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(columns).map(([columnId, columnAssets]) => (
            <div key={columnId} className="bg-white rounded-lg shadow flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getColumnColor(columnId) }}
                    ></span>
                    <h3 className="text-sm font-medium text-neutral-800">
                      {getColumnTitle(columnId)}
                    </h3>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-neutral-200 text-neutral-800">
                    {columnAssets.length}
                  </span>
                </div>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`p-3 flex-1 overflow-y-auto max-h-[calc(100vh-220px)] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
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

      <AssetDetailModal
        asset={selectedAsset}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAssetUpdated={handleAssetUpdated}
      />
    </>
  );
}
