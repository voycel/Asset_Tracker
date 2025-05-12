import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";

interface AssetCardPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssetCardPreferences({ isOpen, onClose }: AssetCardPreferencesProps) {
  const [preferences, setPreferences] = useState<{[key: string]: boolean}>({
    serialNumber: true,
    manufacturer: true,
    location: true,
    assignment: true,
    customer: true,
    dateAcquired: true,
    cost: true
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('assetCardDisplayPreferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(parsedPreferences);
      } catch (e) {
        console.error('Error parsing display preferences:', e);
      }
    }
  }, []);

  const handlePreferenceChange = (key: string, value: boolean) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
  };

  const handleSave = () => {
    localStorage.setItem('assetCardDisplayPreferences', JSON.stringify(preferences));
    onClose();
    // Force a refresh to apply the new preferences
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Asset Card Display Preferences
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-neutral-600 mb-4">
            Select which fields should be visible on asset cards. Custom fields can be configured in the Asset Types section.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="serialNumber" className="cursor-pointer">Serial Number / Asset ID</Label>
              <Switch 
                id="serialNumber" 
                checked={preferences.serialNumber} 
                onCheckedChange={(checked) => handlePreferenceChange('serialNumber', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="manufacturer" className="cursor-pointer">Manufacturer</Label>
              <Switch 
                id="manufacturer" 
                checked={preferences.manufacturer} 
                onCheckedChange={(checked) => handlePreferenceChange('manufacturer', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="location" className="cursor-pointer">Location</Label>
              <Switch 
                id="location" 
                checked={preferences.location} 
                onCheckedChange={(checked) => handlePreferenceChange('location', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="assignment" className="cursor-pointer">Assignment</Label>
              <Switch 
                id="assignment" 
                checked={preferences.assignment} 
                onCheckedChange={(checked) => handlePreferenceChange('assignment', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="customer" className="cursor-pointer">Customer</Label>
              <Switch 
                id="customer" 
                checked={preferences.customer} 
                onCheckedChange={(checked) => handlePreferenceChange('customer', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="dateAcquired" className="cursor-pointer">Date Acquired</Label>
              <Switch 
                id="dateAcquired" 
                checked={preferences.dateAcquired} 
                onCheckedChange={(checked) => handlePreferenceChange('dateAcquired', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="cost" className="cursor-pointer">Cost</Label>
              <Switch 
                id="cost" 
                checked={preferences.cost} 
                onCheckedChange={(checked) => handlePreferenceChange('cost', checked)}
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
