import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AppProvider } from "@/context/app-context";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Assets from "@/pages/assets";
import AssetTypes from "@/pages/asset-types";
import Configuration from "@/pages/configuration";
import ActivityLog from "@/pages/activity-log";
import ExportData from "@/pages/export-data";
import Login from "@/pages/login";
import Landing from "@/pages/landing";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/sidebar";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader } from "lucide-react";

// Protected route wrapper
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>; [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return isAuthenticated ? <Component {...rest} /> : null;
}

function Router() {
  const [location] = useLocation();
  const isAuthPage = location === "/login" || location === "/landing";

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/landing" component={Landing} />
      <Route path="/">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/assets">
        {() => <ProtectedRoute component={Assets} />}
      </Route>
      <Route path="/asset-types">
        {() => <ProtectedRoute component={AssetTypes} />}
      </Route>
      <Route path="/configuration">
        {() => <ProtectedRoute component={Configuration} />}
      </Route>
      <Route path="/activity-log">
        {() => <ProtectedRoute component={ActivityLog} />}
      </Route>
      <Route path="/export">
        {() => <ProtectedRoute component={ExportData} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [location, setLocation] = useLocation();
  const isAuthPage = location === "/login" || location === "/landing";

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // Redirect to landing page on initial load
    if (location === "/") {
      setLocation("/landing");
    }
  }, [location, setLocation]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="asset-tracker-theme">
        <TooltipProvider>
          <AppProvider>
            {isAuthPage ? (
              <Router />
            ) : (
              <div className="flex h-screen overflow-hidden bg-neutral-100 text-neutral-800">
                <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Router />
                </div>
              </div>
            )}
            <Toaster />
          </AppProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
