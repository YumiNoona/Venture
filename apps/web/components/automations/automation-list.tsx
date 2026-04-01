"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AutomationList({ initialData }: { initialData: any[] }) {
  const [automations, setAutomations] = useState(initialData);
  const router = useRouter();

  const toggleStatus = async (id: string, current: boolean) => {
    // Optimistic UI
    setAutomations(prev => prev.map((a: any) => 
      a.id === id ? { ...a, isActive: !current } : a
    ));

    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !current }),
    });
    
    router.refresh();
  };

  return (
    <div className="grid gap-4">
      {automations.map((a: any) => (
        <div key={a.id} className="p-6 border rounded-xl bg-card flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-xl">{a.name}</h3>
              {a.isActive && <span className="flex h-2 w-2 rounded-full bg-green-500" />}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {a.triggers?.[0]?.keywords?.map((k: string) => (
                <span key={k} className="px-3 py-1 bg-muted/50 text-xs font-semibold rounded-lg border border-border/50 uppercase tracking-tighter">
                  {k}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">

            <div className="flex items-center gap-3">
              <span className={a.isActive ? "text-green-500 text-sm font-bold uppercase tracking-widest" : "text-muted-foreground text-sm font-bold uppercase tracking-widest"}>
                {a.isActive ? "Active" : "Paused"}
              </span>
              <button
                onClick={() => toggleStatus(a.id, a.isActive)}
                className={`w-14 h-7 rounded-full transition-all duration-300 relative ${a.isActive ? 'bg-green-600 shadow-[0_0_15px_rgba(22,163,74,0.3)]' : 'bg-muted'}`}
              >
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${a.isActive ? 'translate-x-7' : ''}`} />
              </button>
            </div>
          </div>
        </div>

      ))}

      {automations.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground">You don't have any automations yet.</p>
          <a href="/dashboard/automations/new" className="text-primary hover:underline font-medium">Create your first one</a>
        </div>
      )}
    </div>
  );
}
