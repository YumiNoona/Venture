"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Globe, Shield, User } from "lucide-react";

interface SettingsClientProps {
  dbUser: any;
  authUser: any;
}

export default function SettingsClient({ dbUser, authUser }: SettingsClientProps) {
  const [slug, setSlug] = useState(dbUser?.username || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const validateAndSetSlug = (input: string) => {
    // 1. Convert to lowercase
    // 2. Replace non-alphanumeric (except hyphen) with empty string
    // 3. Replace spaces with hyphens
    const formattedSlug = input
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    
    setSlug(formattedSlug);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Simulate DB save with unique constraint handling
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      // In a real app, we would call a server action here:
      // const result = await updateProfile({ username: slug });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "That slug is already taken. Try another one." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, public profile, and project settings.</p>
      </div>

      <div className="grid gap-8">
        {/* Public Profile & Slug Settings */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>How others see you on the Venture network.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 border animate-in slide-in-from-top-2 ${
                  message.type === "success" 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}>
                  {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Name</Label>
                  <Input id="display-name" defaultValue={dbUser?.name || ""} placeholder="Your name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Public Handle (Slug)</Label>
                  <div className="flex items-center gap-2">
                    <div className="bg-muted px-3 py-2 rounded-l-lg border border-r-0 border-border text-sm text-muted-foreground font-medium">
                      venture.app/
                    </div>
                    <Input 
                      id="slug" 
                      value={slug}
                      onChange={(e) => validateAndSetSlug(e.target.value)}
                      placeholder="username" 
                      className="rounded-l-none font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 italic">
                    Use only lowercase letters, numbers, and hyphens. No spaces allowed.
                  </p>
                </div>
              </div>

              <Button type="submit" disabled={isSaving} className="px-8 shadow-lg shadow-primary/20">
                {isSaving && <AlertCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security / Password */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Manage your authentication and login methods.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email address</Label>
                <Input value={authUser?.email} disabled className="bg-muted/50 cursor-not-allowed" />
                <p className="text-[10px] text-muted-foreground">Primary login email cannot be changed manually.</p>
              </div>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/5 hover:text-primary">
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
