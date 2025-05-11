import { useState } from "react";
import { Header } from "@/components/header";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { ConfigModal } from "@/components/config-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Tag, FileText, RadioTower, Map, Factory, Users } from "lucide-react";

export default function Configuration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("asset-types");
  const { toast } = useToast();
  const { 
    assetTypes, 
    customFieldDefinitions, 
    manufacturers, 
    statuses, 
    locations, 
    assignments,
    refreshData 
  } = useAppContext();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const openConfigWithTab = (tab: string) => {
    setActiveTab(tab);
    setIsConfigModalOpen(true);
  };

  const configCards = [
    {
      title: "Asset Types",
      description: "Define the categories of items you track and their custom fields",
      icon: Tag,
      count: assetTypes.length,
      tab: "asset-types",
    },
    {
      title: "Custom Fields",
      description: "Configure the data points that can be tracked for each asset type",
      icon: FileText,
      count: Object.values(customFieldDefinitions).reduce((acc, curr) => acc + curr.length, 0),
      tab: "custom-fields",
    },
    {
      title: "Statuses",
      description: "Define the possible states of assets in your inventory",
      icon: RadioTower,
      count: statuses.length,
      tab: "statuses",
    },
    {
      title: "Locations",
      description: "Define where assets are physically stored or used",
      icon: Map,
      count: locations.length,
      tab: "locations",
    },
    {
      title: "Manufacturers",
      description: "Define the companies that produce your assets",
      icon: Factory,
      count: manufacturers.length,
      tab: "manufacturers",
    },
    {
      title: "Assignments",
      description: "Define the projects, departments, or people to which assets are assigned",
      icon: Users,
      count: assignments.length,
      tab: "assignments",
    },
  ];

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Configuration" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />
        
        <main className="flex-1 overflow-x-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Configuration</h2>
            <p className="text-neutral-500">
              Configure asset types, custom fields, and other settings for your asset tracking system.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configCards
              .filter(card => 
                card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((card, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="bg-primary-100 p-3 rounded-lg">
                        <card.icon className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="bg-neutral-100 rounded-full px-2.5 py-0.5 text-sm font-medium text-neutral-800">
                        {card.count}
                      </div>
                    </div>
                    <CardTitle className="mt-4">{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => openConfigWithTab(card.tab)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure {card.title}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
          
          {configCards.filter(card => 
            card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.description.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="text-center p-8 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No configuration options found</h3>
              <p className="text-neutral-500 mb-4">
                No configuration options match your search criteria
              </p>
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
        }}
      />
    </>
  );
}
