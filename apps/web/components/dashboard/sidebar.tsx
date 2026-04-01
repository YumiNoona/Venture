"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  CreditCard,
  Layers,
  LogOut,
  Loader2,
  Box
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/dashboard/projects", icon: Layers },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export function Sidebar({ user }: { user: { name: string | null; email: string } | null }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (e) {
      setLoggingOut(false);
    }
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col justify-between h-full">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-xl tracking-tight group">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-black transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-primary/20">V</div>
            <span className="transition-colors duration-200 group-hover:text-primary">Venture</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                }`}
              >
                <item.icon className={`h-4 w-4 transition-all duration-200 ${
                  isActive 
                    ? "text-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                    : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                }`} />
                {item.name}
                {isActive && (
                  <div className="absolute left-0 w-1 h-4 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border/50 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-primary/20 uppercase shadow-inner">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{user?.name || "User"}</p>
            <p className="text-[10px] text-muted-foreground truncate opacity-70 italic">{user?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-xs text-muted-foreground font-semibold rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-destructive/20"
        >
          {loggingOut ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Signing out…
            </>
          ) : (
            <>
              <LogOut className="h-3.5 w-3.5 transform transition-transform group-hover:-translate-x-1" />
              Sign Out
            </>
          )}
        </button>
      </div>
    </div>
  );
}
