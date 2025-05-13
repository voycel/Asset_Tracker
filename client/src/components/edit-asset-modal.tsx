import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AssetType,
  Manufacturer,
  Status,
  Location,
  Assignment,
  CustomFieldDefinition,
  insertAssetSchema,
  Asset,
  AssetCustomFieldValue,
  Customer // Import Customer type
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface EditAssetModalProps {
  asset: Asset | null;
  customFieldValues?: AssetCustomFieldValue[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: Asset) => void;
  assetTypes: AssetType[];
  manufacturers: Manufacturer[];
  statuses: Status[];
  locations: Location[];
  assignments: Assignment[];
  customers: Customer[]; // Add customers to props
}

export function EditAssetModal({
  asset,
  customFieldValues = [],
  isOpen,
  onClose,
  onSubmit,
  assetTypes,
  manufacturers,
  statuses,
  locations,
  assignments,
  customers, // Destructure customers from props
}: EditAssetModalProps) {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [customFieldValuesState, setCustomFieldValuesState] = useState<{ [fieldId: number]: any }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, getCustomFieldsForAssetType } = useAppContext();

  // Extend the insert schema
  const extendedSchema = insertAssetSchema.extend({
    uniqueIdentifier: z.string().min(1, "Asset ID is required"),
    name: z.string().min(1, "Asset name is required"),
    // The dateAcquired field will be handled by the server schema's union type
    currentCustomerId: z.number().optional().nullable(), // Add currentCustomerId to schema
  });

  type FormData = z.infer<typeof extendedSchema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      workspaceId: user?.workspaceId || undefined,
      uniqueIdentifier: "",
      name: "",
      dateAcquired: undefined, // Set default to undefined or null
      cost: "",
      notes: "",
      isArchived: false,
      currentCustomerId: undefined, // Add default value for currentCustomerId
    },
  });

  const assetTypeId = watch("assetTypeId");

  // Load asset data when modal opens
  useEffect(() => {
    if (isOpen && asset) {
      // Set form values from asset
      setValue("workspaceId", asset.workspaceId);
      setValue("assetTypeId", asset.assetTypeId);
      setValue("uniqueIdentifier", asset.uniqueIdentifier);
      setValue("name", asset.name);
      setValue("manufacturerId", asset.manufacturerId);
      // Set dateAcquired as Date object or undefined
      setValue("dateAcquired", asset.dateAcquired ? new Date(asset.dateAcquired) : undefined);
      setValue("cost", asset.cost?.toString() || "");
      setValue("notes", asset.notes || "");
      setValue("currentStatusId", asset.currentStatusId);
      setValue("currentLocationId", asset.currentLocationId);
      setValue("currentAssignmentId", asset.currentAssignmentId);
      setValue("currentCustomerId", asset.currentCustomerId); // Set currentCustomerId

      // Set selected asset type
      const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
      setSelectedAssetType(assetType || null);

      // Load custom fields for this asset type
      if (asset.assetTypeId) {
        loadCustomFields(asset.assetTypeId);
      }

      // Set custom field values
      const fieldValues: { [fieldId: number]: any } = {};
      customFieldValues.forEach(cfv => {
        if (cfv.fieldDefinitionId) {
          if (cfv.textValue !== null) fieldValues[cfv.fieldDefinitionId] = cfv.textValue;
          if (cfv.numberValue !== null) fieldValues[cfv.fieldDefinitionId] = cfv.numberValue;
          if (cfv.dateValue !== null) fieldValues[cfv.fieldDefinitionId] = new Date(cfv.dateValue).toISOString().split("T")[0];
          if (cfv.booleanValue !== null) fieldValues[cfv.fieldDefinitionId] = cfv.booleanValue;
        }
      });
      setCustomFieldValuesState(fieldValues);
    }
  }, [isOpen, asset, assetTypes, customFieldValues, setValue]);

  const loadCustomFields = async (assetTypeId: number) => {
    try {
      const fields = await getCustomFieldsForAssetType(assetTypeId);
      setCustomFields(fields);
    } catch (error) {
      console.error("Error loading custom fields:", error);
      toast({
        title: "Error",
        description: "Failed to load custom fields for this asset type.",
        variant: "destructive",
      });
    }
  };

  // Handle asset type change
  useEffect(() => {
    if (assetTypeId) {
      const assetType = assetTypes.find(at => at.id === assetTypeId);
      setSelectedAssetType(assetType || null);
      loadCustomFields(assetTypeId);
    }
  }, [assetTypeId, assetTypes, getCustomFieldsForAssetType]);

  const handleCustomFieldChange = (fieldId: number, value: any) => {
    setCustomFieldValuesState(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const processFormSubmit = async (data: FormData) => {
    if (!asset) return;

    try {
      setLoading(true);

      // The dateAcquired is already a Date object or undefined due to schema transform
      // No need to create a new Date object here

      const formattedData = {
        ...data,
        cost: data.cost ? data.cost.toString() : "",
        userId: user?.id,
      };

      // Update the asset
      const response = await apiRequest("PUT", `/api/assets/${asset.id}`, formattedData);

      if (!response.ok) {
        throw new Error("Failed to update asset");
      }

      const updatedAsset = await response.json();

      // Update custom field values if any
      const customFieldPromises = Object.entries(customFieldValuesState).map(([fieldId, value]) => {
        const fieldDef = customFields.find(f => f.id === parseInt(fieldId));
        if (!fieldDef) return null;

        let fieldValue: any = {};
        fieldValue.assetId = asset.id;
        fieldValue.fieldDefinitionId = parseInt(fieldId);

        switch (fieldDef.fieldType) {
          case 'Text':
            fieldValue.textValue = value;
            break;
          case 'Number':
            fieldValue.numberValue = parseFloat(value);
            break;
          case 'Date':
            fieldValue.dateValue = new Date(value);
            break;
          case 'Boolean':
            fieldValue.booleanValue = Boolean(value);
            break;
        }

        // Find if this custom field value already exists
        const existingValue = customFieldValues.find(cfv => cfv.fieldDefinitionId === parseInt(fieldId));

        if (existingValue) {
          // Update existing value
          return apiRequest("PUT", `/api/asset-custom-field-values/${existingValue.id}`, fieldValue);
        } else {
          // Create new value
          return apiRequest("POST", "/api/asset-custom-field-values", fieldValue);
        }
      });

      await Promise.all(customFieldPromises.filter(Boolean));

      toast({
        title: "Asset updated",
        description: `Asset "${data.name}" has been updated successfully.`,
      });

      // Call onSubmit callback
      onSubmit(updatedAsset);
    } catch (error) {
      console.error("Error updating asset:", error);
      toast({
        title: "Error",
        description: "Failed to update asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0"
        aria-describedby="asset-dialog-description"
      >
        <DialogHeader className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-neutral-900">Edit Asset</DialogTitle>
          <p id="asset-dialog-description" className="sr-only">Form to edit asset details</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(processFormSubmit)}>
            {/* Asset Type Selection */}
            <div className="border-b border-neutral-200 pb-6 mb-6">
              <Label htmlFor="assetType" className="block text-sm font-medium text-neutral-700 mb-1">
                Asset Type
              </Label>
              <Select
                value={assetTypeId?.toString()}
                onValueChange={(value) => setValue("assetTypeId", parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select asset type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assetTypeId && (
                <p className="text-sm text-red-500 mt-1">{errors.assetTypeId.message}</p>
              )}
              <p className="mt-1 text-sm text-neutral-500">
                This determines which custom fields will be available
              </p>
            </div>

            {/* Basic Information */}
            <div className="border-b border-neutral-200 pb-6 mb-6">
              <h3 className="text-md font-medium text-neutral-900 mb-4">Basic Information</h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="assetName" className="block text-sm font-medium text-neutral-700 mb-1">
                    Asset Name
                  </Label>
                  <Input
                    id="assetName"
                    placeholder="Asset Name"
                    {...register("name")}
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between">
                    <Label htmlFor="assetId" className="block text-sm font-medium text-neutral-700 mb-1">
                      Serial Number / Asset ID
                    </Label>
                  </div>
                  <Input
                    id="assetId"
                    placeholder="LP-2023-0042"
                    {...register("uniqueIdentifier")}
                    disabled={loading}
                  />
                  {errors.uniqueIdentifier && (
                    <p className="text-sm text-red-500 mt-1">{errors.uniqueIdentifier.message}</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">Unique identifier for this asset</p>
                </div>

                <div>
                  <Label htmlFor="manufacturer" className="block text-sm font-medium text-neutral-700 mb-1">
                    Customer
                  </Label>
                  <Select
                    value={watch("manufacturerId")?.toString() || "none"}
                    onValueChange={(value) => setValue("manufacturerId", value && value !== "none" ? parseInt(value) : undefined)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateAcquired" className="block text-sm font-medium text-neutral-700 mb-1">
                    Date Acquired
                  </Label>
                  <Input
                    id="dateAcquired"
                    type="date"
                    {...register("dateAcquired")}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="cost" className="block text-sm font-medium text-neutral-700 mb-1">
                    Value
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("cost")}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </Label>
                  <Select
                    value={watch("currentStatusId")?.toString() || "none"}
                    onValueChange={(value) => setValue("currentStatusId", value && value !== "none" ? parseInt(value) : undefined)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Selection */}
                <div>
                  <Label htmlFor="customer" className="block text-sm font-medium text-neutral-700 mb-1">
                    End User
                  </Label>
                  <Select
                    value={watch("currentCustomerId")?.toString() || "none"}
                    onValueChange={(value) => setValue("currentCustomerId", value && value !== "none" ? parseInt(value) : undefined)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Customer</SelectItem>
                      {Array.isArray(customers) && customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Add any additional information about this asset..."
                  {...register("notes")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div className="border-b border-neutral-200 pb-6 mb-6">
                <h3 className="text-md font-medium text-neutral-900 mb-4">Custom Fields</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <Label
                        htmlFor={`custom-${field.id}`}
                        className="block text-sm font-medium text-neutral-700 mb-1"
                      >
                        {field.fieldName}
                      </Label>
                      {field.fieldType === 'Text' && (
                        <Input
                          id={`custom-${field.id}`}
                          value={customFieldValuesState[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          disabled={loading}
                        />
                      )}
                      {field.fieldType === 'Number' && (
                        <Input
                          id={`custom-${field.id}`}
                          type="number"
                          value={customFieldValuesState[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          disabled={loading}
                        />
                      )}
                      {field.fieldType === 'Date' && (
                        <Input
                          id={`custom-${field.id}`}
                          type="date"
                          value={customFieldValuesState[field.id] || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                          disabled={loading}
                        />
                      )}
                      {field.fieldType === 'Boolean' && (
                        <Select
                          value={customFieldValuesState[field.id]?.toString() || "false"}
                          onValueChange={(value) => handleCustomFieldChange(field.id, value === "true")}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
