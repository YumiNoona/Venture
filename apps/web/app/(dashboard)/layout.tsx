import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { requireUser } from "@/lib/getUser";
import { PageTransition } from "@/components/ui/page-transition";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { authUser, dbUser } = await requireUser();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar user={dbUser} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={dbUser} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mx-auto max-w-6xl">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
