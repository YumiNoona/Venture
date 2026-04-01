"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { TrendingUp, Users, Zap, MessageSquare, ArrowUpRight } from "lucide-react";

// Mock data for initial rendering until user has real volume
const data = [
  { name: 'Mar 24', sent: 4, received: 12 },
  { name: 'Mar 25', sent: 7, received: 18 },
  { name: 'Mar 26', sent: 12, received: 25 },
  { name: 'Mar 27', sent: 22, received: 42 },
  { name: 'Mar 28', sent: 18, received: 35 },
  { name: 'Mar 29', sent: 35, received: 64 },
  { name: 'Mar 30', sent: 45, received: 78 },
];

const COLORS = ['#adfa1d', '#2563eb', '#8b5cf6', '#f59e0b'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Real-time performance of your AI engagement engine.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Engagement</h3>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">1,284</div>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="text-success font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +12%
            </span> from last month
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">AI Replies</h3>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">452</div>
          <p className="text-xs text-muted-foreground mt-1">
             35% automation rate
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Unique Accounts</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">89</div>
          <p className="text-xs text-muted-foreground mt-1">
             Active listeners
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Time Saved</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">14.2h</div>
          <p className="text-xs text-muted-foreground mt-1">
            Estimated this month
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
             <h3 className="font-bold text-lg">Message Volume</h3>
             <p className="text-sm text-muted-foreground">Daily inbound vs. AI replies.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#adfa1d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#adfa1d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                   stroke="#888888" 
                   fontSize={12} 
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="received" stroke="#888888" fillOpacity={0.1} fill="#888888" />
                <Area type="monotone" dataKey="sent" stroke="#adfa1d" fillOpacity={1} fill="url(#colorSent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 rounded-xl border bg-card p-6 shadow-sm">
           <div className="mb-6">
             <h3 className="font-bold text-lg">Top Triggers</h3>
             <p className="text-sm text-muted-foreground">Highest converting keyword groups.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'PRICING', hits: 145 },
                { name: 'DEMO', hits: 98 },
                { name: 'DISCOUNT', hits: 76 },
                { name: 'HELP', hits: 42 },
              ]} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={70} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="hits" radius={[0, 4, 4, 0]} barSize={20}>
                   <Cell fill="#adfa1d" />
                   <Cell fill="#2563eb" />
                   <Cell fill="#8b5cf6" />
                   <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
