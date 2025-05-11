import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { useAppContext } from "@/context/app-context";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { AssetType, CustomFieldDefinition } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ConfigModal } from "@/components/config-modal";
import { Plus, Settings } from "lucide-react";

export default function AssetTypes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const { toast } = useToast();
  const { assetTypes, getCustomFieldsForAssetType, refreshData } = useAppContext();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const fetchCustomFields = async (assetTypeId: number) => {
    try {
      setLoading(true);
      const fields = await getCustomFieldsForAssetType(assetTypeId);
      setCustomFields(fields);
      setSelectedAssetType(assetTypes.find(at => at.id === assetTypeId) || null);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      toast({
        title: "Error",
        description: "Failed to load custom fields for this asset type.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter asset types based on search query
  const filteredAssetTypes = assetTypes.filter(assetType => 
    assetType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assetType.description && assetType.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const customFieldsColumns: ColumnDef<CustomFieldDefinition>[] = [
    {
      accessorKey: "fieldName",
      header: "Field Name",
    },
    {
      accessorKey: "fieldType",
      header: "Type",
    },
    {
      accessorKey: "isRequired",
      header: "Required",
      cell: ({ row }) => row.original.isRequired ? "Yes" : "No",
    },
    {
      accessorKey: "isFilterable",
      header: "Filterable",
      cell: ({ row }) => row.original.isFilterable ? "Yes" : "No",
    },
    {
      accessorKey: "isVisibleOnCard",
      header: "On Card",
      cell: ({ row }) => row.original.isVisibleOnCard ? "Yes" : "No",
    },
  ];

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Asset Types" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />
        
        <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Asset Types</h2>
              <div className="flex space-x-2">
                <Button onClick={() => setIsConfigModalOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
              </div>
            </div>
            <p className="text-neutral-500">
              Asset types define the categories of items you track and determine which custom fields are available.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssetTypes.length > 0 ? (
              filteredAssetTypes.map((assetType) => (
                <Card key={assetType.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <span className="material-icons text-primary-500 mr-2">
                          {assetType.icon || "dashboard"}
                        </span>
                        <CardTitle>{assetType.name}</CardTitle>
                      </div>
                    </div>
                    {assetType.description && (
                      <CardDescription className="mt-1">
                        {assetType.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="custom-fields">
                        <AccordionTrigger className="text-sm font-medium py-2">
                          Custom Fields
                        </AccordionTrigger>
                        <AccordionContent>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mb-2"
                            onClick={() => fetchCustomFields(assetType.id)}
                          >
                            View Custom Fields
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No asset types found</h3>
                <p className="text-neutral-500 mb-4">
                  {searchQuery 
                    ? "No asset types match your search criteria" 
                    : "Get started by adding your first asset type"}
                </p>
                <Button onClick={() => setIsConfigModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset Type
                </Button>
              </div>
            )}
          </div>
          
          {selectedAssetType && (
            <div className="mt-8 bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-neutral-900">
                  Custom Fields for {selectedAssetType.name}
                </h3>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedAssetType(null)}
                >
                  Close
                </Button>
              </div>
              
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-neutral-200 rounded mb-4"></div>
                  <div className="h-48 bg-neutral-200 rounded"></div>
                </div>
              ) : (
                customFields.length > 0 ? (
                  <DataTable 
                    columns={customFieldsColumns} 
                    data={customFields} 
                    searchColumn="fieldName"
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-4">No custom fields found for this asset type</p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsConfigModalOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Custom Field
                    </Button>
                  </div>
                )
              )}
            </div>
          )}
        </main>
      </div>

      <ConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={() => {
          refreshData();
          setIsConfigModalOpen(false);
          // Refresh custom fields if an asset type is selected
          if (selectedAssetType) {
            fetchCustomFields(selectedAssetType.id);
          }
        }}
      />
    </>
  );
}
