'use client'

import { useFormState } from "react-dom";
import { Button } from "@ventry/ui/components/ui/button";
import { Zap, ArrowLeft, Info, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createAutomation } from "./actions";

const initialState = { error: null, success: null };

export default function NewAutomationPage() {
  const [state, formAction] = useFormState(createAutomation, initialState);
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/automations">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Automation</h1>
          <p className="text-muted-foreground mt-1">Set up a new keyword-triggered AI response flow.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-primary uppercase font-bold text-xs tracking-widest">
            <Zap className="h-4 w-4" />
            Configuring New Trigger
          </div>
        </div>

        <form action={formAction} className="p-8 space-y-6">
          {state?.error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">{state.error}</p>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">Internal Name</label>
              <input 
                id="name" 
                name="name" 
                required 
                placeholder="e.g. Sales Inquiry Response"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
              />
              <p className="text-xs text-muted-foreground">Only you see this label.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="keywords">Keywords</label>
              <input 
                id="keywords" 
                name="keywords" 
                required 
                placeholder="PROMO, DISCOUNT, PRICE"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring uppercase" 
              />
              <p className="text-xs text-muted-foreground">Separate keywords with commas.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Trigger Sources</label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex flex-col items-start gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/30 cursor-pointer transition-colors relative has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                <input type="radio" name="type" value="DM" defaultChecked className="absolute top-4 right-4 accent-primary" />
                <div className="text-sm font-bold">DMs Only</div>
                <p className="text-xs text-muted-foreground">Direct messages sent to your inbox.</p>
              </label>
              
              <label className="flex flex-col items-start gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/30 cursor-pointer transition-colors relative has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                 <input type="radio" name="type" value="COMMENT" className="absolute top-4 right-4 accent-primary" />
                 <div className="text-sm font-bold">Comments</div>
                 <p className="text-xs text-muted-foreground">Replies to your posts or reels.</p>
              </label>

              <label className="flex flex-col items-start gap-4 p-4 rounded-xl border border-border bg-background hover:bg-muted/30 cursor-pointer transition-colors relative has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary">
                 <input type="radio" name="type" value="ALL" className="absolute top-4 right-4 accent-primary" />
                 <div className="text-sm font-bold">Both</div>
                 <p className="text-xs text-muted-foreground">Highest reach across all engagement types.</p>
              </label>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4 shadow-sm">
             <div className="mt-1">
               <input type="checkbox" name="useAI" id="useAI" defaultChecked className="accent-primary size-5" />
             </div>
             <div className="space-y-1">
               <label htmlFor="useAI" className="text-sm font-bold cursor-pointer">Persona-Engaged AI Reply</label>
               <p className="text-xs text-muted-foreground leading-relaxed">
                 Generative AI will craft a context-aware response using your brand persona. If disabled, a system default will be used.
               </p>
             </div>
          </div>

          <div className="pt-6 flex gap-4 border-t border-border">
            <Button type="submit" size="lg" className="flex-1 font-bold">Deploy Automation</Button>
            <Link href="/dashboard/automations" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">Discard</Button>
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-muted/10 p-6 flex items-start gap-4 shadow-sm border-l-4 border-l-primary">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
          <Info className="h-5 w-5" />
        </div>
        <div className="space-y-1 pt-1">
          <h4 className="text-sm font-bold uppercase tracking-wider">How triggers work</h4>
          <p className="text-sm text-muted-foreground">
            Ventry scans for your keywords in any incoming message. Once found, our AI generates a response, adds it to the queue, and executes it via the Meta API in under 5 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
