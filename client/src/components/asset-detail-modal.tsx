import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Asset, AssetCustomFieldValue, AssetLog, CustomFieldDefinition } from "@shared/schema";
import { useAppContext } from "@/context/app-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime, formatCurrency, getIconForAssetType } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Archive, Edit, QrCode, History, BookmarkPlus, 
  CheckCircle, Circle, Wrench, AlertCircle
} from "lucide-react";

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onAssetUpdated: () => void;
}

export function AssetDetailModal({ asset, isOpen, onClose, onAssetUpdated }: AssetDetailModalProps) {
  const { assetTypes, manufacturers, statuses, locations, assignments, getCustomFieldsForAssetType, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [assetDetails, setAssetDetails] = useState<{
    asset: Asset;
    customFieldValues: AssetCustomFieldValue[];
    logs: AssetLog[];
  } | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssetDetails = async () => {
      if (!asset) return;
      
      try {
        setLoading(true);
        const response = await apiRequest("GET", `/api/assets/${asset.id}`);
        const data = await response.json();
        setAssetDetails(data);
        
        // Fetch custom fields for this asset type
        const fields = await getCustomFieldsForAssetType(asset.assetTypeId);
        setCustomFields(fields);
      } catch (error) {
        console.error("Error fetching asset details:", error);
        toast({
          title: "Error",
          description: "Failed to load asset details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && asset) {
      fetchAssetDetails();
    }
  }, [isOpen, asset, getCustomFieldsForAssetType, toast]);

  if (!asset) return null;

  const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
  const manufacturer = manufacturers.find(m => m.id === asset.manufacturerId);
  const currentStatus = statuses.find(s => s.id === asset.currentStatusId);
  const currentLocation = locations.find(l => l.id === asset.currentLocationId);
  const currentAssignment = assignments.find(a => a.id === asset.currentAssignmentId);

  const updateAssetStatus = async (statusId: number) => {
    try {
      setLoading(true);
      await apiRequest("PATCH", `/api/assets/${asset.id}/status`, {
        statusId,
        userId: user?.id
      });
      
      toast({
        title: "Status updated",
        description: `Asset status has been updated successfully.`
      });
      
      onAssetUpdated();
    } catch (error) {
      console.error("Error updating asset status:", error);
      toast({
        title: "Error",
        description: "Failed to update asset status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssetLocation = async (locationId: number | null) => {
    try {
      setLoading(true);
      await apiRequest("PATCH", `/api/assets/${asset.id}/location`, {
        locationId,
        userId: user?.id
      });
      
      toast({
        title: "Location updated",
        description: `Asset location has been updated successfully.`
      });
      
      onAssetUpdated();
    } catch (error) {
      console.error("Error updating asset location:", error);
      toast({
        title: "Error",
        description: "Failed to update asset location.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAssetAssignment = async (assignmentId: number | null) => {
    try {
      setLoading(true);
      await apiRequest("PATCH", `/api/assets/${asset.id}/assignment`, {
        assignmentId,
        userId: user?.id
      });
      
      toast({
        title: "Assignment updated",
        description: `Asset assignment has been updated successfully.`
      });
      
      onAssetUpdated();
    } catch (error) {
      console.error("Error updating asset assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update asset assignment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const archiveAsset = async () => {
    try {
      setLoading(true);
      await apiRequest("PATCH", `/api/assets/${asset.id}/archive`, {
        userId: user?.id
      });
      
      toast({
        title: "Asset archived",
        description: `Asset has been archived successfully.`
      });
      
      onAssetUpdated();
    } catch (error) {
      console.error("Error archiving asset:", error);
      toast({
        title: "Error",
        description: "Failed to archive asset.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomFieldValue = (fieldId: number) => {
    if (!assetDetails) return null;
    
    const fieldValue = assetDetails.customFieldValues.find(
      v => v.fieldDefinitionId === fieldId
    );
    
    if (!fieldValue) return null;
    
    // Find the definition to determine the field type
    const fieldDef = customFields.find(f => f.id === fieldId);
    if (!fieldDef) return null;
    
    switch (fieldDef.fieldType) {
      case 'Text':
        return fieldValue.textValue;
      case 'Number':
        return fieldValue.numberValue;
      case 'Date':
        return fieldValue.dateValue ? formatDate(fieldValue.dateValue) : null;
      case 'Boolean':
        return fieldValue.booleanValue ? 'Yes' : 'No';
      default:
        return fieldValue.textValue;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE':
        return <Circle className="text-green-700" size={16} />;
      case 'UPDATE':
        return <Edit className="text-blue-700" size={16} />;
      case 'UPDATE_STATUS':
        return <CheckCircle className="text-green-700" size={16} />;
      case 'UPDATE_LOCATION':
        return <BookmarkPlus className="text-blue-700" size={16} />;
      case 'ASSIGNED':
        return <CheckCircle className="text-purple-700" size={16} />;
      case 'ARCHIVE':
        return <Archive className="text-red-700" size={16} />;
      default:
        return <Circle className="text-neutral-700" size={16} />;
    }
  };

  const getStatusButtonClass = (status: string) => {
    const isSelected = currentStatus?.name === status;
    
    if (status === "Available") {
      return isSelected 
        ? "bg-neutral-100 text-neutral-800 border-2 border-neutral-300" 
        : "bg-white hover:bg-neutral-50 border border-neutral-300";
    } else if (status === "In Use") {
      return isSelected 
        ? "bg-green-100 text-green-800 border-2 border-green-300" 
        : "bg-white hover:bg-neutral-50 border border-neutral-300";
    } else if (status === "In Maintenance") {
      return isSelected 
        ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300" 
        : "bg-white hover:bg-neutral-50 border border-neutral-300";
    } else if (status === "Requires Attention") {
      return isSelected 
        ? "bg-red-100 text-red-800 border-2 border-red-300" 
        : "bg-white hover:bg-neutral-50 border border-neutral-300";
    }
    
    return isSelected 
      ? "bg-blue-100 text-blue-800 border-2 border-blue-300" 
      : "bg-white hover:bg-neutral-50 border border-neutral-300";
  };

  const icon = getIconForAssetType(assetType?.name);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
        aria-describedby="asset-details-dialog-description"
      >
        <DialogHeader className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-neutral-900">Asset Details</DialogTitle>
          <p id="asset-details-dialog-description" className="sr-only">View and manage details for this asset</p>
        </DialogHeader>
        
        {loading ? (
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i}>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div className="flex" key={i}>
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-5 w-48 mb-1" />
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Skeleton className="h-64 w-full mb-4" />
                <Skeleton className="h-40 w-full mb-4" />
                <Skeleton className="h-40 w-full mb-4" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <span className="material-icons text-primary-600">{icon}</span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-neutral-900">{asset.name}</h3>
                        <div className="flex items-center text-sm text-neutral-500">
                          <span>{assetType?.name || "Unknown Type"}</span>
                          <span className="mx-2">•</span>
                          <span>ID: {asset.uniqueIdentifier}</span>
                        </div>
                      </div>
                    </div>
                    {currentStatus && (
                      <span 
                        className={`text-sm px-3 py-1 font-medium rounded-full ${
                          currentStatus.name.toLowerCase().includes("available") ? "bg-neutral-100 text-neutral-800" :
                          currentStatus.name.toLowerCase().includes("in use") ? "bg-green-100 text-green-800" :
                          currentStatus.name.toLowerCase().includes("maintenance") ? "bg-yellow-100 text-yellow-800" :
                          currentStatus.name.toLowerCase().includes("attention") ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {currentStatus.name}
                      </span>
                    )}
                  </div>
                  
                  {/* Asset Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {manufacturer && (
                      <div>
                        <h4 className="text-xs font-medium text-neutral-500 uppercase">Manufacturer</h4>
                        <p className="text-sm text-neutral-800">{manufacturer.name}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-medium text-neutral-500 uppercase">Date Acquired</h4>
                      <p className="text-sm text-neutral-800">{formatDate(asset.dateAcquired)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-neutral-500 uppercase">Cost</h4>
                      <p className="text-sm text-neutral-800">{formatCurrency(asset.cost)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-neutral-500 uppercase">Created At</h4>
                      <p className="text-sm text-neutral-800">{formatDate(asset.createdAt)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-neutral-500 uppercase">Last Updated</h4>
                      <p className="text-sm text-neutral-800">{formatDate(asset.updatedAt)}</p>
                    </div>
                    
                    {/* Render custom fields */}
                    {customFields.map(field => (
                      <div key={field.id}>
                        <h4 className="text-xs font-medium text-neutral-500 uppercase">{field.fieldName}</h4>
                        <p className="text-sm text-neutral-800">{getCustomFieldValue(field.id) || 'N/A'}</p>
                      </div>
                    ))}
                  </div>

                  {asset.notes && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <h4 className="text-xs font-medium text-neutral-500 uppercase mb-1">Notes</h4>
                      <p className="text-sm text-neutral-700">{asset.notes}</p>
                    </div>
                  )}
                </div>
                
                {/* Activity Log */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-4">Activity Log</h3>
                  
                  {assetDetails?.logs && assetDetails.logs.length > 0 ? (
                    <div className="space-y-4">
                      {assetDetails.logs.slice(0, 10).map(log => (
                        <div className="flex" key={log.id}>
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              {getActionIcon(log.actionType)}
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm">
                              <span className="font-medium text-neutral-900">
                                {log.actionType === 'CREATE' && 'Asset created'}
                                {log.actionType === 'UPDATE' && 'Asset updated'}
                                {log.actionType === 'UPDATE_STATUS' && 'Status changed'}
                                {log.actionType === 'UPDATE_LOCATION' && 'Location changed'}
                                {log.actionType === 'ASSIGNED' && 'Assignment changed'}
                                {log.actionType === 'ARCHIVE' && 'Asset archived'}
                                {!['CREATE', 'UPDATE', 'UPDATE_STATUS', 'UPDATE_LOCATION', 'ASSIGNED', 'ARCHIVE'].includes(log.actionType) && log.actionType}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-neutral-500">
                              <span>By {user?.displayName || 'System'}</span>
                              <span className="mx-1">•</span>
                              <span>{formatDateTime(log.timestamp)}</span>
                            </div>
                            {log.detailsJson && (
                              <p className="mt-1 text-sm text-neutral-600">
                                {log.detailsJson.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">No activity logs available.</p>
                  )}
                </div>
              </div>
              
              {/* Right Column - Status, Location, Assignment */}
              <div>
                {/* Status */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-3">Status</h3>
                  <div className="space-y-2">
                    {statuses.map(status => (
                      <button 
                        key={status.id}
                        onClick={() => updateAssetStatus(status.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${getStatusButtonClass(status.name)}`}
                        disabled={loading}
                      >
                        <div className="flex items-center">
                          <span className="status-label" style={{ backgroundColor: status.color }}></span>
                          {status.name}
                        </div>
                        {currentStatus?.id === status.id && (
                          <span className="material-icons text-inherit" style={{ fontSize: "18px" }}>check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Location */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-3">Location</h3>
                  <select 
                    className="block w-full rounded-md border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={asset.currentLocationId?.toString() || ""}
                    onChange={(e) => updateAssetLocation(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading}
                  >
                    <option value="">Unassigned</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Assignment */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-3">Assignment</h3>
                  <select 
                    className="block w-full rounded-md border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={asset.currentAssignmentId?.toString() || ""}
                    onChange={(e) => updateAssetAssignment(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading}
                  >
                    <option value="">Unassigned</option>
                    {assignments.map(assignment => (
                      <option key={assignment.id} value={assignment.id}>{assignment.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Actions */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-3">Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full">
                      <Edit className="mr-1 h-5 w-5" />
                      Edit Asset
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <QrCode className="mr-1 h-5 w-5" />
                      Generate QR Code
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <History className="mr-1 h-5 w-5" />
                      View Full History
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800"
                      onClick={archiveAsset}
                      disabled={loading}
                    >
                      <Archive className="mr-1 h-5 w-5" />
                      Archive Asset
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
