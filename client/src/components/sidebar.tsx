import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/app-context";
import {
  HomeIcon,
  BoxesIcon,
  TagsIcon,
  SettingsIcon,
  ClockIcon,
  DownloadIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  CreditCardIcon,
  UsersIcon, // Added for Customers link
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAppContext();

  const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Assets", href: "/assets", icon: BoxesIcon },
    { name: "Customers", href: "/customers", icon: UsersIcon }, // Added Customers link
    { name: "Asset Types", href: "/asset-types", icon: TagsIcon },
    { name: "Configuration", href: "/configuration", icon: SettingsIcon },
    { name: "Activity Log", href: "/activity-log", icon: ClockIcon },
    { name: "Export Data", href: "/export", icon: DownloadIcon },
    { name: "Feature Tiers", href: "/subscription", icon: CreditCardIcon },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onToggle}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-sidebar shadow-lg w-64 flex-shrink-0 h-screen overflow-hidden z-50 fixed md:relative transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Logo & Name */}
        <div className="px-6 py-4 flex items-center border-b border-sidebar-border">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground rounded p-1">
            <BoxesIcon className="h-5 w-5" />
          </div>
          <h1 className="ml-2 text-xl font-semibold text-sidebar-foreground">
            Alex Asset Tracker
          </h1>
          <button
            className="ml-auto md:hidden text-sidebar-accent-foreground hover:text-sidebar-foreground"
            onClick={onToggle}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sidebar-foreground rounded-md",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-sidebar-primary" : "text-sidebar-accent-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-medium">
              {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-sidebar-foreground">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.email || 'User')}
              </p>
              <p className="text-xs text-sidebar-accent-foreground">
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </p>
            </div>
            <div className="ml-auto">
              <button className="text-sidebar-accent-foreground hover:text-sidebar-foreground">
                <LogOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button - always visible when sidebar is closed */}
      {!isOpen && (
        <button
          className="fixed top-4 left-4 md:hidden z-50 bg-transparent text-foreground p-2 rounded"
          onClick={onToggle}
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      )}

      {/* Floating action button for adding new asset */}
      <button
        className="fixed bottom-4 right-4 md:hidden z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
        onClick={() => {
          // Use the Link's click method to navigate to the dashboard
          document.querySelector<HTMLAnchorElement>('a[href="/"]')?.click();
        }}
      >
        <HomeIcon className="h-6 w-6" />
      </button>
    </>
  );
}
