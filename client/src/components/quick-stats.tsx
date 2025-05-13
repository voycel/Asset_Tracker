import { Card, CardContent } from "@/components/ui/card";
import {
  ArchiveIcon, AlertCircleIcon, CheckCircleIcon, WrenchIcon,
  BarChart3, Package, Truck, Clock, Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface Stat {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  label: string;
  value: number;
  trend?: number; // Optional trend percentage
  trendDirection?: 'up' | 'down' | 'neutral'; // Direction of trend
}

interface QuickStatsProps {
  workspaceId?: number;
}

export function QuickStats({ workspaceId }: QuickStatsProps) {
  // Use React Query for better caching and refetching
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/stats', workspaceId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/stats${workspaceId ? `?workspaceId=${workspaceId}` : ''}`);
        return response.json();
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Return default data on error
        return { total: 0, byStatus: [] };
      }
    },
    // Add retry and stale time options
    retry: 1,
    staleTime: 60000, // 1 minute
  });

  // Ensure stats has default values to prevent undefined errors
  const stats = data || { total: 0, byStatus: [] };

  // Create stat cards based on the status data
  const getStatCards = (): Stat[] => {
    const defaultCards: Stat[] = [
      {
        icon: Layers,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-100",
        label: "Total Assets",
        value: stats?.total || 0,
        trend: 0,
        trendDirection: 'neutral'
      }
    ];

    // Add status-based stat cards
    const statusCards = (stats.byStatus || []).map(statusStat => {
      let icon = ArchiveIcon;
      let iconColor = "text-blue-600";
      let bgColor = "bg-blue-50";

      // Map status names to appropriate icons and colors
      const statusName = statusStat.statusName?.toLowerCase() || '';
      if (statusName.includes("in use") || statusName.includes("active") || statusName.includes("deployed")) {
        icon = CheckCircleIcon;
        iconColor = "text-green-600";
        bgColor = "bg-green-50";
      } else if (statusName.includes("maintenance") || statusName.includes("repair")) {
        icon = WrenchIcon;
        iconColor = "text-amber-600";
        bgColor = "bg-amber-50";
      } else if (statusName.includes("attention") || statusName.includes("issue") || statusName.includes("critical")) {
        icon = AlertCircleIcon;
        iconColor = "text-red-600";
        bgColor = "bg-red-50";
      } else if (statusName.includes("transit") || statusName.includes("shipping")) {
        icon = Truck;
        iconColor = "text-purple-600";
        bgColor = "bg-purple-50";
      } else if (statusName.includes("stock") || statusName.includes("inventory")) {
        icon = Package;
        iconColor = "text-indigo-600";
        bgColor = "bg-indigo-50";
      } else if (statusName.includes("pending") || statusName.includes("waiting")) {
        icon = Clock;
        iconColor = "text-orange-600";
        bgColor = "bg-orange-50";
      }

      return {
        icon,
        iconColor,
        bgColor,
        label: statusStat.statusName || 'Unknown',
        value: statusStat.count || 0
      };
    });

    return [...defaultCards, ...statusCards];
  };

  const statCards = getStatCards();

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="enhanced-card overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-muted rounded-full w-12 h-12 flex items-center justify-center animate-pulse">
                  <div className="h-6 w-6 bg-muted-foreground/20 rounded-full"></div>
                </div>
                <div className="ml-5 animate-pulse w-full">
                  <div className="h-4 w-24 bg-muted-foreground/20 rounded"></div>
                  <div className="h-8 w-16 bg-muted-foreground/20 rounded mt-2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show error state if there's an issue but we have fallback data
  if (isError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="enhanced-card overflow-hidden col-span-full">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-destructive/10 rounded-full w-12 h-12 flex items-center justify-center">
                <AlertCircleIcon className="h-6 w-6 text-destructive" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-muted-foreground">Stats Unavailable</p>
                <p className="text-sm text-foreground/70 mt-1">Using cached data. Some information may not be up to date.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className="enhanced-card overflow-hidden transition-all duration-200"
        >
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-full w-12 h-12 flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>

                  {stat.trend !== undefined && (
                    <div className={`ml-2 flex items-center text-xs font-medium ${
                      stat.trendDirection === 'up' ? 'text-green-600' :
                      stat.trendDirection === 'down' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}>
                      {stat.trendDirection === 'up' && <span className="mr-1">↑</span>}
                      {stat.trendDirection === 'down' && <span className="mr-1">↓</span>}
                      {stat.trend > 0 && '+'}{stat.trend}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
