import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { DashboardFilters } from "@/components/dashboard-filters";
import { QuickStats } from "@/components/quick-stats";
import { KanbanBoard } from "@/components/kanban-board";
import { Asset } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfigModal } from "@/components/config-modal";
import { useAppContext } from "@/context/app-context";

export default function Dashboard() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [groupBy, setGroupBy] = useState<"status" | "location" | "assignment">("status");
  const [assetTypeFilter, setAssetTypeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { toast } = useToast();
  const { currentWorkspace, refreshData } = useAppContext();

  useEffect(() => {
    fetchAssets();
  }, [assetTypeFilter, statusFilter, locationFilter, assignmentFilter, searchQuery]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      
      let url = "/api/assets?";
      
      if (currentWorkspace) {
        url += `workspaceId=${currentWorkspace.id}&`;
      }
      
      if (assetTypeFilter) {
        url += `assetTypeId=${assetTypeFilter}&`;
      }
      
      if (statusFilter) {
        url += `statusId=${statusFilter}&`;
      }
      
      if (locationFilter) {
        url += `locationId=${locationFilter}&`;
      }
      
      if (assignmentFilter) {
        url += `assignmentId=${assignmentFilter}&`;
      }
      
      if (searchQuery) {
        url += `search=${encodeURIComponent(searchQuery)}&`;
      }
      
      const response = await apiRequest("GET", url);
      const data = await response.json();
      setAssets(data);
    } catch (error) {
      console.error("Error fetching assets:", error);
      toast({
        title: "Error",
        description: "Failed to load assets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssetUpdated = () => {
    fetchAssets();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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
          onAssetTypeFilterChange={setAssetTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          locationFilter={locationFilter}
          onLocationFilterChange={setLocationFilter}
          assignmentFilter={assignmentFilter}
          onAssignmentFilterChange={setAssignmentFilter}
        />
        
        <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <QuickStats workspaceId={currentWorkspace?.id} />
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse h-96"></div>
              ))}
            </div>
          ) : assets.length > 0 ? (
            <KanbanBoard 
              assets={assets} 
              groupBy={groupBy} 
              onAssetUpdated={handleAssetUpdated} 
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No assets found</h3>
              <p className="text-neutral-500 mb-4">
                {assetTypeFilter || statusFilter || locationFilter || assignmentFilter || searchQuery
                  ? "Try changing your filters or search query"
                  : "Get started by adding your first asset"}
              </p>
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => document.querySelector<HTMLButtonElement>('button.hidden.sm\\:inline-flex')?.click()}
              >
                <span className="material-icons text-sm mr-1">add</span>
                Add Asset
              </button>
            </div>
          )}
        </main>
      </div>

      <ConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={() => {
          refreshData();
          setIsConfigModalOpen(false);
        }}
      />
    </>
  );
}
