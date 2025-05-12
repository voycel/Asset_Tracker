import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query"; // Import useQuery and useQueryClient
import { Header } from "@/components/header";
import { DashboardFilters } from "@/components/dashboard-filters";
import { QuickStats } from "@/components/quick-stats";
import { KanbanBoard } from "@/components/kanban-board";
import { Asset } from "@shared/schema";
// Remove apiRequest import if only used for this fetch
// import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfigModal } from "@/components/config-modal";
import { useAppContext } from "@/context/app-context";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Button } from "@/components/ui/button"; // Import Button for empty state
import { Plus } from "lucide-react"; // Import Plus icon

// Helper to build the query string, excluding null/undefined/empty values
const buildAssetQueryString = (params: Record<string, string | number | null | undefined>): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value));
    }
  });
  return query.toString();
};

export default function Dashboard() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [groupBy, setGroupBy] = useState<"status" | "location" | "assignment">("status");
  const [assetTypeFilter, setAssetTypeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Remove useState for assets and loading
  // const [assets, setAssets] = useState<Asset[]>([]);
  // const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Keep sidebar state if needed locally
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { toast } = useToast();
  const { currentWorkspace, refreshData, openNewAssetModal } = useAppContext(); // Get openNewAssetModal from context
  const queryClient = useQueryClient(); // Get query client instance

  // Define query parameters object
  const queryParams = {
    workspaceId: currentWorkspace?.id,
    assetTypeId: assetTypeFilter,
    statusId: statusFilter,
    locationId: locationFilter,
    assignmentId: assignmentFilter,
    search: searchQuery,
  };

  // Use React Query to fetch assets
  const {
    data: assets = [], // Default to empty array
    isLoading, // Use isLoading from useQuery
    error, // Get error state
    isError, // Boolean error flag
  } = useQuery<Asset[], Error>({ // Specify types for data and error
    // Query key includes endpoint and all parameters that affect the query
    queryKey: ['/api/assets', queryParams],
    queryFn: async ({ queryKey }) => {
      const [, params] = queryKey as [string, typeof queryParams];
      // Ensure workspaceId exists before fetching
      if (!params.workspaceId) {
        return []; // Return empty array or throw error if workspace is required
      }
      const queryString = buildAssetQueryString(params);
      const url = `/api/assets?${queryString}`;

      // Use fetch directly or adapt apiRequest/getQueryFn logic
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const errorText = await res.text() || res.statusText;
        // Handle 401 specifically if needed, otherwise throw generic error
        if (res.status === 401) {
           console.error("Unauthorized fetching assets");
           // Potentially trigger logout or redirect here
           throw new Error(`Unauthorized (401)`);
        }
        throw new Error(`Failed to fetch assets: ${res.status} ${errorText}`);
      }
      return res.json();
    },
    // Enable the query only when workspaceId is available
    enabled: !!currentWorkspace?.id,
    // Keep data fresh based on your app's needs, or rely on invalidation
    // staleTime: 5 * 60 * 1000, // e.g., 5 minutes
    // refetchOnWindowFocus: true, // Consider enabling if needed
  });

  // Handle fetch error with toast
  useEffect(() => {
    if (isError && error) {
      console.error("Error fetching assets:", error);
      toast({
        title: "Error Loading Assets",
        description: error.message || "Failed to load assets. Please try again.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);


  // Remove manual fetchAssets function and its useEffect trigger
  // useEffect(() => {
  //   fetchAssets();
  // }, [assetTypeFilter, statusFilter, locationFilter, assignmentFilter, searchQuery, currentWorkspace]);
  // const fetchAssets = async () => { ... };


  // This function is now primarily for invalidation, called after mutations succeed
  const handleAssetUpdated = () => {
    // Invalidate the query to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ['/api/assets', queryParams] });
    // Also invalidate quick stats if they depend on asset changes
    queryClient.invalidateQueries({ queryKey: ['/api/stats', currentWorkspace?.id] });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query); // State update triggers query rerun via queryKey change
  };

  // Use the context function to open the modal
  const triggerAddAsset = () => {
     if (openNewAssetModal) {
       openNewAssetModal();
     } else {
       console.error("openNewAssetModal function not available in context");
       toast({ title: "Action Unavailable", description: "Cannot open the new asset form.", variant: "destructive" });
     }
  };


  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dashboard"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />

        <DashboardFilters
          activeView={view}
          onViewChange={setView}
          groupBy={groupBy}
          onGroupByChange={(value) => setGroupBy(value as "status" | "location" | "assignment")}
          assetTypeFilter={assetTypeFilter}
          onAssetTypeFilterChange={setAssetTypeFilter} // State update triggers query rerun
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter} // State update triggers query rerun
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter} // State update triggers query rerun
          assignmentFilter={assignmentFilter}
          onAssignmentFilterChange={setAssignmentFilter} // State update triggers query rerun
        />

        <main className="flex-1 overflow-x-auto bg-neutral-100 p-4 sm:p-6 lg:p-8">
          {/* Conditionally render QuickStats only if workspace is selected */}
          {currentWorkspace?.id && <QuickStats workspaceId={currentWorkspace.id} />}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-neutral-800">
                {groupBy === "status" ? "Assets by Status" :
                 groupBy === "location" ? "Assets by Location" :
                 "Assets by Assignment"}
              </h2>
              <Button onClick={triggerAddAsset} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add New Asset
              </Button>
            </div>

            {isLoading ? (
              // Enhanced skeleton loader with better visual representation
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-1/3 rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : assets.length > 0 ? (
              <div className="bg-transparent rounded-lg">
                <KanbanBoard
                  assets={assets}
                  groupBy={groupBy}
                  onAssetUpdated={handleAssetUpdated}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center mt-4 border border-neutral-200">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No assets found</h3>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  {assetTypeFilter || statusFilter || locationFilter || assignmentFilter || searchQuery
                    ? "Try changing your filters or search query to see more results."
                    : "Get started by adding your first asset to begin tracking your inventory."}
                </p>
                <Button
                  onClick={triggerAddAsset}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Asset
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={() => {
          // refreshData might still be needed if it refreshes things *other* than assets
          // Or it could potentially be replaced by more specific query invalidations
          refreshData(); // Keep for now, evaluate if specific invalidations are better
          setIsConfigModalOpen(false);
        }}
      />
    </>
  );
}
