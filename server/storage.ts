import {
  users, type User, type InsertUser, type UpsertUser,
  workspaces, type Workspace, type InsertWorkspace,
  assetTypes, type AssetType, type InsertAssetType,
  customFieldDefinitions, type CustomFieldDefinition, type InsertCustomFieldDefinition,
  manufacturers, type Manufacturer, type InsertManufacturer,
  statuses, type Status, type InsertStatus,
  locations, type Location, type InsertLocation,
  assignments, type Assignment, type InsertAssignment,
  assets, type Asset, type InsertAsset,
  assetCustomFieldValues, type AssetCustomFieldValue, type InsertAssetCustomFieldValue,
  assetLogs, type AssetLog, type InsertAssetLog,
  subscriptionPlans, type SubscriptionPlan, type InsertSubscriptionPlan,
  subscriptions, type Subscription, type InsertSubscription
} from "@shared/schema";
import { db } from "./db";
import { eq, and, isNull, desc, sql, or, like } from "drizzle-orm";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Workspace operations
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  getWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: number): Promise<Workspace | undefined>;

  // Asset Type operations
  createAssetType(assetType: InsertAssetType): Promise<AssetType>;
  getAssetTypes(workspaceId?: number): Promise<AssetType[]>;
  getAssetType(id: number): Promise<AssetType | undefined>;
  updateAssetType(id: number, assetType: Partial<InsertAssetType>): Promise<AssetType | undefined>;
  deleteAssetType(id: number): Promise<boolean>;

  // Custom Field Definition operations
  createCustomFieldDefinition(customField: InsertCustomFieldDefinition): Promise<CustomFieldDefinition>;
  getCustomFieldDefinitions(assetTypeId: number): Promise<CustomFieldDefinition[]>;
  getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition | undefined>;
  updateCustomFieldDefinition(id: number, customField: Partial<InsertCustomFieldDefinition>): Promise<CustomFieldDefinition | undefined>;
  deleteCustomFieldDefinition(id: number): Promise<boolean>;

  // Manufacturer operations
  createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer>;
  getManufacturers(workspaceId?: number): Promise<Manufacturer[]>;
  getManufacturer(id: number): Promise<Manufacturer | undefined>;
  updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer | undefined>;
  deleteManufacturer(id: number): Promise<boolean>;

  // Status operations
  createStatus(status: InsertStatus): Promise<Status>;
  getStatuses(workspaceId?: number, assetTypeId?: number): Promise<Status[]>;
  getStatus(id: number): Promise<Status | undefined>;
  updateStatus(id: number, status: Partial<InsertStatus>): Promise<Status | undefined>;
  deleteStatus(id: number): Promise<boolean>;

  // Location operations
  createLocation(location: InsertLocation): Promise<Location>;
  getLocations(workspaceId?: number, assetTypeId?: number): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;

  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignments(workspaceId?: number): Promise<Assignment[]>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;

  // Asset operations
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAssets(workspaceId?: number, assetTypeId?: number, statusId?: number, locationId?: number, assignmentId?: number, search?: string): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  archiveAsset(id: number): Promise<boolean>;
  deleteAsset(id: number): Promise<boolean>;

  // Asset Custom Field Value operations
  createAssetCustomFieldValue(customFieldValue: InsertAssetCustomFieldValue): Promise<AssetCustomFieldValue>;
  getAssetCustomFieldValues(assetId: number): Promise<AssetCustomFieldValue[]>;
  updateAssetCustomFieldValue(id: number, customFieldValue: Partial<InsertAssetCustomFieldValue>): Promise<AssetCustomFieldValue | undefined>;
  deleteAssetCustomFieldValue(id: number): Promise<boolean>;

  // Asset Log operations
  createAssetLog(log: InsertAssetLog): Promise<AssetLog>;
  getAssetLogs(assetId: number): Promise<AssetLog[]>;

  // Stats operations
  getAssetStats(workspaceId?: number): Promise<{ total: number, byStatus: { statusId: number, statusName: string, count: number }[] }>;

  // Subscription Plan operations
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<boolean>;

  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptions(workspaceId?: number): Promise<Subscription[]>;
  getActiveSubscription(workspaceId: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: number): Promise<Subscription | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Workspace operations
  async createWorkspace(workspace: InsertWorkspace): Promise<Workspace> {
    const [newWorkspace] = await db.insert(workspaces).values(workspace).returning();
    return newWorkspace;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    return await db.select().from(workspaces);
  }

  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  // Asset Type operations
  async createAssetType(assetType: InsertAssetType): Promise<AssetType> {
    const [newAssetType] = await db.insert(assetTypes).values(assetType).returning();
    return newAssetType;
  }

  async getAssetTypes(workspaceId?: number): Promise<AssetType[]> {
    if (workspaceId) {
      return await db.select().from(assetTypes).where(or(
        eq(assetTypes.workspaceId, workspaceId),
        isNull(assetTypes.workspaceId)
      ));
    }
    return await db.select().from(assetTypes);
  }

  async getAssetType(id: number): Promise<AssetType | undefined> {
    const [assetType] = await db.select().from(assetTypes).where(eq(assetTypes.id, id));
    return assetType;
  }

  async updateAssetType(id: number, assetType: Partial<InsertAssetType>): Promise<AssetType | undefined> {
    const [updatedAssetType] = await db.update(assetTypes)
      .set(assetType)
      .where(eq(assetTypes.id, id))
      .returning();
    return updatedAssetType;
  }

  async deleteAssetType(id: number): Promise<boolean> {
    const result = await db.delete(assetTypes).where(eq(assetTypes.id, id));
    return result.rowCount > 0;
  }

  // Custom Field Definition operations
  async createCustomFieldDefinition(customField: InsertCustomFieldDefinition): Promise<CustomFieldDefinition> {
    const [newCustomField] = await db.insert(customFieldDefinitions).values(customField).returning();
    return newCustomField;
  }

  async getCustomFieldDefinitions(assetTypeId: number): Promise<CustomFieldDefinition[]> {
    return await db.select().from(customFieldDefinitions).where(eq(customFieldDefinitions.assetTypeId, assetTypeId));
  }

  async getCustomFieldDefinition(id: number): Promise<CustomFieldDefinition | undefined> {
    const [customField] = await db.select().from(customFieldDefinitions).where(eq(customFieldDefinitions.id, id));
    return customField;
  }

  async updateCustomFieldDefinition(id: number, customField: Partial<InsertCustomFieldDefinition>): Promise<CustomFieldDefinition | undefined> {
    const [updatedCustomField] = await db.update(customFieldDefinitions)
      .set(customField)
      .where(eq(customFieldDefinitions.id, id))
      .returning();
    return updatedCustomField;
  }

  async deleteCustomFieldDefinition(id: number): Promise<boolean> {
    const result = await db.delete(customFieldDefinitions).where(eq(customFieldDefinitions.id, id));
    return result.rowCount > 0;
  }

  // Manufacturer operations
  async createManufacturer(manufacturer: InsertManufacturer): Promise<Manufacturer> {
    const [newManufacturer] = await db.insert(manufacturers).values(manufacturer).returning();
    return newManufacturer;
  }

  async getManufacturers(workspaceId?: number): Promise<Manufacturer[]> {
    if (workspaceId) {
      return await db.select().from(manufacturers).where(or(
        eq(manufacturers.workspaceId, workspaceId),
        isNull(manufacturers.workspaceId)
      ));
    }
    return await db.select().from(manufacturers);
  }

  async getManufacturer(id: number): Promise<Manufacturer | undefined> {
    const [manufacturer] = await db.select().from(manufacturers).where(eq(manufacturers.id, id));
    return manufacturer;
  }

  async updateManufacturer(id: number, manufacturer: Partial<InsertManufacturer>): Promise<Manufacturer | undefined> {
    const [updatedManufacturer] = await db.update(manufacturers)
      .set(manufacturer)
      .where(eq(manufacturers.id, id))
      .returning();
    return updatedManufacturer;
  }

  async deleteManufacturer(id: number): Promise<boolean> {
    const result = await db.delete(manufacturers).where(eq(manufacturers.id, id));
    return result.rowCount > 0;
  }

  // Status operations
  async createStatus(status: InsertStatus): Promise<Status> {
    const [newStatus] = await db.insert(statuses).values(status).returning();
    return newStatus;
  }

  async getStatuses(workspaceId?: number, assetTypeId?: number): Promise<Status[]> {
    if (workspaceId && assetTypeId) {
      return await db.select().from(statuses).where(
        or(
          and(
            or(eq(statuses.workspaceId, workspaceId), isNull(statuses.workspaceId)),
            or(eq(statuses.assetTypeId, assetTypeId), isNull(statuses.assetTypeId))
          ),
          and(isNull(statuses.workspaceId), isNull(statuses.assetTypeId))
        )
      );
    } else if (workspaceId) {
      return await db.select().from(statuses).where(
        or(eq(statuses.workspaceId, workspaceId), isNull(statuses.workspaceId))
      );
    } else if (assetTypeId) {
      return await db.select().from(statuses).where(
        or(eq(statuses.assetTypeId, assetTypeId), isNull(statuses.assetTypeId))
      );
    }
    return await db.select().from(statuses);
  }

  async getStatus(id: number): Promise<Status | undefined> {
    const [status] = await db.select().from(statuses).where(eq(statuses.id, id));
    return status;
  }

  async updateStatus(id: number, status: Partial<InsertStatus>): Promise<Status | undefined> {
    const [updatedStatus] = await db.update(statuses)
      .set(status)
      .where(eq(statuses.id, id))
      .returning();
    return updatedStatus;
  }

  async deleteStatus(id: number): Promise<boolean> {
    const result = await db.delete(statuses).where(eq(statuses.id, id));
    return result.rowCount > 0;
  }

  // Location operations
  async createLocation(location: InsertLocation): Promise<Location> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async getLocations(workspaceId?: number, assetTypeId?: number): Promise<Location[]> {
    if (workspaceId && assetTypeId) {
      return await db.select().from(locations).where(
        or(
          and(
            or(eq(locations.workspaceId, workspaceId), isNull(locations.workspaceId)),
            or(eq(locations.assetTypeId, assetTypeId), isNull(locations.assetTypeId))
          ),
          and(isNull(locations.workspaceId), isNull(locations.assetTypeId))
        )
      );
    } else if (workspaceId) {
      return await db.select().from(locations).where(
        or(eq(locations.workspaceId, workspaceId), isNull(locations.workspaceId))
      );
    } else if (assetTypeId) {
      return await db.select().from(locations).where(
        or(eq(locations.assetTypeId, assetTypeId), isNull(locations.assetTypeId))
      );
    }
    return await db.select().from(locations);
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined> {
    const [updatedLocation] = await db.update(locations)
      .set(location)
      .where(eq(locations.id, id))
      .returning();
    return updatedLocation;
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id));
    return result.rowCount > 0;
  }

  // Assignment operations
  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values(assignment).returning();
    return newAssignment;
  }

  async getAssignments(workspaceId?: number): Promise<Assignment[]> {
    if (workspaceId) {
      return await db.select().from(assignments).where(
        or(eq(assignments.workspaceId, workspaceId), isNull(assignments.workspaceId))
      );
    }
    return await db.select().from(assignments);
  }

  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async updateAssignment(id: number, assignment: Partial<InsertAssignment>): Promise<Assignment | undefined> {
    const [updatedAssignment] = await db.update(assignments)
      .set(assignment)
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id));
    return result.rowCount > 0;
  }

  // Asset operations
  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values(asset).returning();
    return newAsset;
  }

  async getAssets(workspaceId?: number, assetTypeId?: number, statusId?: number, locationId?: number, assignmentId?: number, search?: string): Promise<Asset[]> {
    let query = db.select().from(assets).where(eq(assets.isArchived, false));

    if (workspaceId) {
      query = query.where(or(eq(assets.workspaceId, workspaceId), isNull(assets.workspaceId)));
    }

    if (assetTypeId) {
      query = query.where(eq(assets.assetTypeId, assetTypeId));
    }

    if (statusId) {
      query = query.where(eq(assets.currentStatusId, statusId));
    }

    if (locationId) {
      query = query.where(eq(assets.currentLocationId, locationId));
    }

    if (assignmentId) {
      query = query.where(eq(assets.currentAssignmentId, assignmentId));
    }

    if (search) {
      query = query.where(
        or(
          like(assets.name, `%${search}%`),
          like(assets.uniqueIdentifier, `%${search}%`),
          like(assets.notes, `%${search}%`)
        )
      );
    }

    return await query.orderBy(desc(assets.updatedAt));
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updatedAsset] = await db.update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updatedAsset;
  }

  async archiveAsset(id: number): Promise<boolean> {
    const result = await db.update(assets)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(assets.id, id));
    return result.rowCount > 0;
  }

  async deleteAsset(id: number): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id));
    return result.rowCount > 0;
  }

  // Asset Custom Field Value operations
  async createAssetCustomFieldValue(customFieldValue: InsertAssetCustomFieldValue): Promise<AssetCustomFieldValue> {
    const [newCustomFieldValue] = await db.insert(assetCustomFieldValues).values(customFieldValue).returning();
    return newCustomFieldValue;
  }

  async getAssetCustomFieldValues(assetId: number): Promise<AssetCustomFieldValue[]> {
    return await db.select().from(assetCustomFieldValues).where(eq(assetCustomFieldValues.assetId, assetId));
  }

  async updateAssetCustomFieldValue(id: number, customFieldValue: Partial<InsertAssetCustomFieldValue>): Promise<AssetCustomFieldValue | undefined> {
    const [updatedCustomFieldValue] = await db.update(assetCustomFieldValues)
      .set({ ...customFieldValue, updatedAt: new Date() })
      .where(eq(assetCustomFieldValues.id, id))
      .returning();
    return updatedCustomFieldValue;
  }

  async deleteAssetCustomFieldValue(id: number): Promise<boolean> {
    const result = await db.delete(assetCustomFieldValues).where(eq(assetCustomFieldValues.id, id));
    return result.rowCount > 0;
  }

  // Asset Log operations
  async createAssetLog(log: InsertAssetLog): Promise<AssetLog> {
    const [newLog] = await db.insert(assetLogs).values(log).returning();
    return newLog;
  }

  async getAssetLogs(assetId: number): Promise<AssetLog[]> {
    return await db.select().from(assetLogs)
      .where(eq(assetLogs.assetId, assetId))
      .orderBy(desc(assetLogs.timestamp));
  }

  // Stats operations
  async getAssetStats(workspaceId?: number): Promise<{ total: number, byStatus: { statusId: number, statusName: string, count: number }[] }> {
    // Get total asset count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(and(
        eq(assets.isArchived, false),
        workspaceId ? or(eq(assets.workspaceId, workspaceId), isNull(assets.workspaceId)) : undefined
      ));

    const total = totalResult?.count || 0;

    // Get assets grouped by status
    const byStatus = await db
      .select({
        statusId: statuses.id,
        statusName: statuses.name,
        count: sql<number>`count(${assets.id})`
      })
      .from(assets)
      .leftJoin(statuses, eq(assets.currentStatusId, statuses.id))
      .where(and(
        eq(assets.isArchived, false),
        workspaceId ? or(eq(assets.workspaceId, workspaceId), isNull(assets.workspaceId)) : undefined
      ))
      .groupBy(statuses.id, statuses.name);

    return { total, byStatus };
  }

  // Subscription Plan operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans);
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db.update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteSubscriptionPlan(id: number): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return result.rowCount > 0;
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async getSubscriptions(workspaceId?: number): Promise<Subscription[]> {
    if (workspaceId) {
      return await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspaceId));
    }
    return await db.select().from(subscriptions);
  }

  async getActiveSubscription(workspaceId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.workspaceId, workspaceId),
          eq(subscriptions.status, 'active')
        )
      )
      .orderBy(desc(subscriptions.startDate))
      .limit(1);

    return subscription;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db.update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async cancelSubscription(id: number): Promise<Subscription | undefined> {
    const [canceledSubscription] = await db.update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return canceledSubscription;
  }
}

export const storage = new DatabaseStorage();
