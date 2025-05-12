import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns2, ListIcon, FilterIcon, LayoutGridIcon, TagIcon, Settings } from "lucide-react";
import { AssetType, Status, Location, Assignment } from "@shared/schema";
import { useAppContext } from "@/context/app-context";
import { WorkflowStatusCreator } from "@/components/workflow-status-creator";
import { AssetCardPreferences } from "@/components/asset-card-preferences";

interface DashboardFiltersProps {
  activeView: "kanban" | "list";
  onViewChange: (view: "kanban" | "list") => void;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  assetTypeFilter: number | null;
  onAssetTypeFilterChange: (assetTypeId: number | null) => void;
  statusFilter: number | null;
  onStatusFilterChange: (statusId: number | null) => void;
  locationFilter: number | null;
  onLocationFilterChange: (locationId: number | null) => void;
  assignmentFilter: number | null;
  onAssignmentFilterChange: (assignmentId: number | null) => void;
}

export function DashboardFilters({
  activeView,
  onViewChange,
  groupBy,
  onGroupByChange,
  assetTypeFilter,
  onAssetTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  locationFilter,
  onLocationFilterChange,
  assignmentFilter,
  onAssignmentFilterChange,
}: DashboardFiltersProps) {
  const { assetTypes, statuses, locations, assignments } = useAppContext();
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  return (
    <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* View Selector */}
        <div className="inline-flex items-center rounded-md shadow-sm" role="group">
          <Button
            variant={activeView === "kanban" ? "default" : "outline"}
            onClick={() => onViewChange("kanban")}
            className="rounded-r-none"
          >
            <Columns2 className="h-4 w-4 mr-1" />
            Kanban
          </Button>
          <Button
            variant={activeView === "list" ? "default" : "outline"}
            onClick={() => onViewChange("list")}
            className="rounded-l-none"
          >
            <ListIcon className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>

        {/* Filters Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <FilterIcon className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={statusFilter?.toString() || "all"} onValueChange={(value) => onStatusFilterChange(value && value !== "all" ? Number(value) : null)}>
                <DropdownMenuRadioItem value="all">All Statuses</DropdownMenuRadioItem>
                {statuses.map((status) => (
                  <DropdownMenuRadioItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group By Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <LayoutGridIcon className="h-4 w-4 mr-1" />
                Group by: {groupBy === "status" ? "Status" : groupBy === "location" ? "Location" : "Assignment"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={groupBy} onValueChange={onGroupByChange}>
                <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="location">Location</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="assignment">Assignment</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Asset Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="inline-flex items-center">
                <TagIcon className="h-4 w-4 mr-1" />
                {assetTypeFilter
                  ? assetTypes.find(at => at.id === assetTypeFilter)?.name || "All Types"
                  : "All Types"
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={assetTypeFilter?.toString() || "all"} onValueChange={(value) => onAssetTypeFilterChange(value && value !== "all" ? Number(value) : null)}>
                <DropdownMenuRadioItem value="all">All Types</DropdownMenuRadioItem>
                {assetTypes.map((assetType) => (
                  <DropdownMenuRadioItem key={assetType.id} value={assetType.id.toString()}>
                    {assetType.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Workflow Status Creator */}
          <WorkflowStatusCreator />

          {/* Card Display Preferences */}
          <Button
            variant="outline"
            className="inline-flex items-center"
            onClick={() => setIsPreferencesOpen(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Card Display
          </Button>
        </div>
      </div>

      {/* Asset Card Preferences Modal */}
      <AssetCardPreferences
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
}
