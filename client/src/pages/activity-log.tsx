import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { apiRequest } from "@/lib/queryClient";
import { AssetLog } from "@shared/schema";
import { formatDateTime } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Check, MapPin, Users, Archive, CircleX } from "lucide-react";

export default function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<AssetLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const { toast } = useToast();
  const { assetTypes } = useAppContext();
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
    fetchAssets();
  }, [selectedAssetId]);
  
  const fetchAssets = async () => {
    try {
      const response = await apiRequest("GET", "/api/assets");
      const assetsData = await response.json();
      setAssets(assetsData);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      if (!selectedAssetId) {
        // If no asset is selected, we can't fetch logs because the API requires an asset ID
        setLogs([]);
        return;
      }
      
      const url = `/api/assets/${selectedAssetId}/logs`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error",
        description: "Failed to load activity logs. Please try again.",
        variant: "destructive",
      });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'UPDATE_STATUS':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'UPDATE_LOCATION':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'ASSIGNED':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'ARCHIVE':
        return <Archive className="h-4 w-4 text-red-500" />;
      default:
        return <CircleX className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getActionDescription = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return 'Asset created';
      case 'UPDATE':
        return 'Asset updated';
      case 'UPDATE_STATUS':
        return 'Status changed';
      case 'UPDATE_LOCATION':
        return 'Location changed';
      case 'ASSIGNED':
        return 'Assignment changed';
      case 'ARCHIVE':
        return 'Asset archived';
      default:
        return actionType;
    }
  };

  const columns: ColumnDef<AssetLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Date & Time",
      cell: ({ row }) => formatDateTime(row.original.timestamp),
    },
    {
      accessorKey: "actionType",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center">
          {getActionIcon(row.original.actionType)}
          <span className="ml-2">{getActionDescription(row.original.actionType)}</span>
        </div>
      ),
    },
    {
      accessorKey: "assetId",
      header: "Asset",
      cell: ({ row }) => {
        const asset = assets.find(a => a.id === row.original.assetId);
        if (!asset) return <span>Unknown Asset</span>;
        
        const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
        return (
          <div>
            <div className="font-medium">{asset.name}</div>
            <div className="text-sm text-neutral-500">
              {assetType?.name || "Unknown Type"} • {asset.uniqueIdentifier}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "userId",
      header: "User",
      cell: ({ row }) => "Administrator", // Simplified since we don't have real user data yet
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const details = row.original.detailsJson;
        if (!details) return "-";
        
        if (typeof details === 'string') {
          return details;
        } else if (typeof details === 'object' && details !== null && 'message' in details) {
          return (details as any).message;
        } else {
          return JSON.stringify(details);
        }
      },
    },
  ];

  const filteredLogs = logs.filter(log => {
    // If no asset is selected, include all logs
    if (selectedAssetId === null) return true;
    
    // If an asset is selected, only include logs for that asset
    return log.assetId === selectedAssetId;
  });

  // Further filter based on search query
  const searchedLogs = filteredLogs.filter(log => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Get asset details for the log
    const asset = assets.find(a => a.id === log.assetId);
    const assetName = asset?.name?.toLowerCase() || "";
    const assetId = asset?.uniqueIdentifier?.toLowerCase() || "";
    
    // Get action details
    const action = getActionDescription(log.actionType).toLowerCase();
    
    // Get details from the log
    let details = "";
    if (log.detailsJson) {
      if (typeof log.detailsJson === 'string') {
        details = log.detailsJson.toLowerCase();
      } else if (typeof log.detailsJson === 'object' && log.detailsJson !== null && 'message' in log.detailsJson) {
        details = ((log.detailsJson as any).message || "").toLowerCase();
      } else {
        details = JSON.stringify(log.detailsJson).toLowerCase();
      }
    }
    
    return action.includes(searchLower) || 
           assetName.includes(searchLower) || 
           assetId.includes(searchLower) || 
           details.includes(searchLower);
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Activity Log" 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />
      
      <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-semibold">Activity Log</h2>
              <p className="text-neutral-500">
                Track all changes and activities across your assets
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={selectedAssetId?.toString() || "all"}
                onValueChange={(value) => setSelectedAssetId(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id.toString()}>
                      {asset.name} ({asset.uniqueIdentifier})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={fetchLogs}>
                Refresh
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-neutral-200 rounded mb-4"></div>
              <div className="h-80 bg-neutral-200 rounded"></div>
            </div>
          ) : searchedLogs.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={searchedLogs} 
            />
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No activity logs found</h3>
              <p className="text-neutral-500">
                {selectedAssetId 
                  ? "No logs found for the selected asset." 
                  : searchQuery 
                    ? "No logs match your search criteria." 
                    : "No activity has been recorded yet."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
