import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Workspaces (Organizations)
export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Asset Types
export const assetTypes = pgTable("asset_types", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("dashboard"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Field Definitions
export const customFieldDefinitions = pgTable("custom_field_definitions", {
  id: serial("id").primaryKey(),
  assetTypeId: integer("asset_type_id").references(() => assetTypes.id, { onDelete: "cascade" }).notNull(),
  fieldName: text("field_name").notNull(),
  fieldType: text("field_type").notNull(), // 'Text', 'Number', 'Date', 'Boolean', 'Dropdown', 'User_Reference'
  isRequired: boolean("is_required").default(false),
  dropdownOptions: text("dropdown_options").array(), // For dropdown fields
  isFilterable: boolean("is_filterable").default(false),
  isVisibleOnCard: boolean("is_visible_on_card").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manufacturers
export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Statuses
export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  assetTypeId: integer("asset_type_id").references(() => assetTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6B7280"), // Default neutral color
  createdAt: timestamp("created_at").defaultNow(),
});

// Locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  assetTypeId: integer("asset_type_id").references(() => assetTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assignments/Contexts/Projects
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Free', 'Light', 'Pro', 'Enterprise'
  description: text("description").notNull(),
  price: integer("price").notNull(), // Price in cents
  billingCycle: text("billing_cycle").notNull(), // 'monthly', 'yearly'
  features: jsonb("features").notNull(), // Array of features included in this plan
  assetLimit: integer("asset_limit"), // Maximum number of assets allowed (null for unlimited)
  userLimit: integer("user_limit"), // Maximum number of users allowed (null for unlimited)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  planId: integer("plan_id").references(() => subscriptionPlans.id, { onDelete: "restrict" }).notNull(),
  status: text("status").notNull(), // 'active', 'canceled', 'past_due', 'trialing'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users - Updated to work with Replit Auth and Subscriptions
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  email: varchar("email").unique(),
  first_name: varchar("first_name"),
  last_name: varchar("last_name"),
  profile_image_url: varchar("profile_image_url"),
  role: text("role").default("viewer"), // Admin, Editor, Viewer
  isWorkspaceOwner: boolean("is_workspace_owner").default(false), // Whether this user is the owner of their workspace
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assets (Trackable Items)
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  assetTypeId: integer("asset_type_id").references(() => assetTypes.id, { onDelete: "cascade" }).notNull(),
  uniqueIdentifier: text("unique_identifier").notNull(), // User-defined ID like Serial Number or Asset Tag
  name: text("name").notNull(),
  manufacturerId: integer("manufacturer_id").references(() => manufacturers.id, { onDelete: "set null" }),
  dateAcquired: timestamp("date_acquired"),
  cost: text("cost"),
  notes: text("notes"),
  currentStatusId: integer("current_status_id").references(() => statuses.id, { onDelete: "set null" }),
  currentLocationId: integer("current_location_id").references(() => locations.id, { onDelete: "set null" }),
  currentAssignmentId: integer("current_assignment_id").references(() => assignments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isArchived: boolean("is_archived").default(false),
  currentCustomerId: integer("current_customer_id").references(() => customers.id, { onDelete: "set null" }), // New field
});

// Customers Table (New)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Custom Field Values
export const assetCustomFieldValues = pgTable("asset_custom_field_values", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").references(() => assets.id, { onDelete: "cascade" }).notNull(),
  fieldDefinitionId: integer("field_definition_id").references(() => customFieldDefinitions.id, { onDelete: "cascade" }).notNull(),
  textValue: text("text_value"),
  numberValue: text("number_value"),
  dateValue: timestamp("date_value"),
  booleanValue: boolean("boolean_value"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Asset Log (Audit Trail)
export const assetLogs = pgTable("asset_logs", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").references(() => assets.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  timestamp: timestamp("timestamp").defaultNow(),
  actionType: text("action_type").notNull(), // 'CREATE', 'UPDATE_STATUS', 'UPDATE_LOCATION', 'ASSIGNED', 'CUSTOM_FIELD_UPDATE', 'RETURN_RECEIVED', 'RMA_INITIATED', 'RMA_COMPLETED', 'SHIPPED_TO_CUSTOMER', 'DELIVERED_TO_CUSTOMER', 'DEMO_STARTED', 'DEMO_ENDED', 'CUSTOMER_ASSIGNED', 'RELATIONSHIP_CREATED', 'RELATIONSHIP_DELETED'
  detailsJson: jsonb("details_json"), // To store what changed (old/new values)
});

// Asset Relationships
export const assetRelationships = pgTable("asset_relationships", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  sourceAssetId: integer("source_asset_id").references(() => assets.id, { onDelete: "cascade" }).notNull(),
  targetAssetId: integer("target_asset_id").references(() => assets.id, { onDelete: "cascade" }).notNull(),
  relationshipType: text("relationship_type").notNull(), // 'part_of', 'accessory_to', 'replacement_for', 'depends_on', 'paired_with', 'parent_of', 'child_of', 'connected_to', 'installed_in', 'contains'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const assetTypesRelations = relations(assetTypes, ({ many }) => ({
  customFields: many(customFieldDefinitions),
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assetType: one(assetTypes, {
    fields: [assets.assetTypeId],
    references: [assetTypes.id],
  }),
  manufacturer: one(manufacturers, {
    fields: [assets.manufacturerId],
    references: [manufacturers.id],
  }),
  status: one(statuses, {
    fields: [assets.currentStatusId],
    references: [statuses.id],
  }),
  location: one(locations, {
    fields: [assets.currentLocationId],
    references: [locations.id],
  }),
  assignment: one(assignments, {
    fields: [assets.currentAssignmentId],
    references: [assignments.id],
  }),
  customFieldValues: many(assetCustomFieldValues),
  logs: many(assetLogs),
  customer: one(customers, {
    fields: [assets.currentCustomerId],
    references: [customers.id],
  }),
  sourceRelationships: many(assetRelationships, { relationName: "sourceAsset" }),
  targetRelationships: many(assetRelationships, { relationName: "targetAsset" }),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({ // New relations
  assets: many(assets),
  workspace: one(workspaces, {
    fields: [customers.workspaceId],
    references: [workspaces.id],
  }),
}));

export const assetCustomFieldValuesRelations = relations(assetCustomFieldValues, ({ one }) => ({
  asset: one(assets, {
    fields: [assetCustomFieldValues.assetId],
    references: [assets.id],
  }),
  fieldDefinition: one(customFieldDefinitions, {
    fields: [assetCustomFieldValues.fieldDefinitionId],
    references: [customFieldDefinitions.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [subscriptions.workspaceId],
    references: [workspaces.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const assetRelationshipsRelations = relations(assetRelationships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [assetRelationships.workspaceId],
    references: [workspaces.id],
  }),
  sourceAsset: one(assets, {
    fields: [assetRelationships.sourceAssetId],
    references: [assets.id],
  }),
  targetAsset: one(assets, {
    fields: [assetRelationships.targetAssetId],
    references: [assets.id],
  }),
}));

// Zod Schemas for insertion
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, createdAt: true });
export const insertAssetTypeSchema = createInsertSchema(assetTypes).omit({ id: true, createdAt: true });
export const insertCustomFieldDefinitionSchema = createInsertSchema(customFieldDefinitions).omit({ id: true, createdAt: true });
export const insertManufacturerSchema = createInsertSchema(manufacturers).omit({ id: true, createdAt: true });
export const insertStatusSchema = createInsertSchema(statuses).omit({ id: true, createdAt: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
// Create a custom schema for customers that properly handles null values
export const insertCustomerSchema = createInsertSchema(customers)
  .omit({ id: true, createdAt: true, updatedAt: true, workspaceId: true }) // Omit workspaceId as it will be added by the server
  .extend({
    // Make these fields optional and allow null values
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetRelationshipSchema = createInsertSchema(assetRelationships).omit({ id: true, createdAt: true, updatedAt: true });

// Base schema for assets
const baseAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });

// Customize with better date handling
export const insertAssetSchema = baseAssetSchema.extend({
  // Accept both Date objects and strings that can be parsed into dates
  dateAcquired: z.union([
    z.string()
      .refine(str => !isNaN(new Date(str).getTime()), {
        message: "Invalid date string format"
      })
      .transform(str => new Date(str)),
    z.date()
  ]).optional().nullable(),
});
export const insertAssetCustomFieldValueSchema = createInsertSchema(assetCustomFieldValues).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetLogSchema = createInsertSchema(assetLogs).omit({ id: true });

// Types
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type AssetType = typeof assetTypes.$inferSelect;
export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;

export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;
export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;

export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;

export type Status = typeof statuses.$inferSelect;
export type InsertStatus = z.infer<typeof insertStatusSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;

export type Customer = typeof customers.$inferSelect; // New type
export type InsertCustomer = z.infer<typeof insertCustomerSchema>; // New type

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type AssetCustomFieldValue = typeof assetCustomFieldValues.$inferSelect;
export type InsertAssetCustomFieldValue = z.infer<typeof insertAssetCustomFieldValueSchema>;

export type AssetLog = typeof assetLogs.$inferSelect;
export type InsertAssetLog = z.infer<typeof insertAssetLogSchema>;

export type AssetRelationship = typeof assetRelationships.$inferSelect;
export type InsertAssetRelationship = z.infer<typeof insertAssetRelationshipSchema>;
