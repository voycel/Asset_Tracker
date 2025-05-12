import { getIconForAssetType, formatCurrency, formatDate } from "@/lib/utils";
import { Asset } from "@shared/schema";
import { useAppContext } from "@/context/app-context";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Building, Calendar, DollarSign, Tag } from "lucide-react";

interface AssetCardProps {
  asset: Asset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const { assetTypes, statuses, locations, manufacturers, assignments } = useAppContext();

  const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
  const status = statuses.find(s => s.id === asset.currentStatusId);
  const location = locations.find(l => l.id === asset.currentLocationId);
  const manufacturer = manufacturers.find(m => m.id === asset.manufacturerId);
  const assignment = assignments.find(a => a.id === asset.currentAssignmentId);

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
    <div className="bg-white border border-neutral-200 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2">
              <span className="material-icons text-blue-500" style={{ fontSize: "18px" }}>
                {icon}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-800 line-clamp-1">{asset.name}</h4>
              <div className="flex items-center mt-1">
                <Tag className="h-3 w-3 text-neutral-400 mr-1" />
                <p className="text-xs text-neutral-500">{asset.uniqueIdentifier}</p>
              </div>
            </div>
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

      <div className="mt-3 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-2">
        {manufacturer && (
          <div className="flex items-center text-xs text-neutral-600">
            <Building className="h-3 w-3 text-neutral-400 mr-1 flex-shrink-0" />
            <span className="truncate">{manufacturer.name}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center text-xs text-neutral-600">
            <MapPin className="h-3 w-3 text-neutral-400 mr-1 flex-shrink-0" />
            <span className="truncate">{location.name}</span>
          </div>
        )}
        {assignment && (
          <div className="flex items-center text-xs text-neutral-600">
            <User className="h-3 w-3 text-neutral-400 mr-1 flex-shrink-0" />
            <span className="truncate">{assignment.name}</span>
          </div>
        )}
        {asset.dateAcquired && (
          <div className="flex items-center text-xs text-neutral-600">
            <Calendar className="h-3 w-3 text-neutral-400 mr-1 flex-shrink-0" />
            <span className="truncate">{formatDate(asset.dateAcquired)}</span>
          </div>
        )}
        {asset.cost && (
          <div className="flex items-center text-xs text-neutral-600">
            <DollarSign className="h-3 w-3 text-neutral-400 mr-1 flex-shrink-0" />
            <span className="truncate">{formatCurrency(asset.cost)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
