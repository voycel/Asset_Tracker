import { IStorage } from './storage';
import {
  User, Workspace, AssetType, CustomFieldDefinition, Manufacturer,
  Status, Location, Assignment, Asset, AssetCustomFieldValue, AssetLog,
  SubscriptionPlan, Subscription, InsertUser, InsertWorkspace, InsertAssetType,
  InsertCustomFieldDefinition, InsertManufacturer, InsertStatus, InsertLocation,
  InsertAssignment, InsertAsset, InsertAssetCustomFieldValue, InsertAssetLog,
  InsertSubscriptionPlan, InsertSubscription, UpsertUser
} from '@shared/schema';

// Mock data storage for local development
export class MockStorage implements IStorage {
  private users: User[] = [];
  private workspaces: Workspace[] = [];
  private assetTypes: AssetType[] = [];
  private customFieldDefinitions: CustomFieldDefinition[] = [];
  private manufacturers: Manufacturer[] = [];
  private statuses: Status[] = [];
  private locations: Location[] = [];
  private assignments: Assignment[] = [];
  private assets: Asset[] = [];
  private assetCustomFieldValues: AssetCustomFieldValue[] = [];
  private assetLogs: AssetLog[] = [];
  private subscriptionPlans: SubscriptionPlan[] = [];
  private subscriptions: Subscription[] = [];
  
  constructor() {
    // Initialize with some default data
    this.initializeDefaultData();
  }
  
  private initializeDefaultData() {
    // Create default workspace
    const workspace: Workspace = {
      id: 1,
      name: 'Default Workspace',
      createdAt: new Date()
    };
    this.workspaces.push(workspace);
    
    // Create default statuses
    this.statuses.push({
      id: 1,
      workspaceId: workspace.id,
      name: 'Available',
      color: '#6B7280',
      createdAt: new Date()
    });
    this.statuses.push({
      id: 2,
      workspaceId: workspace.id,
      name: 'In Use',
      color: '#10B981',
      createdAt: new Date()
    });
    this.statuses.push({
      id: 3,
      workspaceId: workspace.id,
      name: 'In Maintenance',
      color: '#F59E0B',
      createdAt: new Date()
    });
    this.statuses.push({
      id: 4,
      workspaceId: workspace.id,
      name: 'Requires Attention',
      color: '#EF4444',
      createdAt: new Date()
    });
    
    // Create default location
    this.locations.push({
      id: 1,
      workspaceId: workspace.id,
      name: 'Main Storage',
      description: 'Primary storage location',
      createdAt: new Date()
    });
    
    // Create default subscription plans
    this.subscriptionPlans.push({
      id: 1,
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
      userLimit: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.subscriptionPlans.push({
      id: 2,
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
      userLimit: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.subscriptionPlans.push({
      id: 3,
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
      userLimit: 15,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    this.subscriptionPlans.push({
      id: 4,
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
      userLimit: null, // Unlimited
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUser(userData.id);
    if (existingUser) {
      // Update existing user
      Object.assign(existingUser, {
        ...userData,
        updatedAt: new Date()
      });
      return existingUser;
    } else {
      // Create new user
      return this.createUser(userData as InsertUser);
    }
  }

  // Workspace operations
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const newWorkspace: Workspace = {
      id: this.workspaces.length + 1,
      ...workspace,
      createdAt: new Date()
    };
    this.workspaces.push(newWorkspace);
    return newWorkspace;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return this.workspaces;
  }

  async getWorkspace(id: number): Promise<Workspace | undefined> {
    return this.workspaces.find(workspace => workspace.id === id);
  }

  // Subscription plan operations
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlans;
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.find(plan => plan.id === id);
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const newPlan: SubscriptionPlan = {
      id: this.subscriptionPlans.length + 1,
      ...plan,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.subscriptionPlans.push(newPlan);
    return newPlan;
  }

  async updateSubscriptionPlan(id: number, plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const existingPlan = await this.getSubscriptionPlan(id);
    if (existingPlan) {
      Object.assign(existingPlan, {
        ...plan,
        updatedAt: new Date()
      });
      return existingPlan;
    }
    return undefined;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const index = this.subscriptionPlans.findIndex(plan => plan.id === id);
    if (index !== -1) {
      this.subscriptionPlans.splice(index, 1);
      return true;
    }
    return false;
  }

  // Implement other methods as needed for your application
  // This is a simplified version for local development
  
  // Status operations
  async getStatuses(workspaceId?: number, assetTypeId?: number): Promise<Status[]> {
    return this.statuses.filter(status => 
      (!workspaceId || status.workspaceId === workspaceId) &&
      (!assetTypeId || status.assetTypeId === assetTypeId)
    );
  }

  async createStatus(status: InsertStatus): Promise<Status> {
    const newStatus: Status = {
      id: this.statuses.length + 1,
      ...status,
      createdAt: new Date()
    };
    this.statuses.push(newStatus);
    return newStatus;
  }

  async updateStatus(id: number, status: Partial<Status>): Promise<Status | undefined> {
    const existingStatus = this.statuses.find(s => s.id === id);
    if (existingStatus) {
      Object.assign(existingStatus, status);
      return existingStatus;
    }
    return undefined;
  }

  async deleteStatus(id: number): Promise<boolean> {
    const index = this.statuses.findIndex(s => s.id === id);
    if (index !== -1) {
      this.statuses.splice(index, 1);
      return true;
    }
    return false;
  }

  // Location operations
  async getLocations(workspaceId?: number, assetTypeId?: number): Promise<Location[]> {
    return this.locations.filter(location => 
      (!workspaceId || location.workspaceId === workspaceId) &&
      (!assetTypeId || location.assetTypeId === assetTypeId)
    );
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const newLocation: Location = {
      id: this.locations.length + 1,
      ...location,
      createdAt: new Date()
    };
    this.locations.push(newLocation);
    return newLocation;
  }

  async updateLocation(id: number, location: Partial<Location>): Promise<Location | undefined> {
    const existingLocation = this.locations.find(l => l.id === id);
    if (existingLocation) {
      Object.assign(existingLocation, location);
      return existingLocation;
    }
    return undefined;
  }

  async deleteLocation(id: number): Promise<boolean> {
    const index = this.locations.findIndex(l => l.id === id);
    if (index !== -1) {
      this.locations.splice(index, 1);
      return true;
    }
    return false;
  }

  // Add other methods as needed
  // This is a simplified implementation for local development
}
