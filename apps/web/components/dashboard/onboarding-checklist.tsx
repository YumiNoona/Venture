import { CheckCircle2, Circle, Instagram, Zap, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@ventry/ui/components/ui/button";

export function OnboardingChecklist({ 
  hasAccounts, 
  hasAutomations, 
  hasActiveAutomations 
}: { 
  hasAccounts: boolean; 
  hasAutomations: boolean; 
  hasActiveAutomations: boolean;
}) {
  const steps = [
    {
      title: "Connect Instagram",
      description: "Link your business profile via Meta to start monitoring engagement.",
      icon: Instagram,
      done: hasAccounts,
      href: "/dashboard/settings/accounts",
    },
    {
      title: "Create your first automation",
      description: "Define keywords that will trigger your AI persona.",
      icon: MessageSquare,
      done: hasAutomations,
      href: "/dashboard/automations/new",
    },
    {
      title: "Activate a trigger",
      description: "Turn your automation ON to start replying to customers.",
      icon: Zap,
      done: hasActiveAutomations,
      href: "/dashboard/automations",
    },
  ];

  const completedCount = steps.filter((step: { title: string; description: string; icon: any; done: boolean; href: string; }) => step.done).length;
  const isComplete = completedCount === steps.length;

  if (isComplete) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.06] pointer-events-none">
         <Zap className="size-32 text-primary" />
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary/10">
        <div 
          className="h-full bg-primary transition-all duration-700 ease-out rounded-r-full"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="relative z-10 space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">Getting Started</h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
              {completedCount}/{steps.length}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Complete these steps to activate your AI automation engine.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 stagger-children">
          {steps.map((step: { title: string; description: string; icon: any; done: boolean; href: string; }, i: number) => (
            <div key={i} className={`p-5 rounded-xl border bg-card transition-all duration-300 ${step.done ? 'opacity-60 grayscale' : 'shadow-sm card-hover'}`}>
               <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-lg transition-colors duration-200 ${step.done ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                    <step.icon className="size-5" />
                  </div>
                  {step.done ? (
                    <CheckCircle2 className="size-5 text-success fill-success/20" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground opacity-30" />
                  )}
               </div>
               <h3 className="font-bold text-sm mb-1">{step.title}</h3>
               <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{step.description}</p>
               {!step.done && (
                 <Link href={step.href}>
                   <Button size="sm" className="w-full text-xs h-8 gap-1.5">
                     Complete Step
                     <ArrowRight className="h-3 w-3" />
                   </Button>
                 </Link>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
