"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Clock, Server } from "lucide-react";

export function SystemStatus() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch system stats", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    // No polling < 10s (per contract). Polling every 30s.
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const hasAlerts = stats.alerts?.length > 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col card-hover transition-all duration-300">
      <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">System Health</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`size-1.5 rounded-full ${hasAlerts ? 'bg-danger animate-pulse' : 'bg-success'}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {hasAlerts ? 'Action Required' : 'All Systems Operational'}
          </span>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Queue Depth */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Queue Status</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">{stats.queue?.waiting || 0}</span>
            <span className="text-[10px] text-muted-foreground">jobs waiting</span>
          </div>
        </div>

        {/* Failed Jobs */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Failures (24h)</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-xl font-bold ${stats.failuresLast24h > 0 ? 'text-danger' : 'text-muted-foreground'}`}>
              {stats.failuresLast24h || 0}
            </span>
            <Activity className={`h-3 w-3 ${stats.failuresLast24h > 0 ? 'text-danger animate-pulse' : 'text-muted-foreground opacity-20'}`} />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Alerts</p>
          <div className="flex items-center gap-2">
             {hasAlerts ? (
               <div className="flex items-center gap-1 text-danger font-bold text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{stats.alerts.length} Issues</span>
               </div>
             ) : (
               <div className="flex items-center gap-1 text-success font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>N/A</span>
               </div>
             )}
          </div>
        </div>
      </div>

      {hasAlerts && (
        <div className="px-5 py-3 bg-danger/5 border-t border-danger/10">
          <div className="flex flex-col gap-1.5">
            {stats.alerts.map((alert: string, idx: number) => (
              <p key={idx} className="text-[11px] text-danger font-medium flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                {alert}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
