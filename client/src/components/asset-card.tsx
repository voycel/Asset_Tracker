import { getIconForAssetType } from "@/lib/utils";
import { Asset } from "@shared/schema";
import { useAppContext } from "@/context/app-context";

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

  const getStatusClass = () => {
    if (!status) return "bg-neutral-100 text-neutral-800";
    
    const statusName = status.name.toLowerCase();
    if (statusName.includes("available")) return "bg-neutral-100 text-neutral-800";
    if (statusName.includes("in use")) return "bg-green-100 text-green-800";
    if (statusName.includes("maintenance")) return "bg-yellow-100 text-yellow-800";
    if (statusName.includes("attention") || statusName.includes("issue") || statusName.includes("critical")) {
      return "bg-red-100 text-red-800";
    }
    
    return "bg-blue-100 text-blue-800";
  };

  const icon = getIconForAssetType(assetType?.name);

  return (
    <div className="bg-white border border-neutral-200 p-3 rounded-md shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center">
            <span className="material-icons text-neutral-400 mr-1" style={{ fontSize: "18px" }}>
              {icon}
            </span>
            <p className="text-xs text-neutral-500">{assetType?.name || "Unknown Type"}</p>
          </div>
          <h4 className="text-sm font-medium text-neutral-800 mt-1">{asset.name}</h4>
          <p className="text-xs text-neutral-500 mt-1">ID: {asset.uniqueIdentifier}</p>
        </div>
        <div className="flex flex-col items-end">
          {status && (
            <span className={`text-xs inline-block px-2 py-1 font-medium rounded-full ${getStatusClass()}`}>
              {status.name}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-200">
        {manufacturer && (
          <div className="flex items-center text-xs text-neutral-500">
            <span className="material-icons mr-1" style={{ fontSize: "12px" }}>
              business
            </span>
            <span>{manufacturer.name}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center text-xs text-neutral-500 mt-1">
            <span className="material-icons mr-1" style={{ fontSize: "12px" }}>
              location_on
            </span>
            <span>{location.name}</span>
          </div>
        )}
        {assignment && (
          <div className="flex items-center text-xs text-neutral-500 mt-1">
            <span className="material-icons mr-1" style={{ fontSize: "12px" }}>
              person
            </span>
            <span>{assignment.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
