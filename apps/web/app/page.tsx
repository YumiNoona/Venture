import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { SystemStatus } from "@/components/dashboard/system-status";
import { requireUser } from "@/lib/getUser";
import { prisma } from "@/lib/prisma";
import { Zap, MessageSquare, Link as LinkIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@ventry/ui/components/ui/button";

export default async function DashboardPage() {
  const { dbUser } = await requireUser();

  // Basic stats
  const [totalReplies, activeAccounts, automationsCount, activeAutomationsCount] = await Promise.all([
    prisma.automationExecution.count({ 
      where: { automation: { userId: dbUser?.id } } 
    }),
    prisma.account.count({ 
      where: { userId: dbUser?.id, accessToken: { not: null } } 
    }),
    prisma.automation.count({
      where: { userId: dbUser?.id }
    }),
    prisma.automation.count({
      where: { userId: dbUser?.id, isActive: true }
    })
  ]);

  return (
    <div className="flex flex-col gap-6">
      <OnboardingChecklist 
        hasAccounts={activeAccounts > 0} 
        hasAutomations={automationsCount > 0} 
        hasActiveAutomations={activeAutomationsCount > 0} 
      />
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {dbUser?.name?.split(' ')[0] || 'User'}!</h1>
        <Link href="/dashboard/automations/new">
          <Button className="gap-2 shadow-sm hover:shadow-md">
            <Zap className="h-4 w-4" />
            Create Automation
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
        {/* Stat 1 */}
        <div className="rounded-xl border bg-card p-6 shadow-sm card-hover flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">AI Replies</h3>
            <div className="p-2 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold">{totalReplies}</div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <span className="text-success inline-block font-semibold">↑ Active</span> this month
          </p>
        </div>
        
        {/* Stat 2 */}
        <div className="rounded-xl border bg-card p-6 shadow-sm card-hover flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Active Automations</h3>
            <div className="p-2 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold">{activeAutomationsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Listening to DMs & Comments</p>
        </div>

        {/* Stat 3 */}
        <div className="rounded-xl border bg-card p-6 shadow-sm card-hover flex flex-col gap-2 group">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Connected Accounts</h3>
            <div className="p-2 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <LinkIcon className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-bold">{activeAccounts}</div>
          <Link href="/dashboard/settings/accounts" className="text-xs text-primary hover:underline mt-1 font-medium inline-flex items-center gap-1 group/link">
            Manage connections <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-4 stagger-children">
        <div className="rounded-xl border bg-card shadow-sm p-0 flex flex-col card-hover">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <p className="text-sm text-muted-foreground mt-1">Latest messages handled by AI.</p>
          </div>
          <div className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground py-12">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 opacity-50" />
            </div>
            <p>No activity yet.</p>
            <p className="text-xs mt-1 opacity-60">Activity will appear once your automations process messages.</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm flex flex-col p-6 items-center justify-center text-center min-h-[300px] card-hover relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/[0.04] blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 mx-auto ring-4 ring-primary/5">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to automate?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
              Set up keyword triggers to organically grow your audience.
            </p>
            <Link href="/dashboard/automations/new">
              <Button className="shadow-sm hover:shadow-md gap-2">
                Create your first trigger
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <SystemStatus />
      </div>
    </div>
  );
}
