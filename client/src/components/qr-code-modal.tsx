import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Asset } from "@shared/schema";
import QRCode from "react-qr-code";
import { Download } from "lucide-react";

interface QRCodeModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ asset, isOpen, onClose }: QRCodeModalProps) {
  const [qrSize, setQrSize] = useState(256);
  
  if (!asset) return null;
  
  // Create a URL for the asset that can be used to access it directly
  const assetUrl = `${window.location.origin}/assets?id=${asset.id}`;
  
  // Function to download QR code as SVG
  const downloadQRCode = () => {
    const svg = document.getElementById("asset-qr-code");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `asset-${asset.uniqueIdentifier}-qr.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-md flex flex-col p-0 gap-0"
        aria-describedby="qr-code-dialog-description"
      >
        <DialogHeader className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-neutral-900">Asset QR Code</DialogTitle>
          <p id="qr-code-dialog-description" className="sr-only">QR code for asset {asset.name}</p>
        </DialogHeader>
        
        <div className="p-6 flex flex-col items-center">
          <div className="mb-4 text-center">
            <h3 className="text-base font-medium text-neutral-900">{asset.name}</h3>
            <p className="text-sm text-neutral-500">ID: {asset.uniqueIdentifier}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-neutral-200 mb-4">
            <QRCode
              id="asset-qr-code"
              value={assetUrl}
              size={qrSize}
              level="H"
              className="mx-auto"
            />
          </div>
          
          <div className="text-center mb-4">
            <p className="text-sm text-neutral-600">
              Scan this QR code to quickly access this asset's details.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setQrSize(qrSize === 256 ? 512 : 256)}
            >
              {qrSize === 256 ? "Larger Size" : "Smaller Size"}
            </Button>
            
            <Button onClick={downloadQRCode}>
              <Download className="mr-1 h-5 w-5" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
