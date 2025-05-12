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
  Asset
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { generateRandomId } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (asset: Asset) => void;
  assetTypes: AssetType[];
  manufacturers: Manufacturer[];
  statuses: Status[];
  locations: Location[];
  assignments: Assignment[];
}

export function NewAssetModal({
  isOpen,
  onClose,
  onSubmit,
  assetTypes,
  manufacturers,
  statuses,
  locations,
  assignments,
}: NewAssetModalProps) {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<{ [fieldId: number]: any }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, getCustomFieldsForAssetType } = useAppContext();

  // Extend the insert schema
  const extendedSchema = insertAssetSchema.extend({
    uniqueIdentifier: z.string().min(1, "Asset ID is required"),
    name: z.string().min(1, "Asset name is required"),
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
      uniqueIdentifier: generateRandomId("AST"),
      name: "",
      dateAcquired: new Date().toISOString().split("T")[0],
      cost: "",
      notes: "",
      isArchived: false,
    },
  });

  const assetTypeId = watch("assetTypeId");

  // When asset type changes, load its custom fields
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!assetTypeId) {
        setCustomFields([]);
        setSelectedAssetType(null);
        return;
      }

      const selectedType = assetTypes.find(type => type.id === Number(assetTypeId));
      setSelectedAssetType(selectedType || null);

      try {
        const fields = await getCustomFieldsForAssetType(Number(assetTypeId));
        setCustomFields(fields);
        // Reset custom field values when asset type changes
        setCustomFieldValues({});
      } catch (error) {
        console.error("Error loading custom fields:", error);
        toast({
          title: "Error",
          description: "Failed to load custom fields for this asset type.",
          variant: "destructive",
        });
      }
    };

    if (assetTypeId) {
      loadCustomFields();
    }
  }, [assetTypeId, assetTypes, getCustomFieldsForAssetType, toast]);

  const handleCustomFieldChange = (fieldId: number, value: any, fieldType: string) => {
    let processedValue = value;
    
    // Process value based on field type
    if (fieldType === 'Number' && value !== '') {
      processedValue = parseFloat(value);
    } else if (fieldType === 'Boolean') {
      processedValue = value === 'true';
    }
    
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: processedValue
    }));
  };

  const processFormSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      // Create the asset
      const response = await apiRequest("POST", "/api/assets", {
        ...data,
        cost: data.cost ? data.cost.toString() : "",
        userId: user?.id,
      });
      
      if (!response.ok) {
        throw new Error("Failed to create asset");
      }
      
      const createdAsset = await response.json();
      
      // Create custom field values if any
      const customFieldPromises = Object.entries(customFieldValues).map(([fieldId, value]) => {
        const fieldDef = customFields.find(f => f.id === parseInt(fieldId));
        if (!fieldDef) return null;
        
        let fieldValue: any = {};
        
        switch (fieldDef.fieldType) {
          case 'Text':
            fieldValue = { 
              assetId: createdAsset.id, 
              fieldDefinitionId: parseInt(fieldId), 
              textValue: value 
            };
            break;
          case 'Number':
            fieldValue = { 
              assetId: createdAsset.id, 
              fieldDefinitionId: parseInt(fieldId), 
              numberValue: value?.toString() 
            };
            break;
          case 'Date':
            fieldValue = { 
              assetId: createdAsset.id, 
              fieldDefinitionId: parseInt(fieldId), 
              dateValue: value 
            };
            break;
          case 'Boolean':
            fieldValue = { 
              assetId: createdAsset.id, 
              fieldDefinitionId: parseInt(fieldId), 
              booleanValue: value === true || value === 'true' 
            };
            break;
          default:
            fieldValue = { 
              assetId: createdAsset.id, 
              fieldDefinitionId: parseInt(fieldId), 
              textValue: value 
            };
        }
        
        return apiRequest("POST", "/api/assets/custom-fields", fieldValue);
      });
      
      await Promise.all(customFieldPromises.filter(Boolean));
      
      toast({
        title: "Asset created",
        description: `Asset "${data.name}" has been created successfully.`,
      });
      
      // Reset form
      reset();
      setCustomFieldValues({});
      
      // Call onSubmit callback
      onSubmit(createdAsset);
    } catch (error) {
      console.error("Error creating asset:", error);
      toast({
        title: "Error",
        description: "Failed to create asset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewAssetId = () => {
    setValue("uniqueIdentifier", generateRandomId(selectedAssetType?.name?.substring(0, 3).toUpperCase() || "AST"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-neutral-900">Add New Asset</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(processFormSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Asset Type Selection */}
            <div className="mb-6">
              <Label htmlFor="assetType" className="block text-sm font-medium text-neutral-700 mb-1">
                Asset Type
              </Label>
              <Select
                onValueChange={(value) => setValue("assetTypeId", parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger id="assetType" className="w-full">
                  <SelectValue placeholder="Select Asset Type" />
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
                    placeholder="MacBook Pro 16-inch"
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
                      Asset ID
                    </Label>
                    <button 
                      type="button" 
                      onClick={generateNewAssetId}
                      className="text-xs text-primary-600 hover:text-primary-800"
                      disabled={loading || !selectedAssetType}
                    >
                      Generate ID
                    </button>
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
                    Manufacturer
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("manufacturerId", parseInt(value))}
                    disabled={loading}
                  >
                    <SelectTrigger id="manufacturer" className="w-full">
                      <SelectValue placeholder="Select Manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id.toString()}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="purchaseDate" className="block text-sm font-medium text-neutral-700 mb-1">
                    Purchase Date
                  </Label>
                  <Input 
                    id="purchaseDate" 
                    type="date" 
                    {...register("dateAcquired")}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cost" className="block text-sm font-medium text-neutral-700 mb-1">
                    Cost
                  </Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-neutral-500 sm:text-sm">$</span>
                    </div>
                    <Input 
                      id="cost" 
                      className="pl-7" 
                      placeholder="0.00"
                      {...register("cost")}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dynamic Custom Fields */}
            {selectedAssetType && customFields.length > 0 && (
              <div className="border-b border-neutral-200 pb-6 mb-6">
                <h3 className="text-md font-medium text-neutral-900 mb-4">
                  {selectedAssetType.name} Specific Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <Label 
                        htmlFor={`field_${field.id}`} 
                        className="block text-sm font-medium text-neutral-700 mb-1"
                      >
                        {field.fieldName}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {field.fieldType === 'Text' && (
                        <Input
                          id={`field_${field.id}`}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.fieldType)}
                          disabled={loading}
                          required={field.isRequired}
                        />
                      )}
                      
                      {field.fieldType === 'Number' && (
                        <Input
                          id={`field_${field.id}`}
                          type="number"
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.fieldType)}
                          disabled={loading}
                          required={field.isRequired}
                        />
                      )}
                      
                      {field.fieldType === 'Date' && (
                        <Input
                          id={`field_${field.id}`}
                          type="date"
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.fieldType)}
                          disabled={loading}
                          required={field.isRequired}
                        />
                      )}
                      
                      {field.fieldType === 'Boolean' && (
                        <Select
                          value={customFieldValues[field.id]?.toString() || "false"}
                          onValueChange={(value) => handleCustomFieldChange(field.id, value, field.fieldType)}
                          disabled={loading}
                        >
                          <SelectTrigger id={`field_${field.id}`} className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {field.fieldType === 'Dropdown' && field.dropdownOptions && (
                        <Select
                          value={customFieldValues[field.id] || (field.dropdownOptions && field.dropdownOptions.length > 0 ? field.dropdownOptions[0] : "default")}
                          onValueChange={(value) => handleCustomFieldChange(field.id, value, field.fieldType)}
                          disabled={loading}
                        >
                          <SelectTrigger id={`field_${field.id}`} className="w-full">
                            <SelectValue placeholder="Select Option" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.dropdownOptions.map((option, index) => (
                              <SelectItem key={index} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Status, Location, Assignment */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-neutral-900 mb-4">Tracking Information</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
                    Status
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("currentStatusId", parseInt(value))}
                    disabled={loading}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select Status" />
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
                
                <div>
                  <Label htmlFor="location" className="block text-sm font-medium text-neutral-700 mb-1">
                    Location
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("currentLocationId", parseInt(value))}
                    disabled={loading}
                  >
                    <SelectTrigger id="location" className="w-full">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="sm:col-span-2">
                  <Label htmlFor="assignment" className="block text-sm font-medium text-neutral-700 mb-1">
                    Assigned To
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("currentAssignmentId", value === "none" ? null : parseInt(value))}
                    disabled={loading}
                  >
                    <SelectTrigger id="assignment" className="w-full">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {assignments.map((assignment) => (
                        <SelectItem key={assignment.id} value={assignment.id.toString()}>
                          {assignment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="sm:col-span-2">
                  <Label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Additional information about this asset..."
                    {...register("notes")}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-neutral-200">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
