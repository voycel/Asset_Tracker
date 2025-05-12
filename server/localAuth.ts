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
    const existingUser = await storage.getUser(mockUser.id);
    if (!existingUser) {
      await storage.upsertUser({
        id: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        profile_image_url: mockUser.profile_image_url,
        role: mockUser.role,
        isWorkspaceOwner: mockUser.isWorkspaceOwner
      });
      console.log("Created mock user for local development");
    }
  } catch (error) {
    console.error("Failed to create mock user:", error);
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

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    // For local development, auto-login
    req.login(mockUser, (err) => {
      if (err) {
        console.error("Auto-login error:", err);
        return res.status(401).json({ message: "Unauthorized" });
      }
      return next();
    });
  } else {
    return next();
  }
};
