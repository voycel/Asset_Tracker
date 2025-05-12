import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Tag, 
  FileText, 
  RadioTower, 
  Map, 
  Factory, 
  Users,
  Check
} from "lucide-react";
import { 
  AssetType, 
  CustomFieldDefinition, 
  Manufacturer, 
  Status, 
  Location, 
  Assignment,
  insertAssetTypeSchema,
  insertCustomFieldDefinitionSchema,
  insertManufacturerSchema,
  insertStatusSchema,
  insertLocationSchema,
  insertAssignmentSchema
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/app-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ConfigModal({ isOpen, onClose, onSave }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState("asset-types");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { 
    currentWorkspace, 
    assetTypes, 
    manufacturers, 
    statuses, 
    locations, 
    assignments, 
    refreshData 
  } = useAppContext();

  // Asset type management
  const [editingAssetType, setEditingAssetType] = useState<AssetType | null>(null);
  const [isAddingAssetType, setIsAddingAssetType] = useState(false);
  const [deleteConfirmAssetType, setDeleteConfirmAssetType] = useState<AssetType | null>(null);

  // Custom field management
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<number | null>(null);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [deleteConfirmField, setDeleteConfirmField] = useState<CustomFieldDefinition | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [newDropdownOption, setNewDropdownOption] = useState("");

  // Status management
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [deleteConfirmStatus, setDeleteConfirmStatus] = useState<Status | null>(null);

  // Location management
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [deleteConfirmLocation, setDeleteConfirmLocation] = useState<Location | null>(null);

  // Manufacturer management
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [isAddingManufacturer, setIsAddingManufacturer] = useState(false);
  const [deleteConfirmManufacturer, setDeleteConfirmManufacturer] = useState<Manufacturer | null>(null);

  // Assignment management
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);
  const [deleteConfirmAssignment, setDeleteConfirmAssignment] = useState<Assignment | null>(null);

  // Load custom fields when asset type changes
  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!selectedAssetTypeId) {
        setCustomFields([]);
        return;
      }

      try {
        setLoading(true);
        const response = await apiRequest("GET", `/api/asset-types/${selectedAssetTypeId}/fields`);
        const data = await response.json();
        setCustomFields(data);
      } catch (error) {
        console.error("Error fetching custom fields:", error);
        toast({
          title: "Error",
          description: "Failed to load custom fields.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (selectedAssetTypeId) {
      fetchCustomFields();
    }
  }, [selectedAssetTypeId, toast]);

  // Asset Type Form
  const assetTypeForm = useForm<z.infer<typeof insertAssetTypeSchema>>({
    resolver: zodResolver(insertAssetTypeSchema),
    defaultValues: {
      workspaceId: currentWorkspace?.id,
      name: "",
      description: "",
      icon: "dashboard",
    },
  });

  // Custom Field Form
  const fieldTypeOptions = [
    { value: "Text", label: "Text" },
    { value: "Number", label: "Number" },
    { value: "Date", label: "Date" },
    { value: "Boolean", label: "Boolean" },
    { value: "Dropdown", label: "Dropdown" },
  ];

  const customFieldForm = useForm<z.infer<typeof insertCustomFieldDefinitionSchema>>({
    resolver: zodResolver(insertCustomFieldDefinitionSchema),
    defaultValues: {
      assetTypeId: 0,
      fieldName: "",
      fieldType: "Text",
      isRequired: false,
      isFilterable: false,
      isVisibleOnCard: false,
      dropdownOptions: [],
    },
  });

  // Status Form
  const statusForm = useForm<z.infer<typeof insertStatusSchema>>({
    resolver: zodResolver(insertStatusSchema),
    defaultValues: {
      workspaceId: currentWorkspace?.id,
      name: "",
      color: "#6B7280",
    },
  });

  // Location Form
  const locationForm = useForm<z.infer<typeof insertLocationSchema>>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      workspaceId: currentWorkspace?.id,
      name: "",
      description: "",
    },
  });

  // Manufacturer Form
  const manufacturerForm = useForm<z.infer<typeof insertManufacturerSchema>>({
    resolver: zodResolver(insertManufacturerSchema),
    defaultValues: {
      workspaceId: currentWorkspace?.id,
      name: "",
      contactInfo: "",
    },
  });

  // Assignment Form
  const assignmentForm = useForm<z.infer<typeof insertAssignmentSchema>>({
    resolver: zodResolver(insertAssignmentSchema),
    defaultValues: {
      workspaceId: currentWorkspace?.id,
      name: "",
      details: "",
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (editingAssetType) {
      assetTypeForm.reset(editingAssetType);
    } else if (isAddingAssetType) {
      assetTypeForm.reset({
        workspaceId: currentWorkspace?.id,
        name: "",
        description: "",
        icon: "dashboard",
      });
    }
  }, [editingAssetType, isAddingAssetType, assetTypeForm, currentWorkspace?.id]);

  useEffect(() => {
    if (editingField) {
      customFieldForm.reset(editingField);
      if (editingField.dropdownOptions) {
        setDropdownOptions(editingField.dropdownOptions);
      } else {
        setDropdownOptions([]);
      }
    } else if (isAddingField) {
      customFieldForm.reset({
        assetTypeId: selectedAssetTypeId || 0,
        fieldName: "",
        fieldType: "Text",
        isRequired: false,
        isFilterable: false,
        isVisibleOnCard: false,
        dropdownOptions: [],
      });
      setDropdownOptions([]);
    }
  }, [editingField, isAddingField, customFieldForm, selectedAssetTypeId]);

  useEffect(() => {
    if (editingStatus) {
      statusForm.reset(editingStatus);
    } else if (isAddingStatus) {
      statusForm.reset({
        workspaceId: currentWorkspace?.id,
        name: "",
        color: "#6B7280",
      });
    }
  }, [editingStatus, isAddingStatus, statusForm, currentWorkspace?.id]);

  useEffect(() => {
    if (editingLocation) {
      locationForm.reset(editingLocation);
    } else if (isAddingLocation) {
      locationForm.reset({
        workspaceId: currentWorkspace?.id,
        name: "",
        description: "",
      });
    }
  }, [editingLocation, isAddingLocation, locationForm, currentWorkspace?.id]);

  useEffect(() => {
    if (editingManufacturer) {
      manufacturerForm.reset(editingManufacturer);
    } else if (isAddingManufacturer) {
      manufacturerForm.reset({
        workspaceId: currentWorkspace?.id,
        name: "",
        contactInfo: "",
      });
    }
  }, [editingManufacturer, isAddingManufacturer, manufacturerForm, currentWorkspace?.id]);

  useEffect(() => {
    if (editingAssignment) {
      assignmentForm.reset(editingAssignment);
    } else if (isAddingAssignment) {
      assignmentForm.reset({
        workspaceId: currentWorkspace?.id,
        name: "",
        details: "",
      });
    }
  }, [editingAssignment, isAddingAssignment, assignmentForm, currentWorkspace?.id]);

  // Reset state on modal close
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("asset-types");
      setEditingAssetType(null);
      setIsAddingAssetType(false);
      setDeleteConfirmAssetType(null);
      setSelectedAssetTypeId(null);
      setEditingField(null);
      setIsAddingField(false);
      setDeleteConfirmField(null);
      setEditingStatus(null);
      setIsAddingStatus(false);
      setDeleteConfirmStatus(null);
      setEditingLocation(null);
      setIsAddingLocation(false);
      setDeleteConfirmLocation(null);
      setEditingManufacturer(null);
      setIsAddingManufacturer(false);
      setDeleteConfirmManufacturer(null);
      setEditingAssignment(null);
      setIsAddingAssignment(false);
      setDeleteConfirmAssignment(null);
    }
  }, [isOpen]);

  // Submit handlers
  const handleAssetTypeSubmit = async (data: z.infer<typeof insertAssetTypeSchema>) => {
    try {
      setLoading(true);
      
      if (editingAssetType) {
        await apiRequest("PUT", `/api/asset-types/${editingAssetType.id}`, data);
        toast({
          title: "Success",
          description: "Asset type updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/asset-types", data);
        toast({
          title: "Success",
          description: "Asset type created successfully.",
        });
      }
      
      refreshData();
      setEditingAssetType(null);
      setIsAddingAssetType(false);
    } catch (error) {
      console.error("Error saving asset type:", error);
      toast({
        title: "Error",
        description: "Failed to save asset type.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFieldSubmit = async (data: z.infer<typeof insertCustomFieldDefinitionSchema>) => {
    try {
      setLoading(true);
      
      // Add dropdown options if applicable
      if (data.fieldType === "Dropdown") {
        data.dropdownOptions = dropdownOptions;
      }
      
      if (editingField) {
        await apiRequest("PUT", `/api/fields/${editingField.id}`, data);
        toast({
          title: "Success",
          description: "Custom field updated successfully.",
        });
      } else {
        await apiRequest("POST", `/api/asset-types/${selectedAssetTypeId}/fields`, data);
        toast({
          title: "Success",
          description: "Custom field created successfully.",
        });
      }
      
      // Refresh custom fields
      const response = await apiRequest("GET", `/api/asset-types/${selectedAssetTypeId}/fields`);
      const updatedFields = await response.json();
      setCustomFields(updatedFields);
      
      setEditingField(null);
      setIsAddingField(false);
    } catch (error) {
      console.error("Error saving custom field:", error);
      toast({
        title: "Error",
        description: "Failed to save custom field.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSubmit = async (data: z.infer<typeof insertStatusSchema>) => {
    try {
      setLoading(true);
      
      if (editingStatus) {
        await apiRequest("PUT", `/api/statuses/${editingStatus.id}`, data);
        toast({
          title: "Success",
          description: "Status updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/statuses", data);
        toast({
          title: "Success",
          description: "Status created successfully.",
        });
      }
      
      refreshData();
      setEditingStatus(null);
      setIsAddingStatus(false);
    } catch (error) {
      console.error("Error saving status:", error);
      toast({
        title: "Error",
        description: "Failed to save status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSubmit = async (data: z.infer<typeof insertLocationSchema>) => {
    try {
      setLoading(true);
      
      if (editingLocation) {
        await apiRequest("PUT", `/api/locations/${editingLocation.id}`, data);
        toast({
          title: "Success",
          description: "Location updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/locations", data);
        toast({
          title: "Success",
          description: "Location created successfully.",
        });
      }
      
      refreshData();
      setEditingLocation(null);
      setIsAddingLocation(false);
    } catch (error) {
      console.error("Error saving location:", error);
      toast({
        title: "Error",
        description: "Failed to save location.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManufacturerSubmit = async (data: z.infer<typeof insertManufacturerSchema>) => {
    try {
      setLoading(true);
      
      if (editingManufacturer) {
        await apiRequest("PUT", `/api/manufacturers/${editingManufacturer.id}`, data);
        toast({
          title: "Success",
          description: "Manufacturer updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/manufacturers", data);
        toast({
          title: "Success",
          description: "Manufacturer created successfully.",
        });
      }
      
      refreshData();
      setEditingManufacturer(null);
      setIsAddingManufacturer(false);
    } catch (error) {
      console.error("Error saving manufacturer:", error);
      toast({
        title: "Error",
        description: "Failed to save manufacturer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (data: z.infer<typeof insertAssignmentSchema>) => {
    try {
      setLoading(true);
      
      if (editingAssignment) {
        await apiRequest("PUT", `/api/assignments/${editingAssignment.id}`, data);
        toast({
          title: "Success",
          description: "Assignment updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/assignments", data);
        toast({
          title: "Success",
          description: "Assignment created successfully.",
        });
      }
      
      refreshData();
      setEditingAssignment(null);
      setIsAddingAssignment(false);
    } catch (error) {
      console.error("Error saving assignment:", error);
      toast({
        title: "Error",
        description: "Failed to save assignment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteAssetType = async () => {
    if (!deleteConfirmAssetType) return;
    
    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/asset-types/${deleteConfirmAssetType.id}`);
      toast({
        title: "Success",
        description: "Asset type deleted successfully.",
      });
      refreshData();
    } catch (error) {
      console.error("Error deleting asset type:", error);
      toast({
        title: "Error",
        description: "Failed to delete asset type. It might be in use by assets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteConfirmAssetType(null);
    }
  };

  const handleDeleteCustomField = async () => {
    if (!deleteConfirmField) return;
    
    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/fields/${deleteConfirmField.id}`);
      toast({
        title: "Success",
        description: "Custom field deleted successfully.",
      });
      
      // Refresh custom fields
      const response = await apiRequest("GET", `/api/asset-types/${selectedAssetTypeId}/fields`);
      const updatedFields = await response.json();
      setCustomFields(updatedFields);
    } catch (error) {
      console.error("Error deleting custom field:", error);
      toast({
        title: "Error",
        description: "Failed to delete custom field. It might be in use by assets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteConfirmField(null);
    }
  };

  const handleDeleteStatus = async () => {
    if (!deleteConfirmStatus) return;
    
    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/statuses/${deleteConfirmStatus.id}`);
      toast({
        title: "Success",
        description: "Status deleted successfully.",
      });
      refreshData();
    } catch (error) {
      console.error("Error deleting status:", error);
      toast({
        title: "Error",
        description: "Failed to delete status. It might be in use by assets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteConfirmStatus(null);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteConfirmLocation) return;
    
    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/locations/${deleteConfirmLocation.id}`);
      toast({
        title: "Success",
        description: "Location deleted successfully.",
      });
      refreshData();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location. It might be in use by assets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteConfirmLocation(null);
    }
  };

  const handleDeleteManufacturer = async () => {
    if (!deleteConfirmManufacturer) return;
    
    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/manufacturers/${deleteConfirmManufacturer.id}`);
      toast({
        title: "Success",
        description: "Manufacturer deleted successfully.",
      });
      refreshData();
    } catch (error) {
      console.error("Error deleting manufacturer:", error);
      toast({
        title: "Error",
        description: "Failed to delete manufacturer. It might be in use by assets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteConfirmManufacturer(null);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!deleteConfirmAssignment) return;
    
    try {
      setLoading(true);
      await apiRequest("DELETE", `/api/assignments/${deleteConfirmAssignment.id}`);
      toast({
        title: "Success",
        description: "Assignment deleted successfully.",
      });
      refreshData();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        title: "Error",
        description: "Failed to delete assignment. It might be in use by assets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDeleteConfirmAssignment(null);
    }
  };

  // Dropdown options management
  const addDropdownOption = () => {
    if (!newDropdownOption.trim()) return;
    
    if (!dropdownOptions.includes(newDropdownOption)) {
      setDropdownOptions([...dropdownOptions, newDropdownOption]);
    }
    
    setNewDropdownOption("");
  };

  const removeDropdownOption = (option: string) => {
    setDropdownOptions(dropdownOptions.filter(opt => opt !== option));
  };

  // Column definitions for data tables
  const assetTypeColumns: ColumnDef<AssetType>[] = [
    {
      accessorKey: "name",
      header: "Asset Type",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span className="material-icons text-neutral-400 mr-2">
            {row.original.icon || "dashboard"}
          </span>
          <div className="text-sm font-medium text-neutral-900">{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="text-sm text-neutral-500">{row.original.description || "-"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingAssetType(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmAssetType(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const customFieldColumns: ColumnDef<CustomFieldDefinition>[] = [
    {
      accessorKey: "fieldName",
      header: "Field Name",
      cell: ({ row }) => <div className="text-sm font-medium text-neutral-900">{row.original.fieldName}</div>,
    },
    {
      accessorKey: "fieldType",
      header: "Type",
      cell: ({ row }) => <div className="text-sm text-neutral-500">{row.original.fieldType}</div>,
    },
    {
      accessorKey: "isRequired",
      header: "Required",
      cell: ({ row }) => (
        <div className="text-sm text-neutral-500">
          {row.original.isRequired ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            ""
          )}
        </div>
      ),
    },
    {
      accessorKey: "isFilterable",
      header: "Filterable",
      cell: ({ row }) => (
        <div className="text-sm text-neutral-500">
          {row.original.isFilterable ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            ""
          )}
        </div>
      ),
    },
    {
      accessorKey: "isVisibleOnCard",
      header: "Visible on Card",
      cell: ({ row }) => (
        <div className="text-sm text-neutral-500">
          {row.original.isVisibleOnCard ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            ""
          )}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingField(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmField(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const statusColumns: ColumnDef<Status>[] = [
    {
      accessorKey: "name",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center">
          <span 
            className="h-3 w-3 rounded-full mr-2" 
            style={{ backgroundColor: row.original.color }}
          ></span>
          <div className="text-sm font-medium text-neutral-900">{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: "color",
      header: "Color",
      cell: ({ row }) => <div className="text-sm text-neutral-500">{row.original.color}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingStatus(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmStatus(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const locationColumns: ColumnDef<Location>[] = [
    {
      accessorKey: "name",
      header: "Location",
      cell: ({ row }) => <div className="text-sm font-medium text-neutral-900">{row.original.name}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="text-sm text-neutral-500">{row.original.description || "-"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingLocation(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmLocation(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const manufacturerColumns: ColumnDef<Manufacturer>[] = [
    {
      accessorKey: "name",
      header: "Manufacturer",
      cell: ({ row }) => <div className="text-sm font-medium text-neutral-900">{row.original.name}</div>,
    },
    {
      accessorKey: "contactInfo",
      header: "Contact Info",
      cell: ({ row }) => <div className="text-sm text-neutral-500">{row.original.contactInfo || "-"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingManufacturer(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmManufacturer(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const assignmentColumns: ColumnDef<Assignment>[] = [
    {
      accessorKey: "name",
      header: "Assignment",
      cell: ({ row }) => <div className="text-sm font-medium text-neutral-900">{row.original.name}</div>,
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => <div className="text-sm text-neutral-500">{row.original.details || "-"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingAssignment(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirmAssignment(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0"
          aria-describedby="config-dialog-description"
        >
          <DialogHeader className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-neutral-900">Admin Configuration</DialogTitle>
            <p id="config-dialog-description" className="sr-only">Configure system settings and manage assets</p>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {/* Tab Navigation */}
              <div className="w-48 border-r border-neutral-200 p-4 hidden sm:block">
                <nav className="flex flex-col space-y-1">
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "asset-types"
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                    onClick={() => setActiveTab("asset-types")}
                  >
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Asset Types
                    </div>
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "custom-fields"
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                    onClick={() => setActiveTab("custom-fields")}
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Custom Fields
                    </div>
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "statuses"
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                    onClick={() => setActiveTab("statuses")}
                  >
                    <div className="flex items-center">
                      <RadioTower className="h-4 w-4 mr-2" />
                      Statuses
                    </div>
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "locations"
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                    onClick={() => setActiveTab("locations")}
                  >
                    <div className="flex items-center">
                      <Map className="h-4 w-4 mr-2" />
                      Locations
                    </div>
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "manufacturers"
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                    onClick={() => setActiveTab("manufacturers")}
                  >
                    <div className="flex items-center">
                      <Factory className="h-4 w-4 mr-2" />
                      Manufacturers
                    </div>
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === "assignments"
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                    onClick={() => setActiveTab("assignments")}
                  >
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Assignments
                    </div>
                  </button>
                </nav>
              </div>
              
              {/* Tab Navigation for Mobile */}
              <div className="sm:hidden w-full px-4 py-2 border-b border-neutral-200">
                <Select
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Tab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset-types">Asset Types</SelectItem>
                    <SelectItem value="custom-fields">Custom Fields</SelectItem>
                    <SelectItem value="statuses">Statuses</SelectItem>
                    <SelectItem value="locations">Locations</SelectItem>
                    <SelectItem value="manufacturers">Manufacturers</SelectItem>
                    <SelectItem value="assignments">Assignments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Asset Types Tab */}
                {activeTab === "asset-types" && (
                  <div>
                    {(isAddingAssetType || editingAssetType) ? (
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">
                          {editingAssetType ? "Edit Asset Type" : "Add Asset Type"}
                        </h3>
                        
                        <form onSubmit={assetTypeForm.handleSubmit(handleAssetTypeSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              {...assetTypeForm.register("name")}
                              className="mt-1"
                              disabled={loading}
                            />
                            {assetTypeForm.formState.errors.name && (
                              <p className="text-red-500 text-sm mt-1">
                                {assetTypeForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              {...assetTypeForm.register("description")}
                              className="mt-1"
                              disabled={loading}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="icon">Icon</Label>
                            <Input
                              id="icon"
                              {...assetTypeForm.register("icon")}
                              className="mt-1"
                              placeholder="Material icon name (e.g., laptop, desktop_windows)"
                              disabled={loading}
                            />
                            <p className="text-sm text-neutral-500 mt-1">
                              Enter a Material Icons name. See <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google Fonts Icons</a>.
                            </p>
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingAssetType(null);
                                setIsAddingAssetType(false);
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-neutral-900">Asset Types</h3>
                          <Button onClick={() => setIsAddingAssetType(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Asset Type
                          </Button>
                        </div>
                        
                        <p className="text-sm text-neutral-500 mb-4">
                          Asset types define the categories of items you track and determine which custom fields are available.
                        </p>
                        
                        <DataTable
                          columns={assetTypeColumns}
                          data={assetTypes}
                          searchColumn="name"
                          searchPlaceholder="Search asset types..."
                        />
                      </>
                    )}
                  </div>
                )}
                
                {/* Custom Fields Tab */}
                {activeTab === "custom-fields" && (
                  <div>
                    {(isAddingField || editingField) ? (
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">
                          {editingField ? "Edit Custom Field" : "Add Custom Field"}
                        </h3>
                        
                        <form onSubmit={customFieldForm.handleSubmit(handleCustomFieldSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="fieldName">Field Name</Label>
                            <Input
                              id="fieldName"
                              {...customFieldForm.register("fieldName")}
                              className="mt-1"
                              disabled={loading}
                            />
                            {customFieldForm.formState.errors.fieldName && (
                              <p className="text-red-500 text-sm mt-1">
                                {customFieldForm.formState.errors.fieldName.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="fieldType">Field Type</Label>
                            <Select
                              value={customFieldForm.watch("fieldType")}
                              onValueChange={(value) => customFieldForm.setValue("fieldType", value)}
                              disabled={loading || !!editingField}
                            >
                              <SelectTrigger id="fieldType" className="mt-1">
                                <SelectValue placeholder="Select a field type" />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypeOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {editingField && (
                              <p className="text-sm text-amber-500 mt-1">
                                Field type cannot be changed after creation
                              </p>
                            )}
                          </div>
                          
                          {customFieldForm.watch("fieldType") === "Dropdown" && (
                            <div>
                              <Label htmlFor="dropdownOptions">Dropdown Options</Label>
                              <div className="flex mt-1">
                                <Input
                                  id="dropdownOptions"
                                  value={newDropdownOption}
                                  onChange={(e) => setNewDropdownOption(e.target.value)}
                                  className="flex-1"
                                  placeholder="Enter an option"
                                  disabled={loading}
                                />
                                <Button
                                  type="button"
                                  className="ml-2"
                                  onClick={addDropdownOption}
                                  disabled={loading || !newDropdownOption.trim()}
                                >
                                  Add
                                </Button>
                              </div>
                              <div className="mt-2">
                                {dropdownOptions.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {dropdownOptions.map((option, index) => (
                                      <div key={index} className="flex items-center bg-neutral-100 rounded-md px-2 py-1">
                                        <span className="text-sm">{option}</span>
                                        <button
                                          type="button"
                                          className="ml-1 text-neutral-500 hover:text-neutral-700"
                                          onClick={() => removeDropdownOption(option)}
                                          disabled={loading}
                                        >
                                          <span className="material-icons" style={{ fontSize: "16px" }}>close</span>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-neutral-500">No options added yet</p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isRequired"
                              checked={customFieldForm.watch("isRequired")}
                              onCheckedChange={(checked) => customFieldForm.setValue("isRequired", checked)}
                              disabled={loading}
                            />
                            <Label htmlFor="isRequired">Required field</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isFilterable"
                              checked={customFieldForm.watch("isFilterable")}
                              onCheckedChange={(checked) => customFieldForm.setValue("isFilterable", checked)}
                              disabled={loading}
                            />
                            <Label htmlFor="isFilterable">Filterable (can be used in search/filters)</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isVisibleOnCard"
                              checked={customFieldForm.watch("isVisibleOnCard")}
                              onCheckedChange={(checked) => customFieldForm.setValue("isVisibleOnCard", checked)}
                              disabled={loading}
                            />
                            <Label htmlFor="isVisibleOnCard">Visible on asset card</Label>
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingField(null);
                                setIsAddingField(false);
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-neutral-900">Custom Fields</h3>
                          <div className="flex space-x-2">
                            <Select
                              value={selectedAssetTypeId?.toString() || ""}
                              onValueChange={(value) => setSelectedAssetTypeId(value ? parseInt(value) : null)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select Asset Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {assetTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id.toString()}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={() => setIsAddingField(true)}
                              disabled={!selectedAssetTypeId}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Field
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-neutral-500 mb-4">
                          Custom fields define the data points that can be tracked for each asset type.
                        </p>
                        
                        {selectedAssetTypeId ? (
                          customFields.length > 0 ? (
                            <DataTable
                              columns={customFieldColumns}
                              data={customFields}
                              searchColumn="fieldName"
                              searchPlaceholder="Search custom fields..."
                            />
                          ) : (
                            <div className="text-center py-8 border rounded-md bg-neutral-50">
                              <p className="text-neutral-500">No custom fields found for this asset type.</p>
                              <Button 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => setIsAddingField(true)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add First Field
                              </Button>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-8 border rounded-md bg-neutral-50">
                            <p className="text-neutral-500">Please select an asset type to view its custom fields.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Statuses Tab */}
                {activeTab === "statuses" && (
                  <div>
                    {(isAddingStatus || editingStatus) ? (
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">
                          {editingStatus ? "Edit Status" : "Add Status"}
                        </h3>
                        
                        <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Status Name</Label>
                            <Input
                              id="name"
                              {...statusForm.register("name")}
                              className="mt-1"
                              disabled={loading}
                            />
                            {statusForm.formState.errors.name && (
                              <p className="text-red-500 text-sm mt-1">
                                {statusForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="color">Color</Label>
                            <div className="flex items-center mt-1">
                              <div 
                                className="h-6 w-6 rounded-md mr-2"
                                style={{ backgroundColor: statusForm.watch("color") || "#6B7280" }}
                              ></div>
                              <Input
                                id="color"
                                type="color"
                                {...statusForm.register("color")}
                                className="w-24"
                                disabled={loading}
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingStatus(null);
                                setIsAddingStatus(false);
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-neutral-900">Statuses</h3>
                          <Button onClick={() => setIsAddingStatus(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Status
                          </Button>
                        </div>
                        
                        <p className="text-sm text-neutral-500 mb-4">
                          Statuses define the possible states of assets in your inventory.
                        </p>
                        
                        <DataTable
                          columns={statusColumns}
                          data={statuses}
                          searchColumn="name"
                          searchPlaceholder="Search statuses..."
                        />
                      </>
                    )}
                  </div>
                )}
                
                {/* Locations Tab */}
                {activeTab === "locations" && (
                  <div>
                    {(isAddingLocation || editingLocation) ? (
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">
                          {editingLocation ? "Edit Location" : "Add Location"}
                        </h3>
                        
                        <form onSubmit={locationForm.handleSubmit(handleLocationSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Location Name</Label>
                            <Input
                              id="name"
                              {...locationForm.register("name")}
                              className="mt-1"
                              disabled={loading}
                            />
                            {locationForm.formState.errors.name && (
                              <p className="text-red-500 text-sm mt-1">
                                {locationForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              {...locationForm.register("description")}
                              className="mt-1"
                              disabled={loading}
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingLocation(null);
                                setIsAddingLocation(false);
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-neutral-900">Locations</h3>
                          <Button onClick={() => setIsAddingLocation(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Location
                          </Button>
                        </div>
                        
                        <p className="text-sm text-neutral-500 mb-4">
                          Locations define where assets are physically stored or used.
                        </p>
                        
                        <DataTable
                          columns={locationColumns}
                          data={locations}
                          searchColumn="name"
                          searchPlaceholder="Search locations..."
                        />
                      </>
                    )}
                  </div>
                )}
                
                {/* Manufacturers Tab */}
                {activeTab === "manufacturers" && (
                  <div>
                    {(isAddingManufacturer || editingManufacturer) ? (
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">
                          {editingManufacturer ? "Edit Manufacturer" : "Add Manufacturer"}
                        </h3>
                        
                        <form onSubmit={manufacturerForm.handleSubmit(handleManufacturerSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Manufacturer Name</Label>
                            <Input
                              id="name"
                              {...manufacturerForm.register("name")}
                              className="mt-1"
                              disabled={loading}
                            />
                            {manufacturerForm.formState.errors.name && (
                              <p className="text-red-500 text-sm mt-1">
                                {manufacturerForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="contactInfo">Contact Information</Label>
                            <Textarea
                              id="contactInfo"
                              {...manufacturerForm.register("contactInfo")}
                              className="mt-1"
                              disabled={loading}
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingManufacturer(null);
                                setIsAddingManufacturer(false);
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-neutral-900">Manufacturers</h3>
                          <Button onClick={() => setIsAddingManufacturer(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Manufacturer
                          </Button>
                        </div>
                        
                        <p className="text-sm text-neutral-500 mb-4">
                          Manufacturers define the companies that produce your assets.
                        </p>
                        
                        <DataTable
                          columns={manufacturerColumns}
                          data={manufacturers}
                          searchColumn="name"
                          searchPlaceholder="Search manufacturers..."
                        />
                      </>
                    )}
                  </div>
                )}
                
                {/* Assignments Tab */}
                {activeTab === "assignments" && (
                  <div>
                    {(isAddingAssignment || editingAssignment) ? (
                      <div>
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">
                          {editingAssignment ? "Edit Assignment" : "Add Assignment"}
                        </h3>
                        
                        <form onSubmit={assignmentForm.handleSubmit(handleAssignmentSubmit)} className="space-y-4">
                          <div>
                            <Label htmlFor="name">Assignment Name</Label>
                            <Input
                              id="name"
                              {...assignmentForm.register("name")}
                              className="mt-1"
                              disabled={loading}
                            />
                            {assignmentForm.formState.errors.name && (
                              <p className="text-red-500 text-sm mt-1">
                                {assignmentForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <Label htmlFor="details">Details</Label>
                            <Textarea
                              id="details"
                              {...assignmentForm.register("details")}
                              className="mt-1"
                              disabled={loading}
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingAssignment(null);
                                setIsAddingAssignment(false);
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? "Saving..." : "Save"}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-neutral-900">Assignments</h3>
                          <Button onClick={() => setIsAddingAssignment(true)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Assignment
                          </Button>
                        </div>
                        
                        <p className="text-sm text-neutral-500 mb-4">
                          Assignments define the projects, departments, or people to which assets are assigned.
                        </p>
                        
                        <DataTable
                          columns={assignmentColumns}
                          data={assignments}
                          searchColumn="name"
                          searchPlaceholder="Search assignments..."
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-neutral-200">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Asset Type Confirmation */}
      <AlertDialog 
        open={!!deleteConfirmAssetType} 
        onOpenChange={(open) => !open && setDeleteConfirmAssetType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the asset type "{deleteConfirmAssetType?.name}"? This will also delete all associated custom fields. Assets of this type will not be deleted but may become orphaned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssetType}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Custom Field Confirmation */}
      <AlertDialog 
        open={!!deleteConfirmField} 
        onOpenChange={(open) => !open && setDeleteConfirmField(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the custom field "{deleteConfirmField?.fieldName}"? This will also delete all values stored for this field across all assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomField}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Status Confirmation */}
      <AlertDialog 
        open={!!deleteConfirmStatus} 
        onOpenChange={(open) => !open && setDeleteConfirmStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the status "{deleteConfirmStatus?.name}"? Assets with this status will have their status set to null.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStatus}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Location Confirmation */}
      <AlertDialog 
        open={!!deleteConfirmLocation} 
        onOpenChange={(open) => !open && setDeleteConfirmLocation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the location "{deleteConfirmLocation?.name}"? Assets at this location will have their location set to null.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLocation}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Manufacturer Confirmation */}
      <AlertDialog 
        open={!!deleteConfirmManufacturer} 
        onOpenChange={(open) => !open && setDeleteConfirmManufacturer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manufacturer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the manufacturer "{deleteConfirmManufacturer?.name}"? Assets from this manufacturer will have their manufacturer set to null.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteManufacturer}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Assignment Confirmation */}
      <AlertDialog 
        open={!!deleteConfirmAssignment} 
        onOpenChange={(open) => !open && setDeleteConfirmAssignment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the assignment "{deleteConfirmAssignment?.name}"? Assets assigned to this will have their assignment set to null.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
