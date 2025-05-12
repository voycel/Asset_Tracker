import { EditAssetModal } from "@/components/edit-asset-modal";
import { QRCodeModal } from "@/components/qr-code-modal";
import { Asset, AssetCustomFieldValue, AssetLog, AssetType, Manufacturer, Status, Location, Assignment } from "@shared/schema";

interface AssetModalsProps {
  asset: Asset | null;
  assetDetails: { asset: Asset; customFieldValues: AssetCustomFieldValue[]; logs: AssetLog[] } | null;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  isQRCodeModalOpen: boolean;
  setIsQRCodeModalOpen: (open: boolean) => void;
  onAssetUpdated: () => void;
  assetTypes: AssetType[];
  manufacturers: Manufacturer[];
  statuses: Status[];
  locations: Location[];
  assignments: Assignment[];
}

export function AssetModals({
  asset,
  assetDetails,
  isEditModalOpen,
  setIsEditModalOpen,
  isQRCodeModalOpen,
  setIsQRCodeModalOpen,
  onAssetUpdated,
  assetTypes,
  manufacturers,
  statuses,
  locations,
  assignments
}: AssetModalsProps) {
  if (!asset) return null;
  
  return (
    <>
      {isEditModalOpen && (
        <EditAssetModal
          asset={asset}
          customFieldValues={assetDetails?.customFieldValues || []}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={(updatedAsset) => {
            setIsEditModalOpen(false);
            onAssetUpdated();
          }}
          assetTypes={assetTypes}
          manufacturers={manufacturers}
          statuses={statuses}
          locations={locations}
          assignments={assignments}
        />
      )}
      
      {isQRCodeModalOpen && (
        <QRCodeModal
          asset={asset}
          isOpen={isQRCodeModalOpen}
          onClose={() => setIsQRCodeModalOpen(false)}
        />
      )}
    </>
  );
}
