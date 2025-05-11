import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuIcon, SearchIcon, PlusIcon, BellIcon, HelpCircleIcon } from "lucide-react";
import { NewAssetModal } from "./new-asset-modal";
import { useAppContext } from "@/context/app-context";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ title, onMenuClick, onSearch, searchQuery = "" }: HeaderProps) {
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);
  const { assetTypes, manufacturers, statuses, locations, assignments, refreshData } = useAppContext();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleAssetCreated = () => {
    refreshData();
    setIsNewAssetModalOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-neutral-500"
              onClick={onMenuClick}
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            <div className="flex-1 flex items-center justify-between">
              {/* Page Title */}
              <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>

              {/* Search Bar */}
              <div className="hidden md:block mx-4 flex-1 max-w-lg">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search assets by ID, name or custom fields..."
                    className="w-full pl-10 pr-4 py-2"
                    value={searchValue}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => setIsNewAssetModalOpen(true)}
                  className="hidden sm:inline-flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Asset
                </Button>
                <button className="text-neutral-500 hover:text-neutral-700">
                  <BellIcon className="h-5 w-5" />
                </button>
                <button className="text-neutral-500 hover:text-neutral-700">
                  <HelpCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-4 md:hidden">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2"
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </header>

      <NewAssetModal
        isOpen={isNewAssetModalOpen}
        onClose={() => setIsNewAssetModalOpen(false)}
        onSubmit={handleAssetCreated}
        assetTypes={assetTypes}
        manufacturers={manufacturers}
        statuses={statuses}
        locations={locations}
        assignments={assignments}
      />
    </>
  );
}
