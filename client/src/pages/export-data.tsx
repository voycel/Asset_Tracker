import { useState, useRef } from "react";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DownloadIcon,
  FileTypeIcon,
  FileTextIcon,
  DatabaseIcon,
  UploadIcon,
  AlertCircleIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ExportData() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exportFormat, setExportFormat] = useState("csv");
  const [assetTypeFilter, setAssetTypeFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [assignmentFilter, setAssignmentFilter] = useState<number | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    currentWorkspace,
    assetTypes,
    statuses,
    locations,
    assignments
  } = useAppContext();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      let url = "/api/export/assets?";

      if (currentWorkspace) {
        url += `workspaceId=${currentWorkspace.id}&`;
      }

      if (assetTypeFilter) {
        url += `assetTypeId=${assetTypeFilter}&`;
      }

      if (statusFilter) {
        url += `statusId=${statusFilter}&`;
      }

      if (locationFilter) {
        url += `locationId=${locationFilter}&`;
      }

      if (assignmentFilter) {
        url += `assignmentId=${assignmentFilter}&`;
      }

      if (includeArchived) {
        url += `includeArchived=true&`;
      }

      // Add format parameter
      url += `format=${exportFormat}&`;

      // Trigger download by creating a link and clicking it
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assets-export.${exportFormat === 'excel' ? 'csv' : exportFormat}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export started",
        description: `Your ${exportFormat.toUpperCase()} export has started downloading.`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
    setImportFile(null);
    setImportErrors([]);
    setImportSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportErrors([]);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportErrors(["Please select a file to import"]);
      return;
    }

    // Check file extension
    const fileExt = importFile.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'json') {
      setImportErrors(["Only CSV and JSON files are supported"]);
      return;
    }

    try {
      setIsImporting(true);
      setImportErrors([]);

      const formData = new FormData();
      formData.append('file', importFile);

      if (currentWorkspace) {
        formData.append('workspaceId', currentWorkspace.id.toString());
      }

      // Send the file to the API endpoint
      const response = await fetch('/api/import/assets', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }

      // Check if there were any errors during import
      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);

        // If some assets were imported successfully despite errors
        if (result.imported > 0) {
          toast({
            title: "Partial import successful",
            description: `${result.imported} assets were imported with ${result.errors.length} errors.`,
          });
          setImportSuccess(true);
        } else {
          toast({
            title: "Import failed",
            description: "No assets were imported due to errors.",
            variant: "destructive"
          });
        }
      } else {
        // Show success message
        setImportSuccess(true);
        toast({
          title: "Import successful",
          description: `${result.imported || 0} assets have been imported successfully.`,
        });

        // Close dialog after a delay
        setTimeout(() => {
          setImportDialogOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error importing data:", error);
      setImportErrors([error instanceof Error ? error.message : "There was an error importing your data. Please try again."]);

      toast({
        title: "Import failed",
        description: "There was an error processing your import.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const exportOptions = [
    {
      id: "csv",
      title: "CSV Format",
      description: "Export assets as CSV (Comma Separated Values)",
      icon: FileTextIcon,
    },
    {
      id: "excel",
      title: "Excel Format",
      description: "Export assets as Microsoft Excel spreadsheet",
      icon: FileTypeIcon,
    },
    {
      id: "json",
      title: "JSON Format",
      description: "Export assets as JSON for data processing",
      icon: DatabaseIcon,
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title="Export Data"
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />

      <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Export Data</h2>
            <p className="text-neutral-500">
              Export your asset data in various formats for reporting and analysis
            </p>
          </div>
          <Button
            onClick={handleImportClick}
            variant="outline"
            className="flex items-center gap-2"
          >
            <UploadIcon className="h-4 w-4" />
            Import Assets
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Export Filters</CardTitle>
                <CardDescription>
                  Select filters to apply to your export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type</Label>
                    <Select
                      value={assetTypeFilter?.toString() || "all"}
                      onValueChange={(value) => setAssetTypeFilter(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger id="assetType">
                        <SelectValue placeholder="All Asset Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Asset Types</SelectItem>
                        {assetTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={statusFilter?.toString() || "all"}
                      onValueChange={(value) => setStatusFilter(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={locationFilter?.toString() || "all"}
                      onValueChange={(value) => setLocationFilter(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment">Assignment</Label>
                    <Select
                      value={assignmentFilter?.toString() || "all"}
                      onValueChange={(value) => setAssignmentFilter(value === "all" ? null : parseInt(value))}
                    >
                      <SelectTrigger id="assignment">
                        <SelectValue placeholder="All Assignments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assignments</SelectItem>
                        {assignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id.toString()}>
                            {assignment.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeArchived"
                      checked={includeArchived}
                      onCheckedChange={(checked) => setIncludeArchived(checked === true)}
                    />
                    <Label htmlFor="includeArchived">Include archived assets</Label>
                  </div>
                </div>

                <div className="pt-2">
                  <Label htmlFor="searchFilter">Search Filter</Label>
                  <Input
                    id="searchFilter"
                    placeholder="Filter assets by name, ID, or attributes..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  {isExporting ? "Exporting..." : `Export as ${exportFormat.toUpperCase()}`}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Export Format</CardTitle>
                <CardDescription>
                  Choose your preferred export format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exportOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`border rounded-lg p-4 cursor-pointer hover:border-primary-500 transition-colors ${
                        exportFormat === option.id ? 'border-primary-500 bg-primary-50' : ''
                      }`}
                      onClick={() => setExportFormat(option.id)}
                    >
                      <div className="flex items-start">
                        <div className={`mt-0.5 ${exportFormat === option.id ? 'text-primary-500' : 'text-neutral-500'}`}>
                          <option.icon className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${exportFormat === option.id ? 'text-primary-700' : 'text-neutral-900'}`}>{option.title}</p>
                          <p className="text-xs text-neutral-500 mt-1">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Assets</DialogTitle>
            <DialogDescription>
              Upload a CSV or JSON file to import assets into your workspace.
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Create a sample CSV template
                  const headers = "uniqueIdentifier,name,assetTypeName,dateAcquired,cost,notes,statusName,locationName,assignmentName,manufacturerName,customerName";
                  const sampleRow = "ASSET-001,Sample Asset,Computer,2023-01-01,1000,Sample notes,Available,Main Storage,General Use,Sample Manufacturer,";
                  const csvContent = `${headers}\n${sampleRow}`;

                  // Create a download link
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'asset_import_template.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="text-blue-600 hover:underline text-xs mt-1 inline-block"
              >
                Download CSV template
              </button>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadIcon className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {importFile ? importFile.name : "Click to select a file or drag and drop"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: CSV, JSON
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json"
                className="hidden"
              />
            </div>

            {isImporting && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                  <span>Importing...</span>
                </div>
                <p className="mt-1 text-xs text-blue-700">
                  Please wait while your assets are being imported.
                </p>
              </div>
            )}

            {importErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
                  <AlertCircleIcon className="h-4 w-4" />
                  <span>Import Errors {importErrors.length > 5 ? `(${importErrors.length} total)` : ''}</span>
                </div>
                <ul className="mt-1 text-xs text-red-700 list-disc list-inside max-h-40 overflow-y-auto">
                  {importErrors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {importErrors.length > 10 && (
                    <li className="font-medium">...and {importErrors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}

            {importSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
                  <span>Import {importErrors.length > 0 ? 'Partially ' : ''}Successful</span>
                </div>
                <p className="mt-1 text-xs text-green-700">
                  {importErrors.length > 0
                    ? `Some assets were imported successfully, but there were ${importErrors.length} errors.`
                    : 'Your assets have been imported successfully.'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting || importSuccess}
            >
              {isImporting ? "Importing..." : "Import Assets"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
