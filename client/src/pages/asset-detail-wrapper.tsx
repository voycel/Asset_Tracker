import { useState, useEffect } from "react";
import { Asset } from "@shared/schema";
import { AssetDetailModal } from "@/components/asset-detail-modal";
import { EditAssetModal } from "@/components/edit-asset-modal";
import { QRCodeModal } from "@/components/qr-code-modal";
import { useAppContext } from "@/context/app-context";
import { useToast } from "@/hooks/use-toast";

interface AssetDetailWrapperProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onAssetUpdated: () => void;
}

export function AssetDetailWrapper({ asset, isOpen, onClose, onAssetUpdated }: AssetDetailWrapperProps) {
  const { assetTypes, manufacturers, statuses, locations, assignments, customers } = useAppContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const { toast } = useToast();

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsEditModalOpen(false);
      setIsQRCodeModalOpen(false);
    }
  }, [isOpen]);

  // Log when the asset detail modal should open
  useEffect(() => {
    if (isOpen && asset) {
      console.log("Asset Detail Wrapper: Opening modal for asset", asset.id);
    }
  }, [isOpen, asset]);

  const handleEditClick = (details: any) => {
    if (!details) {
      console.error("Cannot edit asset: No details provided");
      toast({
        title: "Error",
        description: "Cannot edit asset: Missing details",
        variant: "destructive",
      });
      return;
    }

    console.log("Opening edit modal for asset", asset?.id);
    setAssetDetails(details);
    setIsEditModalOpen(true);
  };

  const handleQRCodeClick = () => {
    console.log("Opening QR code modal for asset", asset?.id);
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
          customers={customers || []}
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
