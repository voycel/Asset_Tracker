import { useState } from "react";
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
import { DownloadIcon, FileTypeIcon, FileTextIcon, DatabaseIcon } from "lucide-react";

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
      
      // Trigger download by creating a link and clicking it
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assets-export.${exportFormat}`);
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
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Export Data</h2>
          <p className="text-neutral-500">
            Export your asset data in various formats for reporting and analysis
          </p>
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
                      value={assetTypeFilter?.toString() || ""}
                      onValueChange={(value) => setAssetTypeFilter(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger id="assetType">
                        <SelectValue placeholder="All Asset Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Asset Types</SelectItem>
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
                      value={statusFilter?.toString() || ""}
                      onValueChange={(value) => setStatusFilter(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
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
                      value={locationFilter?.toString() || ""}
                      onValueChange={(value) => setLocationFilter(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Locations</SelectItem>
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
                      value={assignmentFilter?.toString() || ""}
                      onValueChange={(value) => setAssignmentFilter(value ? parseInt(value) : null)}
                    >
                      <SelectTrigger id="assignment">
                        <SelectValue placeholder="All Assignments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Assignments</SelectItem>
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
    </div>
  );
}
