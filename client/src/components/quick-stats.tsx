import { Card, CardContent } from "@/components/ui/card";
import { ArchiveIcon, AlertCircleIcon, CheckCircleIcon, WrenchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Stat {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  label: string;
  value: number;
}

interface QuickStatsProps {
  workspaceId?: number;
}

export function QuickStats({ workspaceId }: QuickStatsProps) {
  const [stats, setStats] = useState<{ 
    total: number,
    byStatus: { statusId: number, statusName: string, count: number }[]
  }>({
    total: 0,
    byStatus: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('GET', `/api/stats${workspaceId ? `?workspaceId=${workspaceId}` : ''}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [workspaceId]);

  // Create stat cards based on the status data
  const getStatCards = (): Stat[] => {
    const defaultCards: Stat[] = [
      {
        icon: ArchiveIcon,
        iconColor: "text-primary-600",
        bgColor: "bg-primary-100",
        label: "Total Assets",
        value: stats.total || 0
      }
    ];

    // Add status-based stat cards
    const statusCards = stats.byStatus.map(statusStat => {
      let icon = ArchiveIcon;
      let iconColor = "text-neutral-600";
      let bgColor = "bg-neutral-100";

      // Map status names to appropriate icons and colors
      const statusName = statusStat.statusName?.toLowerCase();
      if (statusName?.includes("in use")) {
        icon = CheckCircleIcon;
        iconColor = "text-green-600";
        bgColor = "bg-green-100";
      } else if (statusName?.includes("maintenance")) {
        icon = WrenchIcon;
        iconColor = "text-yellow-600";
        bgColor = "bg-yellow-100";
      } else if (statusName?.includes("attention") || statusName?.includes("issue")) {
        icon = AlertCircleIcon;
        iconColor = "text-red-600";
        bgColor = "bg-red-100";
      }

      return {
        icon,
        iconColor,
        bgColor,
        label: statusStat.statusName,
        value: statusStat.count
      };
    });

    return [...defaultCards, ...statusCards];
  };

  const statCards = getStatCards();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white rounded-lg shadow">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-neutral-100 rounded-md p-3 animate-pulse">
                  <div className="h-5 w-5"></div>
                </div>
                <div className="ml-5 animate-pulse">
                  <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                  <div className="h-6 w-12 bg-neutral-200 rounded mt-2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="bg-white rounded-lg shadow">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-neutral-900">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
