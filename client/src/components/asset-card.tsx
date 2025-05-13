import { getIconForAssetType, formatCurrency, formatDate } from "@/lib/utils";
import { Asset, AssetCustomFieldValue, CustomFieldDefinition } from "@shared/schema";
import { useAppContext } from "@/context/app-context";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Building, Calendar, DollarSign, Tag, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AssetCardProps {
  asset: Asset;
  customFieldValues?: AssetCustomFieldValue[];
}

export function AssetCard({ asset, customFieldValues }: AssetCardProps) {
  const { assetTypes, statuses, locations, manufacturers, assignments, customers, getCustomFieldsForAssetType } = useAppContext();
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [assetCustomValues, setAssetCustomValues] = useState<AssetCustomFieldValue[]>([]);
  const [displayPreferences, setDisplayPreferences] = useState<{[key: string]: boolean}>({
    serialNumber: true,
    manufacturer: true,
    location: true,
    assignment: true,
    customer: true,
    dateAcquired: true,
    cost: true
  });

  const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
  const status = statuses.find(s => s.id === asset.currentStatusId);
  const location = locations.find(l => l.id === asset.currentLocationId);
  const manufacturer = manufacturers.find(m => m.id === asset.manufacturerId);
  const assignment = assignments.find(a => a.id === asset.currentAssignmentId);
  const customer = Array.isArray(customers) ? customers.find(c => c.id === asset.currentCustomerId) : null;

  // Load display preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('assetCardDisplayPreferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setDisplayPreferences(parsedPreferences);
      } catch (e) {
        console.error('Error parsing display preferences:', e);
      }
    }
  }, []);

  // Load custom fields for this asset type
  useEffect(() => {
    if (asset.assetTypeId) {
      const loadCustomFields = async () => {
        try {
          const fields = await getCustomFieldsForAssetType(asset.assetTypeId);
          setCustomFields(fields.filter(field => field.isVisibleOnCard));
        } catch (error) {
          console.error('Error loading custom fields:', error);
        }
      };

      loadCustomFields();
    }
  }, [asset.assetTypeId, getCustomFieldsForAssetType]);

  // Load custom field values for this asset
  useEffect(() => {
    if (customFieldValues) {
      setAssetCustomValues(customFieldValues);
    } else {
      const loadCustomFieldValues = async () => {
        try {
          const response = await apiRequest('GET', `/api/assets/${asset.id}/custom-field-values`);
          const values = await response.json();
          setAssetCustomValues(values);
        } catch (error) {
          console.error('Error loading custom field values:', error);
        }
      };

      loadCustomFieldValues();
    }
  }, [asset.id, customFieldValues]);

  // Helper function to get custom field value
  const getCustomFieldValue = (fieldId: number) => {
    const fieldValue = assetCustomValues.find(v => v.fieldDefinitionId === fieldId);
    if (!fieldValue) return null;

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

  const getStatusColor = () => {
    if (!status) return "bg-neutral-100 text-neutral-800 border-neutral-200";

    if (status.color) return status.color;

    const statusName = status.name.toLowerCase();
    if (statusName.includes("available")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (statusName.includes("in use")) return "bg-green-100 text-green-800 border-green-200";
    if (statusName.includes("maintenance")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (statusName.includes("attention") || statusName.includes("issue") || statusName.includes("critical")) {
      return "bg-red-100 text-red-800 border-red-200";
    }

    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const icon = getIconForAssetType(assetType?.name);

  return (
    <div className="bg-white border border-neutral-200 shadow-sm rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-xl hover:scale-[1.02] dark:bg-neutral-700 dark:border-neutral-600 dark:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div>
            <h4 className="text-sm font-medium text-foreground line-clamp-1">{asset.name}</h4>
            {displayPreferences.serialNumber && asset.uniqueIdentifier ? (
              <div className="flex items-center mt-1 bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                <Tag className="h-3 w-3 text-primary mr-1" />
                <p className="text-xs font-mono font-medium text-primary">{asset.uniqueIdentifier}</p>
              </div>
            ) : displayPreferences.serialNumber ? ( // This fallback might be redundant if uniqueIdentifier is always shown when serialNumber pref is true
              <div className="flex items-center mt-1">
                <Tag className="h-3 w-3 text-muted-foreground mr-1" />
                <p className="text-xs text-muted-foreground">{asset.uniqueIdentifier}</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="ml-2">
          {status && (
            <Badge variant="outline" className={`${getStatusColor()}`}>
              {status.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-600 grid grid-cols-2 gap-2">
        {displayPreferences.manufacturer && manufacturer && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Building className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
            <span className="truncate">{manufacturer.name}</span>
          </div>
        )}
        {displayPreferences.location && location && (
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
            <span className="truncate">{location.name}</span>
          </div>
        )}
        {displayPreferences.assignment && assignment && (
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
            <span className="truncate">{assignment.name}</span>
          </div>
        )}
        {displayPreferences.customer && customer && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
            <span className="truncate">{customer.name}</span>
          </div>
        )}
        {displayPreferences.dateAcquired && asset.dateAcquired && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
            <span className="truncate">{formatDate(asset.dateAcquired)}</span>
          </div>
        )}
        {displayPreferences.cost && asset.cost && (
          <div className="flex items-center text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0" />
            <span className="truncate">{formatCurrency(asset.cost)}</span>
          </div>
        )}

        {/* Render custom fields that are marked as visible on card */}
        {customFields.map(field => {
          const value = getCustomFieldValue(field.id);
          if (!value) return null;

          return (
            <div key={field.id} className="flex items-center text-xs text-muted-foreground">
              <span className="h-3 w-3 text-muted-foreground mr-1 flex-shrink-0">•</span>
              <span className="font-medium mr-1">{field.fieldName}:</span>
              <span className="truncate">{value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
