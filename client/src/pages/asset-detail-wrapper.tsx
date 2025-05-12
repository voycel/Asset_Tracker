import { useState } from "react";
import { Asset } from "@shared/schema";
import { AssetDetailModal } from "@/components/asset-detail-modal";
import { EditAssetModal } from "@/components/edit-asset-modal";
import { QRCodeModal } from "@/components/qr-code-modal";
import { useAppContext } from "@/context/app-context";

interface AssetDetailWrapperProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onAssetUpdated: () => void;
}

export function AssetDetailWrapper({ asset, isOpen, onClose, onAssetUpdated }: AssetDetailWrapperProps) {
  const { assetTypes, manufacturers, statuses, locations, assignments } = useAppContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [assetDetails, setAssetDetails] = useState<any>(null);
  
  const handleEditClick = (details: any) => {
    setAssetDetails(details);
    setIsEditModalOpen(true);
  };
  
  const handleQRCodeClick = () => {
    setIsQRCodeModalOpen(true);
  };
  
  return (
    <>
      <AssetDetailModal 
        asset={asset}
        isOpen={isOpen}
        onClose={onClose}
        onAssetUpdated={onAssetUpdated}
        onEditClick={handleEditClick}
        onQRCodeClick={handleQRCodeClick}
      />
      
      {isEditModalOpen && asset && assetDetails && (
        <EditAssetModal
          asset={asset}
          customFieldValues={assetDetails.customFieldValues || []}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={() => {
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
      
      {isQRCodeModalOpen && asset && (
        <QRCodeModal
          asset={asset}
          isOpen={isQRCodeModalOpen}
          onClose={() => setIsQRCodeModalOpen(false)}
        />
      )}
    </>
  );
}
