import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import MemoryStore from "memorystore";

// Create a memory store for sessions (for local development)
const MemoryStoreSession = MemoryStore(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  // Use memory store for local development
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  });

  return session({
    secret: process.env.SESSION_SECRET || "asset-tracker-session-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Mock user for local development
const mockUser = {
  id: "local-dev-user",
  email: "local@example.com",
  first_name: "Local",
  last_name: "Developer",
  profile_image_url: null,
  role: "admin",
  isWorkspaceOwner: true,
  workspaceId: 1, // Default workspace ID
  claims: {
    sub: "local-dev-user",
    email: "local@example.com",
    name: "Local Developer",
    exp: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days
  },
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Math.floor(Date.now() / 1000) + 86400 * 30 // 30 days
};

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Create a mock user in the database if it doesn't exist
  try {
    // First, ensure we have a default workspace
    const workspaces = await storage.getWorkspaces();
    let workspaceId = 1;

    if (workspaces.length === 0) {
      // Create a default workspace if none exists
      const workspace = await storage.createWorkspace({ name: 'Default Workspace' });
      workspaceId = workspace.id;
      console.log("Created default workspace with ID:", workspaceId);

      // Create some default statuses for the new workspace
      await storage.createStatus({
        workspaceId: workspaceId,
        name: 'Available',
        color: '#6B7280'
      });
      await storage.createStatus({
        workspaceId: workspaceId,
        name: 'In Use',
        color: '#10B981'
      });
    } else {
      workspaceId = workspaces[0].id;
    }

    // Update the mock user with the correct workspace ID
    mockUser.workspaceId = workspaceId;

    const existingUser = await storage.getUser(mockUser.id);
    if (!existingUser) {
      await storage.upsertUser({
        id: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        profile_image_url: mockUser.profile_image_url,
        role: mockUser.role,
        isWorkspaceOwner: mockUser.isWorkspaceOwner,
        workspaceId: workspaceId // Add the workspace ID
      });
      console.log("Created mock user for local development with workspace ID:", workspaceId);
    } else if (!existingUser.workspaceId) {
      // Update the existing user with a workspace ID if it doesn't have one
      await storage.upsertUser({
        ...existingUser,
        workspaceId: workspaceId
      });
      console.log("Updated existing mock user with workspace ID:", workspaceId);
    }
  } catch (error) {
    console.error("Failed to create/update mock user:", error);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Auto-login route for local development
  app.get("/api/login", (req, res) => {
    req.login(mockUser, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Login failed" });
      }
      return res.redirect("/");
    });
  });

  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  if (!req.isAuthenticated()) {
    console.log("User not authenticated, performing auto-login");
    // For local development, auto-login
    req.login(mockUser, (err) => {
      if (err) {
        console.error("Auto-login error:", err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      console.log("Auto-login successful, user:", req.user.id);
      return next();
    });
  } else {
    // Ensure the user has a workspaceId
    if (!req.user.workspaceId && mockUser.workspaceId) {
      req.user.workspaceId = mockUser.workspaceId;
      console.log("Added workspaceId to authenticated user:", req.user.workspaceId);
    }

    // Always log the current user state for debugging
    console.log("User authenticated:", {
      id: req.user.id,
      workspaceId: req.user.workspaceId,
      isAuthenticated: req.isAuthenticated()
    });

    return next();
  }
};
