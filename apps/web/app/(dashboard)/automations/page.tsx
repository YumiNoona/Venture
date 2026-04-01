import { requireUser } from "@/lib/getUser";
import { prisma } from "@/lib/prisma";
import { Button } from "@ventry/ui/components/ui/button";
import { Zap, Plus } from "lucide-react";
import Link from "next/link";
import { AutomationCard } from "@/components/dashboard/automation-card";

export default async function AutomationsPage() {
  const { dbUser } = await requireUser();

  const data = await prisma.automation.findMany({
    where: { userId: dbUser?.id },
    include: {
      triggers: true,
      executions: true
    },
    orderBy: { createdAt: "desc" },
  });

  type AutomationWithTriggers = typeof data[number];
  type Trigger = AutomationWithTriggers["triggers"][number];

  const automations = data.map((automation: AutomationWithTriggers) => ({
    ...automation,
    keywords: automation.triggers.flatMap((t: Trigger) => t.keywords)
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground mt-1">Manage your keyword-triggered AI reply sequences.</p>
        </div>
        <Link href="/dashboard/automations/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Automation
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {automations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-24 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No automations active</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm">
              Create your first keyword trigger to start engaging your audience automatically.
            </p>
            <Link href="/dashboard/automations/new">
              <Button size="lg">Create your first trigger</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {automations.map((automation: AutomationWithTriggers & { keywords: string[] }) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
