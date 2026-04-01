import { requireUser } from "@/lib/getUser";
import { prisma } from "@/lib/prisma";
import { Button } from "@ventry/ui/components/ui/button";
import { CheckCircle2, Zap, CreditCard, Shield } from "lucide-react";
import Link from "next/link";

export default async function BillingPage() {
  const { authUser } = await requireUser();
  
  const [data, dbUserWithPlan] = await Promise.all([
    prisma.plan.findMany({ orderBy: { price: "asc" } }),
    prisma.user.findUnique({
      where: { id: authUser.id },
      include: { plan: true }
    })
  ]);

  type Plan = typeof data[number];
  const currentPlan = dbUserWithPlan?.plan || { name: "Free", messageLimit: 50 };

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and track your usage limits.</p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-primary/5 border-primary/20">
           <Zap className="size-4 text-primary" />
           <div className="text-sm font-medium">
             Current: <span className="text-primary font-bold uppercase tracking-wider">{currentPlan.name}</span>
           </div>
        </div>
      </div>

      {/* Usage Meter Placeholder */}
      <div className="rounded-xl border bg-card p-6 shadow-sm overflow-hidden relative">
         <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Monthly Usage</h3>
            <span className="text-xs font-bold">12 / {currentPlan.messageLimit || "∞"} messages</span>
         </div>
         <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '24%' }}></div>
         </div>
         <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-tighter">Your limits reset in 14 days.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 pt-4">
        {data.map((plan: Plan) => {
          const isCurrent = dbUserWithPlan?.planId === plan.id || (plan.name === "Free" && !dbUserWithPlan?.planId);
          
          return (
            <div key={plan.id} className={`flex flex-col p-6 rounded-2xl border transition-all ${isCurrent ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-lg' : 'border-border bg-card'}`}>
              <div className="mb-4">
                 <h4 className="font-bold text-lg">{plan.name}</h4>
                 <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black">${plan.price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                 </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm">
                   <CheckCircle2 className="size-4 text-success" />
                   <span>{plan.messageLimit || "Unlimited"} AI Replies</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                   <CheckCircle2 className="size-4 text-success" />
                   <span>{plan.name === "Elite" ? "Unlimited" : plan.name === "Pro" ? "3" : "1"} Account(s)</span>
                </li>
                {plan.name !== "Free" && (
                   <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="size-4 text-success" />
                      <span>Advanced Persona AI</span>
                   </li>
                )}
              </ul>

              <Button 
                variant={isCurrent ? "outline" : "default"} 
                disabled={isCurrent}
                className="w-full font-bold uppercase tracking-widest text-xs"
              >
                {isCurrent ? "Active Plan" : "Upgrade Now"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-border p-8 bg-muted/10 grid md:grid-cols-2 gap-8">
         <div className="flex gap-4">
            <div className="size-10 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0">
               <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <div>
               <h4 className="font-bold text-sm uppercase tracking-wide">Secure Checkout</h4>
               <p className="text-xs text-muted-foreground mt-1">All payments are safely processed via Stripe. We do not store your card details.</p>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="size-10 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0">
               <Shield className="size-5 text-muted-foreground" />
            </div>
            <div>
               <h4 className="font-bold text-sm uppercase tracking-wide">Cancel Anytime</h4>
               <p className="text-xs text-muted-foreground mt-1">No long-term contracts. Pause or cancel your subscription at any point from your billing panel.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
