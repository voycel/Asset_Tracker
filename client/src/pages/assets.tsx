import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Asset, AssetType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { AssetDetailWrapper } from "@/pages/asset-detail-wrapper";
import { formatDate, formatCurrency, getIconForAssetType } from "@/lib/utils";
import { Eye, Edit, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function Assets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [archiveConfirmAsset, setArchiveConfirmAsset] = useState<Asset | null>(null);
  const { toast } = useToast();
  const { currentWorkspace, assetTypes, statuses, locations, manufacturers, user } = useAppContext();

  useEffect(() => {
    fetchAssets();
  }, [searchQuery]);

  const fetchAssets = async () => {
    try {
      setLoading(true);

      let url = "/api/assets?";

      if (currentWorkspace) {
        url += `workspaceId=${currentWorkspace.id}&`;
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailModalOpen(true);
  };

  const handleAssetUpdated = () => {
    fetchAssets();
    setIsDetailModalOpen(false);
  };

  const handleArchiveAsset = async () => {
    if (!archiveConfirmAsset) return;

    try {
      setLoading(true);
      await apiRequest("PATCH", `/api/assets/${archiveConfirmAsset.id}/archive`, {
        userId: user?.id
      });

      toast({
        title: "Asset archived",
        description: `${archiveConfirmAsset.name} has been archived successfully.`,
      });

      fetchAssets();
    } catch (error) {
      console.error("Error archiving asset:", error);
      toast({
        title: "Error",
        description: "Failed to archive asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setArchiveConfirmAsset(null);
    }
  };

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const asset = row.original;
        const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
        const icon = getIconForAssetType(assetType?.name);

        return (
          <div className="flex items-center">
            <span className="material-icons text-neutral-500 mr-2">{icon}</span>
            <span>{assetType?.name || "Unknown"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "uniqueIdentifier",
      header: "Asset ID",
      cell: ({ row }) => <div>{row.original.uniqueIdentifier}</div>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
      cell: ({ row }) => {
        const asset = row.original;
        const manufacturer = manufacturers.find(m => m.id === asset.manufacturerId);
        return <div>{manufacturer?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const asset = row.original;
        const status = statuses.find(s => s.id === asset.currentStatusId);

        if (!status) return <div>-</div>;

        const statusName = status.name.toLowerCase();
        let bgColor = "bg-neutral-100";
        let textColor = "text-neutral-800";

        if (statusName.includes("available")) {
          bgColor = "bg-neutral-100";
          textColor = "text-neutral-800";
        } else if (statusName.includes("in use")) {
          bgColor = "bg-green-100";
          textColor = "text-green-800";
        } else if (statusName.includes("maintenance")) {
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
        } else if (statusName.includes("attention") || statusName.includes("issue")) {
          bgColor = "bg-red-100";
          textColor = "text-red-800";
        }

        return (
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
            {status.name}
          </div>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => {
        const asset = row.original;
        const location = locations.find(l => l.id === asset.currentLocationId);
        return <div>{location?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "dateAcquired",
      header: "Date Acquired",
      cell: ({ row }) => <div>{formatDate(row.original.dateAcquired)}</div>,
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => <div>{formatCurrency(row.original.cost)}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="material-icons">more_vert</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewAsset(row.original)}>
                <Eye className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setArchiveConfirmAsset(row.original)}
                className="text-red-600"
              >
                <Archive className="mr-2 h-4 w-4" />
                <span>Archive</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Assets"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />

        <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Assets</h2>

            {loading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-neutral-200 rounded mb-4"></div>
                <div className="h-64 bg-neutral-200 rounded"></div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={assets}
                searchColumn="name"
                searchPlaceholder="Search assets by name, ID, or attributes..."
              />
            )}
          </div>
        </main>
      </div>

      <AssetDetailWrapper
        asset={selectedAsset}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAssetUpdated={handleAssetUpdated}
      />

      <AlertDialog
        open={!!archiveConfirmAsset}
        onOpenChange={(open) => !open && setArchiveConfirmAsset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive the asset "{archiveConfirmAsset?.name}"?
              Archived assets will no longer appear in the main view but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveAsset}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
