'use client'

import { useFormState } from "react-dom";
import { Button } from "@ventry/ui/components/ui/button";
import { updateProfile, updatePassword } from "./actions";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ActionState = {
  error: string | null;
  success: string | null;
};

const initialState: ActionState = { error: null, success: null };

interface SettingsClientProps {
  dbUser: any;
  authUser: any;
}

export default function SettingsClient({ dbUser, authUser }: SettingsClientProps) {
  const [profileState, profileAction] = useFormState(updateProfile, initialState);
  const [passwordState, passwordAction] = useFormState(updatePassword, initialState);

  return (
    <div className="max-w-3xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your profile, connected accounts, and billing.</p>
      </div>

      <div className="grid gap-8">
        {/* Profile Settings */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="text-lg font-bold tracking-tight">Profile</h3>
            <p className="text-sm text-muted-foreground mt-1">Update your personal information.</p>
          </div>
          <div className="p-8 bg-card">
            <form key={profileState?.success} action={profileAction} className="space-y-6 max-w-md">
              {profileState?.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-xs font-bold leading-none">{profileState.error}</p>
                </div>
              )}
              {profileState?.success && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3 text-primary animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-bold leading-none">{profileState.success}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Name</label>
                <input 
                  name="name" 
                  defaultValue={dbUser?.name || ""} 
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-sm" 
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                <input 
                  name="email" 
                  type="email"
                  defaultValue={authUser?.email || ""} 
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-sm" 
                  placeholder="name@example.com"
                />
                <p className="text-[10px] text-muted-foreground/80 font-medium px-1 italic">Changing your email requires new verification.</p>
              </div>
              <Button type="submit" className="w-full sm:w-auto px-8 font-bold rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-95">Save Changes</Button>
            </form>
          </div>
        </div>

        {/* Security / Password */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-border bg-muted/30">
            <h3 className="text-lg font-bold tracking-tight">Security</h3>
            <p className="text-sm text-muted-foreground mt-1">Update your password to keep your account secure.</p>
          </div>
          <div className="p-8 bg-card">
            <form key={passwordState?.success} action={passwordAction} className="space-y-6 max-w-md">
              {passwordState?.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-xs font-bold leading-none">{passwordState.error}</p>
                </div>
              )}
              {passwordState?.success && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3 text-primary animate-in fade-in slide-in-from-top-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-xs font-bold leading-none">{passwordState.success}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Password</label>
                <input 
                  name="password" 
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-sm" 
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full sm:w-auto px-8 font-bold rounded-xl shadow-lg transition-transform active:scale-95">Update Password</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
