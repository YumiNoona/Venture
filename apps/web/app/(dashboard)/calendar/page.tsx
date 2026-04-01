import { requireUser } from "@/lib/getUser";
import { prisma } from "@/lib/prisma";
import { Button } from "@ventry/ui/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, Instagram, CheckCircle2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import Link from "next/link";

export default async function CalendarPage() {
  const { dbUser } = await requireUser();
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });

  // Get scheduled posts for the current month
  const data = await prisma.post.findMany({
    where: { 
      account: { userId: dbUser?.id },
      scheduledAt: { gte: start, lte: end }
    },
    include: { account: true }
  });

  type PostWithAccount = typeof data[number];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage your automated content distribution.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
             <Clock className="size-4" />
             Queue Settings
          </Button>
          <Button size="sm" className="gap-2">
             <Plus className="size-4" />
             Schedule Post
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
           <div className="flex items-center gap-4">
              <h3 className="font-bold text-lg uppercase tracking-widest">{format(today, 'MMMM yyyy')}</h3>
              <div className="flex gap-1">
                 <button className="p-1 rounded hover:bg-muted"><ChevronLeft className="size-4" /></button>
                 <button className="p-1 rounded hover:bg-muted"><ChevronRight className="size-4" /></button>
              </div>
           </div>
           <div className="flex gap-2 text-xs font-bold uppercase tracking-tighter">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-muted-foreground group">
                 <div className="size-1.5 rounded-full bg-success"></div>
                 Published
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-muted-foreground group">
                 <div className="size-1.5 rounded-full bg-primary/50"></div>
                 Scheduled
              </div>
           </div>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/20">
           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: string) => (
             <div key={day} className="p-3 text-center text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{day}</div>
           ))}
        </div>
        
        <div className="grid grid-cols-7 min-h-[600px]">
           {days.map((day: Date, i: number) => {
              const dayPosts = data.filter((p: PostWithAccount) => p.scheduledAt && isSameDay(p.scheduledAt, day));
              const isToday = isSameDay(day, today);
              
              return (
                <div key={i} className={`p-2 border-r border-b border-border bg-background min-h-[120px] transition-colors hover:bg-muted/5 group relative ${!isSameMonth(day, today) ? 'bg-muted/10 opacity-30 select-none' : ''}`}>
                   <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${isToday ? 'size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </span>
                      {isToday && <div className="text-[8px] font-bold uppercase text-primary animate-pulse tracking-tighter">Today</div>}
                   </div>
                   
                   <div className="space-y-1">
                      {dayPosts.map((post: PostWithAccount, pi: number) => (
                        <div key={pi} className={`px-2 py-1.5 rounded-md text-[9px] font-bold border truncate flex items-center gap-1.5 ${post.status === 'published' ? 'bg-success/5 border-success/20 text-success' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                           {post.status === 'published' ? <CheckCircle2 className="size-2.5" /> : <Clock className="size-2.5" />}
                           {post.content.slice(0, 15)}...
                        </div>
                      ))}
                      <button className="w-full py-1 rounded border border-dashed border-border text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                         <Plus className="size-2" />
                         Schedule
                      </button>
                   </div>
                </div>
              );
           })}
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
         <div className="flex gap-6 max-w-2xl">
            <div className="size-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
               <span className="text-2xl font-black text-primary">0</span>
               <span className="text-[8px] font-bold uppercase opacity-50">Pending</span>
            </div>
            <div>
               <h4 className="font-bold text-lg mb-1 italic tracking-tight">Streamline your distribution.</h4>
               <p className="text-sm text-muted-foreground leading-relaxed">
                  The Ventry Pipeline is optimized for high-volume creator flows. Connect your Facebook Creator Studio or continue using our lightweight scheduling engine to perfectly time your IG drops.
               </p>
            </div>
         </div>
         <Link href="/dashboard/settings/accounts">
            <Button variant="outline" className="gap-2 shrink-0">
               <Instagram className="size-4" />
               Sync Creator Group
            </Button>
         </Link>
      </div>
    </div>
  );
}
