import { useState, useEffect, useCallback } from "react";
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
  CheckCircle, Circle, Wrench, AlertCircle, Link as LinkIcon,
  Copy, Clipboard
} from "lucide-react";
import { AssetRelationshipManager } from "@/components/asset-relationship-manager";
import { AssetModals } from "@/components/asset-modals";

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onAssetUpdated: () => void;
  onEditClick?: (assetDetails: any) => void;
  onQRCodeClick?: () => void;
}



export function AssetDetailModal({ asset, isOpen, onClose, onAssetUpdated, onEditClick, onQRCodeClick }: AssetDetailModalProps) {
  const {
    assetTypes,
    manufacturers,
    statuses,
    locations,
    assignments,
    getCustomFieldsForAssetType,
    user,
    customers // Add customers from context
  } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [assetDetails, setAssetDetails] = useState<{
    asset: Asset;
    customFieldValues: AssetCustomFieldValue[];
    logs: AssetLog[];
  } | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const { toast } = useToast();

  const fetchAssetDetails = useCallback(async () => {
    if (!asset || !isOpen) return;

    try {
      setLoading(true);
      console.log(`Fetching details for asset ID: ${asset.id}`);

      const response = await apiRequest("GET", `/api/assets/${asset.id}`);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Asset details fetched successfully:", data);
      setAssetDetails(data);

      // Fetch custom fields for this asset type
      console.log(`Fetching custom fields for asset type ID: ${asset.assetTypeId}`);
      const fields = await getCustomFieldsForAssetType(asset.assetTypeId);
      console.log("Custom fields fetched successfully:", fields);
      setCustomFields(fields);
    } catch (error) {
      console.error("Error fetching asset details:", error);
      toast({
        title: "Error loading asset details",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [asset, isOpen, getCustomFieldsForAssetType, toast]);

  useEffect(() => {
    if (isOpen && asset) {
      fetchAssetDetails();
    }
  }, [isOpen, asset, fetchAssetDetails]);

  if (!asset) return null;

  // Find related entities for the asset
  const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
  const manufacturer = manufacturers.find(m => m.id === asset.manufacturerId);
  const currentStatus = statuses.find(s => s.id === asset.currentStatusId);
  // These are used in the UI for displaying location and assignment info
  const currentLocation = locations.find(l => l.id === asset.currentLocationId);
  const currentAssignment = assignments.find(a => a.id === asset.currentAssignmentId);
  const currentCustomer = Array.isArray(customers) ? customers.find(c => c.id === asset.currentCustomerId) : null;

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

  const updateAssetCustomer = async (customerId: number | null) => {
    try {
      setLoading(true);
      await apiRequest("PATCH", `/api/assets/${asset.id}/customer`, {
        customerId,
        userId: user?.id
      });

      toast({
        title: "Customer updated",
        description: `Asset customer assignment has been updated successfully.`
      });

      onAssetUpdated();
    } catch (error) {
      console.error("Error updating asset customer:", error);
      toast({
        title: "Error",
        description: "Failed to update asset customer assignment.",
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
      case 'CUSTOMER_ASSIGNED':
        return <CheckCircle className="text-orange-700" size={16} />;
      case 'RELATIONSHIP_CREATED':
        return <LinkIcon className="text-blue-700" size={16} />;
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
                          <div className="flex items-center">
                            <span>Serial Number / Asset ID: {asset.uniqueIdentifier}</span>
                            <button
                              className="ml-2 text-neutral-400 hover:text-primary-500 focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(asset.uniqueIdentifier);
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
                        <h4 className="text-xs font-medium text-neutral-500 uppercase">Customer</h4>
                        <p className="text-sm text-neutral-800">{manufacturer.name}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-medium text-neutral-500 uppercase">Date Acquired</h4>
                      <p className="text-sm text-neutral-800">{formatDate(asset.dateAcquired)}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-neutral-500 uppercase">Value</h4>
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
                <div id="asset-activity-log" className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-medium text-neutral-900">Activity Log</h3>
                    {assetDetails?.logs && assetDetails.logs.length > 10 && (
                      <button
                        className="text-sm text-primary-600 hover:text-primary-800 focus:outline-none"
                        onClick={() => setShowAllLogs(!showAllLogs)}
                      >
                        {showAllLogs ? "Show Recent" : "Show All"}
                      </button>
                    )}
                  </div>

                  {assetDetails?.logs && assetDetails.logs.length > 0 ? (
                    <div className="space-y-4">
                      {(showAllLogs ? assetDetails.logs : assetDetails.logs.slice(0, 10)).map(log => (
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
                                {log.actionType === 'CUSTOMER_ASSIGNED' && 'Customer assigned'}
                                {log.actionType === 'RELATIONSHIP_CREATED' && 'Relationship created'}
                                {log.actionType === 'ARCHIVE' && 'Asset archived'}
                                {!['CREATE', 'UPDATE', 'UPDATE_STATUS', 'UPDATE_LOCATION', 'ASSIGNED', 'CUSTOMER_ASSIGNED', 'RELATIONSHIP_CREATED', 'ARCHIVE'].includes(log.actionType) && log.actionType}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-neutral-500">
                              <span>By {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.email || 'System')}</span>
                              <span className="mx-1">•</span>
                              <span>{formatDateTime(log.timestamp)}</span>
                            </div>
                            {log.detailsJson !== null && log.detailsJson !== undefined && (
                              <p className="mt-1 text-sm text-neutral-600">
                                {typeof log.detailsJson === 'string' || typeof log.detailsJson === 'number'
                                  ? log.detailsJson
                                  : (typeof log.detailsJson === 'object' && 'message' in log.detailsJson && typeof (log.detailsJson as any).message === 'string')
                                    ? (log.detailsJson as any).message
                                    : '' // Render empty string for other types
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      ))}

                      {!showAllLogs && assetDetails.logs.length > 10 && (
                        <div className="text-center pt-2">
                          <button
                            className="text-sm text-primary-600 hover:text-primary-800 focus:outline-none"
                            onClick={() => setShowAllLogs(true)}
                          >
                            Show {assetDetails.logs.length - 10} more entries...
                          </button>
                        </div>
                      )}
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
                          <span className="status-label" style={{ backgroundColor: status.color || undefined }}></span>
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
                  {currentLocation && (
                    <div className="mb-2 text-sm text-neutral-600">
                      Current: <span className="font-medium">{currentLocation.name}</span>
                    </div>
                  )}
                  <select
                    className="block w-full rounded-md border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={asset.currentLocationId?.toString() || "none"}
                    onChange={(e) => updateAssetLocation(e.target.value && e.target.value !== "none" ? Number(e.target.value) : null)}
                    disabled={loading}
                  >
                    <option value="none">Unassigned</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>{location.name}</option>
                    ))}
                  </select>
                </div>

                {/* Assignment */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-3">Assignment</h3>
                  {currentAssignment && (
                    <div className="mb-2 text-sm text-neutral-600">
                      Current: <span className="font-medium">{currentAssignment.name}</span>
                    </div>
                  )}
                  <select
                    className="block w-full rounded-md border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={asset.currentAssignmentId?.toString() || "none"}
                    onChange={(e) => updateAssetAssignment(e.target.value && e.target.value !== "none" ? Number(e.target.value) : null)}
                    disabled={loading}
                  >
                    <option value="none">Unassigned</option>
                    {assignments.map(assignment => (
                      <option key={assignment.id} value={assignment.id}>{assignment.name}</option>
                    ))}
                  </select>
                </div>

                {/* Customer */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 mb-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-3">End User</h3>
                  <select
                    className="block w-full rounded-md border-neutral-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:ring-primary-500"
                    value={asset.currentCustomerId?.toString() || "none"}
                    onChange={(e) => updateAssetCustomer(e.target.value && e.target.value !== "none" ? Number(e.target.value) : null)}
                    disabled={loading}
                  >
                    <option value="none">No Customer</option>
                    {customers?.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  {currentCustomer && (
                    <div className="mt-2 text-sm">
                      {currentCustomer.email && (
                        <div className="flex items-center text-neutral-600 mt-1">
                          <span className="material-icons text-neutral-400 mr-1" style={{ fontSize: "14px" }}>email</span>
                          <span>{currentCustomer.email}</span>
                        </div>
                      )}
                      {currentCustomer.phone && (
                        <div className="flex items-center text-neutral-600 mt-1">
                          <span className="material-icons text-neutral-400 mr-1" style={{ fontSize: "14px" }}>phone</span>
                          <span>{currentCustomer.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4">
                  <h3 className="text-base font-medium text-neutral-900 mb-3">Actions</h3>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => onEditClick && onEditClick(assetDetails)}
                      disabled={loading || !onEditClick}
                    >
                      <Edit className="mr-1 h-5 w-5" />
                      Edit Asset
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => onQRCodeClick && onQRCodeClick()}
                      disabled={loading || !onQRCodeClick}
                    >
                      <QrCode className="mr-1 h-5 w-5" />
                      Generate QR Code
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Show all logs instead of just the first 10
                        const historySection = document.getElementById('asset-activity-log');
                        if (historySection) {
                          historySection.scrollIntoView({ behavior: 'smooth' });
                        }

                        // Toggle showing all logs
                        setShowAllLogs(!showAllLogs);

                        toast({
                          title: showAllLogs ? "Showing recent logs" : "Showing all logs",
                          description: showAllLogs
                            ? "Displaying the 10 most recent logs"
                            : `Displaying all ${assetDetails?.logs?.length || 0} logs`
                        });
                      }}
                      disabled={loading}
                    >
                      <History className="mr-1 h-5 w-5" />
                      {showAllLogs ? "Show Recent Logs" : "View Full History"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full text-blue-700 border-blue-300 hover:bg-blue-50 hover:text-blue-800 mb-2"
                      onClick={() => setIsRelationshipModalOpen(true)}
                      disabled={loading}
                    >
                      <LinkIcon className="mr-1 h-5 w-5" />
                      Manage Relationships
                    </Button>

                    {/* Workflow Action Buttons (Placeholder) */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => toast({ title: "Action Needed", description: "Implement 'Mark as Shipped' functionality." })}
                      disabled={loading}
                    >
                      Mark as Shipped
                    </Button>
                     <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => toast({ title: "Action Needed", description: "Implement 'Initiate RMA' functionality." })}
                      disabled={loading}
                    >
                      Initiate RMA
                    </Button>
                     <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => toast({ title: "Action Needed", description: "Implement 'Mark as Returned' functionality." })}
                      disabled={loading}
                    >
                      Mark as Returned
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

      {/* Asset Relationship Manager */}
      {asset && (
        <AssetRelationshipManager
          assetId={asset.id}
          isOpen={isRelationshipModalOpen}
          onClose={() => setIsRelationshipModalOpen(false)}
          onRelationshipsUpdated={onAssetUpdated}
        />
      )}
    </Dialog>
  );
}
