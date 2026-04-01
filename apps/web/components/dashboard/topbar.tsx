"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@ventry/ui/components/ui/button";
import { ChevronRight } from "lucide-react";

export function Topbar({ user }: { user: any }) {
  const pathname = usePathname();
  
  // Build breadcrumb
  const segments = pathname.split('/').filter(Boolean).slice(1);
  const title = segments.length > 0 
    ? segments[segments.length - 1].charAt(0).toUpperCase() + segments[segments.length - 1].slice(1) 
    : "Overview";

  return (
    <header className="h-16 border-b border-border bg-card/50 px-6 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
      <div className="flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
          Dashboard
        </Link>
        {segments.length > 0 && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-semibold text-foreground" style={{ animation: 'slideInLeft 0.25s ease-out forwards' }}>
              {title}
            </span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-border bg-background/80 backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-success glow-pulse"></div>
          <span className="text-muted-foreground font-medium">Free Plan</span>
        </div>
        
        <Link href="/dashboard/settings/billing">
          <Button variant="outline" size="sm" className="h-8 border-primary/20 hover:border-primary/40 hover:bg-primary/5">
            Upgrade
          </Button>
        </Link>
      </div>
    </header>
  );
}
