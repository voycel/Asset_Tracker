import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Parser, Transform } from 'json2csv';
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertWorkspaceSchema, insertAssetTypeSchema, insertCustomFieldDefinitionSchema,
  insertManufacturerSchema, insertStatusSchema, insertLocationSchema,
  insertAssignmentSchema, insertUserSchema, insertAssetSchema,
  insertAssetCustomFieldValueSchema, insertAssetLogSchema
} from '@shared/schema';
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Helper middleware for handling Zod validation errors
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: error.errors 
          });
        }
        next(error);
      }
    };
  };

  // Create default workspace if it doesn't exist
  const setupDefaultWorkspace = async () => {
    const workspaces = await storage.getWorkspaces();
    if (workspaces.length === 0) {
      const workspace = await storage.createWorkspace({ name: 'Default Workspace' });
      
      // Create default statuses
      await storage.createStatus({ 
        workspaceId: workspace.id, 
        name: 'Available', 
        color: '#6B7280' 
      });
      await storage.createStatus({ 
        workspaceId: workspace.id, 
        name: 'In Use', 
        color: '#10B981' 
      });
      await storage.createStatus({ 
        workspaceId: workspace.id, 
        name: 'In Maintenance', 
        color: '#F59E0B' 
      });
      await storage.createStatus({ 
        workspaceId: workspace.id, 
        name: 'Requires Attention', 
        color: '#EF4444' 
      });
      
      // Create default locations
      await storage.createLocation({ 
        workspaceId: workspace.id, 
        name: 'Main Storage', 
        description: 'Primary storage location' 
      });
    }
  };
  
  await setupDefaultWorkspace();
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Workspaces API
  app.get('/api/workspaces', async (req, res) => {
    try {
      const workspaces = await storage.getWorkspaces();
      res.json(workspaces);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching workspaces' });
    }
  });

  app.post('/api/workspaces', validateRequest(insertWorkspaceSchema), async (req, res) => {
    try {
      const workspace = await storage.createWorkspace(req.body);
      res.status(201).json(workspace);
    } catch (error) {
      res.status(500).json({ message: 'Error creating workspace' });
    }
  });

  // Asset Types API
  app.get('/api/asset-types', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const assetTypes = await storage.getAssetTypes(workspaceId);
      res.json(assetTypes);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching asset types' });
    }
  });

  app.get('/api/asset-types/:id', async (req, res) => {
    try {
      const assetType = await storage.getAssetType(Number(req.params.id));
      if (!assetType) {
        return res.status(404).json({ message: 'Asset type not found' });
      }
      res.json(assetType);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching asset type' });
    }
  });

  app.post('/api/asset-types', validateRequest(insertAssetTypeSchema), async (req, res) => {
    try {
      const assetType = await storage.createAssetType(req.body);
      res.status(201).json(assetType);
    } catch (error) {
      res.status(500).json({ message: 'Error creating asset type' });
    }
  });

  app.put('/api/asset-types/:id', async (req, res) => {
    try {
      const assetType = await storage.updateAssetType(Number(req.params.id), req.body);
      if (!assetType) {
        return res.status(404).json({ message: 'Asset type not found' });
      }
      res.json(assetType);
    } catch (error) {
      res.status(500).json({ message: 'Error updating asset type' });
    }
  });

  app.delete('/api/asset-types/:id', async (req, res) => {
    try {
      const result = await storage.deleteAssetType(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Asset type not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting asset type' });
    }
  });

  // Custom Field Definitions API
  app.get('/api/asset-types/:assetTypeId/fields', async (req, res) => {
    try {
      const fields = await storage.getCustomFieldDefinitions(Number(req.params.assetTypeId));
      res.json(fields);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching custom fields' });
    }
  });

  app.post('/api/asset-types/:assetTypeId/fields', validateRequest(insertCustomFieldDefinitionSchema), async (req, res) => {
    try {
      const field = await storage.createCustomFieldDefinition({
        ...req.body,
        assetTypeId: Number(req.params.assetTypeId)
      });
      res.status(201).json(field);
    } catch (error) {
      res.status(500).json({ message: 'Error creating custom field' });
    }
  });

  app.put('/api/fields/:id', async (req, res) => {
    try {
      const field = await storage.updateCustomFieldDefinition(Number(req.params.id), req.body);
      if (!field) {
        return res.status(404).json({ message: 'Custom field not found' });
      }
      res.json(field);
    } catch (error) {
      res.status(500).json({ message: 'Error updating custom field' });
    }
  });

  app.delete('/api/fields/:id', async (req, res) => {
    try {
      const result = await storage.deleteCustomFieldDefinition(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Custom field not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting custom field' });
    }
  });

  // Manufacturers API
  app.get('/api/manufacturers', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const manufacturers = await storage.getManufacturers(workspaceId);
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching manufacturers' });
    }
  });

  app.post('/api/manufacturers', validateRequest(insertManufacturerSchema), async (req, res) => {
    try {
      const manufacturer = await storage.createManufacturer(req.body);
      res.status(201).json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: 'Error creating manufacturer' });
    }
  });

  app.put('/api/manufacturers/:id', async (req, res) => {
    try {
      const manufacturer = await storage.updateManufacturer(Number(req.params.id), req.body);
      if (!manufacturer) {
        return res.status(404).json({ message: 'Manufacturer not found' });
      }
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: 'Error updating manufacturer' });
    }
  });

  app.delete('/api/manufacturers/:id', async (req, res) => {
    try {
      const result = await storage.deleteManufacturer(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Manufacturer not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting manufacturer' });
    }
  });

  // Statuses API
  app.get('/api/statuses', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const assetTypeId = req.query.assetTypeId ? Number(req.query.assetTypeId) : undefined;
      const statuses = await storage.getStatuses(workspaceId, assetTypeId);
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching statuses' });
    }
  });

  app.post('/api/statuses', validateRequest(insertStatusSchema), async (req, res) => {
    try {
      const status = await storage.createStatus(req.body);
      res.status(201).json(status);
    } catch (error) {
      res.status(500).json({ message: 'Error creating status' });
    }
  });

  app.put('/api/statuses/:id', async (req, res) => {
    try {
      const status = await storage.updateStatus(Number(req.params.id), req.body);
      if (!status) {
        return res.status(404).json({ message: 'Status not found' });
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: 'Error updating status' });
    }
  });

  app.delete('/api/statuses/:id', async (req, res) => {
    try {
      const result = await storage.deleteStatus(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Status not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting status' });
    }
  });

  // Locations API
  app.get('/api/locations', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const assetTypeId = req.query.assetTypeId ? Number(req.query.assetTypeId) : undefined;
      const locations = await storage.getLocations(workspaceId, assetTypeId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching locations' });
    }
  });

  app.post('/api/locations', validateRequest(insertLocationSchema), async (req, res) => {
    try {
      const location = await storage.createLocation(req.body);
      res.status(201).json(location);
    } catch (error) {
      res.status(500).json({ message: 'Error creating location' });
    }
  });

  app.put('/api/locations/:id', async (req, res) => {
    try {
      const location = await storage.updateLocation(Number(req.params.id), req.body);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: 'Error updating location' });
    }
  });

  app.delete('/api/locations/:id', async (req, res) => {
    try {
      const result = await storage.deleteLocation(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting location' });
    }
  });

  // Assignments API
  app.get('/api/assignments', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const assignments = await storage.getAssignments(workspaceId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching assignments' });
    }
  });

  app.post('/api/assignments', validateRequest(insertAssignmentSchema), async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ message: 'Error creating assignment' });
    }
  });

  app.put('/api/assignments/:id', async (req, res) => {
    try {
      const assignment = await storage.updateAssignment(Number(req.params.id), req.body);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: 'Error updating assignment' });
    }
  });

  app.delete('/api/assignments/:id', async (req, res) => {
    try {
      const result = await storage.deleteAssignment(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting assignment' });
    }
  });

  // Users API
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users.map(user => {
        // Don't return password
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  app.post('/api/users', validateRequest(insertUserSchema), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Error creating user' });
    }
  });

  // Assets API
  app.get('/api/assets', async (req, res) => {
    try {
      const { workspaceId, assetTypeId, statusId, locationId, assignmentId, search } = req.query;
      const assets = await storage.getAssets(
        workspaceId ? Number(workspaceId) : undefined,
        assetTypeId ? Number(assetTypeId) : undefined,
        statusId ? Number(statusId) : undefined,
        locationId ? Number(locationId) : undefined,
        assignmentId ? Number(assignmentId) : undefined,
        search ? String(search) : undefined
      );
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching assets' });
    }
  });

  app.get('/api/assets/:id', async (req, res) => {
    try {
      const asset = await storage.getAsset(Number(req.params.id));
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      // Fetch custom field values
      const customFieldValues = await storage.getAssetCustomFieldValues(asset.id);
      
      // Fetch logs
      const logs = await storage.getAssetLogs(asset.id);
      
      res.json({ asset, customFieldValues, logs });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching asset' });
    }
  });

  app.post('/api/assets', validateRequest(insertAssetSchema), async (req, res) => {
    try {
      // Extract custom field values from request
      const { customFieldValues, ...assetData } = req.body;
      
      // Create the asset
      const asset = await storage.createAsset(assetData);
      
      // Create log entry for asset creation
      await storage.createAssetLog({
        assetId: asset.id,
        userId: req.body.userId,
        actionType: 'CREATE',
        detailsJson: { message: 'Asset created' }
      });
      
      // Create custom field values if provided
      if (customFieldValues && Array.isArray(customFieldValues)) {
        for (const fieldValue of customFieldValues) {
          await storage.createAssetCustomFieldValue({
            assetId: asset.id,
            ...fieldValue
          });
        }
      }
      
      res.status(201).json(asset);
    } catch (error) {
      res.status(500).json({ message: 'Error creating asset' });
    }
  });

  app.put('/api/assets/:id', async (req, res) => {
    try {
      const { customFieldValues, ...assetData } = req.body;
      
      // Update the asset
      const asset = await storage.updateAsset(Number(req.params.id), assetData);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      // Create log entry for asset update
      await storage.createAssetLog({
        assetId: asset.id,
        userId: req.body.userId,
        actionType: 'UPDATE',
        detailsJson: { 
          message: 'Asset updated',
          changes: assetData
        }
      });
      
      // Update custom field values if provided
      if (customFieldValues && Array.isArray(customFieldValues)) {
        // Get existing custom field values
        const existingValues = await storage.getAssetCustomFieldValues(asset.id);
        
        for (const fieldValue of customFieldValues) {
          const existingValue = existingValues.find(v => v.fieldDefinitionId === fieldValue.fieldDefinitionId);
          
          if (existingValue) {
            // Update existing value
            await storage.updateAssetCustomFieldValue(existingValue.id, fieldValue);
          } else {
            // Create new value
            await storage.createAssetCustomFieldValue({
              assetId: asset.id,
              ...fieldValue
            });
          }
        }
      }
      
      res.json(asset);
    } catch (error) {
      res.status(500).json({ message: 'Error updating asset' });
    }
  });

  app.patch('/api/assets/:id/status', async (req, res) => {
    try {
      const { statusId, userId } = req.body;
      
      // Update the asset status
      const asset = await storage.updateAsset(Number(req.params.id), { currentStatusId: statusId });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      // Create log entry for status change
      await storage.createAssetLog({
        assetId: asset.id,
        userId,
        actionType: 'UPDATE_STATUS',
        detailsJson: { 
          message: 'Status updated',
          statusId
        }
      });
      
      res.json(asset);
    } catch (error) {
      res.status(500).json({ message: 'Error updating asset status' });
    }
  });

  app.patch('/api/assets/:id/location', async (req, res) => {
    try {
      const { locationId, userId } = req.body;
      
      // Update the asset location
      const asset = await storage.updateAsset(Number(req.params.id), { currentLocationId: locationId });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      // Create log entry for location change
      await storage.createAssetLog({
        assetId: asset.id,
        userId,
        actionType: 'UPDATE_LOCATION',
        detailsJson: { 
          message: 'Location updated',
          locationId
        }
      });
      
      res.json(asset);
    } catch (error) {
      res.status(500).json({ message: 'Error updating asset location' });
    }
  });

  app.patch('/api/assets/:id/assignment', async (req, res) => {
    try {
      const { assignmentId, userId } = req.body;
      
      // Update the asset assignment
      const asset = await storage.updateAsset(Number(req.params.id), { currentAssignmentId: assignmentId });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      // Create log entry for assignment change
      await storage.createAssetLog({
        assetId: asset.id,
        userId,
        actionType: 'ASSIGNED',
        detailsJson: { 
          message: 'Assignment updated',
          assignmentId
        }
      });
      
      res.json(asset);
    } catch (error) {
      res.status(500).json({ message: 'Error updating asset assignment' });
    }
  });

  app.patch('/api/assets/:id/archive', async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Archive the asset
      const result = await storage.archiveAsset(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      // Create log entry for archiving
      await storage.createAssetLog({
        assetId: Number(req.params.id),
        userId,
        actionType: 'ARCHIVE',
        detailsJson: { message: 'Asset archived' }
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error archiving asset' });
    }
  });

  app.delete('/api/assets/:id', async (req, res) => {
    try {
      const result = await storage.deleteAsset(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting asset' });
    }
  });

  // Asset Logs API
  app.get('/api/assets/:assetId/logs', async (req, res) => {
    try {
      const logs = await storage.getAssetLogs(Number(req.params.assetId));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching asset logs' });
    }
  });

  // Stats API
  app.get('/api/stats', async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const stats = await storage.getAssetStats(workspaceId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching asset stats' });
    }
  });

  // Export API
  app.get('/api/export/assets', async (req, res) => {
    try {
      const { workspaceId, assetTypeId, statusId, locationId, assignmentId, search } = req.query;
      
      // Get assets based on filters
      const assets = await storage.getAssets(
        workspaceId ? Number(workspaceId) : undefined,
        assetTypeId ? Number(assetTypeId) : undefined,
        statusId ? Number(statusId) : undefined,
        locationId ? Number(locationId) : undefined,
        assignmentId ? Number(assignmentId) : undefined,
        search ? String(search) : undefined
      );
      
      // Prepare data for CSV export
      const csvParser = new Parser({ 
        fields: [
          'id', 
          'uniqueIdentifier', 
          'name', 
          'dateAcquired', 
          'cost', 
          'notes', 
          'createdAt', 
          'updatedAt'
        ] 
      });
      
      const csv = csvParser.parse(assets);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="assets.csv"');
      res.status(200).send(csv);
    } catch (error) {
      res.status(500).json({ message: 'Error exporting assets' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
