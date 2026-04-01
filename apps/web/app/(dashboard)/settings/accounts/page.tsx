import { requireUser } from "@/lib/getUser";
import { prisma } from "@/lib/prisma";
import { Button } from "@ventry/ui/components/ui/button";
import { Instagram, Link as LinkIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function AccountsPage() {
  const { dbUser } = await requireUser();

  const data = await prisma.account.findMany({
    where: { userId: dbUser?.id },
    orderBy: { createdAt: "desc" },
  });

  type Account = typeof data[number];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
        <p className="text-muted-foreground mt-1">Manage your Instagram business profiles and connection status.</p>
      </div>

      <div className="grid gap-6">
        {/* Connect New Account Card */}
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 flex flex-col items-center justify-center text-center">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Instagram className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Link a new profile</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Connect your Instagram Business account via Meta to start automating your engagement.
          </p>
          <Link href="/api/auth/meta/login">
            <Button className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Connect Instagram
            </Button>
          </Link>
        </div>

        {/* Account List */}
        <div className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Connections ({data.length})</h2>
          
          {data.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
              No accounts connected yet.
            </div>
          ) : (
            data.map((account: Account) => (
              <div key={account.id} className="rounded-xl border bg-card p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
                    {account.name?.charAt(0) || "I"}
                  </div>
                  <div>
                    <h4 className="font-semibold">{account.name || "Instagram Account"}</h4>
                    <p className="text-sm text-muted-foreground">ID: {account.externalId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                       {account.tokenValid ? (
                         <>
                           <CheckCircle2 className="h-4 w-4 text-success" />
                           <span className="text-sm font-medium text-success">Connected</span>
                         </>
                       ) : (
                         <>
                           <AlertCircle className="h-4 w-4 text-danger animate-pulse" />
                           <span className="text-sm font-medium text-danger">Reconnect Required</span>
                         </>
                       )}
                    </div>
                    {account.lastChecked && (
                       <span className="text-[10px] text-muted-foreground uppercase opacity-50">
                         Last failure: {new Date(account.lastChecked).toLocaleString()}
                       </span>
                    )}
                  </div>
                  
                  {account.tokenValid ? (
                     <Button variant="outline" size="sm">Settings</Button>
                  ) : (
                     <Link href="/api/auth/meta/login">
                        <Button variant="destructive" size="sm" className="gap-2">
                           <LinkIcon className="h-3.5 w-3.5" />
                           Reconnect
                        </Button>
                     </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
