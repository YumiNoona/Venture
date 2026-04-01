"use client";

import { useState } from "react";
import { Button } from "@ventry/ui/components/ui/button";
import { Zap, MessageSquare, Plus, SwitchCamera, ToggleRight, ToggleLeft } from "lucide-react";
import { useRouter } from "next/navigation";
interface AutomationWithTriggers {
  id: string;
  name: string;
  isActive: boolean;
  keywords: string[];
  executions: any[];
}

export function AutomationCard({ automation }: { automation: AutomationWithTriggers }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(automation.isActive);
  const [loading, setLoading] = useState(false);

  const toggleAutomation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/automations/${automation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (response.ok) {
        setIsActive(!isActive);
        router.refresh();
      }
    } catch (e) {
      console.error("Toggle failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-lg">{automation.name}</h4>
        </div>
        <button 
          onClick={toggleAutomation} 
          disabled={loading}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${isActive ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {automation.keywords.map((kw: string) => (
            <span key={kw} className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground border border-border">
              {kw}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{automation.executions?.length || 0} hits</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs underline">Edit Sequence</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
