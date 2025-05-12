import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Workspace, AssetType, CustomFieldDefinition, Manufacturer, 
  Status, Location, Assignment, User
} from "@shared/schema";

interface AppContextType {
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  workspaces: Workspace[];
  assetTypes: AssetType[];
  customFieldDefinitions: { [assetTypeId: number]: CustomFieldDefinition[] };
  manufacturers: Manufacturer[];
  statuses: Status[];
  locations: Location[];
  assignments: Assignment[];
  user: User | null;
  refreshData: () => void;
  getCustomFieldsForAssetType: (assetTypeId: number) => Promise<CustomFieldDefinition[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  // We'll fetch user data directly instead of using useAuth here to avoid circular dependencies
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<{ [assetTypeId: number]: CustomFieldDefinition[] }>({});
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const fetchData = async () => {
    try {
      // Fetch user
      try {
        const userResponse = await fetch("/api/auth/user");
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Map user data to match our expected schema
          const mappedUser = {
            ...userData,
            firstName: userData.first_name,
            lastName: userData.last_name,
            profileImageUrl: userData.profile_image_url
          };
          setUser(mappedUser);
        }
      } catch (authError) {
        console.error("Auth error:", authError);
        setUser(null);
      }
      
      // Fetch workspaces
      const workspacesResponse = await apiRequest("GET", "/api/workspaces");
      const workspacesData = await workspacesResponse.json();
      setWorkspaces(workspacesData);
      
      if (workspacesData.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(workspacesData[0]);
      }

      // Fetch asset types
      const assetTypesResponse = await apiRequest("GET", "/api/asset-types");
      const assetTypesData = await assetTypesResponse.json();
      setAssetTypes(assetTypesData);

      // Fetch manufacturers
      const manufacturersResponse = await apiRequest("GET", "/api/manufacturers");
      const manufacturersData = await manufacturersResponse.json();
      setManufacturers(manufacturersData);

      // Fetch statuses
      const statusesResponse = await apiRequest("GET", "/api/statuses");
      const statusesData = await statusesResponse.json();
      setStatuses(statusesData);

      // Fetch locations
      const locationsResponse = await apiRequest("GET", "/api/locations");
      const locationsData = await locationsResponse.json();
      setLocations(locationsData);

      // Fetch assignments
      const assignmentsResponse = await apiRequest("GET", "/api/assignments");
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const getCustomFieldsForAssetType = async (assetTypeId: number): Promise<CustomFieldDefinition[]> => {
    // Check if we have already fetched these fields
    if (customFieldDefinitions[assetTypeId]) {
      return customFieldDefinitions[assetTypeId];
    }

    try {
      const response = await apiRequest("GET", `/api/asset-types/${assetTypeId}/fields`);
      const fieldsData = await response.json();
      
      // Update the state
      setCustomFieldDefinitions(prev => ({
        ...prev,
        [assetTypeId]: fieldsData
      }));
      
      return fieldsData;
    } catch (error) {
      console.error(`Error fetching custom fields for asset type ${assetTypeId}:`, error);
      return [];
    }
  };

  // Use a ref to only run fetch once
  const initialFetchDoneRef = useRef(false);
  
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      fetchData();
    }
  }, []);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
    fetchData();
  };

  return (
    <AppContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace,
        workspaces,
        assetTypes,
        customFieldDefinitions,
        manufacturers,
        statuses,
        locations,
        assignments,
        user,
        refreshData,
        getCustomFieldsForAssetType
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
