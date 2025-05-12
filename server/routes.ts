import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Parser, Transform } from 'json2csv';
import { setupAuth, isAuthenticated } from "./localAuth";
import {
  insertWorkspaceSchema, insertAssetTypeSchema, insertCustomFieldDefinitionSchema,
  insertManufacturerSchema, insertStatusSchema, insertLocationSchema,
  insertAssignmentSchema, insertUserSchema, insertAssetSchema,
  insertAssetCustomFieldValueSchema, insertAssetLogSchema,
  insertSubscriptionPlanSchema, insertSubscriptionSchema,
  insertCustomerSchema, insertAssetRelationshipSchema // Added schemas
} from '@shared/schema';
import { ZodError } from "zod";
import { createCheckoutSession, setupStripePrices } from './stripe';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Helper middleware for handling Zod validation errors
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        console.log('Validating request body:', req.body);
        console.log('Using schema:', schema);
        req.body = schema.parse(req.body);
        console.log('Validation successful, parsed body:', req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          console.error('Validation error:', error.errors);
          return res.status(400).json({
            message: 'Validation error',
            errors: error.errors
          });
        }
        console.error('Non-validation error:', error);
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

  // Create default subscription plans if they don't exist
  const setupDefaultSubscriptionPlans = async () => {
    const plans = await storage.getSubscriptionPlans();
    if (plans.length === 0) {
      // Free Plan
      await storage.createSubscriptionPlan({
        name: 'Free',
        description: 'Basic asset tracking for individuals and small teams',
        price: 0,
        billingCycle: 'monthly',
        features: [
          'Up to 25 assets',
          'Up to 2 users',
          'Basic asset tracking',
          'Limited reporting'
        ],
        assetLimit: 25,
        userLimit: 2
      });

      // Light Plan
      await storage.createSubscriptionPlan({
        name: 'Light',
        description: 'Enhanced asset tracking for growing teams',
        price: 1999, // $19.99
        billingCycle: 'monthly',
        features: [
          'Up to 100 assets',
          'Up to 5 users',
          'Advanced asset tracking',
          'Basic reporting',
          'Email support'
        ],
        assetLimit: 100,
        userLimit: 5
      });

      // Pro Plan
      await storage.createSubscriptionPlan({
        name: 'Pro',
        description: 'Professional asset management for businesses',
        price: 4999, // $49.99
        billingCycle: 'monthly',
        features: [
          'Up to 500 assets',
          'Up to 15 users',
          'Advanced asset tracking',
          'Comprehensive reporting',
          'Priority email support',
          'API access'
        ],
        assetLimit: 500,
        userLimit: 15
      });

      // Enterprise Plan
      await storage.createSubscriptionPlan({
        name: 'Enterprise',
        description: 'Custom asset management solutions for large organizations',
        price: 0, // Custom pricing
        billingCycle: 'monthly',
        features: [
          'Unlimited assets',
          'Unlimited users',
          'Advanced asset tracking',
          'Custom reporting',
          'Dedicated support',
          'API access',
          'Custom integrations',
          'SLA guarantees'
        ],
        assetLimit: null, // Unlimited
        userLimit: null // Unlimited
      });
    }
  };

  // Setup Stripe prices for subscription plans
  const setupStripeIntegration = async () => {
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        // Setup Stripe prices for our subscription plans
        await setupStripePrices();
        console.log('Stripe prices setup complete');
      } catch (error) {
        console.error('Error setting up Stripe prices:', error);
      }
    } else {
      console.log('Stripe integration skipped - STRIPE_SECRET_KEY not set');
    }
  };

  await setupDefaultWorkspace();
  await setupDefaultSubscriptionPlans();
  await setupStripeIntegration();

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
  app.get('/api/users', isAuthenticated, async (req: any, res) => { // Added isAuthenticated middleware
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID not found for user.' });
      }
      // Fetch users belonging to the same workspace
      const users = await storage.getUsers(workspaceId);
      // Users fetched from storage already exclude password if schema is set up correctly
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  app.post('/api/users', isAuthenticated, validateRequest(insertUserSchema), async (req: any, res) => { // Added isAuthenticated
    try {
      const workspaceId = req.user.workspaceId;
      if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID not found for user.' });
      }
      // TODO: Add logic to handle user creation securely (hashing password, etc.)
      // For now, assume password handling happens elsewhere or is not needed for this endpoint
      const userData = { ...req.body, workspaceId }; // Ensure user is added to the correct workspace
      const user = await storage.createUser(userData);
      // User returned from storage should already exclude password
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
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
      const assetId = Number(req.params.id);

      // Validate inputs
      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }

      // If statusId is not null, validate it exists
      if (statusId !== null) {
        const statusExists = await storage.getStatus(statusId);
        if (!statusExists) {
          return res.status(400).json({ message: 'Invalid status ID' });
        }
      }

      // Update the asset status
      const asset = await storage.updateAsset(assetId, { currentStatusId: statusId });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      // Create log entry for status change
      await storage.createAssetLog({
        assetId: asset.id,
        userId: userId || 1, // Fallback to system user if not provided
        actionType: 'UPDATE_STATUS',
        detailsJson: {
          message: 'Status updated',
          statusId,
          previousStatusId: asset.currentStatusId
        }
      });

      res.json(asset);
    } catch (error) {
      console.error('Error updating asset status:', error);
      res.status(500).json({
        message: 'Error updating asset status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch('/api/assets/:id/location', async (req, res) => {
    try {
      const { locationId, userId } = req.body;
      const assetId = Number(req.params.id);

      // Validate inputs
      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }

      // If locationId is not null, validate it exists
      if (locationId !== null) {
        const locationExists = await storage.getLocation(locationId);
        if (!locationExists) {
          return res.status(400).json({ message: 'Invalid location ID' });
        }
      }

      // Update the asset location
      const asset = await storage.updateAsset(assetId, { currentLocationId: locationId });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      // Create log entry for location change
      await storage.createAssetLog({
        assetId: asset.id,
        userId: userId || 1, // Fallback to system user if not provided
        actionType: 'UPDATE_LOCATION',
        detailsJson: {
          message: 'Location updated',
          locationId,
          previousLocationId: asset.currentLocationId
        }
      });

      res.json(asset);
    } catch (error) {
      console.error('Error updating asset location:', error);
      res.status(500).json({
        message: 'Error updating asset location',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.patch('/api/assets/:id/assignment', async (req, res) => {
    try {
      const { assignmentId, userId } = req.body;
      const assetId = Number(req.params.id);

      // Validate inputs
      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }

      // If assignmentId is not null, validate it exists
      if (assignmentId !== null) {
        const assignmentExists = await storage.getAssignment(assignmentId);
        if (!assignmentExists) {
          return res.status(400).json({ message: 'Invalid assignment ID' });
        }
      }

      // Update the asset assignment
      const asset = await storage.updateAsset(assetId, { currentAssignmentId: assignmentId });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      // Create log entry for assignment change
      await storage.createAssetLog({
        assetId: asset.id,
        userId: userId || 1, // Fallback to system user if not provided
        actionType: 'ASSIGNED',
        detailsJson: {
          message: 'Assignment updated',
          assignmentId,
          previousAssignmentId: asset.currentAssignmentId
        }
      });

      res.json(asset);
    } catch (error) {
      console.error('Error updating asset assignment:', error);
      res.status(500).json({
        message: 'Error updating asset assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Customer Assignment API
  app.patch('/api/assets/:id/customer', async (req, res) => {
    try {
      const { customerId, userId } = req.body;
      const assetId = Number(req.params.id);

      // Validate inputs
      if (isNaN(assetId)) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }

      // If customerId is not null, validate it exists
      if (customerId !== null) {
        const customerExists = await storage.getCustomer(customerId);
        if (!customerExists) {
          return res.status(400).json({ message: 'Invalid customer ID' });
        }
      }

      // Update the asset customer
      const asset = await storage.updateAsset(assetId, { currentCustomerId: customerId });
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      // Create log entry for customer assignment change
      await storage.createAssetLog({
        assetId: asset.id,
        userId: userId || 1, // Fallback to system user if not provided
        actionType: 'CUSTOMER_ASSIGNED',
        detailsJson: {
          message: 'Customer assignment updated',
          customerId,
          previousCustomerId: asset.currentCustomerId
        }
      });

      res.json(asset);
    } catch (error) {
      console.error('Error updating asset customer assignment:', error);
      res.status(500).json({
        message: 'Error updating asset customer assignment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Asset Relationships API
  app.get('/api/asset-relationships', async (req, res) => {
    try {
      const assetId = req.query.assetId ? Number(req.query.assetId) : undefined;
      const includeReverse = req.query.includeReverse === 'true';

      if (!assetId) {
        return res.status(400).json({ message: 'Asset ID is required' });
      }

      // Get relationships from database
      const relationships = await storage.getAssetRelationships(assetId, includeReverse);

      // Enhance the response with asset details
      const enhancedRelationships = await Promise.all(relationships.map(async (rel) => {
        const sourceAsset = await storage.getAsset(rel.sourceAssetId);
        const targetAsset = await storage.getAsset(rel.targetAssetId);

        return {
          ...rel,
          sourceAsset: sourceAsset ? {
            id: sourceAsset.id,
            name: sourceAsset.name,
            uniqueIdentifier: sourceAsset.uniqueIdentifier
          } : null,
          targetAsset: targetAsset ? {
            id: targetAsset.id,
            name: targetAsset.name,
            uniqueIdentifier: targetAsset.uniqueIdentifier
          } : null
        };
      }));

      res.json(enhancedRelationships);
    } catch (error) {
      console.error('Error fetching asset relationships:', error);
      res.status(500).json({
        message: 'Error fetching asset relationships',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/asset-relationships', validateRequest(insertAssetRelationshipSchema), async (req, res) => {
    try {
      const { sourceAssetId, targetAssetId, relationshipType, notes, userId, workspaceId } = req.body;

      // Validate inputs
      if (!sourceAssetId || !targetAssetId || !relationshipType) {
        return res.status(400).json({ message: 'Source asset ID, target asset ID, and relationship type are required' });
      }

      // Validate assets exist
      const sourceAsset = await storage.getAsset(sourceAssetId);
      if (!sourceAsset) {
        return res.status(400).json({ message: 'Source asset not found' });
      }

      const targetAsset = await storage.getAsset(targetAssetId);
      if (!targetAsset) {
        return res.status(400).json({ message: 'Target asset not found' });
      }

      // Check if relationship already exists
      const existingRelationships = await storage.getAssetRelationships(sourceAssetId);
      const alreadyExists = existingRelationships.some(rel =>
        rel.sourceAssetId === sourceAssetId &&
        rel.targetAssetId === targetAssetId &&
        rel.relationshipType === relationshipType
      );

      if (alreadyExists) {
        return res.status(400).json({ message: 'This relationship already exists' });
      }

      // Create the relationship in the database
      const relationship = await storage.createAssetRelationship({
        sourceAssetId,
        targetAssetId,
        relationshipType,
        notes,
        workspaceId: workspaceId || sourceAsset.workspaceId
      });

      // Create log entries for both assets
      await storage.createAssetLog({
        assetId: sourceAssetId,
        userId: userId || null,
        actionType: 'RELATIONSHIP_CREATED',
        detailsJson: {
          message: `Relationship created with asset ${targetAsset.name}`,
          relationshipType,
          targetAssetId
        }
      });

      await storage.createAssetLog({
        assetId: targetAssetId,
        userId: userId || null,
        actionType: 'RELATIONSHIP_CREATED',
        detailsJson: {
          message: `Relationship created with asset ${sourceAsset.name}`,
          relationshipType,
          sourceAssetId
        }
      });

      res.status(201).json(relationship);
    } catch (error) {
      console.error('Error creating asset relationship:', error);
      res.status(500).json({
        message: 'Error creating asset relationship',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put('/api/asset-relationships/:id', validateRequest(insertAssetRelationshipSchema.partial()), async (req, res) => {
    try {
      const relationshipId = Number(req.params.id);
      const { relationshipType, notes, userId } = req.body;

      // Get the existing relationship
      const existingRelationship = await storage.getAssetRelationship(relationshipId);
      if (!existingRelationship) {
        return res.status(404).json({ message: 'Relationship not found' });
      }

      // Update the relationship
      const updatedRelationship = await storage.updateAssetRelationship(relationshipId, {
        relationshipType,
        notes
      });

      // Create log entries for both assets
      if (updatedRelationship) {
        const sourceAsset = await storage.getAsset(updatedRelationship.sourceAssetId);
        const targetAsset = await storage.getAsset(updatedRelationship.targetAssetId);

        if (sourceAsset && targetAsset) {
          await storage.createAssetLog({
            assetId: updatedRelationship.sourceAssetId,
            userId: userId || null,
            actionType: 'RELATIONSHIP_UPDATED',
            detailsJson: {
              message: `Relationship with asset ${targetAsset.name} updated`,
              relationshipType,
              previousRelationshipType: existingRelationship.relationshipType
            }
          });

          await storage.createAssetLog({
            assetId: updatedRelationship.targetAssetId,
            userId: userId || null,
            actionType: 'RELATIONSHIP_UPDATED',
            detailsJson: {
              message: `Relationship with asset ${sourceAsset.name} updated`,
              relationshipType,
              previousRelationshipType: existingRelationship.relationshipType
            }
          });
        }
      }

      res.json(updatedRelationship);
    } catch (error) {
      console.error('Error updating asset relationship:', error);
      res.status(500).json({
        message: 'Error updating asset relationship',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete('/api/asset-relationships/:id', async (req, res) => {
    try {
      const relationshipId = Number(req.params.id);
      const { userId } = req.body;

      // Get the relationship before deleting it
      const relationship = await storage.getAssetRelationship(relationshipId);
      if (!relationship) {
        return res.status(404).json({ message: 'Relationship not found' });
      }

      // Get the assets involved
      const sourceAsset = await storage.getAsset(relationship.sourceAssetId);
      const targetAsset = await storage.getAsset(relationship.targetAssetId);

      // Delete the relationship
      const result = await storage.deleteAssetRelationship(relationshipId);
      if (!result) {
        return res.status(404).json({ message: 'Relationship not found' });
      }

      // Create log entries for both assets
      if (sourceAsset && targetAsset) {
        await storage.createAssetLog({
          assetId: relationship.sourceAssetId,
          userId: userId || null,
          actionType: 'RELATIONSHIP_DELETED',
          detailsJson: {
            message: `Relationship with asset ${targetAsset.name} deleted`,
            relationshipType: relationship.relationshipType,
            targetAssetId: relationship.targetAssetId
          }
        });

        await storage.createAssetLog({
          assetId: relationship.targetAssetId,
          userId: userId || null,
          actionType: 'RELATIONSHIP_DELETED',
          detailsJson: {
            message: `Relationship with asset ${sourceAsset.name} deleted`,
            relationshipType: relationship.relationshipType,
            sourceAssetId: relationship.sourceAssetId
          }
        });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting asset relationship:', error);
      res.status(500).json({
        message: 'Error deleting asset relationship',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Asset Custom Field Values API
  app.get('/api/assets/:assetId/custom-field-values', async (req, res) => {
    try {
      const customFieldValues = await storage.getAssetCustomFieldValues(Number(req.params.assetId));
      res.json(customFieldValues);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching custom field values' });
    }
  });

  app.post('/api/asset-custom-field-values', validateRequest(insertAssetCustomFieldValueSchema), async (req, res) => {
    try {
      const customFieldValue = await storage.createAssetCustomFieldValue(req.body);
      res.status(201).json(customFieldValue);
    } catch (error) {
      res.status(500).json({ message: 'Error creating custom field value' });
    }
  });

  app.put('/api/asset-custom-field-values/:id', async (req, res) => {
    try {
      const customFieldValue = await storage.updateAssetCustomFieldValue(Number(req.params.id), req.body);
      if (!customFieldValue) {
        return res.status(404).json({ message: 'Custom field value not found' });
      }
      res.json(customFieldValue);
    } catch (error) {
      res.status(500).json({ message: 'Error updating custom field value' });
    }
  });

  app.delete('/api/asset-custom-field-values/:id', async (req, res) => {
    try {
      const result = await storage.deleteAssetCustomFieldValue(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Custom field value not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting custom field value' });
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

  // Subscription Plans API
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching subscription plans' });
    }
  });

  app.get('/api/subscription-plans/:id', async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlan(Number(req.params.id));
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching subscription plan' });
    }
  });

  app.post('/api/subscription-plans', isAuthenticated, validateRequest(insertSubscriptionPlanSchema), async (req, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ message: 'Error creating subscription plan' });
    }
  });

  app.put('/api/subscription-plans/:id', isAuthenticated, async (req, res) => {
    try {
      const plan = await storage.updateSubscriptionPlan(Number(req.params.id), req.body);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }
      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: 'Error updating subscription plan' });
    }
  });

  app.delete('/api/subscription-plans/:id', isAuthenticated, async (req, res) => {
    try {
      const result = await storage.deleteSubscriptionPlan(Number(req.params.id));
      if (!result) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Error deleting subscription plan' });
    }
  });

  // Subscriptions API
  app.get('/api/subscriptions', isAuthenticated, async (req, res) => {
    try {
      const workspaceId = req.query.workspaceId ? Number(req.query.workspaceId) : undefined;
      const subscriptions = await storage.getSubscriptions(workspaceId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching subscriptions' });
    }
  });

  app.get('/api/workspaces/:workspaceId/active-subscription', isAuthenticated, async (req, res) => {
    try {
      const subscription = await storage.getActiveSubscription(Number(req.params.workspaceId));
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }

      // Get the subscription plan details
      const plan = await storage.getSubscriptionPlan(subscription.planId);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      res.json({ subscription, plan });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching active subscription' });
    }
  });

  app.post('/api/subscriptions', isAuthenticated, validateRequest(insertSubscriptionSchema), async (req, res) => {
    try {
      const subscription = await storage.createSubscription(req.body);
      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ message: 'Error creating subscription' });
    }
  });

  app.put('/api/subscriptions/:id', isAuthenticated, async (req, res) => {
    try {
      const subscription = await storage.updateSubscription(Number(req.params.id), req.body);
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: 'Error updating subscription' });
    }
  });

  app.post('/api/subscriptions/:id/cancel', isAuthenticated, async (req, res) => {
    try {
      const subscription = await storage.cancelSubscription(Number(req.params.id));
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: 'Error canceling subscription' });
    }
  });

  // Enterprise Contact Form API
  app.post('/api/contact/enterprise', async (req, res) => {
    try {
      const { name, email, company, phone, message } = req.body;

      // In a real implementation, you would send this information to your CRM or email system
      // For now, we'll just log it and return success
      console.log('Enterprise Contact Form Submission:', { name, email, company, phone, message });

      res.status(200).json({ message: 'Contact form submitted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting contact form' });
    }
  });

  // Stripe Checkout Session API
  app.post('/api/checkout-session', isAuthenticated, async (req, res) => {
    try {
      const { planId, workspaceId } = req.body;

      if (!planId || !workspaceId) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // Get the subscription plan
      const plan = await storage.getSubscriptionPlan(Number(planId));
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      // Free plan doesn't need a checkout session
      if (plan.price === 0) {
        // Create a free subscription directly
        const subscription = await storage.createSubscription({
          workspaceId: Number(workspaceId),
          planId: Number(planId),
          status: 'active',
          startDate: new Date(),
        });

        return res.status(200).json({
          subscription,
          url: null // No redirect needed for free plan
        });
      }

      // For paid plans, create a Stripe checkout session
      if (!process.env.STRIPE_SECRET_KEY) {
        // Fallback if Stripe is not configured
        return res.status(200).json({ url: null });
      }

      // In a real implementation, you would:
      // 1. Get or create a Stripe customer for this user
      // 2. Get the Stripe price ID for this plan
      // 3. Create a checkout session with the correct price

      // For now, we'll create a simple checkout session
      // This is a placeholder - in production you would use actual Stripe price IDs
      const stripePriceMap: { [key: string]: string } = { // Added explicit type
        'Light': 'price_1PG...', // Replace with actual Stripe price IDs
        'Pro': 'price_1PG...',
        // Enterprise usually has custom pricing, handle separately or omit
      };

      const priceId = stripePriceMap[plan.name];
      if (!priceId && plan.price > 0) { // Check if priceId exists for paid plans
        console.error(`Stripe Price ID not found for plan: ${plan.name}`);
        return res.status(400).json({ message: 'Pricing configuration error for this plan.' });
      }

      const session = await createCheckoutSession(priceId);

      // Store the checkout session ID and plan details for later verification
      // In a real implementation, you would save this to your database

      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ message: 'Error creating checkout session' });
    }
  });

  // Customers API (New)
  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      console.log('GET /api/customers - User:', req.user);
      const workspaceId = req.user.workspaceId; // Get workspace from authenticated user
      if (!workspaceId) {
        console.error('Workspace ID not found for user:', req.user);
        return res.status(400).json({ message: 'Workspace ID not found for user.' });
      }
      console.log('Fetching customers for workspace:', workspaceId);
      const customers = await storage.getCustomers(workspaceId);
      console.log('Customers found:', customers.length);
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ message: 'Error fetching customers' });
    }
  });

  app.post('/api/customers', isAuthenticated, validateRequest(insertCustomerSchema), async (req: any, res) => {
    try {
      console.log('POST /api/customers - Request body:', req.body);
      console.log('User:', req.user);

      const workspaceId = req.user.workspaceId;
      if (!workspaceId) {
        console.error('Workspace ID not found for user:', req.user);
        return res.status(400).json({ message: 'Workspace ID not found for user.' });
      }

      // Clean up the data to ensure null values are properly handled
      const cleanedData = {
        name: req.body.name,
        email: req.body.email || null,
        phone: req.body.phone || null,
        address: req.body.address || null,
        notes: req.body.notes || null,
        workspaceId
      };

      console.log('Creating customer with cleaned data:', cleanedData);

      const customer = await storage.createCustomer(cleanedData);
      console.log('Customer created successfully:', customer);

      // Return the created customer
      res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ message: 'Error creating customer', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, validateRequest(insertCustomerSchema.partial()), async (req: any, res) => { // Use partial schema for updates
    try {
      const customerId = Number(req.params.id);
      const workspaceId = req.user.workspaceId;

      // Optional: Verify customer belongs to the user's workspace before updating
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer || existingCustomer.workspaceId !== workspaceId) {
          return res.status(404).json({ message: 'Customer not found or access denied.' });
      }

      const customer = await storage.updateCustomer(customerId, req.body);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ message: 'Error updating customer' });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const customerId = Number(req.params.id);
      const workspaceId = req.user.workspaceId;

      // Optional: Verify customer belongs to the user's workspace before deleting
      const existingCustomer = await storage.getCustomer(customerId);
      if (!existingCustomer || existingCustomer.workspaceId !== workspaceId) {
          return res.status(404).json({ message: 'Customer not found or access denied.' });
      }

      const result = await storage.deleteCustomer(customerId);
      if (!result) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ message: 'Error deleting customer' });
    }
  });

  // Stripe Webhook Handler
  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: 'Stripe not configured' });
    }

    try {
      // In a real implementation, you would:
      // 1. Verify the webhook signature
      // 2. Parse the event
      // 3. Handle different event types (checkout.session.completed, etc.)
      // 4. Update your database accordingly

      console.log('Stripe webhook received');

      // For now, just acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      res.status(400).json({ message: 'Webhook error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
