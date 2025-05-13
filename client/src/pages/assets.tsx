import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { Asset, AssetType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { AssetDetailWrapper } from "@/pages/asset-detail-wrapper";
import { EditAssetModal } from "@/components/edit-asset-modal";
import { formatDate, formatCurrency, getIconForAssetType } from "@/lib/utils";
import { Eye, Edit, Archive, Copy } from "lucide-react";
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [archiveConfirmAsset, setArchiveConfirmAsset] = useState<Asset | null>(null);
  const { toast } = useToast();
  const { currentWorkspace, assetTypes, statuses, locations, manufacturers, assignments, customers, user, getCustomFieldsForAssetType } = useAppContext();

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
    setIsEditModalOpen(false);
  };

  const fetchAssetDetails = useCallback(async (asset: Asset) => {
    try {
      setLoading(true);
      console.log(`Fetching details for asset ID: ${asset.id}`);

      const response = await apiRequest("GET", `/api/assets/${asset.id}`);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Asset details fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("Error fetching asset details:", error);
      toast({
        title: "Error loading asset details",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleEditAsset = async (asset: Asset) => {
    try {
      setLoading(true);
      setSelectedAsset(asset);

      const details = await fetchAssetDetails(asset);
      if (!details) {
        throw new Error("Failed to fetch asset details");
      }

      setAssetDetails(details);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Error preparing asset for edit:", error);
      toast({
        title: "Error",
        description: "Failed to prepare asset for editing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      enableSorting: true,
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
      header: "Serial Number / Asset ID",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="flex items-center">
          <span>{row.original.uniqueIdentifier}</span>
          <button
            className="ml-2 text-neutral-400 hover:text-primary-500 focus:outline-none"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(row.original.uniqueIdentifier);
              toast({
                title: "Copied!",
                description: "Serial number copied to clipboard",
              });
            }}
            aria-label="Copy serial number to clipboard"
          >
            <Copy size={14} />
          </button>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "manufacturer",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => {
        const asset = row.original;
        const manufacturer = manufacturers.find(m => m.id === asset.manufacturerId);
        return <div>{manufacturer?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const statusA = statuses.find(s => s.id === rowA.original.currentStatusId)?.name || "";
        const statusB = statuses.find(s => s.id === rowB.original.currentStatusId)?.name || "";
        return statusA.localeCompare(statusB);
      },
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
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const locationA = locations.find(l => l.id === rowA.original.currentLocationId)?.name || "";
        const locationB = locations.find(l => l.id === rowB.original.currentLocationId)?.name || "";
        return locationA.localeCompare(locationB);
      },
      cell: ({ row }) => {
        const asset = row.original;
        const location = locations.find(l => l.id === asset.currentLocationId);
        return <div>{location?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "customer",
      header: "Customer",
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const { customers } = useAppContext();
        const customerA = customers?.find(c => c.id === rowA.original.currentCustomerId)?.name || "";
        const customerB = customers?.find(c => c.id === rowB.original.currentCustomerId)?.name || "";
        return customerA.localeCompare(customerB);
      },
      cell: ({ row }) => {
        const asset = row.original;
        // Access customers from useAppContext
        const { customers } = useAppContext();
        const customer = customers?.find(c => c.id === asset.currentCustomerId);
        return <div>{customer?.name || "N/A"}</div>;
      },
    },
    {
      accessorKey: "dateAcquired",
      header: "Date Acquired",
      enableSorting: true,
      cell: ({ row }) => <div>{formatDate(row.original.dateAcquired)}</div>,
    },
    {
      accessorKey: "cost",
      header: "Value",
      enableSorting: true,
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
              <DropdownMenuItem onClick={() => handleEditAsset(row.original)}>
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
                // Remove the searchColumn prop to disable the redundant search bar
                // since we already have the global search in the header
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

      {isEditModalOpen && selectedAsset && assetDetails && (
        <EditAssetModal
          asset={selectedAsset}
          customFieldValues={assetDetails.customFieldValues || []}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={() => {
            setIsEditModalOpen(false);
            fetchAssets();
          }}
          assetTypes={assetTypes}
          manufacturers={manufacturers}
          statuses={statuses}
          locations={locations}
          assignments={assignments}
          customers={customers || []}
        />
      )}

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
