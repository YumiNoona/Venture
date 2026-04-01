import { createClient } from "@/lib/supabaseServer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Zap, CreditCard, Shield, Loader2 } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "0",
    description: "Perfect for testing the engine.",
    features: [
      "1 Interactive Project",
      "512MB Asset Storage",
      "Standard Resolution",
      "Venture Watermark",
    ],
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "29",
    description: "For professional creators.",
    features: [
      "10 Interactive Projects",
      "10GB Asset Storage",
      "High-Fidelity Renders",
      "Custom Branding",
      "Analytics Dashboard",
    ],
    buttonText: "Upgrade to Pro",
    popular: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "99",
    description: "Unleash the full power.",
    features: [
      "Unlimited Projects",
      "100GB Asset Storage",
      "Raytracing (Beta)",
      "Dedicated Support",
      "API Access",
    ],
    buttonText: "Contact Sales",
  },
];

export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // MVP: Hardcoded plan state for now
  const currentPlanId = "free";

  return (
    <div className="max-w-6xl space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Plans & Billing</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Scale your 3D experiences with high-fidelity rendering and advanced interactive behaviors.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          
          return (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:shadow-2xl hover:scale-[1.02] ${
                plan.popular ? 'ring-2 ring-primary shadow-xl shadow-primary/10' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="pb-8 border-b border-border/20">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary/80">{plan.name}</span>
                  <div className="flex items-baseline gap-1">
                    <CardTitle className="text-4xl font-black">${plan.price}</CardTitle>
                    <span className="text-muted-foreground font-medium">/mo</span>
                  </div>
                  <CardDescription className="pt-2">{plan.description}</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="pt-8 flex-1">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="size-5 text-primary shrink-0 transition-transform hover:scale-110" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-8 pb-8">
                <Button 
                  className="w-full font-bold uppercase tracking-widest h-12 shadow-lg shadow-primary/10" 
                  variant={isCurrent ? "outline" : "default"}
                  disabled={plan.disabled}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-8 rounded-2xl border border-border/50 bg-muted/20 p-10 mt-12 backdrop-blur-sm">
        <div className="flex gap-5">
           <div className="size-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-lg group">
              <CreditCard className="size-6 text-primary transition-transform group-hover:scale-110" />
           </div>
           <div className="space-y-1">
              <h4 className="font-bold text-lg">Secure & Encrypted</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use Stripe for all payment processing. Your sensitive financial data never touches our servers.
              </p>
           </div>
        </div>
        <div className="flex gap-5">
           <div className="size-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center shrink-0 shadow-lg group">
              <Shield className="size-6 text-primary transition-transform group-hover:scale-110" />
           </div>
           <div className="space-y-1">
              <h4 className="font-bold text-lg">Guaranteed Support</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Need a custom plan? Reach out to our engineering team for high-volume asset hosting or custom API integration.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
